import { ExpandableSection } from "@buek/ui";
import { areaStatusIcon } from "../lib/chat.js";
import type { Workspace } from "../types.js";

interface FactoryAreasProps {
  workspace: Workspace;
}

export function FactoryAreas({ workspace }: FactoryAreasProps) {
  return (
    <div className="space-y-2">
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
                <div key={metric.label} className="text-sm">
                  <span className="text-slate-500">{metric.label}</span>
                  <span className="ml-2 text-slate-200">{metric.value}</span>
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
                    <p className="text-sm text-slate-400">No additional history.</p>
                  )}
                </ExpandableSection>
              ))}
            </div>
          ) : null}
        </ExpandableSection>
      ))}
    </div>
  );
}
