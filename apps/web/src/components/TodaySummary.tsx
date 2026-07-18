import type { Workspace } from "../types.js";

interface TodaySummaryProps {
  workspace: Workspace;
}

export function TodaySummary({ workspace }: TodaySummaryProps) {
  const healthIcon =
    workspace.factoryHealth.status === "healthy"
      ? "🟢"
      : workspace.factoryHealth.status === "attention"
        ? "🟡"
        : "🔴";

  return (
    <section>
      <h2 className="text-xs font-medium tracking-wide text-slate-500">Today&apos;s Summary</h2>
      <p className="mt-3 text-sm text-slate-200">
        {healthIcon} {workspace.factoryHealth.message}
      </p>
      {workspace.factoryHealth.status === "healthy" ? (
        <p className="mt-1 text-sm text-slate-500">No critical issues</p>
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
    </section>
  );
}
