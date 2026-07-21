import { useEffect, useRef, useState } from "react";
import {
  approveEngineeringAnalysis,
  fetchCompanyBrain,
  fetchEngineeringAnalysis,
  generateReportFromAnalysis,
  rejectEngineeringAnalysis,
  saveEngineeringAnalysis,
  submitEngineeringAnalysis,
  submitVerificationResult,
  updateIssueProduction,
  type CompanyBrainMachineNode,
  type CountermeasureOption,
  type EngineeringAnalysisData,
  type InvestigationCopilot,
  type PossibleCause
} from "../lib/data-api.js";
import { useLanguage } from "../lib/language-context.js";
import type { TranslationKey } from "../lib/i18n.js";
import { isEngineer, isPlantManager, isSupervisor } from "../lib/roles.js";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";
import { InvestigationStepper } from "./InvestigationStepper.js";
import { EngineeringAnalysisDocumentPreview } from "./EngineeringAnalysisDocumentPreview.js";

const WIZARD_STEPS = [
  "Evidence",
  "Possible Root Cause",
  "Countermeasure",
  "Execution Plan",
  "Preview & Submit"
] as const;

interface Props {
  slug: string;
  issueKey: string;
  userName: string;
  userRole: string;
  onClose: () => void;
  onDataChange?: () => void;
  onWorkspaceChange: (next: DynamicWorkspaceState) => void;
  onOpenKnowledge?: () => void;
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
  onWorkspaceChange,
  onOpenKnowledge
}: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [acting, setActing] = useState(false);
  const [step, setStep] = useState(0);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueMeta, setIssueMeta] = useState<{
    createdAt: string;
    createdBy: string;
    reportedAt: string;
  } | null>(null);
  const [copilot, setCopilot] = useState<InvestigationCopilot | null>(null);
  const [showProblemDb, setShowProblemDb] = useState(false);
  const [problemDb, setProblemDb] = useState<CompanyBrainMachineNode[] | null>(null);
  const [problemDbLoading, setProblemDbLoading] = useState(false);
  const [metrics, setMetrics] = useState<{
    machineCode: string;
    currentPpm: number;
    targetPpm: number;
    increasePercent: number;
    priority: string;
    dueLabel: string;
    ppmSource?: "operator_report" | "estimate";
    totalProduction?: number;
    rejectCount?: number;
    ngRatePercent?: number;
    ngPhenomenon?: string;
  } | null>(null);
  const [analysis, setAnalysis] = useState<EngineeringAnalysisData | null>(null);
  const [possibleCauses, setPossibleCauses] = useState<PossibleCause[]>([]);
  const [allCountermeasureOptions, setAllCountermeasureOptions] = useState<CountermeasureOption[]>([]);
  const [otherCause, setOtherCause] = useState("");
  const [askHistorical, setAskHistorical] = useState<boolean | null>(null);
  const [verificationPpm, setVerificationPpm] = useState("");
  const [countermeasureDone, setCountermeasureDone] = useState<boolean | null>(null);
  const [editingProduction, setEditingProduction] = useState(false);
  const [savingProduction, setSavingProduction] = useState(false);
  const [productionSaveMessage, setProductionSaveMessage] = useState<string | null>(null);
  const [editTotalProduction, setEditTotalProduction] = useState(5000);
  const [editRejectCount, setEditRejectCount] = useState(1);
  const [editNgPhenomenon, setEditNgPhenomenon] = useState("");

  const engineerView = isEngineer(userRole);
  const supervisorView = isSupervisor(userRole);
  const managerView = isPlantManager(userRole);
  const readOnly = managerView || (!engineerView && !supervisorView);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchEngineeringAnalysis(slug, issueKey)
      .then((data) => {
        if (cancelled) return;
        setIssueTitle(data.issueTitle);
        setIssueMeta(data.issueMeta);
        setCopilot(data.copilot);
        setMetrics({
          machineCode: data.metrics.machineCode,
          currentPpm: data.metrics.currentPpm,
          targetPpm: data.metrics.targetPpm,
          increasePercent: data.metrics.increasePercent,
          priority: data.metrics.priority,
          dueLabel: data.metrics.dueLabel,
          ...(data.metrics.ppmSource ? { ppmSource: data.metrics.ppmSource } : {}),
          ...(data.metrics.totalProduction !== undefined
            ? { totalProduction: data.metrics.totalProduction }
            : {}),
          ...(data.metrics.rejectCount !== undefined ? { rejectCount: data.metrics.rejectCount } : {}),
          ...(data.metrics.ngRatePercent !== undefined
            ? { ngRatePercent: data.metrics.ngRatePercent }
            : {}),
          ...(data.metrics.ngPhenomenon ? { ngPhenomenon: data.metrics.ngPhenomenon } : {})
        });
        setAnalysis(data.analysis);
        setPossibleCauses(data.copilot.possibleCauses);
        setAllCountermeasureOptions(data.copilot.countermeasureOptions);
        if (data.analysis.selectedCause?.isOther) {
          setOtherCause(data.analysis.selectedCause.label);
        }
        if (data.analysis.useHistoricalCountermeasure !== undefined) {
          setAskHistorical(data.analysis.useHistoricalCountermeasure);
        }
        setEditTotalProduction(data.metrics.totalProduction ?? 5000);
        setEditRejectCount(data.metrics.rejectCount ?? 1);
        setEditNgPhenomenon(data.metrics.ngPhenomenon ?? "");
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

  async function loadProblemDatabase() {
    if (problemDb) {
      setShowProblemDb((open) => !open);
      return;
    }
    setShowProblemDb(true);
    setProblemDbLoading(true);
    try {
      const data = await fetchCompanyBrain(slug);
      setProblemDb(data.machines);
    } finally {
      setProblemDbLoading(false);
    }
  }

  async function persistDraft(next: EngineeringAnalysisData) {
    setAnalysis(next);
    if (!engineerView) return;
    await saveEngineeringAnalysis(slug, issueKey, next, userRole);
  }

  function selectCause(cause: PossibleCause) {
    if (!analysis) return;
    void persistDraft({
      ...analysis,
      selectedCause: { label: cause.label, confidence: cause.confidence },
      countermeasures: [],
      countermeasureNotes: ""
    });
    setAskHistorical(null);
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
    const causeId = possibleCauses.find((c) => c.label === analysis.selectedCause?.label)?.id;
    const ranked = countermeasuresForCause(allCountermeasureOptions, causeId);
    const selected = useHistorical ? ranked.slice(0, 3).map((o) => o.label) : [];
    void persistDraft({
      ...analysis,
      useHistoricalCountermeasure: useHistorical,
      countermeasures: selected,
      countermeasureNotes: selected.join("\n")
    });
  }

  async function handleSaveProduction() {
    if (savingProduction) return;
    setSavingProduction(true);
    setProductionSaveMessage(null);
    try {
      const result = await updateIssueProduction(
        slug,
        issueKey,
        {
          totalProduction: editTotalProduction,
          rejectCount: editRejectCount,
          ngPhenomenon: editNgPhenomenon.trim()
        },
        userRole
      );
      setMetrics({
        machineCode: result.metrics.machineCode,
        currentPpm: result.metrics.currentPpm,
        targetPpm: result.metrics.targetPpm,
        increasePercent: result.metrics.increasePercent,
        priority: result.metrics.priority,
        dueLabel: result.metrics.dueLabel,
        ...(result.metrics.ppmSource ? { ppmSource: result.metrics.ppmSource } : {}),
        ...(result.metrics.totalProduction !== undefined
          ? { totalProduction: result.metrics.totalProduction }
          : {}),
        ...(result.metrics.rejectCount !== undefined ? { rejectCount: result.metrics.rejectCount } : {}),
        ...(result.metrics.ngRatePercent !== undefined
          ? { ngRatePercent: result.metrics.ngRatePercent }
          : {}),
        ...(result.metrics.ngPhenomenon ? { ngPhenomenon: result.metrics.ngPhenomenon } : {})
      });
      setCopilot(result.copilot);
      setPossibleCauses(result.copilot.possibleCauses);
      setAllCountermeasureOptions(result.copilot.countermeasureOptions);
      setEditingProduction(false);
      setProductionSaveMessage(t("investigation.production.saved"));
      onDataChange?.();
    } catch (error) {
      setProductionSaveMessage(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setSavingProduction(false);
    }
  }

  async function handleSubmit() {
    if (!analysis || acting) return;
    setActing(true);
    try {
      await saveEngineeringAnalysis(slug, issueKey, analysis, userRole);
      const result = await submitEngineeringAnalysis(slug, issueKey, analysis, userName, userRole);
      setAnalysis(result.analysis);
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
    return <p className="buek-body text-slate-500">{t("investigation.loading")}</p>;
  }

  if (loadError || !analysis || !metrics) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="buek-card-title text-red-300">{t("investigation.loadError")}</p>
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
            {t("investigation.retry")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  const status = analysis.status;
  const editable = engineerView && (status === "draft" || status === "revision_requested");
  const waitingReview = status === "waiting_supervisor_review";
  const approved = status === "analysis_approved" || status === "verification_complete";
  const submitted = status !== "draft" && status !== "revision_requested";
  const activeCountermeasures = countermeasuresForCause(
    allCountermeasureOptions,
    possibleCauses.find((c) => c.label === analysis.selectedCause?.label)?.id
  );
  const trendInsights =
    copilot?.autoLoadedContext.filter((line) => /trend|kpi|ppm|telemetry|drift|elevated/i.test(line)) ?? [];
  const evidenceCards = buildEvidenceCards(metrics, copilot, t);

  return (
    <div className="space-y-6 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">Engineering Analysis</p>
          <h1 className="buek-heading text-white">{issueTitle}</h1>
          {issueMeta ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 buek-small text-slate-500">
              <span>Di-issue: {formatDateTime(issueMeta.reportedAt)}</span>
              <span>Dibuat oleh: {issueMeta.createdBy}</span>
              <span>Issue #{issueKey}</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
            ← Back
          </button>
          <button
            type="button"
            onClick={() => void loadProblemDatabase()}
            className="rounded-lg border border-cyan-500/30 px-3 py-1.5 buek-small text-cyan-300 hover:bg-cyan-500/10"
          >
            {showProblemDb ? "Tutup Database" : "Database Problem"}
          </button>
        </div>
      </header>

      {showProblemDb ? (
        <ProblemDatabasePanel
          loading={problemDbLoading}
          similarCases={copilot?.similarCases ?? []}
          machines={problemDb ?? []}
          {...(onOpenKnowledge ? { onOpenKnowledge } : {})}
        />
      ) : null}

      <section className="buek-card grid gap-4 rounded-2xl border border-white/10 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Machine" value={metrics.machineCode} />
        <Metric label="PPM" value={metrics.currentPpm.toLocaleString()} highlight />
        <Metric label="Target" value={metrics.targetPpm.toLocaleString()} />
        <Metric label="Increase" value={`+${metrics.increasePercent}%`} warn />
        <Metric label="Priority" value={metrics.priority} />
        <Metric label="Due" value={metrics.dueLabel} />
        {metrics.totalProduction ? (
          <Metric label={t("investigation.production")} value={`${metrics.totalProduction.toLocaleString()} pcs`} />
        ) : null}
        {metrics.rejectCount !== undefined ? (
          <Metric label={t("investigation.ng")} value={`${metrics.rejectCount} pcs`} />
        ) : null}
        <Metric
          label={t("investigation.ppm.source")}
          value={metrics.ppmSource === "operator_report" ? t("investigation.ppm.fromOperator") : t("investigation.ppm.estimate")}
        />
      </section>

      {engineerView && editable ? (
        <section className="buek-card space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="buek-card-title text-cyan-300">{t("investigation.production.edit")}</h2>
              <p className="buek-small text-slate-500">{t("operator.ppmFromTotal")}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingProduction((open) => !open);
                setProductionSaveMessage(null);
                if (!editingProduction) {
                  setEditTotalProduction(metrics.totalProduction ?? editTotalProduction);
                  setEditRejectCount(metrics.rejectCount ?? editRejectCount);
                  setEditNgPhenomenon(metrics.ngPhenomenon ?? editNgPhenomenon);
                }
              }}
              className="rounded-lg border border-cyan-400/30 px-4 py-2 buek-small text-cyan-300 hover:bg-cyan-500/10"
            >
              {editingProduction ? t("common.back") : t("investigation.production.edit")}
            </button>
          </div>
          {editingProduction ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="buek-small text-slate-500">{t("operator.totalProduction")}</span>
                <input
                  type="number"
                  min={1}
                  value={editTotalProduction}
                  onChange={(e) => setEditTotalProduction(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <label className="block space-y-2">
                <span className="buek-small text-slate-500">{t("operator.rejectCount")}</span>
                <input
                  type="number"
                  min={0}
                  value={editRejectCount}
                  onChange={(e) => setEditRejectCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <label className="block space-y-2 sm:col-span-2">
                <span className="buek-small text-slate-500">{t("operator.ngPhenomenon")}</span>
                <input
                  value={editNgPhenomenon}
                  onChange={(e) => setEditNgPhenomenon(e.target.value)}
                  placeholder="Misalnya: white streak, scratch, torque out of spec"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={savingProduction}
                  onClick={() => void handleSaveProduction()}
                  className="rounded-xl bg-cyan-500 px-6 py-2 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  {savingProduction ? "..." : t("investigation.production.save")}
                </button>
                <p className="buek-small text-cyan-300">
                  PPM preview:{" "}
                  {editTotalProduction > 0
                    ? Math.round((editRejectCount / editTotalProduction) * 1_000_000).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
          ) : null}
          {productionSaveMessage ? (
            <p className="buek-small text-emerald-400">{productionSaveMessage}</p>
          ) : null}
        </section>
      ) : null}

      {status === "revision_requested" ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 buek-small text-amber-200">
          Revisi diminta supervisor: {analysis.revisionNotes ?? "—"}
        </div>
      ) : null}

      {waitingReview && engineerView ? (
        <SubmittedAnalysisCard
          slug={slug}
          issueKey={issueKey}
          issueTitle={issueTitle}
          metrics={metrics}
          analysis={analysis}
          {...(issueMeta ? { issueMeta } : {})}
          title="Analisa Terkirim — Menunggu Review Supervisor"
          subtitle="Dokumen analisa engineering sudah dikirim. Preview di bawah."
        />
      ) : null}

      {submitted && !waitingReview && !supervisorView ? (
        <SubmittedAnalysisCard
          slug={slug}
          issueKey={issueKey}
          issueTitle={issueTitle}
          metrics={metrics}
          analysis={analysis}
          {...(issueMeta ? { issueMeta } : {})}
          title={
            approved
              ? "Dokumen Analisa Engineering"
              : status === "revision_requested"
                ? "Analisa Sebelumnya"
                : "Dokumen Analisa"
          }
          {...(analysis.submittedAt
            ? {
                subtitle: `Dikirim ${formatDateTime(analysis.submittedAt)}${analysis.submittedBy ? ` oleh ${analysis.submittedBy}` : ""}`
              }
            : {})}
        />
      ) : null}

      {supervisorView && waitingReview ? (
        <SupervisorReviewPanel
          slug={slug}
          issueKey={issueKey}
          issueTitle={issueTitle}
          metrics={metrics}
          analysis={analysis}
          {...(issueMeta ? { issueMeta } : {})}
          acting={acting}
          onApprove={() => void handleApprove()}
          onReject={() => void handleReject()}
        />
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
          <div className="lg:hidden">
            <InvestigationStepper
              analysis={analysis}
              currentStep={step}
              onStepSelect={setStep}
              title={issueTitle}
            />
          </div>

          <nav className="hidden flex-wrap gap-2 lg:flex">
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
              <h2 className="buek-card-title text-slate-400">{t("investigation.evidence.title")}</h2>
              <p className="buek-small text-slate-500">{t("investigation.evidence.hint")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {evidenceCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      const nextNotes = analysis.evidence.notes.includes(card.body)
                        ? analysis.evidence.notes
                        : [analysis.evidence.notes, card.body].filter(Boolean).join("\n\n");
                      void persistDraft({
                        ...analysis,
                        evidence: {
                          ...analysis.evidence,
                          notes: nextNotes,
                          ...(card.toggleKey ? { [card.toggleKey]: true } : {})
                        }
                      });
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-cyan-400/40 hover:bg-cyan-500/5"
                  >
                    <p className="buek-small font-semibold text-cyan-300">{card.title}</p>
                    <p className="mt-2 buek-small text-slate-400">{card.body}</p>
                  </button>
                ))}
              </div>
              {trendInsights.length ? (
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                  <p className="buek-small font-semibold text-violet-200">{t("investigation.evidence.trendTitle")}</p>
                  <ul className="mt-2 space-y-1">
                    {trendInsights.map((line) => (
                      <li key={line} className="buek-small text-slate-300">
                        • {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                placeholder={t("investigation.evidence.notesPlaceholder")}
              />
              <PhotoUploadField
                label="Upload Foto Evidence"
                photos={analysis.evidence.photos ?? []}
                onChange={(photos) =>
                  void persistDraft({
                    ...analysis,
                    evidence: {
                      ...analysis.evidence,
                      photos,
                      photo: photos.length > 0 || analysis.evidence.photo
                    }
                  })
                }
              />
            </section>
          ) : null}

          {step === 1 ? (
            <section className="buek-card space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <h2 className="buek-card-title text-cyan-300">{t("investigation.rootCause.title")}</h2>
              <p className="buek-small text-slate-500">{t("investigation.rootCause.hint")}</p>
              <div className="space-y-2">
                {possibleCauses.map((cause) => (
                  <label
                    key={cause.id}
                    className={`flex cursor-pointer flex-col gap-2 rounded-xl border px-4 py-3 ${
                      analysis.selectedCause?.label === cause.label
                        ? "border-cyan-400/50 bg-cyan-500/10"
                        : "border-white/10"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
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
                    </span>
                    <span className="pl-7 buek-small text-slate-500">
                      {cause.evidence.join(" · ")}
                    </span>
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
              <PhotoUploadField
                label="Foto Pendukung Analisa Root Cause"
                photos={analysis.analysisPhotos ?? []}
                onChange={(photos) => void persistDraft({ ...analysis, analysisPhotos: photos })}
              />
            </section>
          ) : null}

          {step === 2 && analysis.selectedCause ? (
            <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
              <h2 className="buek-card-title text-slate-400">{t("investigation.countermeasure.title")}</h2>
              <p className="buek-small text-slate-500">
                {t("investigation.countermeasure.hint")} — <strong>{analysis.selectedCause.label}</strong>
              </p>
              {askHistorical === null ? (
                <div className="space-y-3">
                  <p className="buek-body text-white">{t("investigation.countermeasure.historical")}</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => applyHistoricalCountermeasures(true)} className="rounded-lg border border-white/10 px-4 py-2">
                      {t("common.yes")}
                    </button>
                    <button type="button" onClick={() => applyHistoricalCountermeasures(false)} className="rounded-lg border border-white/10 px-4 py-2">
                      {t("common.no")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="buek-small text-cyan-400">AI Recommendation — sorted by effectiveness for selected root cause</p>
                  {activeCountermeasures.map((option) => (
                    <label key={option.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3">
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={analysis.countermeasures.includes(option.label)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...analysis.countermeasures, option.label]
                              : analysis.countermeasures.filter((c) => c !== option.label);
                            void persistDraft({
                              ...analysis,
                              countermeasures: next,
                              countermeasureNotes: next.join("\n")
                            });
                          }}
                        />
                        <span className="buek-body text-slate-200">{option.label}</span>
                      </span>
                      <span className="font-semibold text-emerald-300">{option.confidence}%</span>
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
              <h2 className="buek-card-title text-slate-400">STEP 5 — Preview & Submit</h2>
              <p className="buek-body text-slate-400">
                Periksa ringkasan analisa sebelum dikirim ke supervisor.
              </p>
              <AnalysisPreviewContent analysis={analysis} engineerName={userName} />
              <EngineeringAnalysisDocumentPreview
                slug={slug}
                issueKey={issueKey}
                issueTitle={issueTitle}
                metrics={metrics}
                analysis={analysis}
                {...(issueMeta ? { issueMeta } : {})}
                showExport={false}
              />
              <button
                type="button"
                disabled={acting || !analysis.selectedCause}
                onClick={() => void handleSubmit()}
                className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                {acting ? "Mengirim..." : "Submit ke Supervisor"}
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
              {t("common.previous")}
            </button>
            <button
              type="button"
              disabled={step >= WIZARD_STEPS.length - 1}
              onClick={() => setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}
              className="rounded-lg border border-white/10 px-4 py-2 text-slate-300 disabled:opacity-40"
            >
              {t("common.next")}
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
  slug,
  issueKey,
  issueTitle,
  metrics,
  analysis,
  issueMeta,
  acting,
  onApprove,
  onReject
}: {
  slug: string;
  issueKey: string;
  issueTitle: string;
  metrics: {
    machineCode: string;
    currentPpm: number;
    targetPpm: number;
    increasePercent: number;
    priority: string;
    dueLabel: string;
  };
  analysis: EngineeringAnalysisData;
  issueMeta?: { createdAt: string; createdBy: string };
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <section className="buek-card space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
      <h2 className="buek-card-title text-amber-300">Supervisor Review — Engineering Analysis</h2>
      {analysis.submittedBy ? (
        <p className="buek-small text-slate-500">Dikirim oleh: {analysis.submittedBy}</p>
      ) : null}
      <AnalysisPreviewContent analysis={analysis} />
      <EngineeringAnalysisDocumentPreview
        slug={slug}
        issueKey={issueKey}
        issueTitle={issueTitle}
        metrics={metrics}
        analysis={analysis}
        {...(issueMeta ? { issueMeta } : {})}
      />
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

function AnalysisPreviewContent({
  analysis,
  engineerName
}: {
  analysis: EngineeringAnalysisData;
  engineerName?: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
      {engineerName ? <ReviewRow label="Engineer" value={engineerName} /> : null}
      {analysis.submittedBy ? <ReviewRow label="Dikirim oleh" value={analysis.submittedBy} /> : null}
      {analysis.submittedAt ? (
        <ReviewRow label="Waktu submit" value={formatDateTime(analysis.submittedAt)} />
      ) : null}
      <ReviewRow label="Evidence" value={formatEvidence(analysis)} />
      {analysis.evidence.photos?.length ? (
        <div className="border-b border-white/5 pb-3">
          <p className="buek-small text-slate-500">Foto Evidence</p>
          <PhotoGallery photos={analysis.evidence.photos} />
        </div>
      ) : null}
      <ReviewRow label="Root Cause (engineer-selected)" value={analysis.selectedCause?.label ?? "—"} />
      {analysis.analysisPhotos?.length ? (
        <div className="border-b border-white/5 pb-3">
          <p className="buek-small text-slate-500">Foto Analisa</p>
          <PhotoGallery photos={analysis.analysisPhotos} />
        </div>
      ) : null}
      <ReviewRow
        label="Countermeasure"
        value={analysis.countermeasureNotes || analysis.countermeasures.join(", ") || "—"}
      />
      <ReviewRow label="PIC" value={analysis.executionPlan.pic || "—"} />
      <ReviewRow label="Execution Date" value={analysis.executionPlan.executionDate || "—"} />
      <ReviewRow label="Expected Finish" value={analysis.executionPlan.expectedFinish || "—"} />
      <ReviewRow label="Verification Plan" value={analysis.executionPlan.verificationDate || "—"} />
    </div>
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

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

function SubmittedAnalysisCard({
  slug,
  issueKey,
  issueTitle,
  metrics,
  analysis,
  issueMeta,
  title,
  subtitle
}: {
  slug: string;
  issueKey: string;
  issueTitle: string;
  metrics: {
    machineCode: string;
    currentPpm: number;
    targetPpm: number;
    increasePercent: number;
    priority: string;
    dueLabel: string;
  };
  analysis: EngineeringAnalysisData;
  issueMeta?: { createdAt: string; createdBy: string };
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="buek-card space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
      <div>
        <p className="buek-body font-semibold text-white">{title}</p>
        {subtitle ? <p className="buek-small text-cyan-300">{subtitle}</p> : null}
      </div>
      <AnalysisPreviewContent analysis={analysis} />
      <EngineeringAnalysisDocumentPreview
        slug={slug}
        issueKey={issueKey}
        issueTitle={issueTitle}
        metrics={metrics}
        analysis={analysis}
        {...(issueMeta ? { issueMeta } : {})}
      />
    </section>
  );
}

function ProblemDatabasePanel({
  loading,
  similarCases,
  machines,
  onOpenKnowledge
}: {
  loading: boolean;
  similarCases: Array<{ id: string; title: string; reference?: string }>;
  machines: CompanyBrainMachineNode[];
  onOpenKnowledge?: () => void;
}) {
  return (
    <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="buek-card-title text-white">Database Problem</h2>
          <p className="buek-small text-slate-500">
            Kasus serupa dan riwayat issue per mesin — termasuk kapan di-issue dan siapa pembuatnya.
          </p>
        </div>
        {onOpenKnowledge ? (
          <button
            type="button"
            onClick={onOpenKnowledge}
            className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 buek-small text-slate-300 hover:bg-white/5"
          >
            Buka Company Brain →
          </button>
        ) : null}
      </div>

      {similarCases.length > 0 ? (
        <div className="space-y-2">
          <p className="buek-small text-cyan-400">Kasus Serupa (AI)</p>
          {similarCases.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 px-4 py-2">
              <p className="buek-body text-slate-200">{item.title}</p>
              {item.reference ? <p className="buek-small text-slate-500">Ref: {item.reference}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {loading ? <p className="buek-small text-slate-500">Memuat database problem...</p> : null}

      {!loading && machines.length > 0 ? (
        <div className="space-y-3">
          <p className="buek-small text-emerald-400">Riwayat Issue per Mesin</p>
          {machines.map((machine) => (
            <div key={machine.code} className="rounded-xl border border-white/10 p-4">
              <p className="buek-body font-medium text-white">
                {machine.code} — {machine.name}
              </p>
              <div className="mt-2 space-y-2">
                {machine.issues.map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                    <p className="buek-body text-slate-200">{issue.title}</p>
                    <p className="buek-small text-slate-500">
                      #{issue.issueKey} · {issue.status} · {formatDateTime(issue.createdAt)} · oleh {issue.createdBy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && machines.length === 0 && similarCases.length === 0 ? (
        <p className="buek-small text-slate-500">Belum ada data problem di database.</p>
      ) : null}
    </section>
  );
}

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function PhotoUploadField({
  label,
  photos,
  onChange
}: {
  label: string;
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_PHOTO_BYTES) continue;
      const dataUrl = await readFileAsDataUrl(file);
      next.push(dataUrl);
    }
    onChange(next);
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="buek-small text-slate-400">{label}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={photos.length >= MAX_PHOTOS}
          className="rounded-lg border border-white/10 px-3 py-1.5 buek-small text-cyan-300 hover:bg-white/5 disabled:opacity-40"
        >
          + Tambah Foto
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {photos.length > 0 ? <PhotoGallery photos={photos} editable onRemove={removePhoto} /> : null}
      <p className="buek-small text-slate-600">Maks {MAX_PHOTOS} foto, 2MB per file.</p>
    </div>
  );
}

function PhotoGallery({
  photos,
  editable,
  onRemove
}: {
  photos: string[];
  editable?: boolean;
  onRemove?: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {photos.map((src, index) => (
        <div key={`${index}-${src.slice(0, 32)}`} className="relative">
          <img
            src={src}
            alt={`Foto ${index + 1}`}
            className="h-24 w-24 rounded-lg border border-white/10 object-cover"
          />
          {editable && onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
              aria-label="Hapus foto"
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type EvidenceToggleKey = "qcResult" | "photo" | "trend" | "machineHistory";

interface EvidenceCard {
  id: string;
  title: string;
  body: string;
  toggleKey?: EvidenceToggleKey;
}

function countermeasuresForCause(
  options: CountermeasureOption[],
  causeId?: string
): CountermeasureOption[] {
  const filtered = causeId ? options.filter((option) => option.linkedCauseId === causeId) : options;
  return [...filtered].sort((a, b) => b.confidence - a.confidence);
}

function buildEvidenceCards(
  metrics: {
    currentPpm: number;
    totalProduction?: number;
    rejectCount?: number;
    ngRatePercent?: number;
    ngPhenomenon?: string;
  },
  copilot: InvestigationCopilot | null,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
): EvidenceCard[] {
  const cards: EvidenceCard[] = [];

  if (metrics.rejectCount !== undefined && metrics.totalProduction) {
    cards.push({
      id: "ng-report",
      title: t("investigation.evidence.ngReport"),
      body: `${metrics.rejectCount} NG / ${metrics.totalProduction.toLocaleString()} pcs · PPM ${metrics.currentPpm.toLocaleString()} · ${metrics.ngRatePercent ?? 0}% NG`,
      toggleKey: "qcResult"
    });
  }

  if (metrics.ngPhenomenon) {
    cards.push({
      id: "ng-phenomenon",
      title: t("investigation.evidence.ngPhenomenon"),
      body: metrics.ngPhenomenon,
      toggleKey: "qcResult"
    });
  }

  const contextLines = copilot?.autoLoadedContext ?? [];
  contextLines
    .filter((line) => !/operator ng report|ng phenomenon observed/i.test(line))
    .slice(0, 3)
    .forEach((line, index) => {
      cards.push({
        id: `telemetry-${index}`,
        title: t("investigation.evidence.machineTelemetry"),
        body: line,
        toggleKey: index === 0 ? "trend" : "machineHistory"
      });
    });

  copilot?.similarCases.slice(0, 2).forEach((item, index) => {
    const card: EvidenceCard = {
      id: `similar-${item.id}`,
      title: t("investigation.evidence.similarCase"),
      body: `${item.title}${item.reference ? ` (${item.reference})` : ""}`
    };
    if (index === 0) card.toggleKey = "machineHistory";
    cards.push(card);
  });

  copilot?.sopReferences.slice(0, 1).forEach((item) => {
    cards.push({
      id: `sop-${item.id}`,
      title: t("investigation.evidence.sop"),
      body: `${item.title}${item.referenceId ? ` — ${item.referenceId}` : ""}`,
      toggleKey: "machineHistory"
    });
  });

  return cards;
}
