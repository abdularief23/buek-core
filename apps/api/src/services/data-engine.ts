import { prisma } from "../db.js";
import { countPendingReports, countPendingSopRevisions } from "./workflow-data.js";

export interface TimelineEventDto {
  id: string;
  time: string;
  title: string;
  detail?: string;
  category: string;
}

export interface KpiPointDto {
  metric: string;
  value: number;
  recordedAt: string;
}

export interface WorkOrderDto {
  id: string;
  number: string;
  title: string;
  reason: string;
  risk: string;
  status: string;
  machine?: { code: string; name: string };
  engineer?: { name: string; role: string };
  aiReview?: {
    checks: Array<{ label: string; status: string; detail: string }>;
    summary?: string;
  };
  approval?: { status: string; decidedAt?: string };
}

export interface IssueDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  severity: string;
  progress: number;
  dueAt?: string;
  owner?: { name: string };
  machine?: { code: string; name: string };
  investigation?: {
    status: string;
    progress: number;
    steps: Array<{ key: string; label: string; done: boolean }>;
  };
  graph?: Array<{ relation: string; label: string; toType: string; toId: string }>;
}

export interface SupervisorStatsDto {
  pendingWorkOrders: number;
  pendingSopRevisions: number;
  pendingReports: number;
  openIssues: number;
}

export interface LiveKpiDto {
  label: string;
  value: string;
  status: "green" | "yellow" | "red";
  series: Array<{ time: string; value: number }>;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function kpiStatus(metric: string, value: number): "green" | "yellow" | "red" {
  if (metric === "safety" && value >= 99.5) return "green";
  if (value >= 97) return "green";
  if (value >= 94) return "yellow";
  return "red";
}

async function getWorkspaceBySlug(slug: string) {
  return prisma.workspace.findUnique({ where: { slug }, include: { plants: true } });
}

export async function getTimeline(slug: string): Promise<TimelineEventDto[]> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return [];

  const events = await prisma.activityEvent.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { occurredAt: "asc" },
    take: 50
  });

  return events.map((event) => ({
    id: event.id,
    time: formatTime(event.occurredAt),
    title: event.title,
    category: event.category,
    ...(event.detail ? { detail: event.detail } : {})
  }));
}

export async function getLiveKpis(slug: string): Promise<LiveKpiDto[]> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace?.plants[0]) return [];

  const plantId = workspace.plants[0].id;
  const metrics = ["production", "quality", "delivery", "safety"];
  const labels: Record<string, string> = {
    production: "Production",
    quality: "Quality",
    delivery: "Delivery",
    safety: "Safety"
  };

  const results: LiveKpiDto[] = [];

  for (const metric of metrics) {
    const snapshots = await prisma.kpiSnapshot.findMany({
      where: { plantId, metric },
      orderBy: { recordedAt: "asc" },
      take: 12
    });

    if (!snapshots.length) continue;

    const latest = snapshots[snapshots.length - 1]!;
    results.push({
      label: labels[metric]!,
      value: `${latest.value.toFixed(metric === "safety" ? 0 : 0)}%`,
      status: kpiStatus(metric, latest.value),
      series: snapshots.map((s) => ({
        time: formatTime(s.recordedAt),
        value: s.value
      }))
    });
  }

  return results;
}

function trendFromSeries(series: Array<{ value: number }>): "up" | "down" | "flat" {
  if (series.length < 2) return "flat";
  const first = series[0]!.value;
  const last = series[series.length - 1]!.value;
  if (last > first + 0.3) return "up";
  if (last < first - 0.3) return "down";
  return "flat";
}

export async function getWeeklyTrend(
  slug: string
): Promise<Array<{ label: string; trend: "up" | "down" | "flat" }>> {
  const kpis = await getLiveKpis(slug);
  const trends = kpis
    .filter((kpi) => ["Production", "Quality", "Delivery"].includes(kpi.label))
    .map((kpi) => ({ label: kpi.label, trend: trendFromSeries(kpi.series) }));

  return trends.length
    ? [...trends, { label: "Cost", trend: "down" as const }]
    : [
        { label: "Production", trend: "up" as const },
        { label: "Quality", trend: "up" as const },
        { label: "Cost", trend: "down" as const }
      ];
}

export async function getTeamPerformance(
  slug: string
): Promise<Array<{ name: string; closed: number; pending: number }>> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return [];

  const employees = await prisma.employee.findMany({
    where: { workspaceId: workspace.id },
    include: {
      ownedIssues: { where: { status: { in: ["open", "investigating"] } } },
      workOrders: true
    }
  });

  return employees
    .filter((emp) => /engineer|operator/i.test(emp.role))
    .map((emp) => ({
      name: emp.name,
      closed: emp.workOrders.filter((wo) => wo.status === "approved" || wo.status === "completed")
        .length,
      pending: emp.ownedIssues.length
    }))
    .slice(0, 4);
}

export async function getSupervisorStats(slug: string): Promise<SupervisorStatsDto> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    return { pendingWorkOrders: 0, pendingSopRevisions: 0, pendingReports: 0, openIssues: 0 };
  }

  const [pendingWorkOrders, openIssues, pendingSopRevisions, pendingReports] = await Promise.all([
    prisma.workOrder.count({
      where: { workspaceId: workspace.id, status: "pending_approval" }
    }),
    prisma.issue.count({
      where: {
        workspaceId: workspace.id,
        status: { in: ["open", "investigating"] }
      }
    }),
    countPendingSopRevisions(slug),
    countPendingReports(slug)
  ]);

  return {
    pendingWorkOrders,
    pendingSopRevisions,
    pendingReports,
    openIssues
  };
}

export async function getPendingWorkOrders(slug: string): Promise<WorkOrderDto[]> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return [];

  const orders = await prisma.workOrder.findMany({
    where: { workspaceId: workspace.id, status: "pending_approval" },
    include: {
      machine: true,
      engineer: true,
      approval: true
    },
    orderBy: { createdAt: "asc" }
  });

  return orders.map(mapWorkOrder);
}

export async function getWorkOrderById(slug: string, workOrderId: string): Promise<WorkOrderDto | null> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return null;

  const order = await prisma.workOrder.findFirst({
    where: { id: workOrderId, workspaceId: workspace.id },
    include: { machine: true, engineer: true, approval: true }
  });

  return order ? mapWorkOrder(order) : null;
}

export async function approveWorkOrder(
  slug: string,
  workOrderId: string,
  supervisorName: string,
  role?: string
): Promise<WorkOrderDto | null> {
  const { canApprove } = await import("../lib/roles.js");
  if (!canApprove(role ?? "")) {
    throw new Error("Only supervisors and managers can approve work orders.");
  }

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return null;

  const supervisor = await prisma.employee.findFirst({
    where: { workspaceId: workspace.id, role: { contains: "Supervisor", mode: "insensitive" } }
  });

  const order = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: "approved",
      approval: {
        update: {
          status: "approved",
          ...(supervisor?.id ? { decidedById: supervisor.id } : {}),
          decidedAt: new Date(),
          notes: `Approved by ${supervisorName}`
        }
      }
    },
    include: { machine: true, engineer: true, approval: true }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: workspace.id,
      occurredAt: new Date(),
      title: "Work Order Approved",
      detail: `${order.number} approved by ${supervisorName}`,
      category: "approval",
      entityType: "work_order",
      entityId: order.id
    }
  });

  return mapWorkOrder(order);
}

export async function rejectWorkOrder(
  slug: string,
  workOrderId: string,
  supervisorName: string,
  notes?: string
): Promise<WorkOrderDto | null> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return null;

  const supervisor = await prisma.employee.findFirst({
    where: { workspaceId: workspace.id, role: { contains: "Supervisor", mode: "insensitive" } }
  });

  const order = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: "rejected",
      approval: {
        update: {
          status: "rejected",
          ...(supervisor?.id ? { decidedById: supervisor.id } : {}),
          decidedAt: new Date(),
          notes: notes ?? `Rejected by ${supervisorName}`
        }
      }
    },
    include: { machine: true, engineer: true, approval: true }
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: workspace.id,
      occurredAt: new Date(),
      title: "Work Order Rejected",
      detail: `${order.number} rejected by ${supervisorName}`,
      category: "approval",
      entityType: "work_order",
      entityId: order.id
    }
  });

  return mapWorkOrder(order);
}

export async function getIssues(slug: string, status?: string[]): Promise<IssueDto[]> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return [];

  const issues = await prisma.issue.findMany({
    where: {
      workspaceId: workspace.id,
      ...(status ? { status: { in: status } } : {})
    },
    include: {
      owner: true,
      machine: true,
      investigation: true
    },
    orderBy: { updatedAt: "desc" },
    take: 20
  });

  return Promise.all(issues.map((issue) => mapIssue(slug, issue)));
}

export async function getIssueById(slug: string, issueId: string): Promise<IssueDto | null> {
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return null;

  const issue = await prisma.issue.findFirst({
    where: { id: issueId, workspaceId: workspace.id },
    include: { owner: true, machine: true, investigation: true }
  });

  return issue ? mapIssue(slug, issue) : null;
}

export async function getIssueByKey(slug: string, key: string): Promise<IssueDto | null> {
  const id = `issue-${slug}-${key}`;
  return getIssueById(slug, id);
}

export async function advanceInvestigationStep(
  slug: string,
  issueId: string,
  stepKey: string
): Promise<IssueDto | null> {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId },
    include: { investigation: true, owner: true, machine: true }
  });

  if (!issue?.investigation) return null;

  const steps = (issue.investigation.steps as Array<{ key: string; label: string; done: boolean }>).map(
    (step) => (step.key === stepKey ? { ...step, done: true } : step)
  );
  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  await prisma.investigation.update({
    where: { issueId },
    data: { steps, progress, status: progress >= 100 ? "completed" : "in_progress" }
  });

  await prisma.issue.update({
    where: { id: issueId },
    data: { progress, status: progress >= 100 ? "resolved" : "investigating" }
  });

  const workspace = await getWorkspaceBySlug(slug);
  if (workspace) {
    await prisma.activityEvent.create({
      data: {
        workspaceId: workspace.id,
        occurredAt: new Date(),
        title: "Investigation Updated",
        detail: `${issue.title} — ${stepKey.replace("_", " ")} completed`,
        category: "quality",
        entityType: "issue",
        entityId: issueId
      }
    });
  }

  return getIssueById(slug, issueId);
}

function mapWorkOrder(order: {
  id: string;
  number: string;
  title: string;
  reason: string;
  risk: string;
  status: string;
  aiReview: unknown;
  machine: { code: string; name: string } | null;
  engineer: { name: string; role: string } | null;
  approval: { status: string; decidedAt: Date | null } | null;
}): WorkOrderDto {
  return {
    id: order.id,
    number: order.number,
    title: order.title,
    reason: order.reason,
    risk: order.risk,
    status: order.status,
    ...(order.machine ? { machine: { code: order.machine.code, name: order.machine.name } } : {}),
    ...(order.engineer ? { engineer: { name: order.engineer.name, role: order.engineer.role } } : {}),
    ...(order.aiReview
      ? { aiReview: order.aiReview as NonNullable<WorkOrderDto["aiReview"]> }
      : {}),
    ...(order.approval
      ? {
          approval: {
            status: order.approval.status,
            ...(order.approval.decidedAt
              ? { decidedAt: order.approval.decidedAt.toISOString() }
              : {})
          }
        }
      : {})
  };
}

async function mapIssue(
  slug: string,
  issue: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    severity: string;
    progress: number;
    dueAt: Date | null;
    owner: { name: string } | null;
    machine: { code: string; name: string } | null;
    investigation: { status: string; progress: number; steps: unknown } | null;
  }
): Promise<IssueDto> {
  const workspace = await getWorkspaceBySlug(slug);
  const edges = workspace
    ? await prisma.graphEdge.findMany({
        where: { workspaceId: workspace.id, fromType: "issue", fromId: issue.id }
      })
    : [];

  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    severity: issue.severity,
    progress: issue.progress,
    ...(issue.description ? { description: issue.description } : {}),
    ...(issue.dueAt ? { dueAt: issue.dueAt.toISOString() } : {}),
    ...(issue.owner ? { owner: { name: issue.owner.name } } : {}),
    ...(issue.machine ? { machine: { code: issue.machine.code, name: issue.machine.name } } : {}),
    ...(issue.investigation
      ? {
          investigation: {
            status: issue.investigation.status,
            progress: issue.investigation.progress,
            steps: issue.investigation.steps as Array<{ key: string; label: string; done: boolean }>
          }
        }
      : {}),
    graph: edges.map((e) => ({
      relation: e.relation,
      label: e.label ?? e.toId,
      toType: e.toType,
      toId: e.toId
    }))
  };
}

export async function getMachineTelemetry(slug: string, machineCode: string) {
  const machine = await prisma.machine.findFirst({
    where: {
      code: machineCode,
      line: { plant: { workspace: { slug } } }
    }
  });
  if (!machine) return [];

  const readings = await prisma.machineTelemetry.findMany({
    where: { machineId: machine.id },
    orderBy: { recordedAt: "asc" },
    take: 20
  });

  return readings.map((r) => ({
    metric: r.metric,
    value: r.value,
    recordedAt: formatTime(r.recordedAt)
  }));
}
