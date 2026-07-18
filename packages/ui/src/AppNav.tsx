export type AppNavItem = "home" | "workspace" | "knowledge" | "workflow" | "profile" | "settings";

export interface AppNavProps {
  active: AppNavItem;
  onChange: (item: AppNavItem) => void;
  onOpenNotifications?: () => void;
  notificationCount?: number | undefined;
}

const items: Array<{ id: AppNavItem | "notifications"; icon: string; label: string }> = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "workspace", icon: "🧠", label: "AI Workspace" },
  { id: "knowledge", icon: "📚", label: "Knowledge" },
  { id: "workflow", icon: "🔄", label: "Workflow" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "profile", icon: "👤", label: "Profile" },
  { id: "settings", icon: "⚙", label: "Settings" }
];

export function AppNav({ active, onChange, onOpenNotifications, notificationCount = 0 }: AppNavProps) {
  return (
    <nav aria-label="Main navigation" className="flex h-full w-full flex-col gap-1 px-3 py-6">
      {items.map((item) => {
        const isNotifications = item.id === "notifications";
        const isActive = !isNotifications && active === item.id;

        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() =>
              isNotifications ? onOpenNotifications?.() : onChange(item.id as AppNavItem)
            }
            className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              isActive
                ? "bg-white/10 font-medium text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
            {isNotifications && notificationCount > 0 ? (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-semibold text-slate-950">
                {notificationCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
