export type AppNavItem = "home" | "ask" | "knowledge" | "workspace" | "settings";

export interface AppNavProps {
  active: AppNavItem;
  onChange: (item: AppNavItem) => void;
}

const items: Array<{ id: AppNavItem; icon: string; label: string }> = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "ask", icon: "💬", label: "Ask Buek" },
  { id: "knowledge", icon: "📚", label: "Knowledge" },
  { id: "workspace", icon: "👤", label: "Workspace" },
  { id: "settings", icon: "⚙", label: "Settings" }
];

export function AppNav({ active, onChange }: AppNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex shrink-0 flex-row items-center justify-around border-t border-white/10 bg-slate-950 px-1 py-2 lg:flex-col lg:justify-start lg:gap-1 lg:border-t-0 lg:bg-transparent lg:px-2 lg:py-4"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          aria-label={item.label}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
          className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[10px] transition lg:w-full lg:px-3 ${
            active === item.id ? "text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-base leading-none">{item.icon}</span>
          <span className="text-center leading-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
