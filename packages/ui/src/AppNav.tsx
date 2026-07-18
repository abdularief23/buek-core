export type AppNavItem = "home" | "workspace" | "settings";

export interface AppNavProps {
  active: AppNavItem;
  onChange: (item: AppNavItem) => void;
}

const items: Array<{ id: AppNavItem; icon: string; label: string }> = [
  { id: "home", icon: "💬", label: "Home" },
  { id: "workspace", icon: "📂", label: "Workspace" },
  { id: "settings", icon: "⚙", label: "Settings" }
];

export function AppNav({ active, onChange }: AppNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex shrink-0 flex-row items-center justify-around border-t border-white/5 bg-slate-950 px-1 py-1 lg:w-14 lg:flex-col lg:justify-start lg:gap-1 lg:border-t-0 lg:border-r lg:bg-transparent lg:py-3"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          aria-label={item.label}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
          className={`rounded-lg p-2.5 text-lg transition ${
            active === item.id ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-400"
          }`}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
}
