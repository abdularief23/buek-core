import { useEffect, useState } from "react";
import type { Workspace } from "../types.js";
import { fetchLiveKpis, fetchTimeline, type LiveKpi, type TimelineEvent } from "../lib/data-api.js";
import { focusStatusColor, kpiStatusIcon } from "../lib/context.js";

interface AiWorkspaceViewProps {
  workspace: Workspace;
  onFocusSelect: (prompt: string, contextLabel: string) => void;
  onKpiSelect: (prompt: string) => void;
}

export function AiWorkspaceView({ workspace, onFocusSelect, onKpiSelect }: AiWorkspaceViewProps) {
  const daily = workspace.dailyWorkspace;
  const [kpis, setKpis] = useState<LiveKpi[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLiveKpis(workspace.id), fetchTimeline(workspace.id)])
      .then(([kpiData, timelineData]) => {
        setKpis(kpiData.kpis);
        setTimeline(timelineData.timeline);
      })
      .finally(() => setLoading(false));
  }, [workspace.id]);

  const focusCategories = kpis.length
    ? kpis.slice(0, 3).map((kpi, idx) => ({
        id: `focus-${idx}`,
        label: kpi.label,
        summary: kpi.value,
        status: kpi.status,
        prompt: `Show ${kpi.label} KPI dashboard and trends`
      }))
    : daily.focusCategories;

  const todayKpi = kpis.length
    ? kpis.map((kpi) => ({
        label: kpi.label,
        value: kpi.value,
        status: kpi.status,
        prompt: `Analyze ${kpi.label} performance today`
      }))
    : daily.todayKpi;

  const activityFeed = timeline.length
    ? timeline.slice(-8).reverse().map((event) => ({
        time: event.time,
        message: event.detail ? `${event.title} — ${event.detail}` : event.title
      }))
    : daily.activityFeed;

  return (
    <div className="space-y-10 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">AI Workspace</h1>
        <p className="mt-2 text-base text-slate-400">
          Your factory context — live KPIs and activity from the operating graph.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Today&apos;s Focus
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {focusCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onFocusSelect(category.prompt, category.label)}
              className="rounded-2xl border border-white/10 px-5 py-4 text-left transition hover:border-cyan-400/30 hover:bg-white/[0.02]"
            >
              <p className="text-sm text-slate-500">{category.label}</p>
              <p className={`mt-1 text-lg font-medium ${focusStatusColor(category.status)}`}>
                {category.summary}
              </p>
            </button>
          ))}
        </div>
      </section>

      {todayKpi.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Today&apos;s Factory {loading ? "" : "· Live"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {todayKpi.map((kpi) => (
              <button
                key={kpi.label}
                type="button"
                onClick={() => onKpiSelect(kpi.prompt)}
                className="rounded-2xl border border-white/10 px-6 py-5 text-left transition hover:border-white/20"
              >
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{kpi.value}</p>
                <p className="mt-1 text-sm">{kpiStatusIcon(kpi.status)}</p>
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500">Click any metric to open KPI dashboard via AI.</p>
        </section>
      ) : null}

      {activityFeed.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Live Activity
          </h2>
          <ul className="space-y-3 rounded-2xl border border-white/10 px-6 py-4">
            {activityFeed.map((event) => (
              <li key={`${event.time}-${event.message}`} className="flex gap-4 text-base">
                <span className="w-12 shrink-0 font-mono text-sm text-slate-600">{event.time}</span>
                <span className="text-slate-300">{event.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
