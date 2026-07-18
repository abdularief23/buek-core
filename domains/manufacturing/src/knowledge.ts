import type { KnowledgeSource } from "@buek/shared-types";

export const manufacturingKnowledge: KnowledgeSource[] = [
  {
    id: "manufacturing-production-flow",
    title: "Manufacturing production flow",
    type: "runbook",
    summary:
      "High-level production flow covering planning, raw material readiness, shop floor execution, quality checks, and shipment handoff.",
    tags: ["production", "operations", "shop-floor"]
  },
  {
    id: "manufacturing-quality-basics",
    title: "Quality control basics",
    type: "document",
    summary:
      "General quality control concepts for inspection points, defect reporting, corrective actions, and traceability.",
    tags: ["quality", "inspection", "traceability"]
  }
];
