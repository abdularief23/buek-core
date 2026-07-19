import { useEffect, useMemo, useState } from "react";
import {
  advanceInvestigation,
  createDraftReport,
  fetchInvestigationCopilot,
  fetchIssueByKey,
  type ExecutionPlanDto,
  type InvestigationCopilot,
  type InvestigationDraftInput,
  type IssueRecord,
  type PossibleCause
} from "../lib/data-api.js";
import { isEngineer, isPlantManager, isSupervisor } from "../lib/roles.js";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";

interface InvestigationCopilotWorkspaceProps {
  slug: string;
  issueKey: string;
  userName: string;
  userRole: string;
  onClose: () => void;
  onDataChange?: () => void;
  onWorkspaceChange: (next: DynamicWorkspaceState) => void;
}

type CopilotHint =
  | { kind: "context" }
  | { kind: "similar" }
  | { kind: "sop" }
  | { kind: "cause"; cause: PossibleCause }
  | { kind: "countermeasure" }
  | { kind: "execution" }
  | { kind: "verification" };

export function InvestigationCopilotWorkspace({
  slug,
  issueKey,
  userName,
  userRole,
  onClose,
  onDataChange,
  onWorkspaceChange
}: InvestigationCopilotWorkspaceProps) {
  const [issue, setIssue] = useState<IssueRecord | null>(null);
  const [copilot, setCopilot] = useState<InvestigationCopilot | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [activeHint, setActiveHint] = useState<CopilotHint>({ kind: "context" });

  const [evidence, setEvidence] = useState("");
  const [selectedCauseId, setSelectedCauseId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [decision, setDecision] = useState("");
  const [selectedCountermeasureId, setSelectedCountermeasureId] = useState<string | null>(null);
  const [countermeasureDraft, setCountermeasureDraft] = useState("");
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlanDto | null>(null);
  const [rejectBefore, setRejectBefore] = useState("");
  const [rejectAfter, setRejectAfter] = useState("");
  const [verificationResult, setVerificationResult] = useState<"PASS" | "FAIL" | "">("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  useEffect(() => {
    fetchIssueByKey(slug, issueKey).then((data) => setIssue(data.issue));
    fetchInvestigationCopilot(slug, issueKey)
      .then((data) => {
        setCopilot(data.copilot);
        setExecutionPlan(data.copilot.defaultExecutionPlan);
        setEvidence(
          [
            data.copilot.autoLoadedContext.join("\n"),
            "",
            data.copilot.issueTitle
          ].join("\n")
        );
      })
      .catch(() => setCopilot(null));
  }, [slug, issueKey]);

  const selectedCause = useMemo(
    () => copilot?.possibleCauses.find((c) => c.id === selectedCauseId) ?? null,
    [copilot, selectedCauseId]
  );

  const selectedCountermeasure = useMemo(
    () => copilot?.countermeasureOptions.find((c) => c.id === selectedCountermeasureId) ?? null,
    [copilot, selectedCountermeasureId]
  );

  function selectCause(cause: PossibleCause) {
    setSelectedCauseId(cause.id);
    setActiveHint({ kind: "cause", cause });
    setAnalysis(
      `Possible cause selected by engineer: ${cause.label} (${cause.confidence}% confidence).\nSupporting signals: ${cause.evidence.join(", ")}.\nAI does not declare root cause — engineer retains decision authority.`
    );
    setDecision(`Engineer decision: proceed with ${cause.label} as working hypothesis for countermeasure planning.`);
  }

  function selectCountermeasure(id: string, label: string) {
    setSelectedCountermeasureId(id);
    setActiveHint({ kind: "countermeasure" });
    setCountermeasureDraft(
      `Selected countermeasure: ${label}\n\nAI draft — engineer may edit before submission:\n• Execute ${label.toLowerCase()}\n• Verify reject rate after implementation\n• Document result in technical report`
    );
  }

  async function completeStep(stepKey: string) {
    if (!issue || advancing) return;
    setAdvancing(true);
    try {
      const result = await advanceInvestigation(slug, issue.id, stepKey, userRole);
      setIssue(result.issue);
      onDataChange?.();
    } finally {
      setAdvancing(false);
    }
  }

  async function handleGenerateReport() {
    if (!issue || !copilot || creatingDraft || !selectedCause || !executionPlan) return;
    setCreatingDraft(true);
    try {
      const verificationResultText = [
        rejectBefore ? `Reject Before: ${rejectBefore}%` : null,
        rejectAfter ? `Reject After: ${rejectAfter}%` : null,
        verificationResult ? `Result: ${verificationResult}` : null,
        verificationNotes || null
      ]
        .filter(Boolean)
        .join("\n");

      const draft: InvestigationDraftInput = {
        evidence,
        analysis,
        decision,
        rootCause: `Working hypothesis (engineer-selected): ${selectedCause.label}`,
        countermeasure: countermeasureDraft,
        executionPlan: [
          `PIC: ${executionPlan.pic}`,
          `Due Date: ${executionPlan.dueDate}`,
          `Machine Stop: ${executionPlan.machineStop ? "Yes" : "No"}`,
          `Material Needed: ${executionPlan.materialNeeded}`,
          `Estimated Downtime: ${executionPlan.estimatedDowntime}`
        ].join("\n"),
        verification: verificationNotes,
        verificationResult: verificationResultText,
        selectedCauseLabel: selectedCause.label,
        executionPlanFields: executionPlan,
        lessonsLearned
      };

      const result = await createDraftReport(slug, issueKey, userName, userRole, draft);
      onWorkspaceChange({ kind: "engineering-report", slug, reportId: result.report.id });
      onDataChange?.();
    } finally {
      setCreatingDraft(false);
    }
  }

  if (!issue || !copilot) {
    return <p className="buek-body text-slate-500">Loading engineering co-pilot...</p>;
  }

  const engineerView = isEngineer(userRole);
  const supervisorView = isSupervisor(userRole);
  const managerView = isPlantManager(userRole);
  const canGenerate =
    engineerView &&
    Boolean(selectedCause && selectedCountermeasureId && countermeasureDraft && executionPlan && verificationResult);

  return (
    <div className="space-y-6 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">Engineering Co-Pilot Workspace</p>
          <h1 className="buek-heading text-white">{issue.title}</h1>
          <p className="mt-2 buek-body text-slate-400">
            {issue.machine?.code} · Issue #{issue.id.slice(-3)} · AI assists, engineer decides
          </p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Back
        </button>
      </header>

      {supervisorView ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="buek-small text-amber-200">Supervisor view — monitor progress. Approval on submitted technical report.</p>
        </div>
      ) : null}
      {managerView ? (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
          <p className="buek-small text-cyan-200">Plant Manager view — read-only investigation tracking.</p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="buek-card space-y-3 rounded-2xl border border-white/10 p-6">
            <h2 className="buek-card-title text-slate-400">Auto-Loaded Context</h2>
            <ul className="space-y-2">
              {copilot.autoLoadedContext.map((line) => (
                <li key={line} className="flex items-start gap-2 buek-small text-slate-300">
                  <span className="text-cyan-400">•</span>
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
            <h2 className="buek-card-title text-slate-400">Collect Evidence</h2>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              onFocus={() => setActiveHint({ kind: "similar" })}
              rows={4}
              disabled={!engineerView}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white disabled:opacity-60"
              placeholder="Observations, photos, trend data..."
            />
          </section>

          <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
            <h2 className="buek-card-title text-slate-400">Review Similar Cases</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {copilot.similarCases.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveHint({ kind: "similar" })}
                  className="rounded-xl border border-white/10 px-4 py-3 text-left hover:border-cyan-400/30"
                >
                  <p className="buek-body text-white">{item.title}</p>
                  <p className="buek-small text-slate-500">{item.reference ?? "Company Brain"}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
            <h2 className="buek-card-title text-slate-400">Review SOP</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {copilot.sopReferences.map((sop) => (
                <button
                  key={sop.id}
                  type="button"
                  onClick={() => setActiveHint({ kind: "sop" })}
                  className="rounded-xl border border-white/10 px-4 py-3 text-left hover:border-cyan-400/30"
                >
                  <p className="buek-body text-white">{sop.title}</p>
                  <p className="buek-small text-cyan-400">{sop.referenceId}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="buek-card space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <h2 className="buek-card-title text-cyan-300">Choose Possible Cause</h2>
            <p className="buek-small text-slate-500">AI ranks hypotheses — engineer selects. AI never declares root cause.</p>
            <div className="space-y-2">
              {copilot.possibleCauses.map((cause, index) => (
                <button
                  key={cause.id}
                  type="button"
                  disabled={!engineerView}
                  onClick={() => selectCause(cause)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                    selectedCauseId === cause.id
                      ? "border-cyan-400/50 bg-cyan-500/10"
                      : "border-white/10 hover:border-cyan-400/30"
                  }`}
                >
                  <span className="buek-body text-white">
                    {index + 1}. {cause.label}
                  </span>
                  <span className="text-cyan-300">{cause.confidence}%</span>
                </button>
              ))}
            </div>
            {selectedCause ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="buek-small font-semibold text-emerald-300">Evidence supporting selection</p>
                <ul className="mt-2 space-y-1">
                  {selectedCause.evidence.map((e) => (
                    <li key={e} className="buek-small text-slate-300">
                      ✓ {e}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {selectedCause ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">AI Analysis & Engineer Decision</h2>
              <textarea
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                rows={3}
                disabled={!engineerView}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white disabled:opacity-60"
              />
              <textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                rows={2}
                disabled={!engineerView}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white disabled:opacity-60"
                placeholder="Engineer decision..."
              />
            </section>
          ) : null}

          {selectedCause ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">Possible Countermeasure</h2>
              <div className="space-y-2">
                {copilot.countermeasureOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
                      selectedCountermeasureId === option.id
                        ? "border-cyan-400/50 bg-cyan-500/10"
                        : "border-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="countermeasure"
                      disabled={!engineerView}
                      checked={selectedCountermeasureId === option.id}
                      onChange={() => selectCountermeasure(option.id, option.label)}
                    />
                    <span className="buek-body text-white">{option.label}</span>
                    <span className="ml-auto buek-small text-slate-500">{option.category}</span>
                  </label>
                ))}
              </div>
              {selectedCountermeasure ? (
                <textarea
                  value={countermeasureDraft}
                  onChange={(e) => setCountermeasureDraft(e.target.value)}
                  rows={4}
                  disabled={!engineerView}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white disabled:opacity-60"
                />
              ) : null}
            </section>
          ) : null}

          {executionPlan && selectedCountermeasure ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">Execution Plan → Work Order</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["pic", "PIC"],
                    ["dueDate", "Due Date"],
                    ["materialNeeded", "Material Needed"],
                    ["estimatedDowntime", "Estimated Downtime"]
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block space-y-1">
                    <span className="buek-small text-slate-500">{label}</span>
                    <input
                      type={key === "dueDate" ? "date" : "text"}
                      value={executionPlan[key]}
                      disabled={!engineerView}
                      onChange={(e) => {
                        setExecutionPlan({ ...executionPlan, [key]: e.target.value });
                        setActiveHint({ kind: "execution" });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:opacity-60"
                    />
                  </label>
                ))}
                <label className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={executionPlan.machineStop}
                    disabled={!engineerView}
                    onChange={(e) => setExecutionPlan({ ...executionPlan, machineStop: e.target.checked })}
                  />
                  <span className="buek-body text-slate-300">Machine Stop Required</span>
                </label>
              </div>
            </section>
          ) : null}

          {selectedCountermeasure ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">Verification</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block space-y-1">
                  <span className="buek-small text-slate-500">Reject Before (%)</span>
                  <input
                    type="text"
                    value={rejectBefore}
                    disabled={!engineerView}
                    onChange={(e) => setRejectBefore(e.target.value)}
                    onFocus={() => setActiveHint({ kind: "verification" })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:opacity-60"
                    placeholder="18"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="buek-small text-slate-500">Reject After (%)</span>
                  <input
                    type="text"
                    value={rejectAfter}
                    disabled={!engineerView}
                    onChange={(e) => setRejectAfter(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:opacity-60"
                    placeholder="2"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="buek-small text-slate-500">Result</span>
                  <select
                    value={verificationResult}
                    disabled={!engineerView}
                    onChange={(e) => setVerificationResult(e.target.value as "PASS" | "FAIL" | "")}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:opacity-60"
                  >
                    <option value="">Select</option>
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </label>
              </div>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={2}
                disabled={!engineerView}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white disabled:opacity-60"
                placeholder="AI summary will be included in technical report..."
              />
              {verificationResult === "PASS" && rejectBefore && rejectAfter ? (
                <p className="buek-small text-emerald-400">
                  ✓ Verification PASS — reject improved from {rejectBefore}% to {rejectAfter}%.
                </p>
              ) : null}
            </section>
          ) : null}

          {verificationResult ? (
            <section className="buek-card space-y-3 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">Lessons Learned</h2>
              <textarea
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                rows={2}
                disabled={!engineerView}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white disabled:opacity-60"
                placeholder="Key takeaway for Company Brain..."
              />
            </section>
          ) : null}

          {engineerView ? (
            <button
              type="button"
              disabled={!canGenerate || creatingDraft}
              onClick={() => void handleGenerateReport()}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              {creatingDraft ? "Generating Technical Report..." : "Generate Technical Investigation Report"}
            </button>
          ) : null}

          {issue.investigation ? (
            <section className="space-y-3">
              <h2 className="buek-card-title text-slate-400">Workflow Steps</h2>
              <ul className="space-y-2">
                {issue.investigation.steps.map((step) => (
                  <li key={step.key}>
                    <button
                      type="button"
                      disabled={step.done || advancing || !engineerView}
                      onClick={() => void completeStep(step.key)}
                      className={`flex w-full items-center justify-between rounded-xl border px-5 py-3 text-left ${
                        step.done
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                          : "border-white/10 hover:border-cyan-400/30"
                      }`}
                    >
                      <span className="buek-small">{step.label}</span>
                      <span>{step.done ? "✓" : "□"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="buek-card sticky top-4 h-fit space-y-4 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
          <p className="buek-small font-semibold uppercase tracking-wider text-cyan-400">AI Co-Pilot</p>
          <CopilotPanel hint={activeHint} copilot={copilot} selectedCause={selectedCause} />
          <p className="buek-small text-slate-500">AI prepares context and drafts. Engineer retains all technical decisions.</p>
        </aside>
      </div>
    </div>
  );
}

function CopilotPanel({
  hint,
  copilot,
  selectedCause
}: {
  hint: CopilotHint;
  copilot: InvestigationCopilot;
  selectedCause: PossibleCause | null;
}) {
  if (hint.kind === "similar") {
    return (
      <div className="space-y-2">
        <p className="buek-body text-white">Saya menemukan {copilot.similarCases.length} laporan serupa.</p>
        {copilot.similarCases.map((c) => (
          <p key={c.id} className="buek-small text-slate-400">
            → {c.title} ({c.reference})
          </p>
        ))}
      </div>
    );
  }

  if (hint.kind === "sop") {
    return (
      <div className="space-y-2">
        <p className="buek-body text-white">SOP terkait tersedia:</p>
        {copilot.sopReferences.map((s) => (
          <p key={s.id} className="buek-small text-slate-400">
            → {s.referenceId}: {s.title}
          </p>
        ))}
      </div>
    );
  }

  if (hint.kind === "cause" && selectedCause) {
    return (
      <div className="space-y-2">
        <p className="buek-body text-white">Evidence supporting {selectedCause.label}:</p>
        {selectedCause.evidence.map((e) => (
          <p key={e} className="buek-small text-emerald-300">
            ✓ {e}
          </p>
        ))}
        <p className="buek-small text-slate-500">Engineer memilih — ini bukan keputusan AI.</p>
      </div>
    );
  }

  if (hint.kind === "countermeasure") {
    return (
      <p className="buek-body text-slate-300">
        Pilih countermeasure. AI akan menyusun draft teknis setelah engineer memilih — tidak mengisi otomatis.
      </p>
    );
  }

  if (hint.kind === "execution") {
    return (
      <p className="buek-body text-slate-300">
        Rencana eksekusi ini akan masuk Work Order: PIC, due date, material, dan downtime estimate.
      </p>
    );
  }

  if (hint.kind === "verification") {
    return (
      <p className="buek-body text-slate-300">
        Isi metrik before/after. AI akan merangkum hasil verifikasi di Technical Investigation Report.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="buek-body text-white">Konteks otomatis dimuat:</p>
      {copilot.autoLoadedContext.slice(0, 3).map((line) => (
        <p key={line} className="buek-small text-slate-400">
          • {line}
        </p>
      ))}
    </div>
  );
}
