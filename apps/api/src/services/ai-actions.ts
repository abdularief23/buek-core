import { prisma } from "../db.js";
import { getTenantThemeOrDefault } from "../tenants/index.js";
import { getIssueByKey, getWorkOrderById } from "./data-engine.js";
import { logAgentAction, saveMemory } from "./workflow-data.js";

export type AiActionType =
  | "create_work_order"
  | "assign_engineer"
  | "draft_report"
  | "start_investigation";

export interface AiActionResult {
  success: boolean;
  toolName: string;
  message: string;
  entityType?: string;
  entityId?: string;
  data?: unknown;
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

async function getEngineer(slug: string, name?: string) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  if (name) {
    return prisma.employee.findFirst({
      where: {
        workspaceId,
        role: { contains: "Engineer", mode: "insensitive" },
        name: { contains: name, mode: "insensitive" }
      }
    });
  }

  return prisma.employee.findFirst({
    where: { workspaceId, role: { contains: "Engineer", mode: "insensitive" } }
  });
}

export async function executeAiAction(
  slug: string,
  action: AiActionType,
  params: Record<string, string> = {}
): Promise<AiActionResult> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) {
    return { success: false, toolName: action, message: "Workspace not found." };
  }

  try {
    const tenant = getTenantThemeOrDefault(slug);

    switch (action) {
      case "create_work_order": {
        const machineCode = params.machineCode ?? tenant.machineCode;
        const machine = await prisma.machine.findFirst({
          where: { code: machineCode, line: { plant: { workspaceId } } }
        });
        const engineer = await getEngineer(slug, params.engineerName);
        const issueKey = params.issueKey ?? tenant.primaryIssueKey;
        const issue = await prisma.issue.findUnique({ where: { id: `issue-${slug}-${issueKey}` } });

        const number = `WO-${Date.now().toString().slice(-6)}`;
        const workOrder = await prisma.workOrder.create({
          data: {
            workspaceId,
            number,
            machineId: machine?.id ?? null,
            issueId: issue?.id ?? null,
            title: params.title ?? "Bearing Replacement",
            reason: params.reason ?? `AI-created work order for ${machineCode}`,
            risk: params.risk ?? "medium",
            status: "pending_approval",
            engineerId: engineer?.id ?? null,
            aiReview: {
              checks: [
                { label: "SOP followed", status: "pass", detail: "SOP-014 Rev.5" },
                { label: "Parts available", status: "pass", detail: "Bearing SKF in stock" },
                { label: "Downtime estimate", status: "warning", detail: "40 min" }
              ],
              summary: "AI generated work order — ready for supervisor approval."
            }
          }
        });

        await prisma.approval.create({ data: { workOrderId: workOrder.id, status: "waiting" } });

        await prisma.activityEvent.create({
          data: {
            workspaceId,
            occurredAt: new Date(),
            title: "AI Created Work Order",
            detail: `${number} for ${machineCode}`,
            category: "maintenance",
            entityType: "work_order",
            entityId: workOrder.id
          }
        });

        await saveMemory(
          slug,
          `machine:${machineCode}`,
          `Work order ${number} created for bearing replacement on ${new Date().toISOString().slice(0, 10)}.`,
          ["work_order", "ai_action"]
        );

        const result: AiActionResult = {
          success: true,
          toolName: action,
          message: `Created work order ${number} for ${machineCode}. Status: pending supervisor approval.`,
          entityType: "work_order",
          entityId: workOrder.id,
          data: await getWorkOrderById(slug, workOrder.id)
        };
        await logAgentAction(slug, action, params, result);
        return result;
      }

      case "assign_engineer": {
        const engineerName = params.engineerName ?? "Abdul";
        const issueKey = params.issueKey ?? tenant.primaryIssueKey;
        const engineer = await getEngineer(slug, engineerName);
        if (!engineer) {
          return { success: false, toolName: action, message: `Engineer ${engineerName} not found.` };
        }

        const issueId = `issue-${slug}-${issueKey}`;
        await prisma.issue.update({
          where: { id: issueId },
          data: { ownerId: engineer.id, status: "investigating" }
        });

        await prisma.activityEvent.create({
          data: {
            workspaceId,
            occurredAt: new Date(),
            title: "Engineer Assigned",
            detail: `${engineer.name} assigned via AI`,
            category: "maintenance",
            entityType: "issue",
            entityId: issueId
          }
        });

        await saveMemory(
          slug,
          `issue:${issueKey}`,
          `${engineer.name} assigned to investigate on ${new Date().toISOString().slice(0, 10)}.`,
          ["assignment", "ai_action"]
        );

        const result: AiActionResult = {
          success: true,
          toolName: action,
          message: `Assigned ${engineer.name} to ${issueKey} investigation.`,
          entityType: "issue",
          entityId: issueId,
          data: await getIssueByKey(slug, issueKey)
        };
        await logAgentAction(slug, action, params, result);
        return result;
      }

      case "draft_report": {
        const issueKey = params.issueKey ?? tenant.primaryIssueKey;
        const issue = await getIssueByKey(slug, issueKey);
        const engineer = await getEngineer(slug);
        const content = [
          `# Investigation Report: ${issue?.title ?? issueKey}`,
          "",
          "## Summary",
          issue?.description ?? tenant.primaryIssue.description,
          "",
          "## Evidence",
          "- Visual inspection confirms streak pattern on Line 3",
          "- Torque readings within spec",
          "",
          "## Root Cause",
          "Likely nozzle pressure variance during shift changeover.",
          "",
          "## Countermeasure",
          "Recalibrate nozzle per SOP-014 Rev.5. Monitor for 2 hours.",
          "",
          "## Recommendation",
          "Submit for supervisor approval before production resume."
        ].join("\n");

        const report = await prisma.engineeringReport.create({
          data: {
            workspaceId,
            issueId: issue?.id ?? null,
            title: `Investigation Report — ${issue?.title ?? issueKey}`,
            content,
            status: "pending_approval",
            authorId: engineer?.id ?? null
          }
        });

        await prisma.activityEvent.create({
          data: {
            workspaceId,
            occurredAt: new Date(),
            title: "AI Drafted Report",
            detail: report.title,
            category: "quality",
            entityType: "engineering_report",
            entityId: report.id
          }
        });

        await saveMemory(
          slug,
          `issue:${issueKey}`,
          `Investigation report drafted on ${new Date().toISOString().slice(0, 10)} for ${issue?.title ?? issueKey}.`,
          ["root_cause", "history", "ai_memory"]
        );

        const result: AiActionResult = {
          success: true,
          toolName: action,
          message: `AI created draft report ${report.reportNumber ?? report.id} — engineer must review before submission.`,
          entityType: "engineering_report",
          entityId: report.id,
          data: report
        };
        await logAgentAction(slug, action, params, result);
        return result;
      }

      case "start_investigation": {
        const issueKey = params.issueKey ?? tenant.primaryIssueKey;
        const issue = await getIssueByKey(slug, issueKey);
        const result: AiActionResult = {
          success: true,
          toolName: action,
          message: `Investigation workspace ready for ${issue?.title ?? issueKey}.`,
          entityType: "issue",
          ...(issue?.id ? { entityId: issue.id } : {}),
          data: issue
        };
        await logAgentAction(slug, action, params, result);
        return result;
      }

      default:
        return { success: false, toolName: action, message: "Unknown action." };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed.";
    await logAgentAction(slug, action, params, { error: message }, "failed");
    return { success: false, toolName: action, message };
  }
}

const ACTION_PATTERNS: Array<{ pattern: RegExp; action: AiActionType; extract?: (m: RegExpMatchArray) => Record<string, string> }> = [
  {
    pattern: /create\s+(?:a\s+)?work\s+order|buat\s+work\s+order|investigate\s+machine\s+(\w[\w-]*)/i,
    action: "create_work_order",
    extract: (m) => ({ machineCode: m[1] ? (m[1].includes("-") ? m[1] : `M-${m[1]}`) : "" })
  },
  {
    pattern: /assign\s+(\w+)|tugaskan\s+(\w+)|engineer\s+assigned\s+to/i,
    action: "assign_engineer",
    extract: (m) => ({ engineerName: m[1] ?? m[2] ?? "Abdul" })
  },
  {
    pattern: /draft\s+(?:an?\s+)?(?:investigation\s+)?report|buat\s+laporan|create\s+report/i,
    action: "draft_report"
  },
  {
    pattern: /investigate|root\s+cause\s+analysis|analisis\s+akar/i,
    action: "start_investigation"
  }
];

export function detectAiActionFromMessage(message: string): {
  action: AiActionType;
  params: Record<string, string>;
} | null {
  for (const { pattern, action, extract } of ACTION_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return { action, params: extract?.(match) ?? {} };
    }
  }
  return null;
}

export async function tryExecuteActionFromMessage(
  slug: string,
  message: string
): Promise<AiActionResult | null> {
  const detected = detectAiActionFromMessage(message);
  if (!detected) return null;
  return executeAiAction(slug, detected.action, detected.params);
}
