import type { PromptTemplate } from "@buek/shared-types";

export const manufacturingPrompts: PromptTemplate[] = [
  {
    id: "manufacturing.operator-assistant",
    name: "Manufacturing operator assistant",
    description: "Guides an AI worker to answer manufacturing operations questions.",
    template:
      "You are a manufacturing AI worker. Use the provided manufacturing knowledge to answer clearly and escalate uncertainty. Question: {{question}}",
    variables: ["question"]
  }
];
