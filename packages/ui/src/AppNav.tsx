export type AppNavItem = "home" | "workspace" | "knowledge" | "workflow" | "profile";

export interface AppNavProps {
  active: AppNavItem;
  onChange: (item: AppNavItem) => void;
  onOpenInbox?: () => void;
  inboxCount?: number | undefined;
}

const items: Array<{ id: AppNavItem | "inbox"; icon: string; label: string }> = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "workspace", icon: "🧠", label: "AI Workspace" },
  { id: "knowledge", icon: "📚", label: "Knowledge" },
  { id: "workflow", icon: "⚡", label: "Workflow" },
  { id: "inbox", icon: "🔔", label: "Inbox" },
  { id: "profile", icon: "👤", label: "Me" }
];

export function AppNav({ active, onChange, onOpenInbox, inboxCount = 0 }: AppNavProps) {
  return (
    <nav aria-label="Main navigation" className="flex h-full w-full flex-col gap-1 px-4 py-8">
      {items.map((item) => {
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
            className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base transition ${
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
