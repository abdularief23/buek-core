import type { DynamicWorkspaceState } from "../components/DynamicWorkspace.js";
import type { RoleHomeData, Workspace } from "../types.js";

export interface BriefingItem {
  id: string;
  text: string;
  actionLabel: string;
  workspace?: DynamicWorkspaceState;
}

export function buildProactiveBriefing(
  userName: string,
  workspace: Workspace,
  roleHome: RoleHomeData
): { greeting: string; items: BriefingItem[] } {
  const slug = workspace.id;
  const items: BriefingItem[] = [];

  if (roleHome.roleKey === "supervisor" && roleHome.supervisor) {
    const sup = roleHome.supervisor;
    const wo = sup.waitingApproval.find((w) => w.action === "approval-queue");
    const sop = sup.waitingApproval.find((w) => w.action === "sop-revisions");

    if (sup.openIssues[0]) {
      const issue = sup.openIssues[0];
      items.push({
        id: "issue-1",
        text: issue.title,
        actionLabel: "Investigasi",
        workspace: {
          kind: "investigation",
          slug,
          issueKey: issue.issueKey ?? issue.id.replace(`issue-${slug}-`, "")
        }
      });
    }
    if (wo && wo.count > 0) {
      items.push({
        id: "wo-pending",
        text: `${wo.count} Work Order menunggu approval`,
        actionLabel: "Review",
        workspace: { kind: "approval-queue", slug }
      });
    }
    if (sop && sop.count > 0) {
      items.push({
        id: "sop-pending",
        text: "SOP revision menunggu approval",
        actionLabel: "Review",
        workspace: { kind: "sop-revisions", slug }
      });
    }

    return {
      greeting: `Selamat pagi ${userName}. ${items.length} hal perlu perhatian Anda hari ini.`,
      items
    };
  }

  if (roleHome.roleKey === "manager" && roleHome.manager) {
    const focus = roleHome.manager.todayFocus?.[0];
    if (focus?.route === "customer-complaints" && (focus.count ?? 0) > 0) {
      items.push({
        id: "customer-complaint",
        text: `Customer Complaint — ${focus.badge ?? `${focus.count} aktif`}`,
        actionLabel: "Lihat",
        workspace: { kind: "customer-complaints", slug }
      });
    }

    roleHome.manager.criticalIssues.slice(0, 2).forEach((issue) => {
      if (issue.route === "customer-complaint" && issue.complaintId) {
        items.push({
          id: issue.id,
          text: issue.title,
          actionLabel: "Detail",
          workspace: { kind: "customer-complaint", slug, complaintId: issue.complaintId }
        });
      } else if (issue.route === "investigation" && issue.issueKey) {
        items.push({
          id: issue.id,
          text: issue.title,
          actionLabel: "Investigasi",
          workspace: { kind: "investigation", slug, issueKey: issue.issueKey }
        });
      }
    });

    return {
      greeting: `Selamat pagi ${userName}. Ringkasan pabrik hari ini siap ditinjau.`,
      items: items.length
        ? items
        : [
            {
              id: "production",
              text: "Produksi berjalan sesuai rencana",
              actionLabel: "Lihat",
              workspace: { kind: "production-dashboard", slug }
            }
          ]
    };
  }

  if (roleHome.roleKey === "engineer" && roleHome.engineer) {
    roleHome.engineer.problems.slice(0, 2).forEach((problem) => {
      if (problem.issueKey) {
        items.push({
          id: problem.id,
          text: problem.title,
          actionLabel: problem.actionLabel,
          workspace: { kind: "investigation", slug, issueKey: problem.issueKey }
        });
      }
    });

    return {
      greeting: `Selamat pagi ${userName}. ${items.length ? `${items.length} investigasi aktif.` : "Tidak ada isu kritis saat ini."}`,
      items
    };
  }

  return {
    greeting: `Selamat pagi ${userName}. Buka kartu di Home untuk melihat data — gunakan ✨ jika butuh analisis AI.`,
    items
  };
}
