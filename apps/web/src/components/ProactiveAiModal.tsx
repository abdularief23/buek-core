import type { Workspace } from "../types.js";

interface ProactiveAiModalProps {
  workspace: Workspace;
  onDismiss: () => void;
  onSelectCard: (prompt: string, contextLabel: string) => void;
}

export function ProactiveAiModal({ workspace, onDismiss, onSelectCard }: ProactiveAiModalProps) {
  const { proactiveGreeting, proactiveCards } = workspace.dailyWorkspace;

  if (!proactiveCards.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <p className="text-sm leading-relaxed text-slate-200">{proactiveGreeting}</p>

        <ul className="mt-4 space-y-2">
          {proactiveCards.map((card) => (
            <li key={card.text}>
              <button
                type="button"
                onClick={() => onSelectCard(card.prompt, card.contextLabel)}
                className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
              >
                <span className="text-base">{card.icon}</span>
                <span className="text-sm text-slate-300">{card.text}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full py-2 text-center text-sm text-slate-500 hover:text-slate-300"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
