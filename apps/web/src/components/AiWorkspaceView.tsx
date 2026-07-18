import { useEffect, useState } from "react";
import { fetchLiveKpis, fetchTimeline, type LiveKpi, type TimelineEvent } from "../lib/data-api.js";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";
import type { Workspace } from "../types.js";
import { focusStatusColor, kpiStatusIcon } from "../lib/context.js";

interface AiWorkspaceViewProps {
  workspace: Workspace;
  onOpenDataPage: (page: DynamicWorkspaceState) => void;
}

export function AiWorkspaceView({ workspace, onOpenDataPage }: AiWorkspaceViewProps) {
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

  function openKpi(label: string) {
    if (label === "Production") {
      onOpenDataPage({ kind: "production-dashboard", slug: workspace.id });
      return;
    }
    onOpenDataPage({ kind: "kpi-detail", slug: workspace.id, kpiLabel: label });
  }

  return (
    <div className="space-y-10 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">AI Workspace</h1>
        <p className="mt-2 text-base text-slate-400">
          Konteks pabrik — data live dari operating graph. Klik untuk melihat detail.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Fokus Hari Ini {loading ? "" : "· Live"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.slice(0, 3).map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => openKpi(kpi.label)}
              className="rounded-2xl border border-white/10 px-5 py-4 text-left transition hover:border-cyan-400/30 hover:bg-white/[0.02]"
            >
              <p className="text-sm text-slate-500">{kpi.label}</p>
              <p className={`mt-1 text-lg font-medium ${focusStatusColor(kpi.status)}`}>
                {kpi.value}
              </p>
            </button>
          ))}
        </div>
      </section>

      {kpis.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Pabrik Hari Ini
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <button
                key={kpi.label}
                type="button"
                onClick={() => openKpi(kpi.label)}
                className="rounded-2xl border border-white/10 px-6 py-5 text-left transition hover:border-white/20"
              >
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{kpi.value}</p>
                <p className="mt-1 text-sm">{kpiStatusIcon(kpi.status)}</p>
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500">Klik metrik untuk membuka halaman data. Gunakan ✨ Jelaskan jika butuh analisis AI.</p>
        </section>
      ) : null}

      {timeline.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Aktivitas Live
          </h2>
          <ul className="space-y-3 rounded-2xl border border-white/10 px-6 py-4">
            {timeline.slice(-8).reverse().map((event) => (
              <li key={event.id} className="flex gap-4 text-base">
                <span className="w-12 shrink-0 font-mono text-sm text-slate-600">{event.time}</span>
                <span className="text-slate-300">
                  {event.detail ? `${event.title} — ${event.detail}` : event.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
