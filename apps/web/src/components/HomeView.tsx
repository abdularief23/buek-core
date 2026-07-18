import { AiPromptInput } from "@buek/ui";
import type { DemoUser, Workspace } from "../types.js";

interface HomeViewProps {
  user: DemoUser;
  workspace: Workspace;
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onAsk: (prompt: string) => void;
  onBriefAction: (prompt: string, contextLabel: string) => void;
  onContinue: (prompt: string, contextLabel: string) => void;
}

function briefBorder(severity: "critical" | "warning" | "success") {
  if (severity === "critical") return "border-red-500/30 bg-red-500/5";
  if (severity === "warning") return "border-amber-500/30 bg-amber-500/5";
  return "border-emerald-500/30 bg-emerald-500/5";
}

export function HomeView({
  user,
  workspace,
  input,
  isStreaming,
  onInputChange,
  onAsk,
  onBriefAction,
  onContinue
}: HomeViewProps) {
  const daily = workspace.dailyWorkspace;

  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onInputChange("");
    onAsk(trimmed);
  }

  return (
    <div className="space-y-10 pb-12">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Good Morning, {user.name} 👋
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            {user.role} <span className="text-slate-600">•</span> {workspace.organization}
          </p>
        </div>
        <div className="max-w-2xl space-y-1 text-base text-slate-300">
          <p>I have analyzed your factory this morning.</p>
          <p>
            I found{" "}
            <span className="font-medium text-white">{daily.dailyBrief.length} items</span> that may
            need your attention.
          </p>
        </div>
      </header>

      {daily.dailyBrief.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            AI Daily Brief
          </h2>
          <div className="space-y-4">
            {daily.dailyBrief.map((item) => (
              <article
                key={item.id}
                className={`flex flex-col gap-4 rounded-2xl border px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${briefBorder(item.severity)}`}
              >
                <div className="space-y-1">
                  <p className="text-lg font-medium text-white">
                    {item.icon} {item.title}
                  </p>
                  <p className="text-base text-slate-400">{item.detail}</p>
                  {item.confidence ? (
                    <p className="text-sm text-slate-500">Confidence {item.confidence}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onBriefAction(item.prompt, item.contextLabel)}
                  className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                >
                  {item.actionLabel}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {daily.continueWorking.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Continue Working
          </h2>
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
            {daily.continueWorking.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onContinue(item.prompt, item.label)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-base text-slate-300 transition hover:bg-white/[0.03] hover:text-white"
                >
                  <span>{item.label}</span>
                  <span className="text-cyan-400">→</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4 border-t border-white/10 pt-10">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">Ask Buek</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <AiPromptInput
            value={input}
            onChange={onInputChange}
            onSubmit={handleSubmit}
            disabled={isStreaming}
            placeholder="Ask anything about your factory..."
            id="home-ask-buek"
          />
        </div>
      </section>
    </div>
  );
}
