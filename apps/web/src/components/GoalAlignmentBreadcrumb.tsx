import type { GoalLink } from "../lib/governance-api.js";

const LEVEL_LABELS: Record<GoalLink["level"], string> = {
  mission: "Misi",
  project: "Proyek",
  investigation: "Investigasi",
  task: "Tugas"
};

interface GoalAlignmentBreadcrumbProps {
  goalChain: GoalLink[];
  compact?: boolean;
}

export function GoalAlignmentBreadcrumb({ goalChain, compact = false }: GoalAlignmentBreadcrumbProps) {
  if (!goalChain.length) return null;

  return (
    <nav aria-label="Goal alignment" className="goal-alignment-breadcrumb rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
        Kenapa tugas ini penting
      </p>
      <ol className={`mt-3 space-y-2 ${compact ? "text-sm" : ""}`}>
        {goalChain.map((link, index) => (
          <li key={`${link.level}-${index}`} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-300">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {LEVEL_LABELS[link.level]}
              </p>
              <p className="font-medium text-white">{link.label}</p>
              {link.reason ? <p className="text-xs text-slate-400">{link.reason}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
