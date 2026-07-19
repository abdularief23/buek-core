import { prisma } from "../db.js";

export interface OperatorReportInput {
  problem: string;
  shift: string;
  machineCode: string;
  occurredAt: string;
  rejectCount: number;
  notes?: string;
  reporterName: string;
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

export async function submitOperatorReport(slug: string, input: OperatorReportInput, role?: string) {
  const { canSubmitOperatorReport, assertRole } = await import("../lib/roles.js");
  assertRole(canSubmitOperatorReport(role ?? ""), "Only Operators can submit production problem reports.");
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) throw new Error("Workspace not found.");

  const machine = await prisma.machine.findFirst({
    where: { code: input.machineCode, line: { plant: { workspaceId } } }
  });

  const engineer = await prisma.employee.findFirst({
    where: { workspaceId, role: { contains: "Engineer", mode: "insensitive" } }
  });

  const description = [
    `Operator Report by ${input.reporterName}`,
    `Shift: ${input.shift}`,
    `Time: ${input.occurredAt}`,
    `Reject Count: ${input.rejectCount} pcs`,
    input.notes ? `Notes: ${input.notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const issue = await prisma.issue.create({
    data: {
      workspaceId,
      machineId: machine?.id ?? null,
      title: input.problem,
      description,
      status: "open",
      severity: input.rejectCount >= 5 ? "high" : "medium",
      progress: 0,
      ownerId: engineer?.id ?? null
    }
  });

  await prisma.investigation.create({
    data: {
      issueId: issue.id,
      status: "in_progress",
      progress: 0,
      steps: [
        { key: "reported", label: "Operator Report", done: true },
        { key: "evidence", label: "Evidence", done: false },
        { key: "root_cause", label: "Root Cause", done: false },
        { key: "countermeasure", label: "Countermeasure", done: false },
        { key: "verification", label: "Verification", done: false },
        { key: "approval", label: "Approval", done: false },
        { key: "closed", label: "Closed", done: false }
      ]
    }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      occurredAt: new Date(),
      title: "Operator Report Submitted",
      detail: `${input.problem} — ${input.machineCode} — ${input.rejectCount} reject`,
      category: "quality",
      entityType: "issue",
      entityId: issue.id
    }
  });

  return {
    issueId: issue.id,
    issueKey: issue.id.replace(`issue-${slug}-`, ""),
    title: issue.title,
    message: "Laporan operator tersimpan. Engineer akan mendapat notifikasi."
  };
}
