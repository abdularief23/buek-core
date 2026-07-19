import { prisma } from "../db.js";
import { canApprove, canDraftReport, assertRole } from "../lib/roles.js";
import { defaultInvestigationSteps, getInvestigationCopilot } from "./investigation-copilot.js";
import { createWorkOrderFromExecutionPlan } from "./execution-work-order.js";
import { createDraftReport } from "./workflow-data.js";

export type AnalysisStatus =
  | "draft"
  | "waiting_supervisor_review"
  | "analysis_approved"
  | "revision_requested"
  | "execution_pending"
  | "verification_complete";

export interface EngineeringAnalysisData {
  status: AnalysisStatus;
  evidence: {
    qcResult: boolean;
    photo: boolean;
    trend: boolean;
    machineHistory: boolean;
    notes: string;
  };
  selectedCause?: {
    label: string;
    confidence: number;
    isOther?: boolean;
  };
  useHistoricalCountermeasure?: boolean;
  countermeasures: string[];
  countermeasureNotes: string;
  executionPlan: {
    pic: string;
    executionDate: string;
    expectedFinish: string;
    verificationDate: string;
  };
  verification?: {
    countermeasureComplete: boolean;
    currentPpm?: number;
    targetPpm?: number;
    status?: string;
    lessonsLearned?: string;
  };
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  revisionNotes?: string;
}

export interface EngineerIssueMetrics {
  machineCode: string;
  issueTitle: string;
  currentPpm: number;
  targetPpm: number;
  increasePercent: number;
  priority: string;
  dueLabel: string;
  issueKey: string;
  analysisStatus?: AnalysisStatus;
}

function emptyAnalysis(): EngineeringAnalysisData {
  return {
    status: "draft",
    evidence: {
      qcResult: false,
      photo: false,
      trend: false,
      machineHistory: false,
      notes: ""
    },
    countermeasures: [],
    countermeasureNotes: "",
    executionPlan: {
      pic: "",
      executionDate: new Date().toISOString().slice(0, 10),
      expectedFinish: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      verificationDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
    }
  };
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

async function getIssueWithInvestigation(slug: string, issueKey: string) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const issue = await prisma.issue.findFirst({
    where: { workspaceId, id: { endsWith: issueKey } },
    include: { machine: true, investigation: true }
  });
  return issue;
}

async function ensureInvestigation(issueId: string, progress = 0) {
  const existing = await prisma.investigation.findUnique({ where: { issueId } });
  if (existing) return existing;

  return prisma.investigation.create({
    data: {
      issueId,
      status: "in_progress",
      progress,
      steps: defaultInvestigationSteps()
    }
  });
}

function metricsForIssue(
  slug: string,
  issue: {
    id: string;
    title: string;
    severity: string;
    dueAt: Date | null;
    machine?: { code: string } | null;
    investigation?: { analysisData: unknown } | null;
  }
): EngineerIssueMetrics {
  const issueKey = issue.id.replace(`issue-${slug}-`, "");
  const analysis = (issue.investigation?.analysisData as EngineeringAnalysisData | null) ?? null;
  const seedPpm =
    issue.title.toLowerCase().includes("white") || issue.title.toLowerCase().includes("streak")
      ? { current: 4250, target: 2000, increase: 18 }
      : issue.title.toLowerCase().includes("torque")
        ? { current: 3100, target: 2000, increase: 12 }
        : issue.title.toLowerCase().includes("metal")
          ? { current: 2800, target: 1500, increase: 22 }
          : { current: 3400, target: 2000, increase: 15 };

  const dueLabel = issue.dueAt
    ? issue.dueAt.toDateString() === new Date().toDateString()
      ? "Today"
      : issue.dueAt.toISOString().slice(0, 10)
    : "Today";

  return {
    machineCode: issue.machine?.code ?? "—",
    issueTitle: issue.title,
    currentPpm: seedPpm.current,
    targetPpm: seedPpm.target,
    increasePercent: seedPpm.increase,
    priority:
      issue.severity === "critical" ? "Critical" : issue.severity === "high" ? "High" : "Medium",
    dueLabel,
    issueKey,
    ...(analysis?.status ? { analysisStatus: analysis.status } : {})
  };
}

export async function getEngineerIssueMetrics(slug: string): Promise<EngineerIssueMetrics[]> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const issues = await prisma.issue.findMany({
    where: { workspaceId, status: { in: ["open", "investigating"] } },
    include: { machine: true, investigation: true },
    orderBy: { updatedAt: "desc" },
    take: 5
  });

  return issues.map((issue) => metricsForIssue(slug, issue));
}

export async function getEngineeringAnalysis(slug: string, issueKey: string) {
  let issue = await getIssueWithInvestigation(slug, issueKey);
  if (!issue) return null;

  if (!issue.investigation) {
    await ensureInvestigation(issue.id, issue.progress);
    issue = await getIssueWithInvestigation(slug, issueKey);
    if (!issue) return null;
  }

  const analysis =
    (issue.investigation?.analysisData as EngineeringAnalysisData | null) ?? emptyAnalysis();
  const copilot = await getInvestigationCopilot(slug, issueKey);
  if (!copilot) {
    throw new Error("Investigation co-pilot data unavailable.");
  }
  const metrics = metricsForIssue(slug, issue);

  return {
    issueKey,
    issueTitle: issue.title,
    metrics,
    analysis,
    copilot,
    investigationStatus: issue.investigation?.status ?? "in_progress"
  };
}

export async function saveEngineeringAnalysis(
  slug: string,
  issueKey: string,
  data: EngineeringAnalysisData,
  role?: string
) {
  assertRole(canDraftReport(role ?? ""), "Only Engineers can save engineering analysis.");
  const issue = await getIssueWithInvestigation(slug, issueKey);
  if (!issue?.investigation) throw new Error("Investigation not found.");

  if (!["draft", "revision_requested"].includes(data.status)) {
    throw new Error("Analysis can only be edited while in draft or revision requested.");
  }

  const saved = await prisma.investigation.update({
    where: { issueId: issue.id },
    data: {
      analysisData: { ...data, status: data.status === "revision_requested" ? "draft" : "draft" } as object,
      status: "in_progress"
    }
  });

  return (saved.analysisData as unknown as EngineeringAnalysisData) ?? data;
}

export async function submitEngineeringAnalysis(
  slug: string,
  issueKey: string,
  data: EngineeringAnalysisData,
  engineerName: string,
  role?: string
) {
  assertRole(canDraftReport(role ?? ""), "Only Engineers can submit engineering analysis.");
  const issue = await getIssueWithInvestigation(slug, issueKey);
  if (!issue?.investigation) throw new Error("Investigation not found.");

  const payload: EngineeringAnalysisData = {
    ...data,
    status: "waiting_supervisor_review",
    submittedAt: new Date().toISOString()
  };

  await prisma.investigation.update({
    where: { issueId: issue.id },
    data: {
      analysisData: payload as object,
      status: "waiting_supervisor_review",
      progress: 70
    }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: issue.workspaceId,
      occurredAt: new Date(),
      title: "Engineering Analysis Submitted",
      detail: `${issue.title} — waiting supervisor review by ${engineerName}`,
      category: "approval",
      entityType: "issue",
      entityId: issue.id
    }
  });

  return payload;
}

export async function approveEngineeringAnalysis(
  slug: string,
  issueKey: string,
  supervisorName: string,
  role: string
) {
  assertRole(canApprove(role), "Only Supervisor can approve engineering analysis.");
  const issue = await getIssueWithInvestigation(slug, issueKey);
  if (!issue?.investigation) throw new Error("Investigation not found.");

  const current = (issue.investigation.analysisData as EngineeringAnalysisData | null) ?? emptyAnalysis();
  if (current.status !== "waiting_supervisor_review") {
    throw new Error("No analysis pending supervisor review.");
  }

  const payload: EngineeringAnalysisData = {
    ...current,
    status: "analysis_approved",
    approvedAt: new Date().toISOString(),
    approvedBy: supervisorName
  };

  await prisma.investigation.update({
    where: { issueId: issue.id },
    data: {
      analysisData: payload as object,
      status: "analysis_approved",
      progress: 85
    }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: issue.workspaceId,
      occurredAt: new Date(),
      title: "Engineering Analysis Approved",
      detail: `${issue.title} approved by ${supervisorName}`,
      category: "approval",
      entityType: "issue",
      entityId: issue.id
    }
  });

  return payload;
}

export async function rejectEngineeringAnalysis(
  slug: string,
  issueKey: string,
  supervisorName: string,
  role: string,
  notes?: string
) {
  assertRole(canApprove(role), "Only Supervisor can reject engineering analysis.");
  const issue = await getIssueWithInvestigation(slug, issueKey);
  if (!issue?.investigation) throw new Error("Investigation not found.");

  const current = (issue.investigation.analysisData as EngineeringAnalysisData | null) ?? emptyAnalysis();
  const payload: EngineeringAnalysisData = {
    ...current,
    status: "revision_requested",
    revisionNotes: notes ?? `Revision requested by ${supervisorName}`
  };

  await prisma.investigation.update({
    where: { issueId: issue.id },
    data: { analysisData: payload as object, status: "revision_requested" }
  });

  return payload;
}

export async function submitVerificationResult(
  slug: string,
  issueKey: string,
  input: {
    countermeasureComplete: boolean;
    currentPpm: number;
    targetPpm: number;
    lessonsLearned?: string;
  },
  engineerName: string,
  role?: string
) {
  assertRole(canDraftReport(role ?? ""), "Only Engineers can submit verification.");
  const issue = await getIssueWithInvestigation(slug, issueKey);
  if (!issue?.investigation) throw new Error("Investigation not found.");

  const current = (issue.investigation.analysisData as EngineeringAnalysisData | null) ?? emptyAnalysis();
  if (current.status !== "analysis_approved" && current.status !== "execution_pending") {
    throw new Error("Analysis must be approved before verification.");
  }

  const improved = input.currentPpm <= input.targetPpm;
  const lessons =
    input.lessonsLearned ??
    `Countermeasure ${input.countermeasureComplete ? "completed" : "in progress"}. PPM improved to ${input.currentPpm} (target ${input.targetPpm}).`;

  const payload: EngineeringAnalysisData = {
    ...current,
    status: "verification_complete",
    verification: {
      countermeasureComplete: input.countermeasureComplete,
      currentPpm: input.currentPpm,
      targetPpm: input.targetPpm,
      status: improved ? "Improved" : "Needs Follow-up",
      lessonsLearned: lessons
    }
  };

  await prisma.investigation.update({
    where: { issueId: issue.id },
    data: { analysisData: payload as object, status: "completed", progress: 100 }
  });

  await prisma.lessonLearned.create({
    data: {
      workspaceId: issue.workspaceId,
      issueId: issue.id,
      title: `Lesson: ${issue.title}`,
      content: lessons
    }
  });

  await prisma.memoryRecord.create({
    data: {
      workspaceId: issue.workspaceId,
      scope: issue.machine?.code ? `machine:${issue.machine.code}` : `issue:${issueKey}`,
      content: lessons,
      tags: ["lessons_learned", "company_brain", "verification"]
    }
  });

  return payload;
}

export async function generateReportFromAnalysis(
  slug: string,
  issueKey: string,
  engineerName: string,
  role?: string
) {
  const issue = await getIssueWithInvestigation(slug, issueKey);
  if (!issue?.investigation) throw new Error("Investigation not found.");

  const analysis = (issue.investigation.analysisData as EngineeringAnalysisData | null) ?? null;
  if (
    !analysis ||
    (analysis.status !== "analysis_approved" && analysis.status !== "verification_complete")
  ) {
    throw new Error("Supervisor must approve engineering analysis before generating report.");
  }

  const metrics = metricsForIssue(slug, issue);
  const evidenceNotes = [
    analysis.evidence.qcResult ? "✓ QC Result" : null,
    analysis.evidence.photo ? "✓ Photo" : null,
    analysis.evidence.trend ? "✓ Trend" : null,
    analysis.evidence.machineHistory ? "✓ Machine History" : null,
    analysis.evidence.notes || null
  ]
    .filter(Boolean)
    .join("\n");

  const draft = {
    evidence: evidenceNotes,
    analysis: `Engineer-selected possible cause: ${analysis.selectedCause?.label ?? "—"} (${analysis.selectedCause?.confidence ?? 0}%)`,
    decision: `Engineer decision: ${analysis.selectedCause?.label ?? "Manual analysis"}`,
    rootCause: `Working hypothesis: ${analysis.selectedCause?.label ?? "—"}`,
    countermeasure: [...analysis.countermeasures, analysis.countermeasureNotes].filter(Boolean).join("\n"),
    executionPlan: [
      `PIC: ${analysis.executionPlan.pic}`,
      `Execution Date: ${analysis.executionPlan.executionDate}`,
      `Expected Finish: ${analysis.executionPlan.expectedFinish}`,
      `Verification Date: ${analysis.executionPlan.verificationDate}`
    ].join("\n"),
    verification: analysis.verification?.lessonsLearned ?? "Pending execution verification",
    verificationResult: analysis.verification
      ? `Current PPM: ${analysis.verification.currentPpm}\nTarget PPM: ${analysis.verification.targetPpm}\nStatus: ${analysis.verification.status}`
      : "",
    lessonsLearned: analysis.verification?.lessonsLearned ?? "",
    ...(analysis.selectedCause?.label ? { selectedCauseLabel: analysis.selectedCause.label } : {}),
    executionPlanFields: {
      pic: analysis.executionPlan.pic,
      dueDate: analysis.executionPlan.executionDate,
      machineStop: true,
      materialNeeded: "Per countermeasure plan",
      estimatedDowntime: "Per execution schedule"
    }
  };

  const result = await createDraftReport(slug, issueKey, engineerName, undefined, role, draft);
  return { ...result, metrics };
}
