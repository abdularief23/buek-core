import { prisma } from "../db.js";

export interface SopRevisionDto {
  id: string;
  referenceId: string;
  title: string;
  revision: string;
  summary: string;
  status: string;
  submitter?: { name: string };
  aiReview?: {
    checks: Array<{ label: string; status: string; detail: string }>;
    summary?: string;
  };
}

export interface EngineeringReportDto {
  id: string;
  title: string;
  content: string;
  status: string;
  author?: { name: string };
  issueTitle?: string;
}

export interface OperatorChecklistDto {
  id: string;
  line: string;
  shift: string;
  targetOutput: number;
  progress: number;
  items: Array<{ id: string; label: string; done: boolean }>;
}

async function getWorkspaceId(slug: string) {
  const ws = await prisma.workspace.findUnique({ where: { slug } });
  return ws?.id;
}

export async function countPendingSopRevisions(slug: string): Promise<number> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return 0;
  return prisma.sopRevision.count({ where: { workspaceId, status: "pending_approval" } });
}

export async function countPendingReports(slug: string): Promise<number> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return 0;
  return prisma.engineeringReport.count({
    where: { workspaceId, status: { in: ["draft", "pending_approval"] } }
  });
}

export async function getPendingSopRevisions(slug: string): Promise<SopRevisionDto[]> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const rows = await prisma.sopRevision.findMany({
    where: { workspaceId, status: "pending_approval" },
    include: { submitter: true },
    orderBy: { createdAt: "asc" }
  });

  return rows.map((row) => {
    const dto: SopRevisionDto = {
      id: row.id,
      referenceId: row.referenceId,
      title: row.title,
      revision: row.revision,
      summary: row.summary,
      status: row.status
    };
    if (row.submitter) dto.submitter = { name: row.submitter.name };
    if (row.aiReview) {
      dto.aiReview = row.aiReview as NonNullable<SopRevisionDto["aiReview"]>;
    }
    return dto;
  });
}

export async function getSopRevisionById(slug: string, id: string): Promise<SopRevisionDto | null> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const row = await prisma.sopRevision.findFirst({
    where: { id, workspaceId },
    include: { submitter: true }
  });
  if (!row) return null;

  const dto: SopRevisionDto = {
    id: row.id,
    referenceId: row.referenceId,
    title: row.title,
    revision: row.revision,
    summary: row.summary,
    status: row.status
  };
  if (row.submitter) dto.submitter = { name: row.submitter.name };
  if (row.aiReview) {
    dto.aiReview = row.aiReview as NonNullable<SopRevisionDto["aiReview"]>;
  }
  return dto;
}

export async function approveSopRevision(slug: string, id: string, supervisorName: string) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const row = await prisma.sopRevision.update({
    where: { id },
    data: { status: "approved" },
    include: { submitter: true }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "SOP Revision Approved",
      detail: `${row.referenceId} approved by ${supervisorName}`,
      category: "approval",
      entityType: "sop_revision",
      entityId: id
    }
  });

  return getSopRevisionById(slug, id);
}

export async function rejectSopRevision(slug: string, id: string, supervisorName: string) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  await prisma.sopRevision.update({ where: { id }, data: { status: "rejected" } });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "SOP Revision Rejected",
      detail: `Rejected by ${supervisorName}`,
      category: "approval",
      entityType: "sop_revision",
      entityId: id
    }
  });

  return getSopRevisionById(slug, id);
}

export async function getPendingReports(slug: string): Promise<EngineeringReportDto[]> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const rows = await prisma.engineeringReport.findMany({
    where: { workspaceId, status: { in: ["draft", "pending_approval"] } },
    include: { author: true, issue: true },
    orderBy: { createdAt: "desc" }
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    ...(row.author ? { author: { name: row.author.name } } : {}),
    ...(row.issue ? { issueTitle: row.issue.title } : {})
  }));
}

export async function getReportById(slug: string, id: string): Promise<EngineeringReportDto | null> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const row = await prisma.engineeringReport.findFirst({
    where: { id, workspaceId },
    include: { author: true, issue: true }
  });
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    ...(row.author ? { author: { name: row.author.name } } : {}),
    ...(row.issue ? { issueTitle: row.issue.title } : {})
  };
}

export async function approveReport(slug: string, id: string, supervisorName: string) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  await prisma.engineeringReport.update({ where: { id }, data: { status: "approved" } });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "Engineering Report Approved",
      detail: `Report approved by ${supervisorName}`,
      category: "approval",
      entityType: "engineering_report",
      entityId: id
    }
  });

  return getReportById(slug, id);
}

export async function getOperatorChecklist(slug: string): Promise<OperatorChecklistDto | null> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const row = await prisma.operatorChecklistRun.findFirst({
    where: { workspaceId, runDate: { gte: today } },
    orderBy: { runDate: "desc" }
  });

  if (!row) return null;

  return {
    id: row.id,
    line: row.line,
    shift: row.shift,
    targetOutput: row.targetOutput,
    progress: row.progress,
    items: row.items as Array<{ id: string; label: string; done: boolean }>
  };
}

export async function toggleChecklistItem(slug: string, itemId: string) {
  const checklist = await getOperatorChecklist(slug);
  if (!checklist) return null;

  const items = checklist.items.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item
  );
  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);
  const outputProgress = Math.round((progress / 100) * checklist.targetOutput);

  await prisma.operatorChecklistRun.update({
    where: { id: checklist.id },
    data: { items, progress: outputProgress }
  });

  const workspaceId = await getWorkspaceId(slug);
  if (workspaceId) {
    await prisma.activityEvent.create({
      data: {
        workspaceId,
        occurredAt: new Date(),
        title: "Checklist Updated",
        detail: items.find((i) => i.id === itemId)?.label ?? itemId,
        category: "production",
        entityType: "checklist",
        entityId: checklist.id
      }
    });
  }

  return getOperatorChecklist(slug);
}

export async function getMemories(slug: string, scope?: string) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const rows = await prisma.memoryRecord.findMany({
    where: { workspaceId, ...(scope ? { scope: { contains: scope } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return rows.map((r) => ({ id: r.id, scope: r.scope, content: r.content, tags: r.tags }));
}

export async function saveMemory(slug: string, scope: string, content: string, tags: string[] = []) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  return prisma.memoryRecord.create({
    data: { workspaceId, scope, content, tags }
  });
}

export async function logAgentAction(
  slug: string,
  toolName: string,
  input: unknown,
  output: unknown,
  status = "completed"
) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return;

  return prisma.agentAction.create({
    data: {
      workspaceId,
      toolName,
      input: input as object,
      output: output as object,
      status
    }
  });
}
