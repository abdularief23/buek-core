import type { AgentConfiguration } from "@buek/shared-types";

export const manufacturingAgents: AgentConfiguration[] = [
  {
    id: "manufacturing.operations-worker",
    name: "Manufacturing Operations Worker",
    description:
      "AI worker configuration for production planning, shop floor support, and quality questions.",
    tools: ["manufacturing.find-work-order", "manufacturing.report-defect"],
    knowledge: ["manufacturing-production-flow", "manufacturing-quality-basics"],
    prompts: ["manufacturing.operator-assistant"],
    workflows: ["manufacturing.answer-operations-question"]
  }
];
