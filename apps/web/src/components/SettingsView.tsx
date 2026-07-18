import type { DemoUser, ModuleSummary, Workspace } from "../types.js";

interface SettingsViewProps {
  workspace: Workspace;
  user: DemoUser;
  status: string;
  installedModule?: ModuleSummary | undefined;
}

export function SettingsView({ workspace, user, status, installedModule }: SettingsViewProps) {
  const settings = [
    { label: "AI Provider", value: workspace.aiProvider },
    { label: "Knowledge Sync", value: workspace.lastSync },
    { label: "Notifications", value: "Enabled" },
    { label: "Role", value: user.role },
    {
      label: "Connected Systems",
      value: installedModule
        ? `${installedModule.name} v${installedModule.version}`
        : "Manufacturing Module"
    },
    { label: "API", value: "Connected" }
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-base text-slate-400">{status}</p>
      </header>

      <dl className="divide-y divide-white/5 rounded-2xl border border-white/10">
        {settings.map((item) => (
          <div key={item.label} className="flex items-center justify-between px-6 py-4">
            <dt className="text-base text-slate-400">{item.label}</dt>
            <dd className="text-base text-slate-200">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
