export type AppNavItem = "home" | "workspace" | "knowledge" | "workflow" | "profile";

export interface AppNavProps {
  active: AppNavItem;
  onChange: (item: AppNavItem) => void;
  onOpenInbox?: () => void;
  inboxCount?: number | undefined;
  visibleItems?: AppNavItem[];
  variant?: "sidebar" | "bottom" | "drawer";
}

const items: Array<{ id: AppNavItem | "inbox"; icon: string; label: string; shortLabel?: string }> = [
  { id: "home", icon: "🏠", label: "Home", shortLabel: "Home" },
  { id: "workspace", icon: "🧠", label: "AI Workspace", shortLabel: "AI" },
  { id: "knowledge", icon: "📚", label: "Knowledge", shortLabel: "Knowledge" },
  { id: "workflow", icon: "⚡", label: "Workflow", shortLabel: "Workflow" },
  { id: "inbox", icon: "🔔", label: "Inbox", shortLabel: "Inbox" },
  { id: "profile", icon: "👤", label: "Me", shortLabel: "Me" }
];

const bottomNavOrder: Array<AppNavItem | "inbox"> = ["home", "workspace", "workflow", "inbox", "profile"];

export function AppNav({
  active,
  onChange,
  onOpenInbox,
  inboxCount = 0,
  visibleItems,
  variant = "sidebar"
}: AppNavProps) {
  const filtered = visibleItems
    ? items.filter((item) => item.id === "inbox" || visibleItems.includes(item.id as AppNavItem))
    : items;

  const navItems =
    variant === "bottom"
      ? bottomNavOrder
          .map((id) => filtered.find((item) => item.id === id))
          .filter((item): item is (typeof items)[number] => Boolean(item))
      : filtered;

  if (variant === "bottom") {
    return (
      <nav
        aria-label="Main navigation"
        className="flex h-16 w-full items-stretch justify-around px-1 safe-area-pb"
      >
        {navItems.map((item) => {
          const isInbox = item.id === "inbox";
          const isActive = !isInbox && active === item.id;

          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => (isInbox ? onOpenInbox?.() : onChange(item.id as AppNavItem))}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition ${
                isActive ? "text-cyan-400" : "text-slate-500"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="truncate text-[11px] font-medium">{item.shortLabel ?? item.label}</span>
              {isInbox && inboxCount > 0 ? (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-slate-950">
                  {inboxCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main navigation"
      className={`flex w-full flex-col gap-1 ${variant === "drawer" ? "px-2 py-4" : "h-full px-4 py-8"}`}
    >
      {navItems.map((item) => {
        const isInbox = item.id === "inbox";
        const isActive = !isInbox && active === item.id;

        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => (isInbox ? onOpenInbox?.() : onChange(item.id as AppNavItem))}
            className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-base transition ${
              isActive
                ? "bg-white/10 font-semibold text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
            {isInbox && inboxCount > 0 ? (
              <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-xs font-bold text-slate-950">
                {inboxCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
