import type { Workspace } from "../types.js";

interface NotificationsViewProps {
  workspace: Workspace;
  onAsk: (prompt: string, contextLabel: string) => void;
}

export function NotificationsView({ workspace, onAsk }: NotificationsViewProps) {
  const notifications = workspace.dailyWorkspace.notifications;

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <header>
        <h1 className="text-xl font-semibold text-white">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">{notifications.length} updates</p>
      </header>

      <ul className="space-y-3">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => onAsk(notification.prompt, notification.category)}
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-left transition hover:border-cyan-400/30"
            >
              <p className="text-xs text-cyan-400/80">{notification.category}</p>
              <p className="mt-1 text-sm text-slate-300">{notification.message}</p>
            </button>
          </li>
        ))}
      </ul>

      {notifications.length === 0 ? (
        <p className="text-sm text-slate-500">No notifications right now.</p>
      ) : null}
    </div>
  );
}
