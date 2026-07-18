import { useState, type FormEvent } from "react";
import type { Workspace } from "../types.js";

interface KnowledgeViewProps {
  workspace: Workspace;
  onSearch: (query: string) => void;
}

export function KnowledgeView({ workspace, onSearch }: KnowledgeViewProps) {
  const [query, setQuery] = useState("");
  const daily = workspace.dailyWorkspace;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed);
    setQuery("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">Knowledge</h1>
        <p className="mt-2 text-base text-slate-400">
          Search company knowledge — SOP, manuals, QC, drawings, meeting notes.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="knowledge-search" className="text-sm font-medium text-slate-400">
          Search Company Knowledge
        </label>
        <input
          id="knowledge-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What are you looking for?"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder-slate-600 outline-none focus:border-cyan-400/40"
        />
      </form>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Recent Searches
        </h2>
        <div className="flex flex-wrap gap-2">
          {daily.recentSearchCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onSearch(`Search knowledge for: ${category}`)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {daily.knowledgeRecent.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">Recent</h2>
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
            {daily.knowledgeRecent.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSearch(item.prompt)}
                  className="w-full px-6 py-4 text-left text-base text-slate-300 hover:bg-white/[0.02] hover:text-white"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {workspace.status === "no-knowledge" ? (
        <p className="text-base text-slate-500">
          Upload SOP to activate company knowledge for this workspace.
        </p>
      ) : null}
    </div>
  );
}
