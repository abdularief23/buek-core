import type { ModuleSummary } from "../types.js";

interface SettingsViewProps {
  status: string;
  installedModule?: ModuleSummary | undefined;
}

export function SettingsView({ status, installedModule }: SettingsViewProps) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-lg font-medium text-slate-200">Settings</h2>
      <p className="text-sm text-slate-500">{status}</p>
      {installedModule ? (
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-slate-500">Module</dt>
            <dd className="mt-1 text-slate-200">{installedModule.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Version</dt>
            <dd className="mt-1 text-slate-200">{installedModule.version}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
