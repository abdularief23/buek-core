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
      value: installedModule ? `${installedModule.name} v${installedModule.version}` : "Manufacturing"
    },
    { label: "API", value: "Connected" }
  ];

  return (
    <div className="mx-auto max-w-md space-y-8 pb-8">
      <header>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">{status}</p>
      </header>

      <dl className="space-y-4">
        {settings.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between border-b border-white/5 py-3 text-sm"
          >
            <dt className="text-slate-500">{item.label}</dt>
            <dd className="text-slate-200">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section className="space-y-4 border-t border-white/10 pt-6">
        <h2 className="text-xs font-medium tracking-wide text-slate-500">Profile</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="mt-1 text-slate-200">{user.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Company</dt>
            <dd className="mt-1 text-slate-200">{workspace.organization}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Industry</dt>
            <dd className="mt-1 text-slate-200">{workspace.industry}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-1 text-slate-200">{user.email}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
