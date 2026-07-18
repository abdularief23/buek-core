import { AppNav, type AppNavItem } from "@buek/ui";
import type { DemoUser, Workspace } from "../types.js";

interface AppShellProps {
  activeView: AppNavItem;
  workspace: Workspace;
  user: DemoUser;
  onNavigate: (view: AppNavItem) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppShell({
  activeView,
  workspace,
  user,
  onNavigate,
  onLogout,
  children
}: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col lg:max-w-5xl">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <img src="/logo-mark.svg" alt="" className="h-8 w-8 rounded-lg bg-white p-1" />
          <span className="text-sm font-medium text-slate-300">Buek Core</span>
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
        <aside className="order-2 lg:order-1 lg:w-44 lg:shrink-0 lg:border-r lg:border-white/10 lg:p-4">
          <AppNav active={activeView} onChange={onNavigate} />
          <div className="mt-4 hidden px-2 lg:block">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Signed in</p>
            <p className="mt-1 text-xs text-slate-300">{user.name}</p>
            <p className="text-[10px] text-slate-500">{workspace.organization}</p>
          </div>
        </aside>

        <main className="order-1 flex-1 overflow-y-auto px-4 py-6 lg:order-2 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
