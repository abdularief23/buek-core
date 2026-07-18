import { ExpandableSection } from "@buek/ui";
import { FactorySummary } from "./FactorySummary.js";
import type { ContextPanel } from "../lib/ai-actions.js";
import type { Workspace } from "../types.js";

interface AiContextPanelsProps {
  panels: ContextPanel[];
  workspace: Workspace;
}

export function AiContextPanels({ panels, workspace }: AiContextPanelsProps) {
  if (!panels.length) return null;

  return (
    <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
      {panels.map((panel) => {
        if (panel.kind === "sop") {
          return (
            <ExpandableSection key={panel.id} title={panel.label}>
              {panel.excerpt ? (
                <p className="text-sm leading-6 text-slate-400">{panel.excerpt}</p>
              ) : (
                <p className="text-sm text-slate-500">SOP retrieved from workspace knowledge.</p>
              )}
            </ExpandableSection>
          );
        }

        if (panel.kind === "machine" && panel.machineItem) {
          const isHistory = panel.label.toLowerCase().includes("history");

          return (
            <ExpandableSection
              key={panel.id}
              title={panel.label}
              {...(isHistory || !panel.machineItem.issue ? {} : { subtitle: panel.machineItem.issue })}
            >
              {isHistory && panel.machineItem.history?.length ? (
                <ul className="space-y-1 text-sm text-slate-400">
                  {panel.machineItem.history.map((entry) => (
                    <li key={entry}>• {entry}</li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2 text-sm text-slate-400">
                  <p>Runtime, alarm, PM, and downtime scoped to this workspace.</p>
                  {panel.machineItem.issue ? <p>Issue: {panel.machineItem.issue}</p> : null}
                </div>
              )}
            </ExpandableSection>
          );
        }

        if (panel.kind === "factory") {
          return (
            <ExpandableSection key={panel.id} title={panel.label}>
              <FactorySummary workspace={workspace} />
            </ExpandableSection>
          );
        }

        if (panel.kind === "kpi" && panel.metrics?.length) {
          return (
            <ExpandableSection key={panel.id} title={panel.label}>
              <div className="grid gap-2 sm:grid-cols-2">
                {panel.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm">
                    <span className="text-slate-500">{metric.label}</span>
                    <span className="ml-2 font-medium text-slate-200">{metric.value}</span>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          );
        }

        return null;
      })}
    </div>
  );
}
