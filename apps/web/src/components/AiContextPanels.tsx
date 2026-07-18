import { ExpandableSection } from "@buek/ui";
import { FactoryAreas } from "./FactoryAreas.js";
import type { ContextPanel } from "../lib/ai-actions.js";
import type { Workspace } from "../types.js";

interface AiContextPanelsProps {
  panels: ContextPanel[];
  workspace: Workspace;
}

export function AiContextPanels({ panels, workspace }: AiContextPanelsProps) {
  if (!panels.length) return null;

  return (
    <div className="mt-3 space-y-1">
      {panels.map((panel) => {
        if (panel.kind === "sop") {
          return (
            <ExpandableSection key={panel.id} title={panel.label}>
              {panel.excerpt ? (
                <p className="text-sm leading-6 text-slate-400">{panel.excerpt}</p>
              ) : (
                <p className="text-sm text-slate-500">Retrieved from workspace knowledge.</p>
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
                <div className="space-y-1 text-sm text-slate-400">
                  <p>Runtime · Alarm · PM · Downtime</p>
                  {panel.machineItem.issue ? <p>{panel.machineItem.issue}</p> : null}
                </div>
              )}
            </ExpandableSection>
          );
        }

        if (panel.kind === "similar" && panel.similarCases?.length) {
          return (
            <ExpandableSection key={panel.id} title={panel.label}>
              <ul className="space-y-2 text-sm text-slate-400">
                {panel.similarCases.map((item) => (
                  <li key={item.id}>
                    <span className="text-slate-300">{item.title}</span>
                    <p className="mt-0.5 text-xs">{item.summary}</p>
                  </li>
                ))}
              </ul>
            </ExpandableSection>
          );
        }

        if (panel.kind === "factory") {
          return (
            <ExpandableSection key={panel.id} title={panel.label}>
              <FactoryAreas workspace={workspace} />
            </ExpandableSection>
          );
        }

        if (panel.kind === "kpi" && panel.metrics?.length) {
          return (
            <ExpandableSection key={panel.id} title={panel.label}>
              <div className="space-y-2">
                {panel.metrics.map((metric) => (
                  <div key={metric.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{metric.label}</span>
                    <span className="text-slate-200">{metric.value}</span>
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
