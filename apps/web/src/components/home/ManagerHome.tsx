import { TodayTimeline } from "../TodayTimeline.js";
import { AskBuekSection } from "./AskBuekSection.js";
import type { RoleHomeProps } from "./shared.js";
import { RoleHomeHeader } from "./shared.js";
import { kpiStatusIcon } from "../../lib/context.js";

const trendIcon = { up: "▲", down: "▼", flat: "→" } as const;

export function ManagerHome({ user, workspace, roleHome, onAction, ...askProps }: RoleHomeProps) {
  const mgr = roleHome.manager!;

  return (
    <div className="space-y-12 pb-16">
      <RoleHomeHeader
        user={user}
        workspace={workspace}
        subtitle="Factory overview — KPI, risk, and executive decisions"
      />

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Factory Overview</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mgr.factoryOverview.map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onAction(`Show ${kpi.label} KPI dashboard and trends`, kpi.label)}
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
        <h2 className="buek-card-title text-slate-400">Critical Issues</h2>
        <ul className="space-y-3">
          {mgr.criticalIssues.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => onAction(issue.prompt, issue.title)}
                className="buek-card w-full rounded-xl border border-red-500/20 bg-red-500/5 text-left buek-body text-slate-200 hover:border-red-500/40"
              >
                {issue.title}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Weekly Trend</h2>
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
        <h2 className="buek-card-title text-slate-400">AI Executive Summary</h2>
        <div className="buek-card rounded-2xl border border-white/10 bg-white/[0.02]">
          {mgr.executiveSummary.map((line) => (
            <p key={line} className="buek-body text-slate-300">
              {line}
            </p>
          ))}
        </div>
      </section>

      <TodayTimeline workspaceSlug={workspace.id} />

      <AskBuekSection {...askProps} />
    </div>
  );
}
