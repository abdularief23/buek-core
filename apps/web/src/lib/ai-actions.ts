import type { ChatMetadata, Workspace } from "../types.js";

export interface ContextPanel {
  id: string;
  label: string;
  kind: "sop" | "machine" | "factory" | "kpi";
  excerpt?: string;
  machineItem?: {
    label: string;
    issue?: string;
    history?: string[];
  };
  metrics?: Array<{ label: string; value: string }>;
}

const factoryKeywords = /\b(oee|ppm|kpi|production|output|reject|delivery|factory|shift)\b/i;
const machineKeywords = /\b(machine|mesin|alarm|bearing|temperature|vibration|pm|downtime)\b/i;

function combinedText(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function findMaintenanceItems(workspace: Workspace, haystack: string) {
  const maintenanceArea = workspace.factoryAreas.find((area) => area.id === "maintenance");
  if (!maintenanceArea?.items?.length || !machineKeywords.test(haystack)) {
    return [];
  }

  return maintenanceArea.items.filter((item) => {
    const label = item.label.toLowerCase();
    const token = label.replace(/\s+/g, "").toLowerCase();
    return haystack.includes(label) || haystack.includes(token) || /\b(?:machine|mesin)\b/.test(haystack);
  });
}

export function deriveContextPanels(
  workspace: Workspace,
  assistantContent: string,
  userContent: string,
  metadata?: ChatMetadata
): ContextPanel[] {
  const panels: ContextPanel[] = [];
  const haystack = combinedText(userContent, assistantContent);

  if (metadata?.references.length) {
    for (const reference of metadata.references) {
      panels.push({
        id: `sop-${reference.id}`,
        kind: "sop",
        label: `View ${reference.referenceId ?? reference.title}`,
        ...(reference.excerpt ? { excerpt: reference.excerpt } : {})
      });
    }
  }

  for (const item of findMaintenanceItems(workspace, haystack)) {
    panels.push({
      id: `machine-${item.id}`,
      kind: "machine",
      label: `View ${item.label}`,
      machineItem: item
    });

    if (item.history?.length) {
      panels.push({
        id: `history-${item.id}`,
        kind: "machine",
        label: "View History",
        machineItem: item
      });
    }
  }

  if (factoryKeywords.test(haystack)) {
    const productionArea = workspace.factoryAreas.find((area) => area.id === "production");
    panels.push({
      id: "factory-kpi",
      kind: "factory",
      label: "View Today's Factory",
      ...(productionArea?.metrics ? { metrics: productionArea.metrics } : {})
    });

    if (/\b(oee|ppm|kpi)\b/i.test(haystack)) {
      panels.push({
        id: "kpi-detail",
        kind: "kpi",
        label: "View KPI",
        metrics: workspace.kpis.map((kpi) => ({ label: kpi.label, value: kpi.value }))
      });
    }
  }

  const seen = new Set<string>();

  return panels.filter((panel) => {
    if (seen.has(panel.id)) return false;
    seen.add(panel.id);
    return true;
  });
}
