import type { ToolDefinition } from "@buek/shared-types";

export const manufacturingTools: ToolDefinition[] = [
  {
    id: "manufacturing.find-work-order",
    name: "Find work order",
    description: "Looks up a manufacturing work order by identifier.",
    inputSchema: {
      type: "object",
      required: ["workOrderId"],
      properties: {
        workOrderId: {
          type: "string"
        }
      }
    }
  },
  {
    id: "manufacturing.report-defect",
    name: "Report defect",
    description: "Creates a placeholder defect report payload for downstream systems.",
    inputSchema: {
      type: "object",
      required: ["workOrderId", "description"],
      properties: {
        workOrderId: {
          type: "string"
        },
        description: {
          type: "string"
        }
      }
    }
  }
];
