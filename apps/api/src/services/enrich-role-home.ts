import type { RoleHomeData } from "../role-workspaces.js";
import { getIssues, getLiveKpis, getSupervisorStats } from "./data-engine.js";
import { getOperatorChecklist } from "./workflow-data.js";

export async function enrichRoleHomeFromDb(
  workspaceSlug: string,
  roleHome: RoleHomeData
): Promise<RoleHomeData> {
  try {
    if (roleHome.roleKey === "supervisor" && roleHome.supervisor) {
      const stats = await getSupervisorStats(workspaceSlug);
      return {
        ...roleHome,
        supervisor: {
          ...roleHome.supervisor,
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
          ]
        }
      };
    }

    if (roleHome.roleKey === "manager" && roleHome.manager) {
      const kpis = await getLiveKpis(workspaceSlug);
      if (kpis.length) {
        return {
          ...roleHome,
          manager: {
            ...roleHome.manager,
            factoryOverview: kpis.map((kpi) => ({
              label: kpi.label,
              value: kpi.value,
              status: kpi.status
            }))
          }
        };
      }
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

      return {
        ...roleHome,
        engineer: {
          ...roleHome.engineer,
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
