import { AiPromptInput } from "@buek/ui";
import type { DemoUser, Workspace } from "../types.js";
import { ExamplePrompts } from "./ExamplePrompts.js";
import { RecentInvestigation } from "./RecentInvestigation.js";
import { TodaySummary } from "./TodaySummary.js";

interface HomeViewProps {
  user: DemoUser;
  workspace: Workspace;
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onAsk: (prompt: string) => void;
}

export function HomeView({
  user,
  workspace,
  input,
  isStreaming,
  onInputChange,
  onAsk
}: HomeViewProps) {
  async function handleSubmit() {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;
    onInputChange("");
    onAsk(trimmedInput);
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-8">
      <header className="space-y-3">
        <div>
          <p className="text-sm text-slate-400">Good morning, {user.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{user.role}</h1>
          <p className="mt-1 text-sm text-slate-500">{workspace.organization}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm leading-relaxed text-slate-200">{workspace.aiGreeting.intro}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
            {workspace.aiGreeting.attentionItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-300">{workspace.aiGreeting.prompt}</p>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-300">What would you like to do?</h2>
        <p className="text-sm text-slate-500">
          Ask anything about{" "}
          {workspace.capabilities.map((capability, index) => (
            <span key={capability}>
              {index > 0 ? (index === workspace.capabilities.length - 1 ? ", and " : ", ") : ""}
              <span className="text-slate-400">{capability}</span>
            </span>
          ))}
        </p>
      </section>

      <section className="space-y-3 border-y border-white/10 py-6">
        <h2 className="text-sm font-medium text-slate-300">Ask Buek</h2>
        <AiPromptInput
          value={input}
          onChange={onInputChange}
          onSubmit={handleSubmit}
          disabled={isStreaming}
          placeholder="Ask anything about your factory..."
        />
      </section>

      <ExamplePrompts workspace={workspace} onSelect={onAsk} />
      <TodaySummary workspace={workspace} onAction={onAsk} />
      <RecentInvestigation workspace={workspace} onSelect={onAsk} />
    </div>
  );
}
