import type { Workspace } from "../types.js";

interface TodaySummaryProps {
  workspace: Workspace;
  onAction: (prompt: string) => void;
}

function statusIcon(status: Workspace["factoryHealth"]["status"]) {
  if (status === "healthy") return "🟢";
  if (status === "attention") return "🟡";
  return "🔴";
}

export function TodaySummary({ workspace, onAction }: TodaySummaryProps) {
  return (
    <section>
      <h2 className="text-xs font-medium tracking-wide text-slate-500">Today&apos;s Summary</h2>

      <div className="mt-3 space-y-1">
        <p className="text-sm text-slate-200">
          {statusIcon(workspace.factoryHealth.status)} Factory{" "}
          {workspace.factoryHealth.status === "healthy"
            ? "Healthy"
            : workspace.factoryHealth.status === "attention"
              ? "Attention Needed"
              : "Critical"}
        </p>
        {workspace.summaryCounts.maintenanceAlerts > 0 ? (
          <p className="text-sm text-slate-400">
            {workspace.summaryCounts.maintenanceAlerts} Maintenance Alert
            {workspace.summaryCounts.maintenanceAlerts > 1 ? "s" : ""}
          </p>
        ) : null}
        {workspace.summaryCounts.qualityIssues > 0 ? (
          <p className="text-sm text-slate-400">
            {workspace.summaryCounts.qualityIssues} Quality Investigation
            {workspace.summaryCounts.qualityIssues > 1 ? "s" : ""}
          </p>
        ) : null}
      </div>

      {workspace.summaryItems.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {workspace.summaryItems.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-200">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{item.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => onAction(item.prompt)}
                className="shrink-0 text-sm text-cyan-400 hover:text-cyan-300"
              >
                {item.actionLabel} ↓
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
