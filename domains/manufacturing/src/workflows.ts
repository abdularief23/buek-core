import type { WorkflowDefinition } from "@buek/shared-types";

export const manufacturingWorkflows: WorkflowDefinition[] = [
  {
    id: "manufacturing.answer-operations-question",
    name: "Answer operations question",
    description:
      "A lightweight workflow for grounding a manufacturing answer in registered knowledge before producing a response.",
    steps: [
      "Classify the manufacturing intent",
      "Retrieve relevant manufacturing knowledge",
      "Select eligible manufacturing tools",
      "Generate a grounded response"
    ]
  }
];
