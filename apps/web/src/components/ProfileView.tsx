import type { DemoUser, ModuleSummary, Workspace } from "../types.js";

interface ProfileViewProps {
  workspace: Workspace;
  user: DemoUser;
  installedModule?: ModuleSummary | undefined;
}

export function ProfileView({ workspace, user, installedModule }: ProfileViewProps) {
  const totalDocuments = workspace.documentStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">Profile</h1>
        <p className="mt-2 text-base text-slate-400">Your workspace identity and access.</p>
      </header>

      <div className="flex items-center gap-4 rounded-2xl border border-white/10 px-6 py-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20 text-xl font-semibold text-cyan-300">
          {user.name.charAt(0)}
        </span>
        <div>
          <p className="text-lg font-medium text-white">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </div>

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
          <div key={label} className="flex items-center justify-between px-6 py-4 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
