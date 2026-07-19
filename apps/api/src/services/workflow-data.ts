import { prisma } from "../db.js";
import { getTenantThemeOrDefault } from "../tenants/index.js";
import { canApprove, canDraftReport, canUseOperatorChecklist, assertRole } from "../lib/roles.js";
import {
  buildDraftSectionsFromIssue,
  generateReportNumber,
  renderReportDocument,
  type ReportSections
} from "./report-template.js";
import { createWorkOrderFromExecutionPlan } from "./execution-work-order.js";

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
  reportNumber?: string;
  version: number;
  sections?: ReportSections;
  machineCode?: string;
  author?: { name: string };
  issueTitle?: string;
  issueId?: string;
  submittedAt?: string;
}

export interface OperatorChecklistDto {
  id: string;
  line: string;
  shift: string;
  targetOutput: number;
  progress: number;
  items: Array<{ id: string; label: string; done: boolean }>;
}

export interface AiSuggestionDto {
  candidate: string;
  confidence: string;
  basis: string;
}

async function getWorkspaceId(slug: string) {
  const ws = await prisma.workspace.findUnique({ where: { slug } });
  return ws?.id;
}

async function getEmployeeByName(workspaceId: string, name: string) {
  return prisma.employee.findFirst({
    where: { workspaceId, name: { contains: name, mode: "insensitive" } }
  });
}

type InvestigationStep = { key: string; label: string; done: boolean };

async function syncInvestigationProgress(issueId: string, reportStatus: string) {
  const investigation = await prisma.investigation.findUnique({ where: { issueId } });
  if (!investigation) return;

  const steps = (investigation.steps as InvestigationStep[]).map((step) => {
    if (reportStatus === "approved") {
      return { ...step, done: true };
    }
    if (reportStatus === "pending_approval") {
      if (step.key === "lessons_learned") return { ...step, done: false };
      return { ...step, done: true };
    }
    if (["reported", "evidence", "similar_cases", "sop_review"].includes(step.key)) return { ...step, done: true };
    if (
      [
        "possible_cause",
        "ai_analysis",
        "engineer_decision",
        "countermeasure",
        "execution_plan",
        "verification",
        "technical_report"
      ].includes(step.key)
    ) {
      return { ...step, done: reportStatus !== "draft" };
    }
    if (step.key === "approval") {
      return { ...step, done: reportStatus === "pending_approval" };
    }
    if (step.key === "lessons_learned") {
      return { ...step, done: reportStatus === "approved" };
    }
    return step;
  });

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  await prisma.investigation.update({
    where: { issueId },
    data: {
      steps,
      progress,
      status: reportStatus === "approved" ? "completed" : "in_progress"
    }
  });

  await prisma.issue.update({
    where: { id: issueId },
    data: {
      progress,
      status: reportStatus === "approved" ? "closed" : "investigating"
    }
  });
}

function mapReportRow(row: {
  id: string;
  title: string;
  content: string;
  status: string;
  reportNumber: string | null;
  version: number;
  sections: unknown;
  machineCode: string | null;
  submittedAt: Date | null;
  author: { name: string } | null;
  issue: { title: string; id: string } | null;
}): EngineeringReportDto {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    version: row.version,
    ...(row.reportNumber ? { reportNumber: row.reportNumber } : {}),
    ...(row.sections ? { sections: row.sections as ReportSections } : {}),
    ...(row.machineCode ? { machineCode: row.machineCode } : {}),
    ...(row.author ? { author: { name: row.author.name } } : {}),
    ...(row.issue ? { issueTitle: row.issue.title, issueId: row.issue.id } : {}),
    ...(row.submittedAt ? { submittedAt: row.submittedAt.toISOString() } : {})
  };
}

function assertCanApprove(role: string) {
  assertRole(
    canApprove(role),
    "Only Supervisor can approve at line level. Plant Manager has executive read-only access."
  );
}

function assertCanDraftReport(role: string) {
  assertRole(canDraftReport(role), "Only Engineers can create or edit investigation reports.");
}

function assertCanUseOperatorChecklist(role: string) {
  assertRole(canUseOperatorChecklist(role), "Only Operators can update production checklists.");
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
    where: { workspaceId, status: "pending_approval" }
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

export async function approveSopRevision(
  slug: string,
  id: string,
  supervisorName: string,
  role: string
) {
  assertCanApprove(role);
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

export async function rejectSopRevision(
  slug: string,
  id: string,
  supervisorName: string,
  role: string
) {
  assertCanApprove(role);
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
    where: { workspaceId, status: "pending_approval" },
    include: { author: true, issue: true },
    orderBy: { submittedAt: "desc" }
  });

  return rows.map(mapReportRow);
}

export async function getDraftReports(slug: string, engineerName?: string): Promise<EngineeringReportDto[]> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const rows = await prisma.engineeringReport.findMany({
    where: {
      workspaceId,
      status: { in: ["draft", "revision_requested"] },
      ...(engineerName
        ? { author: { name: { contains: engineerName, mode: "insensitive" } } }
        : {})
    },
    include: { author: true, issue: true },
    orderBy: { updatedAt: "desc" }
  });

  return rows.map(mapReportRow);
}

export async function getReportById(slug: string, id: string): Promise<EngineeringReportDto | null> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const row = await prisma.engineeringReport.findFirst({
    where: { id, workspaceId },
    include: { author: true, issue: true }
  });
  if (!row) return null;

  return mapReportRow(row);
}

export async function getAiSuggestionForIssue(slug: string, issueKey: string): Promise<AiSuggestionDto> {
  const issue = await prisma.issue.findFirst({
    where: { id: { contains: issueKey } },
    include: { machine: true }
  });

  if (issue?.title.toLowerCase().includes("white")) {
    return {
      candidate: "Print Head Nozzle Clog (possible cause #1)",
      confidence: "82%",
      basis: "Ranked hypothesis — engineer selects. 4 similar cases in Company Brain."
    };
  }
  if (issue?.title.toLowerCase().includes("torque")) {
    return {
      candidate: "Torque Tool Drift (possible cause #1)",
      confidence: "84%",
      basis: "Ranked hypothesis — engineer selects. ASM-022 + 3 historical cases."
    };
  }
  if (issue?.title.toLowerCase().includes("metal")) {
    return {
      candidate: "Foreign Material in Line (possible cause #1)",
      confidence: "76%",
      basis: "Ranked hypothesis — engineer selects. HACCP-011 pattern match."
    };
  }
  return {
    candidate: "Bearing Wear (possible cause #1)",
    confidence: "81%",
    basis: "Ranked hypothesis — engineer selects. Machine history + telemetry trend."
  };
}

export interface InvestigationDraftInput {
  evidence?: string;
  analysis?: string;
  decision?: string;
  rootCause?: string;
  countermeasure?: string;
  executionPlan?: string;
  verification?: string;
  verificationResult?: string;
  lessonsLearned?: string;
  selectedCauseLabel?: string;
  executionPlanFields?: {
    pic: string;
    dueDate: string;
    machineStop: boolean;
    materialNeeded: string;
    estimatedDowntime: string;
  };
}

export async function createDraftReport(
  slug: string,
  issueKey: string,
  engineerName: string,
  aiSuggestion?: AiSuggestionDto,
  role?: string,
  investigationDraft?: InvestigationDraftInput
) {
  assertCanDraftReport(role ?? "");
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const issue = await prisma.issue.findFirst({
    where: { workspaceId, id: { endsWith: issueKey } },
    include: { machine: true }
  });
  if (!issue) throw new Error("Issue not found.");

  const engineer = await getEmployeeByName(workspaceId, engineerName);
  const sections = buildDraftSectionsFromIssue({
    title: issue.title,
    description: issue.description,
    ...(issue.machine?.code ? { machineCode: issue.machine.code } : {})
  });

  if (investigationDraft) {
    if (investigationDraft.evidence) sections.evidence = investigationDraft.evidence;
    if (investigationDraft.analysis) sections.analysis = investigationDraft.analysis;
    if (investigationDraft.decision) sections.decision = investigationDraft.decision;
    if (investigationDraft.rootCause) sections.rootCause = investigationDraft.rootCause;
    if (investigationDraft.countermeasure) sections.countermeasure = investigationDraft.countermeasure;
    if (investigationDraft.executionPlan) sections.executionPlan = investigationDraft.executionPlan;
    if (investigationDraft.verification) sections.verification = investigationDraft.verification;
    if (investigationDraft.verificationResult) sections.verificationResult = investigationDraft.verificationResult;
    if (investigationDraft.lessonsLearned) sections.lessonsLearned = investigationDraft.lessonsLearned;
  } else if (aiSuggestion) {
    sections.analysis = `[AI ranked hypothesis — engineer must select]\n${aiSuggestion.candidate} (${aiSuggestion.confidence})\n${aiSuggestion.basis}`;
  }

  const reportNumber = generateReportNumber(slug);
  const tenant = getTenantThemeOrDefault(slug);
  const content = renderReportDocument(
    {
      reportNumber,
      problem: issue.title,
      issueId: issue.id.replace(`issue-${slug}-`, ""),
      date: new Date().toISOString().slice(0, 10),
      engineer: engineerName,
      supervisor: "Pending",
      status: "draft",
      organization: tenant.label,
      version: 1,
      ...(issue.machine?.code ? { machine: issue.machine.code } : {})
    },
    sections
  );

  const report = await prisma.engineeringReport.create({
    data: {
      workspaceId,
      issueId: issue.id,
      title: `Investigation Report — ${issue.title}`,
      content,
      reportNumber,
      version: 1,
      sections: sections as object,
      machineCode: issue.machine?.code ?? null,
      status: "draft",
      authorId: engineer?.id ?? null
    },
    include: { author: true, issue: true }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "AI Draft Report Created",
      detail: `${reportNumber} — Draft v1 (engineer must review)`,
      category: "quality",
      entityType: "engineering_report",
      entityId: report.id
    }
  });

  let workOrder: { id: string; number: string; title: string; status: string } | null = null;
  if (investigationDraft?.executionPlanFields) {
    workOrder = await createWorkOrderFromExecutionPlan(slug, {
      issueId: issue.id,
      machineCode: issue.machine?.code ?? null,
      countermeasureTitle:
        investigationDraft.selectedCauseLabel ??
        investigationDraft.countermeasure?.slice(0, 80) ??
        "Investigation countermeasure",
      executionPlan: investigationDraft.executionPlanFields,
      engineerId: engineer?.id ?? null
    });
  }

  if (issue.machineId) {
    await prisma.graphEdge.create({
      data: {
        workspaceId,
        fromType: "machine",
        fromId: issue.machineId,
        relation: "technical_report",
        toType: "engineering_report",
        toId: report.id,
        label: reportNumber
      }
    });
  }

  return { report: mapReportRow(report), workOrder };
}

export async function updateReportSections(
  slug: string,
  reportId: string,
  sections: ReportSections,
  engineerName: string,
  role?: string
) {
  assertCanDraftReport(role ?? "");
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const existing = await prisma.engineeringReport.findFirst({
    where: { id: reportId, workspaceId },
    include: { author: true, issue: true }
  });
  if (!existing) return null;
  if (!["draft", "revision_requested"].includes(existing.status)) {
    throw new Error("Only draft reports can be edited.");
  }

  const content = renderReportDocument(
    {
      reportNumber: existing.reportNumber ?? reportId,
      problem: existing.issue?.title ?? existing.title,
      date: new Date().toISOString().slice(0, 10),
      engineer: engineerName,
      status: existing.status,
      version: existing.version,
      ...(existing.machineCode ? { machine: existing.machineCode } : {})
    },
    sections
  );

  const updated = await prisma.engineeringReport.update({
    where: { id: reportId },
    data: { sections: sections as object, content, version: existing.version + 1 },
    include: { author: true, issue: true }
  });

  return mapReportRow(updated);
}

export async function submitReportForApproval(
  slug: string,
  reportId: string,
  engineerName: string,
  role?: string
) {
  assertCanDraftReport(role ?? "");
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const existing = await prisma.engineeringReport.findFirst({
    where: { id: reportId, workspaceId },
    include: { author: true, issue: true }
  });
  if (!existing) return null;

  const sections = (existing.sections as ReportSections | null) ?? buildDraftSectionsFromIssue({
    title: existing.issue?.title ?? existing.title
  });

  const content = renderReportDocument(
    {
      reportNumber: existing.reportNumber ?? reportId,
      problem: existing.issue?.title ?? existing.title,
      date: new Date().toISOString().slice(0, 10),
      engineer: engineerName,
      status: "pending_approval",
      version: existing.version,
      ...(existing.machineCode ? { machine: existing.machineCode } : {})
    },
    sections
  );

  const updated = await prisma.engineeringReport.update({
    where: { id: reportId },
    data: { status: "pending_approval", submittedAt: new Date(), content },
    include: { author: true, issue: true }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "Report Submitted for Approval",
      detail: `${existing.reportNumber} submitted by ${engineerName}`,
      category: "approval",
      entityType: "engineering_report",
      entityId: reportId
    }
  });

  if (existing.issueId) {
    await syncInvestigationProgress(existing.issueId, "pending_approval");
  }

  return mapReportRow(updated);
}

async function createLessonLearned(
  workspaceId: string,
  issueId: string | null,
  title: string,
  content: string,
  authorId: string | null
) {
  return prisma.lessonLearned.create({
    data: { workspaceId, issueId, title, content, authorId }
  });
}

export async function approveReport(
  slug: string,
  id: string,
  supervisorName: string,
  role: string
) {
  assertCanApprove(role);
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const supervisor = await getEmployeeByName(workspaceId, supervisorName);
  const report = await prisma.engineeringReport.update({
    where: { id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedById: supervisor?.id ?? null
    },
    include: { author: true, issue: { include: { machine: true } } }
  });

  if (report.issueId) {
    await syncInvestigationProgress(report.issueId, "approved");

    const sections = (report.sections as ReportSections | null) ?? null;
    const lessonContent =
      sections?.lessonsLearned ||
      (sections?.decision
        ? `Decision: ${sections.decision}\nCountermeasure: ${sections.countermeasure ?? "—"}`
        : `Investigation approved. Report ${report.reportNumber}.`);

    await createLessonLearned(
      workspaceId,
      report.issueId,
      `Lesson: ${report.issue?.title ?? report.title}`,
      lessonContent,
      report.authorId
    );

    await prisma.memoryRecord.create({
      data: {
        workspaceId,
        scope: report.machineCode ? `machine:${report.machineCode}` : `issue:${report.issueId}`,
        content: `Technical report ${report.reportNumber} approved. ${lessonContent}`,
        tags: ["lessons_learned", "company_brain", "technical_report"]
      }
    });

    if (report.issue?.machineId) {
      await prisma.graphEdge.create({
        data: {
          workspaceId,
          fromType: "machine",
          fromId: report.issue.machineId,
          relation: "lessons_learned",
          toType: "engineering_report",
          toId: report.id,
          label: report.reportNumber ?? report.id
        }
      });
    }
  }

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "Investigation Report Approved",
      detail: `${report.reportNumber} approved by ${supervisorName}`,
      category: "approval",
      entityType: "engineering_report",
      entityId: id
    }
  });

  return getReportById(slug, id);
}

export async function rejectReport(slug: string, id: string, supervisorName: string, role: string) {
  assertCanApprove(role);
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  await prisma.engineeringReport.update({ where: { id }, data: { status: "rejected" } });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "Investigation Report Rejected",
      detail: `Rejected by ${supervisorName}`,
      category: "approval",
      entityType: "engineering_report",
      entityId: id
    }
  });

  return getReportById(slug, id);
}

export async function requestReportRevision(
  slug: string,
  id: string,
  supervisorName: string,
  role: string,
  notes?: string
) {
  assertCanApprove(role);
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  await prisma.engineeringReport.update({
    where: { id },
    data: { status: "revision_requested" }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "Revision Requested",
      detail: notes ?? `Revision requested by ${supervisorName}`,
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

export async function toggleChecklistItem(slug: string, itemId: string, role?: string) {
  assertCanUseOperatorChecklist(role ?? "");
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

export async function getLessonsLearned(slug: string) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  return prisma.lessonLearned.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
}

export async function saveMemory(slug: string, scope: string, content: string, tags: string[] = []) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  return prisma.memoryRecord.create({
    data: { workspaceId, scope, content, tags }
  });
}

export async function getReportExportHtml(slug: string, reportId: string) {
  const payload = await getReportExportPayload(slug, reportId);
  if (!payload) return null;

  const { renderPrintableHtml } = await import("./report-export.js");
  return renderPrintableHtml(payload);
}

export async function getReportExportDocx(slug: string, reportId: string) {
  const payload = await getReportExportPayload(slug, reportId);
  if (!payload) return null;

  const { renderReportDocx } = await import("./report-export-docx.js");
  return renderReportDocx({
    reportNumber: payload.reportNumber,
    problem: payload.problem,
    date: payload.date,
    engineer: payload.engineer,
    status: payload.status,
    version: payload.version,
    sections: payload.sections,
    content: payload.content,
    reportTitle: payload.reportTitle,
    ...(payload.organization ? { organization: payload.organization } : {}),
    ...(payload.machine ? { machine: payload.machine } : {}),
    ...(payload.approvedBy ? { approvedBy: payload.approvedBy } : {}),
    ...(payload.approvedAt ? { approvedAt: payload.approvedAt } : {})
  });
}

async function getReportExportPayload(slug: string, reportId: string) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const row = await prisma.engineeringReport.findFirst({
    where: { id: reportId, workspaceId },
    include: { author: true, issue: true, approvedBy: true }
  });
  if (!row) return null;

  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  const tenant = getTenantThemeOrDefault(slug);

  return {
    reportNumber: row.reportNumber ?? reportId,
    problem: row.issue?.title ?? row.title,
    date: row.submittedAt?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    engineer: row.author?.name ?? "—",
    status: row.status,
    version: row.version,
    sections: (row.sections as ReportSections | null) ?? null,
    content: row.content,
    ...(row.machineCode ? { machine: row.machineCode } : {}),
    ...(workspace?.organization ? { organization: workspace.organization } : {}),
    reportTitle: tenant.reportTitle,
    brandColor: tenant.primary,
    industryLabel: tenant.industryLabel,
    ...(row.approvedBy?.name ? { approvedBy: row.approvedBy.name } : {}),
    ...(row.approvedAt ? { approvedAt: row.approvedAt.toISOString().slice(0, 10) } : {})
  };
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
