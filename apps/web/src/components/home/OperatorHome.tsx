import type { RoleHomeData, Workspace } from "../../types.js";
import { AskBuekSection } from "./AskBuekSection.js";
import type { RoleHomeProps } from "./shared.js";

export function OperatorHome({
  user,
  workspace,
  roleHome,
  input,
  isStreaming,
  onInputChange,
  onAsk
}: RoleHomeProps) {
  const op = roleHome.operator!;
  const progressPct = Math.round((op.progress / op.targetOutput) * 100);

  return (
    <div className="space-y-12 pb-16">
      <header className="space-y-3 border-b border-white/10 pb-8">
        <h1 className="buek-heading text-white">Good Morning, {user.name} 👋</h1>
        <p className="buek-body text-slate-400">
          Operator <span className="text-slate-600">•</span> {op.line}
        </p>
        <p className="buek-subtitle text-slate-500">{workspace.organization} · {op.shift}</p>
      </header>

      <section className="buek-section space-y-6">
        <h2 className="buek-card-title text-slate-400">Today&apos;s Work</h2>
        <div className="buek-card rounded-2xl border border-white/10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="buek-small text-slate-500">✔ Target Output</p>
              <p className="mt-2 text-4xl font-bold text-white">{op.targetOutput} pcs</p>
            </div>
            <div className="text-right">
              <p className="buek-small text-slate-500">Progress</p>
              <p className="mt-2 text-4xl font-bold text-cyan-400">
                {op.progress} / {op.targetOutput}
              </p>
            </div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Today&apos;s Checklist</h2>
        <ul className="space-y-3">
          {op.checklist.map((item) => (
            <li
              key={item.id}
              className="buek-card flex items-center gap-4 rounded-xl border border-white/10"
            >
              <span className="text-xl">{item.done ? "✔" : "□"}</span>
              <span className={item.done ? "text-slate-500 line-through" : "text-slate-200"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Quality Reminder</h2>
        <ul className="space-y-2">
          {op.qualityReminders.map((reminder) => (
            <li key={reminder} className="buek-body text-amber-300/90">
              ⚠ {reminder}
            </li>
          ))}
        </ul>
      </section>

      <AskBuekSection
        input={input}
        isStreaming={isStreaming}
        onInputChange={onInputChange}
        onAsk={onAsk}
        helpTopics={["SOP", "Machine setup", "Quality checkpoint", "Basic troubleshooting"]}
      />
    </div>
  );
}
