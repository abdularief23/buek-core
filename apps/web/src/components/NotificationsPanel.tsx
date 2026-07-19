import { useEffect, useState } from "react";
import { fetchNotifications, type NotificationItem } from "../lib/data-api.js";
import { notificationToWorkspace } from "../lib/notification-routing.js";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";

interface NotificationsPanelProps {
  workspaceSlug: string;
  open: boolean;
  onClose: () => void;
  onSelect: (prompt: string, contextLabel: string) => void;
  onOpenWorkspace?: (workspace: DynamicWorkspaceState) => void;
  onCountChange?: (count: number) => void;
}

const categoryIcon: Record<string, string> = {
  "Machine Alarm": "🔴",
  Quality: "🟠",
  Production: "🟢",
  Meeting: "📅",
  Email: "📩",
  "New SOP": "📄",
  Approval: "📋",
  Safety: "⚠️"
};

export function NotificationsPanel({
  workspaceSlug,
  open,
  onClose,
  onSelect,
  onOpenWorkspace,
  onCountChange
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications(workspaceSlug)
      .then((data) => {
        setNotifications(data.notifications);
        onCountChange?.(data.notifications.length);
      })
      .catch(() => setNotifications([]));
  }, [workspaceSlug, onCountChange]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchNotifications(workspaceSlug)
      .then((data) => {
        setNotifications(data.notifications);
        onCountChange?.(data.notifications.length);
      })
      .finally(() => setLoading(false));
  }, [open, workspaceSlug, onCountChange]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {loading ? (
          <p className="px-6 py-8 text-center text-slate-500">Loading...</p>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-white/5">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => {
                    const ws = notificationToWorkspace(workspaceSlug, notification);
                    if (ws && onOpenWorkspace) {
                      onOpenWorkspace(ws);
                      onClose();
                    } else {
                      onSelect(notification.prompt, notification.category);
                      onClose();
                    }
                  }}
                  className="w-full px-6 py-4 text-left transition hover:bg-white/[0.03]"
                >
                  <p className="text-sm">
                    {categoryIcon[notification.category] ?? "🔔"}{" "}
                    <span className="text-slate-500">{notification.category}</span>
                    <span className="ml-2 font-mono text-xs text-slate-600">{notification.time}</span>
                  </p>
                  <p className="mt-1 text-base text-slate-200">{notification.message}</p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && notifications.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-500">No notifications.</p>
        ) : null}
      </aside>
    </>
  );
}
