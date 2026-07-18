import type { DemoUser, ModuleSummary, Workspace } from "../types.js";

interface ProfileViewProps {
  workspace: Workspace;
  user: DemoUser;
  installedModule?: ModuleSummary | undefined;
  status?: string;
}

export function ProfileView({ workspace, user, installedModule, status }: ProfileViewProps) {
  const totalDocuments = workspace.documentStats.reduce((sum, item) => sum + item.count, 0);

  const settings = [
    { label: "AI Provider", value: workspace.aiProvider },
    { label: "Knowledge Sync", value: workspace.lastSync },
    { label: "Notifications", value: "Enabled" },
    { label: "Connected Systems", value: installedModule ? `${installedModule.name} v${installedModule.version}` : workspace.moduleId },
    { label: "API", value: "Connected" }
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-12 pb-16">
      <header>
        <h1 className="buek-heading text-white">Me</h1>
        <p className="mt-3 buek-body text-slate-400">Your workspace identity and settings.</p>
      </header>

      <div className="flex items-center gap-5 rounded-2xl border border-white/10 px-6 py-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-2xl font-semibold text-cyan-300">
          {user.name.charAt(0)}
        </span>
        <div>
          <p className="buek-card-title text-white">{user.name}</p>
          <p className="buek-subtitle text-slate-400">{user.email}</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="buek-card-title text-slate-400">Profile</h2>
        <dl className="divide-y divide-white/5 rounded-2xl border border-white/10">
          {[
            ["Company", workspace.organization],
            ["Industry", workspace.industry],
            ["Role", user.role],
            ["Plant", workspace.plant],
            ["Shift", workspace.shift],
            ["Knowledge", `${totalDocuments} documents`],
            ["Installed Modules", installedModule?.name ?? workspace.moduleId],
            ["Last Sync", workspace.lastSync]
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-6 py-4 buek-body">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-slate-200">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="buek-card-title text-slate-400">Settings</h2>
        {status ? <p className="buek-small text-slate-500">{status}</p> : null}
        <dl className="divide-y divide-white/5 rounded-2xl border border-white/10">
          {settings.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-6 py-4 buek-body">
              <dt className="text-slate-500">{item.label}</dt>
              <dd className="text-slate-200">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
