import { AppNav, type AppNavItem } from "@buek/ui";

interface AppShellProps {
  activeView: AppNavItem;
  onNavigate: (view: AppNavItem) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppShell({ activeView, onNavigate, onLogout, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl">
      <aside className="hidden shrink-0 border-r border-white/5 lg:block">
        <AppNav active={activeView} onChange={onNavigate} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-3 lg:px-8">
          <img src="/logo-mark.svg" alt="Buek Core" className="h-6 w-6 rounded bg-white p-0.5" />
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-slate-600 hover:text-slate-400"
          >
            Sign out
          </button>
        </header>

        <main className="flex-1 px-4 pb-20 lg:px-8 lg:pb-8">{children}</main>

        <aside className="fixed inset-x-0 bottom-0 border-t border-white/5 bg-slate-950 lg:hidden">
          <AppNav active={activeView} onChange={onNavigate} />
        </aside>
      </div>
    </div>
  );
}
