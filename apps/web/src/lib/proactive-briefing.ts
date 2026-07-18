import type { DynamicWorkspaceState } from "../components/DynamicWorkspace.js";
import type { RoleHomeData, Workspace } from "../types.js";

export interface BriefingItem {
  id: string;
  text: string;
  actionLabel: string;
  workspace?: DynamicWorkspaceState;
  explainPrompt?: string;
}

function primaryIssueKey(workspaceId: string): string {
  if (workspaceId === "toyota-plant") return "torque-drift";
  if (workspaceId === "nestle-factory") return "metal-detector";
  return "white-streak";
}

export function buildProactiveBriefing(
  userName: string,
  workspace: Workspace,
  roleHome: RoleHomeData
): { greeting: string; items: BriefingItem[] } {
  const slug = workspace.id;
  const issueKey = primaryIssueKey(slug);
  const items: BriefingItem[] = [];

  if (roleHome.roleKey === "supervisor" && roleHome.supervisor) {
    const sup = roleHome.supervisor;
    const wo = sup.waitingApproval.find((w) => w.action === "approval-queue");
    const sop = sup.waitingApproval.find((w) => w.action === "sop-revisions");

    if (sup.openIssues[0]) {
      items.push({
        id: "issue-1",
        text: sup.openIssues[0].title,
        actionLabel: "Investigasi",
        workspace: {
          kind: "investigation",
          slug,
          issueKey: sup.openIssues[0].issueKey ?? issueKey
        },
        explainPrompt: `Jelaskan dampak ${sup.openIssues[0].title} terhadap produksi hari ini`
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
      const sopLabel =
        slug === "toyota-plant" ? "ASM-022" : slug === "nestle-factory" ? "HACCP-011" : "SOP-014";
      items.push({
        id: "sop-pending",
        text: `${sopLabel} siap disetujui`,
        actionLabel: "Approve",
        workspace: { kind: "sop-revisions", slug }
      });
    }

    return {
      greeting: `Selamat pagi ${userName}. Saya menemukan ${items.length} hal yang perlu perhatian Anda.`,
      items
    };
  }

  if (roleHome.roleKey === "manager" && roleHome.manager) {
    roleHome.manager.criticalIssues.slice(0, 3).forEach((issue) => {
      items.push({
        id: issue.id,
        text: issue.title,
        actionLabel: "Lihat",
        workspace: { kind: "kpi-detail", slug, kpiLabel: "Production" },
        explainPrompt: issue.prompt
      });
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

  const proactive = workspace.dailyWorkspace.proactiveCards ?? [];
  proactive.slice(0, 3).forEach((card, idx) => {
    items.push({
      id: `proactive-${idx}`,
      text: card.text,
      actionLabel: "Lihat",
      explainPrompt: card.prompt
    });
  });

  return {
    greeting:
      workspace.dailyWorkspace.proactiveGreeting ||
      `Selamat pagi ${userName}. Ada yang bisa saya bantu hari ini?`,
    items
  };
}
