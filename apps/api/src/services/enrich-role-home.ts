import type { RoleHomeData } from "../role-workspaces.js";
import {
  getIssues,
  getLiveKpis,
  getSupervisorStats,
  getTeamPerformance,
  getWeeklyTrend
} from "./data-engine.js";
import { getOperatorChecklist } from "./workflow-data.js";

function kpiToOverviewStatus(status: "green" | "yellow" | "red"): "green" | "yellow" | "red" {
  return status;
}

function severityIcon(severity: string): string {
  if (severity === "critical" || severity === "high") return "🔴";
  if (severity === "medium") return "🟠";
  return "🟡";
}

export async function enrichRoleHomeFromDb(
  workspaceSlug: string,
  roleHome: RoleHomeData
): Promise<RoleHomeData> {
  try {
    if (roleHome.roleKey === "supervisor" && roleHome.supervisor) {
      const [stats, issues, kpis, teamPerformance] = await Promise.all([
        getSupervisorStats(workspaceSlug),
        getIssues(workspaceSlug, ["open", "investigating"]),
        getLiveKpis(workspaceSlug),
        getTeamPerformance(workspaceSlug)
      ]);

      const overviewLabels = ["Production", "Quality", "Delivery"];
      const overviewFromKpis = overviewLabels
        .map((label) => {
          const kpi = kpis.find((k) => k.label === label);
          if (!kpi) return null;
          return {
            label: label === "Delivery" ? "Maintenance" : label,
            status: kpiToOverviewStatus(kpi.status)
          };
        })
        .filter((item): item is { label: string; status: "green" | "yellow" | "red" } => Boolean(item));

      const openIssues = issues.slice(0, 5).map((issue) => ({
        id: issue.id,
        title: issue.machine ? `${issue.machine.code} — ${issue.title}` : issue.title,
        owner: issue.owner?.name ?? "Unassigned",
        status: issue.status,
        prompt: `Status of ${issue.title} and who owns it`
      }));

      return {
        ...roleHome,
        supervisor: {
          ...roleHome.supervisor,
          overview: overviewFromKpis.length ? overviewFromKpis : roleHome.supervisor.overview,
          waitingApproval: [
            {
              label: "Work Orders",
              count: stats.pendingWorkOrders,
              action: "approval-queue"
            },
            {
              label: "SOP Revision",
              count: stats.pendingSopRevisions,
              action: "sop-revisions"
            },
            {
              label: "Engineering Reports",
              count: stats.pendingReports,
              action: "engineering-reports"
            }
          ],
          openIssues: openIssues.length ? openIssues : roleHome.supervisor.openIssues,
          teamPerformance: teamPerformance.length
            ? teamPerformance
            : roleHome.supervisor.teamPerformance
        }
      };
    }

    if (roleHome.roleKey === "manager" && roleHome.manager) {
      const [kpis, issues, stats, weeklyTrend] = await Promise.all([
        getLiveKpis(workspaceSlug),
        getIssues(workspaceSlug, ["open", "investigating"]),
        getSupervisorStats(workspaceSlug),
        getWeeklyTrend(workspaceSlug)
      ]);

      const criticalIssues = issues
        .filter((i) => i.severity === "high" || i.severity === "critical")
        .slice(0, 4)
        .map((issue) => ({
          id: issue.id,
          title: issue.machine ? `${issue.machine.code} — ${issue.title}` : issue.title,
          prompt: `Executive summary of ${issue.title} impact on production`
        }));

      const productionKpi = kpis.find((k) => k.label === "Production");
      const qualityKpi = kpis.find((k) => k.label === "Quality");
      const executiveSummary = [
        productionKpi
          ? `Production at ${productionKpi.value} (${productionKpi.status}).`
          : "Production remains stable.",
        qualityKpi ? `Quality at ${qualityKpi.value}.` : "Quality improved 4%.",
        stats.openIssues > 0
          ? `${stats.openIssues} open issue${stats.openIssues > 1 ? "s" : ""} requiring attention.`
          : "No critical open issues.",
        stats.pendingWorkOrders + stats.pendingReports > 0
          ? `${stats.pendingWorkOrders + stats.pendingReports} items pending approval.`
          : "All approvals up to date."
      ];

      return {
        ...roleHome,
        manager: {
          ...roleHome.manager,
          factoryOverview: kpis.length
            ? kpis.map((kpi) => ({
                label: kpi.label,
                value: kpi.value,
                status: kpi.status
              }))
            : roleHome.manager.factoryOverview,
          criticalIssues: criticalIssues.length
            ? criticalIssues
            : roleHome.manager.criticalIssues,
          weeklyTrend,
          executiveSummary
        }
      };
    }

    if (roleHome.roleKey === "engineer" && roleHome.engineer) {
      const issues = await getIssues(workspaceSlug, ["open", "investigating"]);
      const investigations = issues
        .filter((i) => i.investigation)
        .slice(0, 4)
        .map((i) => ({
          id: i.id,
          label: i.title,
          issueKey: i.id.replace(`issue-${workspaceSlug}-`, ""),
          progress: i.progress
        }));

      const problems = issues.slice(0, 3).map((issue) => ({
        id: issue.id,
        severity: (issue.severity === "high" || issue.severity === "critical"
          ? "critical"
          : issue.severity === "medium"
            ? "warning"
            : "attention") as "critical" | "warning" | "attention",
        icon: severityIcon(issue.severity),
        title: issue.machine ? `${issue.machine.name} ${issue.title}` : issue.title,
        detail: issue.description?.slice(0, 80) ?? `${issue.progress}% complete`,
        actionLabel: issue.investigation ? "Root Cause" : "Investigate",
        prompt: `Continue ${issue.title} investigation`,
        contextLabel: issue.title,
        action: "investigation" as const,
        issueKey: issue.id.replace(`issue-${workspaceSlug}-`, "")
      }));

      return {
        ...roleHome,
        engineer: {
          ...roleHome.engineer,
          problems: problems.length ? problems : roleHome.engineer.problems,
          investigations: investigations.length
            ? investigations.map((inv) => ({
                id: inv.id,
                label: inv.label,
                prompt: `Continue ${inv.label} investigation`
              }))
            : roleHome.engineer.investigations
        }
      };
    }

    if (roleHome.roleKey === "operator" && roleHome.operator) {
      const checklist = await getOperatorChecklist(workspaceSlug);
      if (checklist) {
        return {
          ...roleHome,
          operator: {
            ...roleHome.operator,
            line: checklist.line,
            shift: checklist.shift,
            targetOutput: checklist.targetOutput,
            progress: checklist.progress,
            checklist: checklist.items
          }
        };
      }
    }

    return roleHome;
  } catch {
    return roleHome;
  }
}
