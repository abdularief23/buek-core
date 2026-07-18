import { SurfaceCard } from "@buek/ui";
import type { ModuleSummary } from "../types.js";

interface SettingsViewProps {
  status: string;
  installedModule?: ModuleSummary | undefined;
}

export function SettingsView({ status, installedModule }: SettingsViewProps) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-slate-400">{status}</p>
      </header>

      <SurfaceCard title="Installed Module">
        <p className="font-medium text-slate-100">{installedModule?.name ?? "Loading..."}</p>
        <p className="mt-1 text-sm text-slate-400">{installedModule?.description}</p>
        {installedModule?.capabilities.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {installedModule.capabilities.map((capability) => (
              <span key={capability} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">
                {capability}
              </span>
            ))}
          </div>
        ) : null}
      </SurfaceCard>
    </div>
  );
}
