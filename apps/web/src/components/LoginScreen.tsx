import { Button } from "@buek/ui";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { applyTenantTheme } from "../lib/tenant-theme.js";
import {
  type AppearanceMode,
  type AppLanguage,
  getAppearanceMode,
  getAppLanguage,
  LANGUAGE_LABELS,
  setAppearanceMode,
  setAppLanguage
} from "../lib/user-preferences.js";
import type { DemoWorkspaceOption } from "../types.js";

interface LoginScreenProps {
  loginError: string | null;
  onProductionSignIn: (email: string, password: string) => Promise<void>;
  onDemoLaunch: (workspaceId: string, role: string) => Promise<void>;
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const demoOptionsEndpoint = `${configuredApiUrl}/api/auth/demo-options`;

const LOGIN_COPY = {
  id: {
    tagline: "Satu AI Core. Pengetahuan Industri Tanpa Batas.",
    production: "Produksi",
    email: "Email",
    password: "Kata Sandi",
    signIn: "Masuk",
    demoIndustry: "🌍 Demo Industri",
    demoHint: "Pilih tenant — yang berubah bukan nama, tetapi seluruh dunia AI.",
    role: "Peran",
    launchDemo: "Luncurkan Demo",
    comingSoon: "Segera Hadir",
    appearance: "Tampilan",
    language: "Bahasa",
    aiUnderstands: "AI memahami"
  },
  en: {
    tagline: "One AI Core. Unlimited Industry Knowledge.",
    production: "Production",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    demoIndustry: "🌍 Demo Industry",
    demoHint: "Pick a tenant — what changes is not the name, but the entire AI world.",
    role: "Role",
    launchDemo: "Launch Demo",
    comingSoon: "Coming Soon",
    appearance: "Appearance",
    language: "Language",
    aiUnderstands: "AI understands"
  },
  ja: {
    tagline: "ひとつのAIコア。無限の産業知識。",
    production: "本番",
    email: "メール",
    password: "パスワード",
    signIn: "サインイン",
    demoIndustry: "🌍 デモ産業",
    demoHint: "テナントを選ぶ — 変わるのは名前ではなく、AIの世界全体です。",
    role: "役割",
    launchDemo: "デモを起動",
    comingSoon: "近日公開",
    appearance: "表示",
    language: "言語",
    aiUnderstands: "AIが理解"
  }
} as const;

const fallbackWorkspaces: DemoWorkspaceOption[] = [
  {
    id: "epson-factory",
    label: "Epson Indonesia",
    emoji: "🏭",
    industry: "Printer Manufacturing",
    sopCount: 532,
    modules: ["Manufacturing", "Quality", "Maintenance"],
    theme: {
      id: "epson-factory",
      label: "Epson Indonesia",
      emoji: "🏭",
      industry: "Printer Manufacturing",
      industryLabel: "Manufacturing Printer",
      primary: "#2563eb",
      primaryLight: "#3b82f6",
      accent: "#60a5fa",
      accentMuted: "rgba(37, 99, 235, 0.15)",
      ring: "rgba(37, 99, 235, 0.4)",
      gradient: "from-blue-600/20 to-blue-900/10",
      sopCount: 532,
      modules: ["Manufacturing", "Quality", "Maintenance"],
      knowledgeTopics: ["Print Head", "Ink", "White Streak"],
      defaultUserName: "Abdul",
      primaryIssueKey: "white-streak"
    }
  },
  {
    id: "toyota-plant",
    label: "Toyota Indonesia",
    emoji: "🚗",
    industry: "Automotive Manufacturing",
    sopCount: 861,
    modules: ["Manufacturing", "Quality", "Maintenance", "Logistics"],
    theme: {
      id: "toyota-plant",
      label: "Toyota Indonesia",
      emoji: "🚗",
      industry: "Automotive",
      industryLabel: "Automotive Manufacturing",
      primary: "#dc2626",
      primaryLight: "#ef4444",
      accent: "#f87171",
      accentMuted: "rgba(220, 38, 38, 0.15)",
      ring: "rgba(220, 38, 38, 0.4)",
      gradient: "from-red-600/20 to-red-900/10",
      sopCount: 861,
      modules: ["Manufacturing", "Quality", "Maintenance", "Logistics"],
      knowledgeTopics: ["Torque", "Engine", "Welding"],
      defaultUserName: "Sari",
      primaryIssueKey: "torque-drift"
    }
  },
  {
    id: "nestle-factory",
    label: "Nestlé Indonesia",
    emoji: "🥛",
    industry: "Food Manufacturing",
    sopCount: 742,
    modules: ["Manufacturing", "Quality", "Food Safety", "Compliance"],
    theme: {
      id: "nestle-factory",
      label: "Nestlé Indonesia",
      emoji: "🥛",
      industry: "Food Manufacturing",
      industryLabel: "Food Manufacturing",
      primary: "#16a34a",
      primaryLight: "#22c55e",
      accent: "#4ade80",
      accentMuted: "rgba(22, 163, 74, 0.15)",
      ring: "rgba(22, 163, 74, 0.4)",
      gradient: "from-green-600/20 to-green-900/10",
      sopCount: 742,
      modules: ["Manufacturing", "Quality", "Food Safety", "Compliance"],
      knowledgeTopics: ["HACCP", "CCP", "Food Safety"],
      defaultUserName: "Budi",
      primaryIssueKey: "metal-detector"
    }
  }
];

const fallbackComingSoon: DemoWorkspaceOption[] = [
  { id: "siemens", label: "Siemens", emoji: "⚙️", industry: "Industrial Automation", available: false },
  { id: "buek-website", label: "Buek Website", emoji: "🌐", industry: "Website Builder", available: false }
];

const fallbackRoles = ["Operator", "Engineer", "Supervisor", "Plant Manager"];

export function LoginScreen({ loginError, onProductionSignIn, onDemoLaunch }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaces, setWorkspaces] = useState<DemoWorkspaceOption[]>(fallbackWorkspaces);
  const [comingSoon, setComingSoon] = useState<DemoWorkspaceOption[]>(fallbackComingSoon);
  const [roles, setRoles] = useState<string[]>(fallbackRoles);
  const [selectedWorkspace, setSelectedWorkspace] = useState("epson-factory");
  const [selectedRole, setSelectedRole] = useState("Engineer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceMode>(getAppearanceMode());
  const [language, setLanguage] = useState<AppLanguage>(getAppLanguage());

  const copy = LOGIN_COPY[language];

  const selectedTheme = useMemo(
    () => workspaces.find((ws) => ws.id === selectedWorkspace)?.theme ?? null,
    [workspaces, selectedWorkspace]
  );

  useEffect(() => {
    applyTenantTheme(selectedTheme);
    return () => applyTenantTheme(null);
  }, [selectedTheme]);

  useEffect(() => {
    fetch(demoOptionsEndpoint)
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as {
          workspaces: DemoWorkspaceOption[];
          comingSoon?: DemoWorkspaceOption[];
          roles: string[];
        };
        if (data.workspaces.length) setWorkspaces(data.workspaces);
        if (data.comingSoon?.length) setComingSoon(data.comingSoon);
        if (data.roles.length) setRoles(data.roles);
      })
      .catch(() => undefined);
  }, []);

  async function handleProductionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onProductionSignIn(email, password);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLaunch() {
    setIsSubmitting(true);
    try {
      await onDemoLaunch(selectedWorkspace, selectedRole);
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectWorkspace(workspace: DemoWorkspaceOption) {
    if (workspace.available === false) return;
    setSelectedWorkspace(workspace.id);
    if (workspace.theme) applyTenantTheme(workspace.theme);
  }

  return (
    <section className="login-page mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="login-preferences mb-8 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium tracking-wide text-slate-500">{copy.appearance}</legend>
          {(
            [
              ["light", "Light"],
              ["dark", "Dark"],
              ["system", "Auto"]
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5"
            >
              <input
                type="radio"
                name="login-appearance"
                checked={appearance === value}
                onChange={() => {
                  setAppearance(value);
                  setAppearanceMode(value);
                }}
                className="tenant-accent"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium tracking-wide text-slate-500">{copy.language}</legend>
          {(["id", "en", "ja"] as const).map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5"
            >
              <input
                type="radio"
                name="login-language"
                checked={language === value}
                onChange={() => {
                  setLanguage(value);
                  setAppLanguage(value);
                }}
                className="tenant-accent"
              />
              {LANGUAGE_LABELS[value]}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="text-center">
        <img src="/logo-mark.svg" alt="" className="login-logo mx-auto h-14 w-14 rounded-2xl bg-white p-2" />
        <h1 className="mt-6 text-2xl font-semibold">Buek Core</h1>
        <p className="mt-2 text-sm text-slate-500">{copy.tagline}</p>
      </div>

      <form onSubmit={handleProductionSubmit} className="mt-10 space-y-4">
        <p className="text-xs font-medium tracking-wide text-slate-500">{copy.production}</p>
        <label className="block text-sm text-slate-400">
          {copy.email}
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            className="tenant-input login-input mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10"
          />
        </label>
        <label className="block text-sm text-slate-400">
          {copy.password}
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            className="tenant-input login-input mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10"
          />
        </label>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="login-primary-btn w-full bg-white text-slate-950 hover:bg-slate-200"
        >
          {copy.signIn}
        </Button>
      </form>

      <div className="my-8 border-t border-white/10" />

      <div className="space-y-5">
        <p className="text-xs font-medium tracking-wide text-slate-500">{copy.demoIndustry}</p>
        <p className="text-sm text-slate-400">{copy.demoHint}</p>

        <div className="space-y-3">
          {workspaces.map((workspace) => {
            const active = selectedWorkspace === workspace.id;
            const theme = workspace.theme;
            return (
              <button
                key={workspace.id}
                type="button"
                onClick={() => selectWorkspace(workspace)}
                className={`login-card w-full rounded-2xl border p-4 text-left transition ${
                  active
                    ? "tenant-card-active border-[var(--tenant-primary)] bg-[var(--tenant-accent-muted)]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
                style={
                  active && theme
                    ? { borderColor: theme.primary, backgroundColor: theme.accentMuted }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{workspace.emoji ?? "🏢"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: theme?.primary ?? "#0891b2" }}
                      />
                      <p className="font-semibold text-white">{workspace.label}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{workspace.industry}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{workspace.sopCount ?? 0} SOP</span>
                      <span>·</span>
                      <span>{(workspace.modules ?? []).join(" · ")}</span>
                    </div>
                    {workspace.knowledgeTopics?.length ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {copy.aiUnderstands}: {workspace.knowledgeTopics.slice(0, 5).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-lg text-slate-500">{active ? "◉" : "◯"}</span>
                </div>
              </button>
            );
          })}

          {comingSoon.map((workspace) => (
            <div
              key={workspace.id}
              className="login-card w-full rounded-2xl border border-dashed border-white/10 p-4 opacity-50"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{workspace.emoji ?? "🏢"}</span>
                <div>
                  <p className="font-semibold text-slate-400">{workspace.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{workspace.industry}</p>
                  <p className="mt-2 text-xs text-slate-600">{copy.comingSoon}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm text-slate-400">{copy.role}</legend>
          {roles.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5"
            >
              <input
                type="radio"
                name="demo-role"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="tenant-accent"
              />
              {role}
            </label>
          ))}
        </fieldset>

        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleDemoLaunch()}
          className="tenant-button login-launch-btn w-full border text-white hover:opacity-90"
          style={
            selectedTheme
              ? {
                  borderColor: selectedTheme.primary,
                  backgroundColor: selectedTheme.accentMuted,
                  color: selectedTheme.accent
                }
              : undefined
          }
        >
          {copy.launchDemo} — {workspaces.find((w) => w.id === selectedWorkspace)?.label}
        </Button>
      </div>

      {loginError ? <p className="mt-6 text-center text-sm text-red-400">{loginError}</p> : null}
    </section>
  );
}
