import { AskBuekSection } from "./AskBuekSection.js";
import type { RoleHomeProps } from "./shared.js";
import { RoleHomeHeader } from "./shared.js";
import { focusStatusColor } from "../../lib/context.js";

export function SupervisorHome({ user, workspace, roleHome, onAction, ...askProps }: RoleHomeProps) {
  const sup = roleHome.supervisor!;

  return (
    <div className="space-y-12 pb-16">
      <RoleHomeHeader
        user={user}
        workspace={workspace}
        subtitle="Ensure the line is running — approvals, owners, and team progress"
      />

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Today&apos;s Overview</h2>
        <div className="grid grid-cols-3 gap-6">
          {sup.overview.map((item) => (
            <div
              key={item.label}
              className="buek-card rounded-2xl border border-white/10 text-center"
            >
              <p className="buek-body text-slate-500">{item.label}</p>
              <p className={`mt-3 text-3xl ${focusStatusColor(item.status)}`}>
                {item.status === "green" ? "🟢" : item.status === "yellow" ? "🟠" : "🔴"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Waiting Approval</h2>
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
          {sup.waitingApproval.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => onAction(item.prompt, item.label)}
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
        <h2 className="buek-card-title text-slate-400">Open Issues</h2>
        {sup.openIssues.map((issue) => (
          <button
            key={issue.id}
            type="button"
            onClick={() => onAction(issue.prompt, issue.title)}
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
        <h2 className="buek-card-title text-slate-400">Team Performance</h2>
        <ul className="space-y-3">
          {sup.teamPerformance.map((member) => (
            <li
              key={member.name}
              className="buek-card flex items-center justify-between rounded-xl border border-white/10"
            >
              <span className="buek-body text-slate-300">{member.name}</span>
              <span className="buek-small text-slate-500">
                {member.closed} closed · {member.pending} pending
              </span>
            </li>
          ))}
        </ul>
      </section>

      <AskBuekSection {...askProps} />
    </div>
  );
}
