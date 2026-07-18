export type AppNavItem = "home" | "chat" | "workspace" | "settings";

export interface AppNavProps {
  active: AppNavItem;
  onChange: (item: AppNavItem) => void;
}

const items: Array<{ id: AppNavItem; icon: string; label: string }> = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "chat", icon: "💬", label: "AI" },
  { id: "workspace", icon: "📂", label: "Workspace" },
  { id: "settings", icon: "⚙", label: "Settings" }
];

export function AppNav({ active, onChange }: AppNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex shrink-0 flex-row items-center justify-around gap-1 border-t border-white/10 bg-slate-950/90 px-2 py-2 lg:flex-col lg:justify-start lg:border-t-0 lg:border-r lg:bg-transparent lg:px-0 lg:py-0"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          onClick={() => onChange(item.id)}
          className={`flex flex-col items-center rounded-xl px-3 py-2 text-xs transition lg:w-full lg:flex-row lg:gap-3 lg:px-4 lg:py-2.5 lg:text-sm ${
            active === item.id
              ? "bg-cyan-400/15 font-medium text-cyan-200"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
        >
          <span className="text-base lg:text-sm">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
