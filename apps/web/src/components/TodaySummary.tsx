import { ExpandableSection } from "@buek/ui";
import type { Workspace } from "../types.js";
import { FactoryAreas } from "./FactoryAreas.js";

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
    <section className="border-t border-white/5 pt-6">
      <h2 className="text-xs tracking-wide text-slate-500">Today&apos;s Summary</h2>
      <p className="mt-3 text-sm text-slate-300">
        {healthIcon} {workspace.factoryHealth.message}
      </p>
      <div className="mt-2 space-y-0.5 text-sm text-slate-500">
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

      {workspace.factoryAreas.length > 0 ? (
        <div className="mt-4">
          <ExpandableSection
            title="Today's Factory"
            subtitle={
              workspace.factoryHealth.status === "healthy" ? "Healthy" : workspace.factoryHealth.message
            }
            leading={<span>{healthIcon}</span>}
          >
            <FactoryAreas workspace={workspace} />
          </ExpandableSection>
        </div>
      ) : null}
    </section>
  );
}
