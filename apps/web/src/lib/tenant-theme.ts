export interface TenantThemePayload {
  id: string;
  label: string;
  emoji: string;
  industry: string;
  industryLabel: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentMuted: string;
  ring: string;
  gradient: string;
  sopCount: number;
  modules: string[];
  knowledgeTopics: string[];
  defaultUserName: string;
}

export function applyTenantTheme(theme: TenantThemePayload | null | undefined): void {
  const root = document.documentElement;
  if (!theme) {
    root.style.removeProperty("--tenant-primary");
    root.style.removeProperty("--tenant-primary-light");
    root.style.removeProperty("--tenant-accent");
    root.style.removeProperty("--tenant-accent-muted");
    root.style.removeProperty("--tenant-ring");
    return;
  }

  root.style.setProperty("--tenant-primary", theme.primary);
  root.style.setProperty("--tenant-primary-light", theme.primaryLight);
  root.style.setProperty("--tenant-accent", theme.accent);
  root.style.setProperty("--tenant-accent-muted", theme.accentMuted);
  root.style.setProperty("--tenant-ring", theme.ring);
}
