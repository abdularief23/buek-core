import type { Workspace } from "../types.js";

interface ContinueWorkingProps {
  workspace: Workspace;
  onSelect: (prompt: string) => void;
}

export function ContinueWorking({ workspace, onSelect }: ContinueWorkingProps) {
  if (!workspace.continueWorking.length) return null;

  return (
    <section className="border-t border-white/5 pt-6">
      <h2 className="text-xs tracking-wide text-slate-500">Continue Working</h2>
      <ul className="mt-3 space-y-1">
        {workspace.continueWorking.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.prompt ?? item.label)}
              className="w-full py-1.5 text-left text-sm text-slate-400 transition hover:text-slate-200"
            >
              • {item.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
