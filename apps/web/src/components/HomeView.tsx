import { AiPromptInput, SurfaceCard } from "@buek/ui";
import type { DemoUser, Workspace } from "../types.js";

interface HomeViewProps {
  user: DemoUser;
  workspace: Workspace;
  homePrompt: string;
  isStreaming: boolean;
  onHomePromptChange: (value: string) => void;
  onHomePromptSubmit: () => void;
  onContinueItem: (prompt: string) => void;
}

export function HomeView({
  user,
  workspace,
  homePrompt,
  isStreaming,
  onHomePromptChange,
  onHomePromptSubmit,
  onContinueItem
}: HomeViewProps) {
  const healthIcon =
    workspace.factoryHealth.status === "healthy"
      ? "🟢"
      : workspace.factoryHealth.status === "attention"
        ? "🟡"
        : "🔴";

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <header className="space-y-1">
        <p className="text-sm text-slate-400">Good morning, {user.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{workspace.organization}</h1>
        <p className="text-sm text-slate-500">What can I help you with today?</p>
      </header>

      <AiPromptInput
        value={homePrompt}
        onChange={onHomePromptChange}
        onSubmit={onHomePromptSubmit}
        disabled={isStreaming}
        autoFocus
        placeholder="Ask anything about production, maintenance, quality, KPI..."
      />

      <SurfaceCard title="Today's Summary">
        <p className="text-sm text-slate-200">
          {healthIcon} {workspace.factoryHealth.message}
        </p>
        {workspace.factoryHealth.status === "healthy" ? (
          <p className="mt-2 text-sm text-slate-500">No critical issues</p>
        ) : null}
        <div className="mt-3 space-y-1 text-sm text-slate-400">
          {workspace.summaryCounts.maintenanceAlerts > 0 ? (
            <p>
              {workspace.summaryCounts.maintenanceAlerts} maintenance alert
              {workspace.summaryCounts.maintenanceAlerts > 1 ? "s" : ""}
            </p>
          ) : null}
          {workspace.summaryCounts.qualityIssues > 0 ? (
            <p>
              {workspace.summaryCounts.qualityIssues} quality issue
              {workspace.summaryCounts.qualityIssues > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      </SurfaceCard>

      {workspace.continueWorking.length > 0 ? (
        <SurfaceCard title="Continue Working">
          <ul className="space-y-1">
            {workspace.continueWorking.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onContinueItem(item.prompt ?? item.label)}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  • {item.label}
                </button>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
