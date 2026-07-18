import type { Workspace } from "../types.js";

interface RecentInvestigationProps {
  workspace: Workspace;
  onSelect: (prompt: string) => void;
}

export function RecentInvestigation({ workspace, onSelect }: RecentInvestigationProps) {
  if (!workspace.recentInvestigations.length) return null;

  return (
    <section className="border-t border-white/5 pt-6">
      <h2 className="text-xs font-medium tracking-wide text-slate-500">Recent Investigation</h2>
      <ul className="mt-3 space-y-3">
        {workspace.recentInvestigations.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">{item.label}</span>
            <button
              type="button"
              onClick={() => onSelect(item.prompt)}
              className="shrink-0 text-sm text-cyan-400 hover:text-cyan-300"
            >
              {item.actionLabel} ↓
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
