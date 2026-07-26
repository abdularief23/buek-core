import { prisma } from "../db.js";
import { getTenantThemeOrDefault } from "../tenants/index.js";

export type GoalLevel = "mission" | "project" | "investigation" | "task";

export interface GoalLink {
  level: GoalLevel;
  label: string;
  reason?: string;
}

const WIZARD_TASK_LABELS = [
  "Kumpulkan bukti defect",
  "Analisis root cause",
  "Tentukan countermeasure",
  "Rencanakan eksekusi",
  "Review & submit laporan"
] as const;

async function getWorkspaceId(slug: string): Promise<string | null> {
  return (await prisma.workspace.findUnique({ where: { slug }, select: { id: true } }))?.id ?? null;
}

export async function ensureWorkspaceGoals(slug: string): Promise<void> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return;

  const existing = await prisma.workspaceGoal.count({ where: { workspaceId, active: true } });
  if (existing > 0) return;

  const tenant = getTenantThemeOrDefault(slug);
  const workspace = await prisma.workspace.findUnique({ where: { slug } });

  await prisma.workspaceGoal.createMany({
    data: [
      {
        workspaceId,
        level: "mission",
        title: `OEE ≥ 95% · ${workspace?.plant ?? "Plant"}`,
        metric: "OEE",
        targetLabel: "≥ 95%",
        priority: 0
      },
      {
        workspaceId,
        level: "project",
        title: `Kurangi defect rate di ${tenant.machineCode}`,
        metric: "NG Rate",
        targetLabel: "< 0.5%",
        priority: 1
      }
    ]
  });
}

export async function getWorkspaceMission(slug: string): Promise<GoalLink | null> {
  await ensureWorkspaceGoals(slug);
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const mission = await prisma.workspaceGoal.findFirst({
    where: { workspaceId, level: "mission", active: true },
    orderBy: { priority: "asc" }
  });

  if (!mission) return null;
  return {
    level: "mission",
    label: mission.title,
    ...(mission.targetLabel ? { reason: mission.targetLabel } : {})
  };
}

export function buildInvestigationGoalChain(input: {
  mission?: GoalLink | null;
  projectLabel?: string;
  issueTitle: string;
  taskStep?: number;
}): GoalLink[] {
  const chain: GoalLink[] = [];

  if (input.mission) {
    chain.push(input.mission);
  }

  chain.push({
    level: "project",
    label: input.projectLabel ?? "Proyek penurunan defect",
    reason: "Prioritas quality improvement bulan ini"
  });

  chain.push({
    level: "investigation",
    label: input.issueTitle,
    reason: "Investigasi defect aktif"
  });

  if (input.taskStep !== undefined && input.taskStep >= 0 && input.taskStep < WIZARD_TASK_LABELS.length) {
    chain.push({
      level: "task",
      label: WIZARD_TASK_LABELS[input.taskStep]!,
      reason: `Langkah ${input.taskStep + 1} dari ${WIZARD_TASK_LABELS.length}`
    });
  }

  return chain;
}

export async function getGoalChainForIssue(
  slug: string,
  issueKey: string,
  taskStep?: number
): Promise<GoalLink[]> {
  const mission = await getWorkspaceMission(slug);
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const project = await prisma.workspaceGoal.findFirst({
    where: { workspaceId, level: "project", active: true },
    orderBy: { priority: "asc" }
  });

  const issue = await prisma.issue.findFirst({
    where: {
      workspaceId,
      OR: [{ id: `issue-${slug}-${issueKey}` }, { title: { contains: issueKey, mode: "insensitive" } }]
    }
  });

  return buildInvestigationGoalChain({
    mission,
    issueTitle: issue?.title ?? `Issue ${issueKey}`,
    ...(project?.title ? { projectLabel: project.title } : {}),
    ...(taskStep !== undefined ? { taskStep } : {})
  });
}

export async function listWorkspaceGoals(slug: string) {
  await ensureWorkspaceGoals(slug);
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const goals = await prisma.workspaceGoal.findMany({
    where: { workspaceId, active: true },
    orderBy: [{ level: "asc" }, { priority: "asc" }]
  });

  return goals.map((goal: { id: string; level: string; title: string; metric: string | null; targetLabel: string | null }) => ({
    id: goal.id,
    level: goal.level,
    title: goal.title,
    metric: goal.metric,
    targetLabel: goal.targetLabel
  }));
}
