import { prisma } from "../db.js";

export interface ExecutionPlanInput {
  pic: string;
  dueDate: string;
  machineStop: boolean;
  materialNeeded: string;
  estimatedDowntime: string;
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

export async function createWorkOrderFromExecutionPlan(
  slug: string,
  input: {
    issueId: string;
    machineCode?: string | null;
    countermeasureTitle: string;
    executionPlan: ExecutionPlanInput;
    engineerId?: string | null;
  }
) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const machine = input.machineCode
    ? await prisma.machine.findFirst({
        where: { code: input.machineCode, line: { plant: { workspaceId } } }
      })
    : null;

  const number = `WO-${Date.now().toString().slice(-6)}`;
  const reason = [
    `PIC: ${input.executionPlan.pic}`,
    `Due Date: ${input.executionPlan.dueDate}`,
    `Machine Stop: ${input.executionPlan.machineStop ? "Yes" : "No"}`,
    `Material Needed: ${input.executionPlan.materialNeeded}`,
    `Estimated Downtime: ${input.executionPlan.estimatedDowntime}`
  ].join("\n");

  const workOrder = await prisma.workOrder.create({
    data: {
      workspaceId,
      number,
      machineId: machine?.id ?? null,
      issueId: input.issueId,
      title: input.countermeasureTitle,
      reason,
      risk: input.executionPlan.machineStop ? "high" : "medium",
      status: "pending_approval",
      engineerId: input.engineerId ?? null,
      aiReview: {
        checks: [
          { label: "Execution plan linked", status: "pass", detail: "From investigation countermeasure" },
          { label: "Materials listed", status: "pass", detail: input.executionPlan.materialNeeded },
          {
            label: "Downtime estimate",
            status: "warning",
            detail: input.executionPlan.estimatedDowntime
          }
        ],
        summary: "Work order created from engineering execution plan — supervisor approval required."
      }
    }
  });

  await prisma.approval.create({ data: { workOrderId: workOrder.id, status: "waiting" } });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "Execution Plan → Work Order",
      detail: `${number} — ${input.countermeasureTitle}`,
      category: "maintenance",
      entityType: "work_order",
      entityId: workOrder.id
    }
  });

  await prisma.graphEdge.create({
    data: {
      workspaceId,
      fromType: "issue",
      fromId: input.issueId,
      relation: "execution_work_order",
      toType: "work_order",
      toId: workOrder.id,
      label: number
    }
  });

  return { id: workOrder.id, number, title: workOrder.title, status: workOrder.status };
}
