import type { EngineeringAnalysisData } from "../lib/data-api.js";

const WIZARD_STEPS = [
  "Evidence",
  "Possible Root Cause",
  "Countermeasure",
  "Execution Plan",
  "Preview & Submit"
] as const;

function stepDetail(step: number, analysis: EngineeringAnalysisData): string {
  switch (step) {
    case 0: {
      const parts: string[] = [];
      if (analysis.evidence.qcResult) parts.push("QC Result");
      if (analysis.evidence.photo || analysis.evidence.photos?.length) {
        parts.push(`${analysis.evidence.photos?.length ?? 0} Photo(s)`);
      }
      if (analysis.evidence.trend) parts.push("Trend");
      if (analysis.evidence.machineHistory) parts.push("Machine History");
      if (analysis.evidence.notes) parts.push(analysis.evidence.notes.slice(0, 40));
      return parts.length ? parts.join(" · ") : "Tap to Continue";
    }
    case 1:
      return analysis.selectedCause?.label ?? "Tap to Continue";
    case 2:
      return analysis.countermeasures.length
        ? analysis.countermeasures[0]!
        : analysis.countermeasureNotes
          ? analysis.countermeasureNotes.slice(0, 40)
          : "Tap to Continue";
    case 3:
      return analysis.executionPlan.pic
        ? `PIC: ${analysis.executionPlan.pic}`
        : "Tap to Continue";
    case 4:
      return analysis.status !== "draft" ? "Ready to Submit" : "Review & Submit";
    default:
      return "";
  }
}

function stepDone(step: number, analysis: EngineeringAnalysisData, currentStep: number): boolean {
  if (step < currentStep) return true;
  switch (step) {
    case 0:
      return Boolean(
        analysis.evidence.qcResult ||
          analysis.evidence.photo ||
          analysis.evidence.trend ||
          analysis.evidence.machineHistory ||
          analysis.evidence.notes ||
          analysis.evidence.photos?.length
      );
    case 1:
      return Boolean(analysis.selectedCause?.label);
    case 2:
      return analysis.countermeasures.length > 0 || Boolean(analysis.countermeasureNotes);
    case 3:
      return Boolean(analysis.executionPlan.pic && analysis.executionPlan.executionDate);
    case 4:
      return analysis.status !== "draft" && analysis.status !== "revision_requested";
    default:
      return false;
  }
}

interface Props {
  analysis: EngineeringAnalysisData;
  currentStep: number;
  onStepSelect?: (step: number) => void;
  title?: string;
  progressPercent?: number;
}

export function InvestigationStepper({
  analysis,
  currentStep,
  onStepSelect,
  title = "Investigation",
  progressPercent
}: Props) {
  const progress =
    progressPercent ??
    Math.round(
      ((WIZARD_STEPS.filter((_, index) => stepDone(index, analysis, currentStep)).length ||
        currentStep + 1) /
        WIZARD_STEPS.length) *
        100
    );

  return (
    <div className="investigation-stepper space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mobile-title text-lg font-semibold text-white lg:text-xl">{title}</p>
          <p className="mobile-body text-sm text-slate-500 lg:text-base">Langkah {currentStep + 1} dari {WIZARD_STEPS.length}</p>
        </div>
        <p className="text-2xl font-bold text-cyan-400">{progress}%</p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="space-y-0">
        {WIZARD_STEPS.map((label, index) => {
          const done = stepDone(index, analysis, currentStep);
          const active = index === currentStep;
          const detail = stepDetail(index, analysis);
          const clickable = Boolean(onStepSelect);

          return (
            <li key={label}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepSelect?.(index)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-cyan-400/40 bg-cyan-500/10"
                    : done
                      ? "border-white/10 bg-white/[0.02]"
                      : "border-white/5 bg-transparent"
                } ${clickable ? "hover:border-cyan-400/30" : ""}`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    done ? "bg-emerald-500/20 text-emerald-300" : active ? "bg-cyan-500 text-slate-950" : "bg-white/10 text-slate-500"
                  }`}
                >
                  {done ? "✔" : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`mobile-body font-medium ${active ? "text-white" : done ? "text-slate-300" : "text-slate-500"}`}>
                    {label}
                  </p>
                  <p className="mobile-small mt-1 text-slate-500">{detail}</p>
                </div>
                {active ? <span className="text-cyan-400">→</span> : null}
              </button>
              {index < WIZARD_STEPS.length - 1 ? (
                <div className="ml-7 border-l border-dashed border-white/10 py-1" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export { WIZARD_STEPS as INVESTIGATION_WIZARD_STEPS };
