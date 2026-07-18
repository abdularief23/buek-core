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
  },
  {
    id: "manufacturing.create-work-order",
    name: "Create work order",
    description: "Creates a maintenance work order for a machine, pending supervisor approval.",
    inputSchema: {
      type: "object",
      properties: {
        machineCode: { type: "string" },
        title: { type: "string" },
        reason: { type: "string" },
        engineerName: { type: "string" }
      }
    }
  },
  {
    id: "manufacturing.assign-engineer",
    name: "Assign engineer",
    description: "Assigns an engineer to an open investigation or issue.",
    inputSchema: {
      type: "object",
      properties: {
        engineerName: { type: "string" },
        issueKey: { type: "string" }
      }
    }
  },
  {
    id: "manufacturing.draft-report",
    name: "Draft investigation report",
    description: "Drafts an engineering investigation report for supervisor approval.",
    inputSchema: {
      type: "object",
      properties: {
        issueKey: { type: "string" }
      }
    }
  }
];
