import { AiPromptInput, SurfaceCard } from "@buek/ui";
import type { DemoUser, Workspace } from "../types.js";
import { FactorySummary } from "./FactorySummary.js";

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
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="text-sm text-slate-400">Good morning, {user.name}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{workspace.organization}</h1>
      </header>

      <AiPromptInput
        value={homePrompt}
        onChange={onHomePromptChange}
        onSubmit={onHomePromptSubmit}
        disabled={isStreaming}
        autoFocus
      />

      <SurfaceCard title="Today's Summary">
        <p className="text-sm text-emerald-200">
          {workspace.factoryHealth.status === "healthy" ? "🟢" : "🟡"} {workspace.factoryHealth.message}
        </p>
        <div className="mt-3 space-y-1 text-sm text-slate-400">
          {workspace.summaryCounts.maintenanceAlerts > 0 ? (
            <p>
              {workspace.summaryCounts.maintenanceAlerts} Maintenance Alert
              {workspace.summaryCounts.maintenanceAlerts > 1 ? "s" : ""}
            </p>
          ) : null}
          {workspace.summaryCounts.qualityIssues > 0 ? (
            <p>
              {workspace.summaryCounts.qualityIssues} Quality Issue
              {workspace.summaryCounts.qualityIssues > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      </SurfaceCard>

      {workspace.continueWorking.length > 0 ? (
        <SurfaceCard title="Continue Working">
          <ul className="space-y-2">
            {workspace.continueWorking.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onContinueItem(item.prompt ?? item.label)}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/5"
                >
                  • {item.label}
                </button>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      ) : null}

      <FactorySummary workspace={workspace} />
    </div>
  );
}
