export type AppNavItem = "home" | "knowledge" | "notifications" | "settings";

export interface AppNavProps {
  active: AppNavItem;
  onChange: (item: AppNavItem) => void;
  notificationCount?: number | undefined;
}

const items: Array<{ id: AppNavItem; icon: string; label: string }> = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "knowledge", icon: "📚", label: "Knowledge" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "settings", icon: "⚙", label: "Settings" }
];

export function AppNav({ active, onChange, notificationCount = 0 }: AppNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="group/nav flex shrink-0 flex-row items-center justify-around border-t border-white/10 bg-slate-950 px-1 py-2 lg:w-14 lg:flex-col lg:justify-start lg:gap-2 lg:border-t-0 lg:bg-transparent lg:px-0 lg:py-6"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          aria-label={item.label}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
          className={`relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] transition lg:w-full lg:px-2 ${
            active === item.id ? "text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-lg leading-none">{item.icon}</span>
          <span className="text-center leading-tight lg:hidden">{item.label}</span>
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 opacity-0 shadow-lg transition group-hover/nav:lg:block group-hover/nav:lg:opacity-100">
            {item.label}
          </span>
          {item.id === "notifications" && notificationCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-medium text-slate-950 lg:right-0 lg:top-0">
              {notificationCount}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
