import { prisma } from "../db.js";

export interface WorkflowInstanceDto {
  id: string;
  type: "investigation" | "work_order" | "sop_revision" | "engineering_report" | "operator_checklist";
  title: string;
  status: string;
  progress: number;
  owner?: string;
  entityId: string;
  issueKey?: string;
  steps?: Array<{ key: string; label: string; done: boolean }>;
}

async function getWorkspaceId(slug: string) {
  const ws = await prisma.workspace.findUnique({ where: { slug } });
  return ws?.id;
}

export async function listActiveWorkflows(slug: string): Promise<WorkflowInstanceDto[]> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const [issues, workOrders, sopRevisions, reports, checklists] = await Promise.all([
    prisma.issue.findMany({
      where: { workspaceId, status: { in: ["open", "investigating"] } },
      include: { owner: true, investigation: true },
      take: 10,
      orderBy: { updatedAt: "desc" }
    }),
    prisma.workOrder.findMany({
      where: { workspaceId, status: { in: ["pending_approval", "approved", "in_progress"] } },
      include: { engineer: true },
      take: 10,
      orderBy: { updatedAt: "desc" }
    }),
    prisma.sopRevision.findMany({
      where: { workspaceId, status: "pending_approval" },
      include: { submitter: true },
      take: 10
    }),
    prisma.engineeringReport.findMany({
      where: { workspaceId, status: { in: ["draft", "pending_approval"] } },
      include: { author: true },
      take: 10
    }),
    prisma.operatorChecklistRun.findMany({
      where: { workspaceId },
      orderBy: { runDate: "desc" },
      take: 1
    })
  ]);

  const workflows: WorkflowInstanceDto[] = [];

  for (const issue of issues) {
    const item: WorkflowInstanceDto = {
      id: issue.id,
      type: "investigation",
      title: issue.title,
      status: issue.status,
      progress: issue.progress,
      entityId: issue.id,
      issueKey: issue.id.replace(`issue-${slug}-`, "")
    };
    if (issue.owner?.name) item.owner = issue.owner.name;
    if (issue.investigation) {
      item.steps = issue.investigation.steps as Array<{ key: string; label: string; done: boolean }>;
    }
    workflows.push(item);
  }

  for (const wo of workOrders) {
    const item: WorkflowInstanceDto = {
      id: wo.id,
      type: "work_order",
      title: `${wo.number} — ${wo.title}`,
      status: wo.status,
      progress: wo.status === "completed" ? 100 : wo.status === "in_progress" ? 60 : 30,
      entityId: wo.id
    };
    if (wo.engineer?.name) item.owner = wo.engineer.name;
    workflows.push(item);
  }

  for (const rev of sopRevisions) {
    const item: WorkflowInstanceDto = {
      id: rev.id,
      type: "sop_revision",
      title: `${rev.referenceId} ${rev.title}`,
      status: rev.status,
      progress: 50,
      entityId: rev.id
    };
    if (rev.submitter?.name) item.owner = rev.submitter.name;
    workflows.push(item);
  }

  for (const report of reports) {
    const item: WorkflowInstanceDto = {
      id: report.id,
      type: "engineering_report",
      title: report.title,
      status: report.status,
      progress: report.status === "draft" ? 40 : 70,
      entityId: report.id
    };
    if (report.author?.name) item.owner = report.author.name;
    workflows.push(item);
  }

  const checklist = checklists[0];
  if (checklist) {
    const items = checklist.items as Array<{ id: string; label: string; done: boolean }>;
    const done = items.filter((i) => i.done).length;
    workflows.push({
      id: checklist.id,
      type: "operator_checklist",
      title: `Operator Checklist — ${checklist.line}`,
      status: "in_progress",
      progress: Math.round((done / items.length) * 100),
      entityId: checklist.id,
      steps: items.map((i) => ({ key: i.id, label: i.label, done: i.done }))
    });
  }

  return workflows;
}
