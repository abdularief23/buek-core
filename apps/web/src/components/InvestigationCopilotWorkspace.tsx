import { useEffect, useState } from "react";
import {
  approveEngineeringAnalysis,
  fetchEngineeringAnalysis,
  generateReportFromAnalysis,
  rejectEngineeringAnalysis,
  saveEngineeringAnalysis,
  submitEngineeringAnalysis,
  submitVerificationResult,
  type EngineeringAnalysisData,
  type PossibleCause
} from "../lib/data-api.js";
import { isEngineer, isPlantManager, isSupervisor } from "../lib/roles.js";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";

const WIZARD_STEPS = [
  "Evidence",
  "Possible Root Cause",
  "Countermeasure",
  "Execution Plan",
  "Submit"
] as const;

interface Props {
  slug: string;
  issueKey: string;
  userName: string;
  userRole: string;
  onClose: () => void;
  onDataChange?: () => void;
  onWorkspaceChange: (next: DynamicWorkspaceState) => void;
}

export function InvestigationCopilotWorkspace(props: Props) {
  return <EngineeringAnalysisWizard {...props} />;
}

function EngineeringAnalysisWizard({
  slug,
  issueKey,
  userName,
  userRole,
  onClose,
  onDataChange,
  onWorkspaceChange
}: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [acting, setActing] = useState(false);
  const [step, setStep] = useState(0);
  const [issueTitle, setIssueTitle] = useState("");
  const [metrics, setMetrics] = useState<{
    machineCode: string;
    currentPpm: number;
    targetPpm: number;
    increasePercent: number;
    priority: string;
    dueLabel: string;
  } | null>(null);
  const [analysis, setAnalysis] = useState<EngineeringAnalysisData | null>(null);
  const [possibleCauses, setPossibleCauses] = useState<PossibleCause[]>([]);
  const [countermeasureOptions, setCountermeasureOptions] = useState<string[]>([]);
  const [otherCause, setOtherCause] = useState("");
  const [askHistorical, setAskHistorical] = useState<boolean | null>(null);
  const [verificationPpm, setVerificationPpm] = useState("");
  const [countermeasureDone, setCountermeasureDone] = useState<boolean | null>(null);

  const engineerView = isEngineer(userRole);
  const supervisorView = isSupervisor(userRole);
  const managerView = isPlantManager(userRole);
  const readOnly = managerView || (!engineerView && !supervisorView);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchEngineeringAnalysis(slug, issueKey)
      .then((data) => {
        if (cancelled) return;
        setIssueTitle(data.issueTitle);
        setMetrics({
          machineCode: data.metrics.machineCode,
          currentPpm: data.metrics.currentPpm,
          targetPpm: data.metrics.targetPpm,
          increasePercent: data.metrics.increasePercent,
          priority: data.metrics.priority,
          dueLabel: data.metrics.dueLabel
        });
        setAnalysis(data.analysis);
        setPossibleCauses(data.copilot.possibleCauses);
        setCountermeasureOptions(data.copilot.countermeasureOptions.map((o) => o.label));
        if (data.analysis.selectedCause?.isOther) {
          setOtherCause(data.analysis.selectedCause.label);
        }
        if (data.analysis.useHistoricalCountermeasure !== undefined) {
          setAskHistorical(data.analysis.useHistoricalCountermeasure);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Gagal memuat analisa engineering";
        setLoadError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, issueKey, reloadKey]);

  async function persistDraft(next: EngineeringAnalysisData) {
    setAnalysis(next);
    if (!engineerView) return;
    await saveEngineeringAnalysis(slug, issueKey, next, userRole);
  }

  function selectCause(cause: PossibleCause) {
    if (!analysis) return;
    void persistDraft({
      ...analysis,
      selectedCause: { label: cause.label, confidence: cause.confidence }
    });
    setStep(2);
  }

  function selectOtherCause() {
    if (!analysis || !otherCause.trim()) return;
    void persistDraft({
      ...analysis,
      selectedCause: { label: otherCause.trim(), confidence: 0, isOther: true }
    });
    setStep(2);
  }

  function applyHistoricalCountermeasures(useHistorical: boolean) {
    if (!analysis) return;
    setAskHistorical(useHistorical);
    const selected = useHistorical ? countermeasureOptions : [];
    void persistDraft({
      ...analysis,
      useHistoricalCountermeasure: useHistorical,
      countermeasures: selected,
      countermeasureNotes: selected.join("\n")
    });
  }

  async function handleSubmit() {
    if (!analysis || acting) return;
    setActing(true);
    try {
      await submitEngineeringAnalysis(slug, issueKey, analysis, userName, userRole);
      setAnalysis({ ...analysis, status: "waiting_supervisor_review" });
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleApprove() {
    if (acting) return;
    setActing(true);
    try {
      const result = await approveEngineeringAnalysis(slug, issueKey, userName, userRole);
      setAnalysis(result.analysis);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (acting) return;
    setActing(true);
    try {
      const result = await rejectEngineeringAnalysis(slug, issueKey, userName, userRole);
      setAnalysis(result.analysis);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleGenerateReport() {
    if (acting) return;
    setActing(true);
    try {
      const result = await generateReportFromAnalysis(slug, issueKey, userName, userRole);
      onWorkspaceChange({ kind: "engineering-report", slug, reportId: result.report.id });
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleVerification() {
    if (!analysis || acting || !metrics) return;
    setActing(true);
    try {
      const result = await submitVerificationResult(slug, issueKey, {
        countermeasureComplete: countermeasureDone ?? true,
        currentPpm: Number(verificationPpm) || metrics.targetPpm,
        targetPpm: metrics.targetPpm,
        engineerName: userName,
        role: userRole
      });
      setAnalysis(result.analysis);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <p className="buek-body text-slate-500">Memuat analisa engineering...</p>;
  }

  if (loadError || !analysis || !metrics) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="buek-card-title text-red-300">Analisa engineering tidak dapat dimuat</p>
        <p className="buek-body text-slate-400">
          {loadError ?? "Data analisa tidak tersedia. Pastikan API berjalan dan database sudah di-migrate."}
        </p>
        <p className="buek-small text-slate-500">Issue: {issueKey}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
          >
            Coba lagi
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const status = analysis.status;
  const editable = engineerView && (status === "draft" || status === "revision_requested");
  const waitingReview = status === "waiting_supervisor_review";
  const approved = status === "analysis_approved" || status === "verification_complete";

  return (
    <div className="space-y-6 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">Engineering Analysis</p>
          <h1 className="buek-heading text-white">{issueTitle}</h1>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Back
        </button>
      </header>

      <section className="buek-card grid gap-4 rounded-2xl border border-white/10 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Machine" value={metrics.machineCode} />
        <Metric label="PPM" value={metrics.currentPpm.toLocaleString()} highlight />
        <Metric label="Target" value={metrics.targetPpm.toLocaleString()} />
        <Metric label="Increase" value={`+${metrics.increasePercent}%`} warn />
        <Metric label="Priority" value={metrics.priority} />
        <Metric label="Due" value={metrics.dueLabel} />
      </section>

      {status === "revision_requested" ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 buek-small text-amber-200">
          Revisi diminta supervisor: {analysis.revisionNotes ?? "—"}
        </div>
      ) : null}

      {waitingReview && engineerView ? (
        <StatusBanner title="Engineering Analysis Completed" subtitle="Waiting Supervisor Review" />
      ) : null}

      {supervisorView && waitingReview ? (
        <SupervisorReviewPanel analysis={analysis} acting={acting} onApprove={() => void handleApprove()} onReject={() => void handleReject()} />
      ) : null}

      {approved && engineerView ? (
        <section className="buek-card space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <StatusBanner title="Engineering Analysis Approved" subtitle="Generate official report after execution" />
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleGenerateReport()}
            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            Generate Investigation Report (PDF/DOCX)
          </button>
          {status === "analysis_approved" ? (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="buek-body text-white">Countermeasure selesai?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCountermeasureDone(true)}
                  className={`rounded-lg px-4 py-2 ${countermeasureDone === true ? "bg-emerald-500/20 text-emerald-300" : "border border-white/10"}`}
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setCountermeasureDone(false)}
                  className={`rounded-lg px-4 py-2 ${countermeasureDone === false ? "bg-amber-500/20 text-amber-300" : "border border-white/10"}`}
                >
                  Belum
                </button>
              </div>
              {countermeasureDone !== null ? (
                <>
                  <label className="block space-y-1">
                    <span className="buek-small text-slate-500">Current PPM (setelah countermeasure)</span>
                    <input
                      type="number"
                      value={verificationPpm}
                      onChange={(e) => setVerificationPpm(e.target.value)}
                      placeholder={String(metrics.targetPpm)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => void handleVerification()}
                    className="rounded-xl border border-emerald-400/30 px-6 py-2 text-emerald-300 hover:bg-emerald-500/10"
                  >
                    Submit Verification → Lessons Learned
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          {analysis.verification?.lessonsLearned ? (
            <p className="buek-small text-emerald-400">✓ {analysis.verification.lessonsLearned}</p>
          ) : null}
        </section>
      ) : null}

      {editable ? (
        <>
          <nav className="flex flex-wrap gap-2">
            {WIZARD_STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  step === index ? "bg-cyan-500 text-slate-950" : "border border-white/10 text-slate-400"
                }`}
              >
                STEP {index + 1}: {label}
              </button>
            ))}
          </nav>

          {step === 0 ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">STEP 1 — Evidence</h2>
              {(
                [
                  ["qcResult", "QC Result"],
                  ["photo", "Photo"],
                  ["trend", "Trend"],
                  ["machineHistory", "Machine History"]
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={analysis.evidence[key]}
                    onChange={(e) =>
                      void persistDraft({
                        ...analysis,
                        evidence: { ...analysis.evidence, [key]: e.target.checked }
                      })
                    }
                  />
                  <span className="buek-body text-slate-200">{label}</span>
                </label>
              ))}
              <textarea
                value={analysis.evidence.notes}
                onChange={(e) =>
                  void persistDraft({
                    ...analysis,
                    evidence: { ...analysis.evidence, notes: e.target.value }
                  })
                }
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                placeholder="Catatan evidence..."
              />
            </section>
          ) : null}

          {step === 1 ? (
            <section className="buek-card space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <h2 className="buek-card-title text-cyan-300">STEP 2 — Possible Root Cause</h2>
              <p className="buek-small text-slate-500">AI menemukan kemungkinan berikut — engineer memilih.</p>
              <div className="space-y-2">
                {possibleCauses.map((cause) => (
                  <label
                    key={cause.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${
                      analysis.selectedCause?.label === cause.label
                        ? "border-cyan-400/50 bg-cyan-500/10"
                        : "border-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="cause"
                        checked={analysis.selectedCause?.label === cause.label}
                        onChange={() => selectCause(cause)}
                      />
                      <span className="buek-body text-white">{cause.label}</span>
                    </span>
                    <span className="text-cyan-300">{cause.confidence}%</span>
                  </label>
                ))}
                <label className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
                  <input type="radio" name="cause" checked={analysis.selectedCause?.isOther === true} readOnly />
                  <input
                    type="text"
                    value={otherCause}
                    onChange={(e) => setOtherCause(e.target.value)}
                    onBlur={() => otherCause.trim() && selectOtherCause()}
                    placeholder="Other (manual input)"
                    className="flex-1 bg-transparent text-white outline-none"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {step === 2 && analysis.selectedCause ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">STEP 3 — Countermeasure</h2>
              {askHistorical === null ? (
                <div className="space-y-3">
                  <p className="buek-body text-white">
                    Apakah Anda ingin menggunakan countermeasure yang pernah berhasil?
                  </p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => applyHistoricalCountermeasures(true)} className="rounded-lg border border-white/10 px-4 py-2">
                      Ya
                    </button>
                    <button type="button" onClick={() => applyHistoricalCountermeasures(false)} className="rounded-lg border border-white/10 px-4 py-2">
                      Tidak
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="buek-small text-cyan-400">AI Recommendation — engineer dapat mengedit</p>
                  {countermeasureOptions.map((option) => (
                    <label key={option} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={analysis.countermeasures.includes(option)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...analysis.countermeasures, option]
                            : analysis.countermeasures.filter((c) => c !== option);
                          void persistDraft({
                            ...analysis,
                            countermeasures: next,
                            countermeasureNotes: next.join("\n")
                          });
                        }}
                      />
                      <span className="buek-body text-slate-200">{option}</span>
                    </label>
                  ))}
                  <textarea
                    value={analysis.countermeasureNotes}
                    onChange={(e) => void persistDraft({ ...analysis, countermeasureNotes: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                  />
                </>
              )}
            </section>
          ) : null}

          {step === 3 ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">STEP 4 — Execution Plan</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["pic", "PIC"],
                    ["executionDate", "Execution Date"],
                    ["expectedFinish", "Expected Finish"],
                    ["verificationDate", "Verification (After)"]
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block space-y-1">
                    <span className="buek-small text-slate-500">{label}</span>
                    <input
                      type={key.includes("Date") ? "date" : "text"}
                      value={analysis.executionPlan[key]}
                      onChange={(e) =>
                        void persistDraft({
                          ...analysis,
                          executionPlan: { ...analysis.executionPlan, [key]: e.target.value }
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">STEP 5 — Submit Engineering Analysis</h2>
              <p className="buek-body text-slate-400">
                Setelah submit, status menjadi <strong className="text-white">Waiting Supervisor Review</strong>.
                Laporan resmi (PDF/DOCX) baru dibuat setelah supervisor approve.
              </p>
              <button
                type="button"
                disabled={acting || !analysis.selectedCause}
                onClick={() => void handleSubmit()}
                className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                {acting ? "Submitting..." : "Submit Engineering Analysis"}
              </button>
            </section>
          ) : null}

          <div className="flex justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-lg border border-white/10 px-4 py-2 text-slate-300 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={step >= WIZARD_STEPS.length - 1}
              onClick={() => setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}
              className="rounded-lg border border-white/10 px-4 py-2 text-slate-300 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </>
      ) : null}

      {readOnly && !supervisorView ? (
        <p className="buek-small text-slate-500">Read-only view untuk role ini.</p>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
  warn
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="buek-small text-slate-500">{label}</p>
      <p
        className={`buek-body font-semibold ${
          highlight ? "text-amber-300" : warn ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBanner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-4">
      <p className="buek-body font-semibold text-white">{title}</p>
      <p className="buek-small text-cyan-300">{subtitle}</p>
    </div>
  );
}

function SupervisorReviewPanel({
  analysis,
  acting,
  onApprove,
  onReject
}: {
  analysis: EngineeringAnalysisData;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <section className="buek-card space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
      <h2 className="buek-card-title text-amber-300">Supervisor Review — Engineering Analysis</h2>
      <ReviewRow label="Evidence" value={formatEvidence(analysis)} />
      <ReviewRow label="Root Cause (engineer-selected)" value={analysis.selectedCause?.label ?? "—"} />
      <ReviewRow label="Countermeasure" value={analysis.countermeasureNotes || analysis.countermeasures.join(", ")} />
      <ReviewRow label="Execution Date" value={analysis.executionPlan.executionDate} />
      <ReviewRow label="Verification Plan" value={analysis.executionPlan.verificationDate} />
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          disabled={acting}
          onClick={onApprove}
          className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={acting}
          onClick={onReject}
          className="rounded-xl border border-red-500/40 px-6 py-3 font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          Request Revision
        </button>
      </div>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/5 pb-3">
      <p className="buek-small text-slate-500">{label}</p>
      <p className="buek-body whitespace-pre-wrap text-slate-200">{value || "—"}</p>
    </div>
  );
}

function formatEvidence(analysis: EngineeringAnalysisData) {
  return [
    analysis.evidence.qcResult ? "QC Result" : null,
    analysis.evidence.photo ? "Photo" : null,
    analysis.evidence.trend ? "Trend" : null,
    analysis.evidence.machineHistory ? "Machine History" : null,
    analysis.evidence.notes || null
  ]
    .filter(Boolean)
    .join("\n");
}
