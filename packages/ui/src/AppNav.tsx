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
      className="flex shrink-0 flex-row items-center justify-around gap-1 border-t border-white/10 bg-slate-950/95 px-2 py-2 lg:flex-col lg:justify-start lg:gap-2 lg:border-t-0 lg:border-r lg:bg-transparent lg:px-0 lg:py-2"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          aria-label={item.label}
          onClick={() => onChange(item.id)}
          className={`flex flex-col items-center rounded-xl px-3 py-2 text-[10px] transition lg:w-full lg:px-3 lg:py-2.5 ${
            active === item.id
              ? "bg-cyan-400/15 text-cyan-200"
              : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
          }`}
        >
          <span className="text-lg leading-none">{item.icon}</span>
          <span className="mt-1 hidden lg:inline">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
