import { AppNav, type AppNavItem } from "@buek/ui";
import { useEffect, useState } from "react";
import type { TenantThemePayload } from "../lib/tenant-theme.js";
import type { DemoUser } from "../types.js";
import { PreferencesMenu } from "./PreferencesMenu.js";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeView]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

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

  function handleNavigate(view: AppNavItem) {
    onNavigate(view);
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell flex min-h-screen w-full">
      <aside className="app-shell-sidebar hidden w-[280px] shrink-0 border-r border-white/5 lg:flex lg:flex-col">
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
        <header className="mobile-app-header flex h-14 shrink-0 items-center gap-3 border-b border-white/5 px-4 lg:h-16 lg:gap-4 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-lg text-white lg:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-base font-semibold text-white">Buek Core</p>
            {tenantTheme ? (
              <p className="truncate text-xs text-slate-500">
                {tenantTheme.emoji} {tenantTheme.label}
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSearchSubmit} className="hidden flex-1 md:block md:max-w-xl lg:flex">
            <input
              name="global-search"
              type="search"
              placeholder="Search factory, machines, SOP, KPI..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white placeholder-slate-500 outline-none focus:border-cyan-400/40"
            />
          </form>

          <div className="ml-auto flex items-center gap-2 lg:gap-3">
            <PreferencesMenu compact />
            <button
              type="button"
              onClick={onOpenInbox}
              className="relative hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white md:inline-flex"
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
              className="hidden text-sm text-slate-500 hover:text-slate-300 sm:inline"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="mobile-app-main flex-1 overflow-y-auto px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div key={activeView} className="buek-view-enter mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>

        <nav className="mobile-bottom-nav app-shell-sidebar fixed inset-x-0 bottom-0 z-30 border-t border-white/10 lg:hidden">
          <AppNav
            active={activeView}
            onChange={handleNavigate}
            onOpenInbox={() => {
              onOpenInbox();
              setMobileMenuOpen(false);
            }}
            inboxCount={inboxCount}
            variant="bottom"
            {...(visibleNavItems ? { visibleItems: visibleNavItems } : {})}
          />
        </nav>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="mobile-nav-drawer app-shell-sidebar absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col border-r border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-white">Menu</p>
                <p className="text-sm text-slate-500">{organization}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <AppNav
              active={activeView}
              onChange={handleNavigate}
              onOpenInbox={() => {
                onOpenInbox();
                setMobileMenuOpen(false);
              }}
              inboxCount={inboxCount}
              variant="drawer"
              {...(visibleNavItems ? { visibleItems: visibleNavItems } : {})}
            />
            <div className="mt-auto border-t border-white/10 p-4">
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-base text-slate-400"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {copilot}
    </div>
  );
}
