import { useState, type FormEvent } from "react";
import type { Workspace } from "../types.js";

interface KnowledgeViewProps {
  workspace: Workspace;
  onAsk: (prompt: string, contextLabel: string) => void;
}

export function KnowledgeView({ workspace, onAsk }: KnowledgeViewProps) {
  const [query, setQuery] = useState("");
  const daily = workspace.dailyWorkspace;

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onAsk(`Search knowledge for: ${trimmed}`, "Knowledge Search");
    setQuery("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-8">
      <header>
        <h1 className="text-xl font-semibold text-white">Knowledge</h1>
      </header>

      <form onSubmit={handleSearch} className="space-y-2">
        <label htmlFor="knowledge-search" className="text-xs font-medium tracking-wide text-slate-500">
          Search Knowledge
        </label>
        <input
          id="knowledge-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="SOP, machine manual, QC standard..."
          className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400/40"
        />
      </form>

      {daily.knowledgeRecent.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-wide text-slate-500">Recent</h2>
          <ul className="space-y-1">
            {daily.knowledgeRecent.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onAsk(item.prompt, item.label)}
                  className="w-full py-2 text-left text-sm text-slate-300 hover:text-white"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {daily.knowledgeRecentlyUpdated.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-wide text-slate-500">Recently Updated</h2>
          <ul className="space-y-1">
            {daily.knowledgeRecentlyUpdated.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onAsk(item.prompt, item.label)}
                  className="w-full py-2 text-left text-sm text-slate-400 hover:text-slate-200"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {workspace.status === "no-knowledge" ? (
        <p className="text-sm text-slate-500">
          Upload SOP to activate the AI worker for this workspace.
        </p>
      ) : null}
    </div>
  );
}
