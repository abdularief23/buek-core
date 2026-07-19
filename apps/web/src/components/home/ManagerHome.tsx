import { TodayTimeline } from "../TodayTimeline.js";
import type { RoleHomeProps } from "./shared.js";
import { RoleHomeHeader } from "./shared.js";
import { kpiStatusIcon } from "../../lib/context.js";

const trendIcon = { up: "▲", down: "▼", flat: "→" } as const;

export function ManagerHome({ user, workspace, roleHome, onOpenWorkspace }: RoleHomeProps) {
  const mgr = roleHome.manager!;

  function openFocus(item: NonNullable<typeof mgr.todayFocus>[number]) {
    if (item.route === "customer-complaints") {
      onOpenWorkspace({ kind: "customer-complaints", slug: workspace.id });
      return;
    }
    if (item.route === "production-dashboard") {
      onOpenWorkspace({ kind: "production-dashboard", slug: workspace.id });
      return;
    }
    onOpenWorkspace({ kind: "kpi-detail", slug: workspace.id, kpiLabel: item.kpiLabel ?? "Quality" });
  }

  function openCriticalIssue(issue: (typeof mgr.criticalIssues)[number]) {
    if (issue.route === "customer-complaint" && issue.complaintId) {
      onOpenWorkspace({ kind: "customer-complaint", slug: workspace.id, complaintId: issue.complaintId });
      return;
    }
    if (issue.route === "investigation" && issue.issueKey) {
      onOpenWorkspace({ kind: "investigation", slug: workspace.id, issueKey: issue.issueKey });
      return;
    }
    onOpenWorkspace({ kind: "production-dashboard", slug: workspace.id });
  }

  function openKpi(label: string) {
    if (label === "Production") {
      onOpenWorkspace({ kind: "production-dashboard", slug: workspace.id });
      return;
    }
    onOpenWorkspace({ kind: "kpi-detail", slug: workspace.id, kpiLabel: label });
  }

  return (
    <div className="space-y-12 pb-16">
      <RoleHomeHeader
        user={user}
        workspace={workspace}
        subtitle="Ringkasan pabrik — KPI, risiko, dan keputusan eksekutif"
      />

      {mgr.todayFocus?.length ? (
        <section className="buek-section space-y-4">
          <h2 className="buek-card-title text-slate-400">Today&apos;s Focus</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {mgr.todayFocus.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openFocus(item)}
                className="buek-card rounded-2xl border border-white/10 text-left hover:border-cyan-400/30"
              >
                <p className="buek-body text-slate-500">{item.label}</p>
                {item.badge ? (
                  <p className="mt-2 text-lg font-semibold text-amber-300">{item.badge}</p>
                ) : (
                  <p className="mt-2 text-lg font-semibold text-white">Lihat detail →</p>
                )}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Ringkasan Pabrik</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mgr.factoryOverview.map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => openKpi(kpi.label)}
              className="buek-card rounded-2xl border border-white/10 text-left hover:border-white/20"
            >
              <p className="buek-body text-slate-500">{kpi.label}</p>
              <p className="mt-3 text-4xl font-bold text-white">{kpi.value}</p>
              <p className="mt-2">{kpiStatusIcon(kpi.status)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Isu Kritis</h2>
        <ul className="space-y-3">
          {mgr.criticalIssues.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => openCriticalIssue(issue)}
                className="buek-card w-full rounded-xl border border-red-500/20 bg-red-500/5 text-left buek-body text-slate-200 hover:border-red-500/40"
              >
                {issue.title}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Tren Mingguan</h2>
        <div className="flex flex-wrap gap-8">
          {mgr.weeklyTrend.map((item) => (
            <div key={item.label} className="buek-body text-slate-300">
              {item.label}{" "}
              <span
                className={
                  item.trend === "up"
                    ? "text-emerald-400"
                    : item.trend === "down"
                      ? "text-red-400"
                      : "text-slate-500"
                }
              >
                {trendIcon[item.trend]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Ringkasan Eksekutif</h2>
        <div className="buek-card rounded-2xl border border-white/10 bg-white/[0.02]">
          {mgr.executiveSummary.map((line) => (
            <p key={line} className="buek-body text-slate-300">
              {line}
            </p>
          ))}
        </div>
      </section>

      <TodayTimeline workspaceSlug={workspace.id} />
    </div>
  );
}
