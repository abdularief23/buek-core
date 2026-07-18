import { ExpandableSection } from "@buek/ui";
import { areaStatusIcon } from "../lib/chat.js";
import type { Workspace } from "../types.js";

interface FactorySummaryProps {
  workspace: Workspace;
}

export function FactorySummary({ workspace }: FactorySummaryProps) {
  const { factoryHealth, summaryCounts } = workspace;

  return (
    <ExpandableSection
      title="Today's Factory"
      subtitle={
        factoryHealth.status === "healthy"
          ? "Healthy — no critical issues"
          : factoryHealth.message
      }
      leading={
        <span>{factoryHealth.status === "healthy" ? "🟢" : factoryHealth.status === "attention" ? "🟡" : "🔴"}</span>
      }
    >
      <div className="space-y-2 text-sm text-slate-300">
        <p>{factoryHealth.message}</p>
        {summaryCounts.maintenanceAlerts > 0 ? (
          <p>{summaryCounts.maintenanceAlerts} Maintenance Alert{summaryCounts.maintenanceAlerts > 1 ? "s" : ""}</p>
        ) : null}
        {summaryCounts.qualityIssues > 0 ? (
          <p>{summaryCounts.qualityIssues} Quality Issue{summaryCounts.qualityIssues > 1 ? "s" : ""}</p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {workspace.factoryAreas.map((area) => (
          <ExpandableSection
            key={area.id}
            level={1}
            title={area.label}
            subtitle={area.summary}
            leading={<span>{areaStatusIcon(area.status)}</span>}
          >
            {area.metrics?.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {area.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm">
                    <span className="text-slate-500">{metric.label}</span>
                    <span className="ml-2 font-medium text-slate-200">{metric.value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {area.items?.length ? (
              <div className="mt-2 space-y-2">
                {area.items.map((item) => (
                  <ExpandableSection
                    key={item.id}
                    level={2}
                    title={item.label}
                    {...(item.issue ? { subtitle: item.issue } : {})}
                  >
                    {item.history?.length ? (
                      <ul className="space-y-1 text-sm text-slate-400">
                        {item.history.map((entry) => (
                          <li key={entry}>• {entry}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">No history available.</p>
                    )}
                  </ExpandableSection>
                ))}
              </div>
            ) : null}
          </ExpandableSection>
        ))}
      </div>
    </ExpandableSection>
  );
}
