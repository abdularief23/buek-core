import { AppNav, type AppNavItem } from "@buek/ui";

interface AppShellProps {
  activeView: AppNavItem;
  onNavigate: (view: AppNavItem) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppShell({ activeView, onNavigate, onLogout, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo-mark.svg" alt="" className="h-7 w-7 rounded-lg bg-white p-1" />
          <span className="text-sm text-slate-400">Buek Core</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Sign out
        </button>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="order-2 lg:order-1 lg:w-16 lg:shrink-0 lg:border-r lg:border-white/10 lg:py-4">
          <AppNav active={activeView} onChange={onNavigate} />
        </aside>

        <main className="order-1 flex-1 overflow-y-auto px-4 py-6 lg:order-2 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
