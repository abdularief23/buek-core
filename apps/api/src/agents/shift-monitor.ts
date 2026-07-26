import { prisma } from "../db.js";
import { logAiAudit } from "../services/audit-log.js";
import { getWorkspaceMission } from "../services/goal-alignment.js";

const MONITORED_WORKSPACES = ["epson-factory", "toyota-plant", "nestle-factory"] as const;

export interface ShiftMonitorResult {
  workspaceSlug: string;
  openIssues: number;
  criticalAlerts: number;
  summary: string;
  recommendations: string[];
}

async function runShiftMonitorForWorkspace(slug: string): Promise<ShiftMonitorResult> {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    return {
      workspaceSlug: slug,
      openIssues: 0,
      criticalAlerts: 0,
      summary: "Workspace not found.",
      recommendations: []
    };
  }

  const [openIssues, criticalRules, mission] = await Promise.all([
    prisma.issue.count({
      where: { workspaceId: workspace.id, status: { in: ["open", "in_progress"] } }
    }),
    prisma.businessRule.count({
      where: { workspaceId: workspace.id, enabled: true, severity: "critical" }
    }),
    getWorkspaceMission(slug)
  ]);

  const recommendations: string[] = [];
  if (openIssues > 0) {
    recommendations.push(`Review ${openIssues} open issue(s) before next shift handover.`);
  }
  if (criticalRules > 0) {
    recommendations.push(`Evaluate ${criticalRules} critical business rule(s) for violations.`);
  }
  if (openIssues === 0) {
    recommendations.push("No open issues — line stable. Continue preventive checks.");
  }

  const summary =
    openIssues > 0
      ? `Shift monitor: ${openIssues} open issue(s) aligned to ${mission?.label ?? "plant mission"}.`
      : `Shift monitor: production stable for ${workspace.plant}.`;

  const goalChain = mission
    ? [
        mission,
        {
          level: "task" as const,
          label: "Shift health check",
          reason: "Background agent heartbeat"
        }
      ]
    : undefined;

  await logAiAudit({
    slug,
    toolName: "shift_monitor_heartbeat",
    source: "background_agent",
    input: { agentType: "shift_monitor", intervalHours: 4 },
    output: { openIssues, criticalRules, recommendations },
    ...(goalChain ? { goalChain } : {})
  });

  return {
    workspaceSlug: slug,
    openIssues,
    criticalAlerts: criticalRules,
    summary,
    recommendations
  };
}

export async function runShiftMonitor(slug: string): Promise<ShiftMonitorResult> {
  const startedAt = new Date();
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    throw new Error(`Workspace ${slug} not found.`);
  }

  const result = await runShiftMonitorForWorkspace(slug);

  await prisma.agentHeartbeatRun.create({
    data: {
      workspaceId: workspace.id,
      agentType: "shift_monitor",
      status: "completed",
      summary: result.summary,
      output: result as object,
      startedAt,
      completedAt: new Date()
    }
  });

  return result;
}

export async function runAllShiftMonitors(): Promise<ShiftMonitorResult[]> {
  const results: ShiftMonitorResult[] = [];
  for (const slug of MONITORED_WORKSPACES) {
    try {
      results.push(await runShiftMonitor(slug));
    } catch {
      // Continue other workspaces if one fails.
    }
  }
  return results;
}

export async function listAgentHeartbeats(slug: string, limit = 10) {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) return [];

  const runs = await prisma.agentHeartbeatRun.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { startedAt: "desc" },
    take: limit
  });

  return runs.map((run: { id: string; agentType: string; status: string; summary: string; output: unknown; startedAt: Date; completedAt: Date | null }) => ({
    id: run.id,
    agentType: run.agentType,
    status: run.status,
    summary: run.summary,
    output: run.output,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null
  }));
}
