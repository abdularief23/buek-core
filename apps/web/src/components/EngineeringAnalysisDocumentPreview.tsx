import type { EngineeringAnalysisData } from "../lib/data-api.js";
import { analysisDocumentExportUrl } from "../lib/data-api.js";

interface DocumentMetrics {
  machineCode: string;
  currentPpm: number;
  targetPpm: number;
  increasePercent: number;
  priority: string;
  dueLabel: string;
}

interface Props {
  slug: string;
  issueKey: string;
  issueTitle: string;
  metrics: DocumentMetrics;
  analysis: EngineeringAnalysisData;
  issueMeta?: {
    createdAt: string;
    createdBy: string;
  };
  showExport?: boolean;
}

const DOCUMENT_SECTIONS = [
  ["Problem / Background", "background"],
  ["Evidence", "evidence"],
  ["Analysis", "analysis"],
  ["Decision", "decision"],
  ["Working Hypothesis", "rootCause"],
  ["Countermeasure", "countermeasure"],
  ["Execution Plan", "executionPlan"],
  ["Verification", "verification"],
  ["Verification Result", "verificationResult"],
  ["Lessons Learned", "lessonsLearned"]
] as const;

function buildSections(
  issueTitle: string,
  metrics: DocumentMetrics,
  analysis: EngineeringAnalysisData
) {
  const evidence = [
    analysis.evidence.qcResult ? "✓ QC Result" : null,
    analysis.evidence.photo ? "✓ Photo" : null,
    analysis.evidence.trend ? "✓ Trend" : null,
    analysis.evidence.machineHistory ? "✓ Machine History" : null,
    analysis.evidence.notes || null
  ]
    .filter(Boolean)
    .join("\n");

  return {
    background: [
      `Issue: ${issueTitle}`,
      `Machine: ${metrics.machineCode}`,
      `PPM: ${metrics.currentPpm.toLocaleString()} (target ${metrics.targetPpm.toLocaleString()}, +${metrics.increasePercent}%)`,
      `Priority: ${metrics.priority}`,
      `Due: ${metrics.dueLabel}`
    ].join("\n"),
    evidence: evidence || "—",
    analysis: `Engineer-selected possible cause: ${analysis.selectedCause?.label ?? "—"} (${analysis.selectedCause?.confidence ?? 0}% confidence)`,
    decision: `Engineer decision: ${analysis.selectedCause?.label ?? "Manual analysis"}`,
    rootCause: `Working hypothesis: ${analysis.selectedCause?.label ?? "—"}`,
    countermeasure:
      [...analysis.countermeasures, analysis.countermeasureNotes].filter(Boolean).join("\n") || "—",
    executionPlan: [
      `PIC: ${analysis.executionPlan.pic || "—"}`,
      `Execution Date: ${analysis.executionPlan.executionDate || "—"}`,
      `Expected Finish: ${analysis.executionPlan.expectedFinish || "—"}`,
      `Verification Date: ${analysis.executionPlan.verificationDate || "—"}`
    ].join("\n"),
    verification: `Verification scheduled: ${analysis.executionPlan.verificationDate || "—"}`,
    verificationResult: analysis.verification?.lessonsLearned ?? "Pending supervisor approval and execution",
    lessonsLearned: analysis.verification?.lessonsLearned ?? "—"
  };
}

function documentNumber(issueKey: string, submittedAt?: string) {
  const date = (submittedAt ?? new Date().toISOString()).slice(0, 10).replace(/-/g, "");
  const key = issueKey.replace(/[^a-z0-9]/gi, "").slice(0, 12).toUpperCase();
  return `EA-${key}-${date}`;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

export function EngineeringAnalysisDocumentPreview({
  slug,
  issueKey,
  issueTitle,
  metrics,
  analysis,
  issueMeta,
  showExport = true
}: Props) {
  const sections = buildSections(issueTitle, metrics, analysis);
  const docNo = documentNumber(issueKey, analysis.submittedAt);
  const exportUrl = analysisDocumentExportUrl(slug, issueKey, true);
  const canExport = showExport && analysis.status !== "draft";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="buek-card-title text-white">Preview Dokumen</h3>
          <p className="buek-small text-slate-500">
            Dokumen resmi analisa engineering — siap dicetak atau diekspor PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canExport ? (
            <>
              <button
                type="button"
                onClick={() => window.open(exportUrl, "_blank", "noopener,noreferrer")}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Buka / Cetak PDF
              </button>
              <a
                href={analysisDocumentExportUrl(slug, issueKey, false)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
              >
                Lihat HTML
              </a>
            </>
          ) : (
            <p className="buek-small text-slate-500">Dokumen PDF tersedia setelah submit.</p>
          )}
        </div>
      </div>

      <div
        id={`analysis-document-${issueKey}`}
        className="analysis-document-preview rounded-2xl border border-white/10 bg-white p-8 font-mono text-sm leading-relaxed text-slate-800 shadow-inner"
      >
        <p className="text-center text-base font-bold tracking-widest text-slate-900">
          ENGINEERING ANALYSIS DOCUMENT
        </p>
        <p className="my-4 text-center text-slate-400">--------------------------------</p>

        <div className="grid gap-1 sm:grid-cols-2">
          <p>Problem     : {issueTitle}</p>
          <p>Machine     : {metrics.machineCode}</p>
          <p>Engineer    : {analysis.submittedBy ?? "—"}</p>
          <p>Document No : {docNo}</p>
          <p>Status      : {formatStatus(analysis.status)}</p>
          <p>Submitted   : {analysis.submittedAt ? new Date(analysis.submittedAt).toLocaleString("id-ID") : "—"}</p>
          {issueMeta ? (
            <>
              <p>Issued      : {new Date(issueMeta.createdAt).toLocaleString("id-ID")}</p>
              <p>Created By  : {issueMeta.createdBy}</p>
            </>
          ) : null}
        </div>

        <p className="my-4 text-center text-slate-400">--------------------------------</p>

        {DOCUMENT_SECTIONS.map(([label, key]) => (
          <div key={key} className="mb-6">
            <p className="font-semibold text-slate-900">{label}</p>
            <p className="my-2 text-slate-400">--------------------------------</p>
            <p className="whitespace-pre-wrap font-sans text-slate-700">{sections[key]}</p>
          </div>
        ))}

        <div className="mb-6">
          <p className="font-semibold text-slate-900">Attachments</p>
          <p className="my-2 text-slate-400">--------------------------------</p>
          <div className="space-y-4 font-sans">
            {analysis.evidence.photos?.length ? (
              <div>
                <p className="text-slate-700">Evidence Photos ({analysis.evidence.photos.length})</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {analysis.evidence.photos.map((src, index) => (
                    <img
                      key={`evidence-${index}`}
                      src={src}
                      alt={`Evidence ${index + 1}`}
                      className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {analysis.analysisPhotos?.length ? (
              <div>
                <p className="text-slate-700">Analysis Photos ({analysis.analysisPhotos.length})</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {analysis.analysisPhotos.map((src, index) => (
                    <img
                      key={`analysis-${index}`}
                      src={src}
                      alt={`Analysis ${index + 1}`}
                      className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {!analysis.evidence.photos?.length && !analysis.analysisPhotos?.length ? (
              <p className="text-slate-500">No photo attachments</p>
            ) : null}
          </div>
        </div>

        <p className="my-4 text-center text-slate-400">--------------------------------</p>
        <p className="text-center text-xs text-slate-500">
          Official document generated by Buek Core Enterprise AI Platform
        </p>
      </div>
    </div>
  );
}
