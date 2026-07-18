import { Button } from "@buek/ui";
import { useEffect, useState } from "react";

interface ModuleSummary {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
}

interface ModulesResponse {
  registry: {
    modules: ModuleSummary[];
  };
  discoveryErrors: Array<{
    moduleName: string;
    reason: string;
  }>;
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const modulesEndpoint = `${configuredApiUrl}/api/modules`;

export function App() {
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [status, setStatus] = useState("Loading installed modules...");

  useEffect(() => {
    fetch(modulesEndpoint)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API responded with ${response.status}`);
        }

        return (await response.json()) as ModulesResponse;
      })
      .then((data) => {
        setModules(data.registry.modules);
        setStatus(
          data.discoveryErrors.length
            ? "Module registry loaded with discovery warnings."
            : "Module registry loaded."
        );
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Unable to load module registry.");
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Buek Core
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Build AI Workers for Any Industry
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Buek Core separates reusable AI reasoning from modular industry knowledge. Manufacturing
            is the first vertical, installed as a domain plugin instead of hard-coded platform
            logic.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button>AI Core</Button>
            <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              Manufacturing Plugin
            </Button>
          </div>
        </div>

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Installed domain modules</h2>
              <p className="mt-1 text-sm text-slate-400">{status}</p>
            </div>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
              {modules.length} active
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {modules.map((module) => (
              <article
                key={module.id}
                className="rounded-xl border border-white/10 bg-slate-900 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{module.name}</h3>
                  <span className="text-xs text-slate-400">v{module.version}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
