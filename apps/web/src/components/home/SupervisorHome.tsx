import { tenantPrimaryIssueKey } from "../../lib/tenant-theme.js";
import { TodayTimeline } from "../TodayTimeline.js";
import type { RoleHomeProps } from "./shared.js";
import { RoleHomeHeader } from "./shared.js";
import { focusStatusColor } from "../../lib/context.js";

const overviewRoute: Record<string, { kind: "production-dashboard" } | { kind: "kpi-detail"; kpiLabel: string }> = {
  Production: { kind: "production-dashboard" },
  Quality: { kind: "kpi-detail", kpiLabel: "Quality" },
  Maintenance: { kind: "kpi-detail", kpiLabel: "Delivery" }
};

export function SupervisorHome({ user, workspace, roleHome, onOpenWorkspace }: RoleHomeProps) {
  const sup = roleHome.supervisor!;

  function openOverview(label: string) {
    const route = overviewRoute[label] ?? { kind: "kpi-detail" as const, kpiLabel: label };
    if (route.kind === "production-dashboard") {
      onOpenWorkspace({ kind: "production-dashboard", slug: workspace.id });
    } else {
      onOpenWorkspace({ kind: "kpi-detail", slug: workspace.id, kpiLabel: route.kpiLabel });
    }
  }

  return (
    <div className="space-y-12 pb-16">
      <RoleHomeHeader
        user={user}
        workspace={workspace}
        subtitle="Pastikan line berjalan — approval, owner, dan progress tim"
      />

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Ringkasan Hari Ini</h2>
        <div className="grid grid-cols-3 gap-6">
          {sup.overview.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => openOverview(item.label)}
              className="buek-card rounded-2xl border border-white/10 text-center hover:border-cyan-400/30"
            >
              <p className="buek-body text-slate-500">{item.label}</p>
              <p className={`mt-3 text-3xl ${focusStatusColor(item.status)}`}>
                {item.status === "green" ? "🟢" : item.status === "yellow" ? "🟠" : "🔴"}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Analisa Menunggu Review</h2>
        {sup.pendingAnalyses?.length ? (
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
            {sup.pendingAnalyses.map((item) => (
              <li key={item.issueKey}>
                <button
                  type="button"
                  onClick={() =>
                    onOpenWorkspace({
                      kind: "investigation",
                      slug: workspace.id,
                      issueKey: item.issueKey
                    })
                  }
                  className="flex w-full flex-col gap-1 px-6 py-5 text-left hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="buek-body font-medium text-white">{item.title}</p>
                    <p className="buek-small text-slate-500">
                      Engineer: {item.engineerName} · Root Cause: {item.rootCause}
                    </p>
                  </div>
                  <span className="shrink-0 text-amber-400">Review Sekarang →</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="buek-body text-slate-500">Tidak ada analisa engineering yang menunggu review.</p>
        )}
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Menunggu Approval</h2>
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
          {sup.waitingApproval.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  if (item.action === "pending-analyses" && sup.pendingAnalyses?.[0]) {
                    onOpenWorkspace({
                      kind: "investigation",
                      slug: workspace.id,
                      issueKey: sup.pendingAnalyses[0].issueKey
                    });
                  } else if (item.action === "approval-queue") {
                    onOpenWorkspace({ kind: "approval-queue", slug: workspace.id });
                  } else if (item.action === "sop-revisions") {
                    onOpenWorkspace({ kind: "sop-revisions", slug: workspace.id });
                  } else if (item.action === "engineering-reports") {
                    onOpenWorkspace({ kind: "engineering-reports", slug: workspace.id });
                  }
                }}
                className="flex w-full items-center justify-between px-6 py-5 hover:bg-white/[0.03]"
              >
                <span className="buek-body text-slate-300">{item.label}</span>
                <span className="text-lg font-semibold text-white">{item.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Isu Terbuka</h2>
        {sup.openIssues.map((issue) => (
          <button
            key={issue.id}
            type="button"
            onClick={() =>
              onOpenWorkspace({
                kind: "investigation",
                slug: workspace.id,
                issueKey: issue.issueKey ?? tenantPrimaryIssueKey(workspace.theme)
              })
            }
            className="buek-card w-full rounded-2xl border border-white/10 text-left hover:border-cyan-400/30"
          >
            <p className="buek-card-title text-white">{issue.title}</p>
            <div className="mt-3 flex gap-8 buek-small text-slate-500">
              <span>Owner: {issue.owner}</span>
              <span>Status: {issue.status}</span>
            </div>
          </button>
        ))}
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Performa Tim</h2>
        <ul className="space-y-3">
          {sup.teamPerformance.map((member) => (
            <li
              key={member.name}
              className="buek-card flex items-center justify-between rounded-xl border border-white/10"
            >
              <span className="buek-body text-slate-300">{member.name}</span>
              <span className="buek-small text-slate-500">
                {member.closed} selesai · {member.pending} pending
              </span>
            </li>
          ))}
        </ul>
      </section>

      <TodayTimeline workspaceSlug={workspace.id} />
    </div>
  );
}
