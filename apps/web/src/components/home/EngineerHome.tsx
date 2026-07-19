import { tenantPrimaryIssueKey } from "../../lib/tenant-theme.js";
import { TodayTimeline } from "../TodayTimeline.js";
import type { RoleHomeProps } from "./shared.js";
import { RoleHomeHeader } from "./shared.js";

export function EngineerHome({ user, workspace, roleHome, onOpenWorkspace }: RoleHomeProps) {
  const eng = roleHome.engineer!;

  return (
    <div className="space-y-12 pb-16">
      <RoleHomeHeader user={user} workspace={workspace} subtitle="Prioritas analisa engineering hari ini" />

      <section className="buek-section space-y-6">
        <h2 className="buek-card-title text-slate-400">Masalah Hari Ini</h2>
        <div className="buek-gap grid gap-6">
          {eng.problems.map((problem) => {
            const m = problem.metrics;
            return (
              <article
                key={problem.id}
                className="buek-card rounded-2xl border border-white/10 p-6"
              >
                {m ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="buek-small text-slate-500">Machine</p>
                        <p className="buek-card-title text-white">{m.machineCode}</p>
                      </div>
                      <div>
                        <p className="buek-small text-slate-500">Issue</p>
                        <p className="buek-body text-white">{m.issueTitle}</p>
                      </div>
                      <div>
                        <p className="buek-small text-slate-500">Current PPM</p>
                        <p className="text-2xl font-semibold text-amber-300">
                          {m.currentPpm.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="buek-small text-slate-500">Target</p>
                        <p className="text-2xl font-semibold text-slate-200">
                          {m.targetPpm.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="buek-small text-slate-500">Increase</p>
                        <p className="buek-body text-red-400">+{m.increasePercent}%</p>
                      </div>
                      <div>
                        <p className="buek-small text-slate-500">Priority</p>
                        <p className="buek-body capitalize text-cyan-300">{m.priority}</p>
                      </div>
                      <div>
                        <p className="buek-small text-slate-500">Due</p>
                        <p className="buek-body text-white">{m.dueLabel}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (problem.issueKey) {
                          onOpenWorkspace({
                            kind: "investigation",
                            slug: workspace.id,
                            issueKey: problem.issueKey
                          });
                        }
                      }}
                      className="rounded-xl bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      {problem.actionLabel}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                      <p className="buek-card-title text-white">
                        {problem.icon} {problem.title}
                      </p>
                      <p className="mt-2 buek-body text-slate-400">{problem.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (problem.issueKey) {
                          onOpenWorkspace({
                            kind: "investigation",
                            slug: workspace.id,
                            issueKey: problem.issueKey
                          });
                        }
                      }}
                      className="shrink-0 rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-950 hover:bg-slate-200"
                    >
                      {problem.actionLabel}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Analisa Saya</h2>
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
          {eng.investigations.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  onOpenWorkspace({
                    kind: "investigation",
                    slug: workspace.id,
                    issueKey: item.issueKey ?? item.id.replace(`issue-${workspace.id}-`, "")
                  })
                }
                className="flex w-full items-center justify-between px-6 py-5 text-left buek-body text-slate-300 hover:bg-white/[0.03] hover:text-white"
              >
                <span>{item.label}</span>
                <span className="text-cyan-400">Lanjutkan Analisa ↓</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Saran AI</h2>
        {eng.aiSuggestions.map((suggestion) => (
          <article
            key={suggestion.id}
            className="buek-card rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6"
          >
            <p className="buek-small text-slate-500">{suggestion.title}</p>
            <p className="mt-2 buek-card-title text-white">{suggestion.candidate}</p>
            <p className="mt-1 buek-body text-cyan-300">{suggestion.confidence}</p>
            <p className="mt-2 buek-small text-slate-500">
              AI menyarankan — engineer yang memilih keputusan akhir.
            </p>
            <button
              type="button"
              onClick={() =>
                onOpenWorkspace({
                  kind: "investigation",
                  slug: workspace.id,
                  issueKey:
                    suggestion.issueKey ??
                    eng.problems[0]?.issueKey ??
                    tenantPrimaryIssueKey(workspace.theme)
                })
              }
              className="mt-4 rounded-lg border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/10"
            >
              Lanjutkan Analisa ↓
            </button>
          </article>
        ))}
      </section>

      <TodayTimeline workspaceSlug={workspace.id} />
    </div>
  );
}
