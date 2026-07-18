import type { DemoUser, Workspace } from "../types.js";
import { formatTodayDate, kpiStatusIcon } from "../lib/context.js";

interface HomeViewProps {
  user: DemoUser;
  workspace: Workspace;
  onAction: (prompt: string, contextLabel: string) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-medium tracking-wide text-slate-500">{children}</h2>;
}

export function HomeView({ user, workspace, onAction }: HomeViewProps) {
  const daily = workspace.dailyWorkspace;

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-8">
      <header className="space-y-1 border-b border-white/10 pb-6">
        <p className="text-sm text-slate-400">Good morning, {user.name}</p>
        <h1 className="text-xl font-semibold text-white">
          {user.role} <span className="text-slate-600">|</span> {workspace.organization}
        </h1>
        <p className="text-sm text-slate-500">{formatTodayDate()}</p>
      </header>

      <section className="space-y-3">
        <SectionTitle>Today&apos;s Focus</SectionTitle>
        <ul className="space-y-2">
          {daily.todayFocus.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm text-slate-300">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {daily.todayKpi.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle>Today&apos;s KPI</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {daily.todayKpi.map((kpi) => (
              <button
                key={kpi.label}
                type="button"
                onClick={() => onAction(kpi.prompt, "Today's KPI")}
                className="rounded-xl border border-white/10 px-3 py-3 text-left transition hover:border-cyan-400/30"
              >
                <p className="text-xs text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{kpi.value}</p>
                <p className="mt-0.5 text-xs">{kpiStatusIcon(kpi.status)}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionTitle>Quick Actions</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {daily.quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onAction(action.prompt, action.contextLabel)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {daily.inbox.unread > 0 ? (
        <section className="space-y-3">
          <SectionTitle>Inbox</SectionTitle>
          <div className="rounded-xl border border-white/10 px-4 py-3">
            <p className="text-sm text-slate-300">{daily.inbox.unread} unread</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500">AI Summary</p>
              {daily.inbox.aiSummary.map((line) => (
                <p key={line} className="text-sm text-slate-400">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {daily.meeting ? (
        <section className="space-y-3">
          <SectionTitle>Today&apos;s Meeting</SectionTitle>
          <div className="rounded-xl border border-white/10 px-4 py-3">
            <p className="text-sm text-slate-400">{daily.meeting.time}</p>
            <p className="mt-1 text-sm font-medium text-slate-200">{daily.meeting.title}</p>
            <ul className="mt-2 space-y-1">
              {daily.meeting.agenda.map((item) => (
                <li key={item} className="text-sm text-slate-500">
                  • {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                onAction(
                  `What is the agenda for ${daily.meeting?.title}?`,
                  daily.meeting?.title ?? "Meeting"
                )
              }
              className="mt-3 text-sm text-cyan-400 hover:text-cyan-300"
            >
              {daily.meeting.linkLabel} ↓
            </button>
          </div>
        </section>
      ) : null}

      {daily.continueWorking.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle>Continue Working</SectionTitle>
          <ul className="space-y-2">
            {daily.continueWorking.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onAction(item.prompt, item.label)}
                  className="flex w-full items-center justify-between py-1.5 text-sm text-slate-300 hover:text-white"
                >
                  <span>{item.label}</span>
                  <span className="text-cyan-400">↓</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {daily.aiSuggestions.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle>Recent AI Suggestions</SectionTitle>
          <ul className="space-y-2">
            {daily.aiSuggestions.map((suggestion) => (
              <li key={suggestion.text}>
                <button
                  type="button"
                  onClick={() => onAction(suggestion.prompt, "AI Suggestion")}
                  className="w-full py-1.5 text-left text-sm text-slate-400 hover:text-slate-200"
                >
                  &ldquo;{suggestion.text}&rdquo;
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {daily.activityFeed.length > 0 ? (
        <section className="space-y-3 border-t border-white/5 pt-6">
          <SectionTitle>Activity</SectionTitle>
          <ul className="space-y-2">
            {daily.activityFeed.map((event) => (
              <li key={`${event.time}-${event.message}`} className="flex gap-3 text-sm">
                <span className="shrink-0 text-slate-600">{event.time}</span>
                <span className="text-slate-400">{event.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
