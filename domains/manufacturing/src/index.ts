import type { DomainModule } from "@buek/shared-types";
import { manufacturingAgents } from "./agents.js";
import { manufacturingKnowledge } from "./knowledge.js";
import { manufacturingPrompts } from "./prompts.js";
import { manufacturingTools } from "./tools.js";
import { manufacturingWorkflows } from "./workflows.js";

export const domainModule: DomainModule = {
  id: "manufacturing",
  name: "Manufacturing",
  version: "0.1.0",
  description: "Manufacturing domain module for production, quality, and shop floor workflows.",
  capabilities: [
    "production-operations",
    "quality-control",
    "work-order-support",
    "shop-floor-assistance",
    "kpi-ppm-oee",
    "sop-wi-qc",
    "maintenance-downtime",
    "customer-complaint-capa-ncr",
    "engineering-report-investigation",
    "production-planning"
  ],
  knowledge: manufacturingKnowledge,
  tools: manufacturingTools,
  prompts: manufacturingPrompts,
  workflows: manufacturingWorkflows,
  agents: manufacturingAgents
};

export default domainModule;
export {
  manufacturingAgents,
  manufacturingKnowledge,
  manufacturingPrompts,
  manufacturingTools,
  manufacturingWorkflows
};
