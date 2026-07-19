import { AppNav, type AppNavItem } from "@buek/ui";
import type { TenantThemePayload } from "../lib/tenant-theme.js";
import type { DemoUser } from "../types.js";

interface AppShellProps {
  activeView: AppNavItem;
  user: DemoUser;
  organization: string;
  tenantTheme?: TenantThemePayload | null;
  onNavigate: (view: AppNavItem) => void;
  onOpenInbox: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  inboxCount?: number;
  visibleNavItems?: AppNavItem[];
  children: React.ReactNode;
  copilot?: React.ReactNode;
}

export function AppShell({
  activeView,
  user,
  organization,
  tenantTheme,
  onNavigate,
  onOpenInbox,
  onLogout,
  onSearch,
  inboxCount,
  visibleNavItems,
  children,
  copilot
}: AppShellProps) {
  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("global-search") as HTMLInputElement;
    const query = input.value.trim();
    if (query) {
      onSearch(query);
      input.value = "";
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-white">
      <aside className="hidden w-[280px] shrink-0 border-r border-white/5 bg-slate-950 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <img src="/logo-mark.svg" alt="" className="h-8 w-8 rounded-lg bg-white p-1" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Buek Core</p>
            {tenantTheme ? (
              <p className="truncate text-xs text-tenant">
                {tenantTheme.emoji} {tenantTheme.label} · {tenantTheme.industryLabel}
              </p>
            ) : (
              <p className="text-xs text-slate-500">AI Employee</p>
            )}
          </div>
        </div>
        <AppNav
          active={activeView}
          onChange={onNavigate}
          onOpenInbox={onOpenInbox}
          inboxCount={inboxCount}
          {...(visibleNavItems ? { visibleItems: visibleNavItems } : {})}
        />
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/5 px-4 lg:px-8">
          <img src="/logo-mark.svg" alt="Buek Core" className="h-7 w-7 rounded bg-white p-0.5 lg:hidden" />

          <form onSubmit={handleSearchSubmit} className="hidden flex-1 md:block md:max-w-xl">
            <input
              name="global-search"
              type="search"
              placeholder="Search factory, machines, SOP, KPI..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white placeholder-slate-500 outline-none focus:border-cyan-400/40"
            />
          </form>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenInbox}
              className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Inbox"
            >
              🔔
              {inboxCount && inboxCount > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-slate-950">
                  {inboxCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-base text-slate-300 hover:bg-white/5 sm:flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium">
                {user.name.charAt(0)}
              </span>
              <span className="hidden lg:inline">{user.name}</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <div key={activeView} className="buek-view-enter mx-auto w-full max-w-[1600px]">{children}</div>
        </main>

        <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-slate-950 lg:hidden">
          <AppNav
            active={activeView}
            onChange={onNavigate}
            onOpenInbox={onOpenInbox}
            inboxCount={inboxCount}
          />
        </aside>
      </div>

      {copilot}
    </div>
  );
}
