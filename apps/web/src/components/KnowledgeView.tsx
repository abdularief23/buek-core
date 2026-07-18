import { useState, type FormEvent } from "react";
import type { Workspace } from "../types.js";
import { searchKnowledge, type KnowledgeSearchHit } from "../lib/data-api.js";

interface KnowledgeViewProps {
  workspace: Workspace;
  onSearch: (query: string) => void;
}

export function KnowledgeView({ workspace, onSearch }: KnowledgeViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const daily = workspace.dailyWorkspace;

  async function runSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setSearching(true);
    setLastQuery(trimmed);
    try {
      const data = await searchKnowledge(trimmed, workspace.moduleId, workspace.id);
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
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
        <div className="flex gap-3">
          <input
            id="knowledge-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What are you looking for?"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder-slate-600 outline-none focus:border-cyan-400/40"
          />
          <button
            type="submit"
            disabled={searching}
            className="shrink-0 rounded-2xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </form>

      {searching ? (
        <p className="text-slate-500">Searching knowledge base...</p>
      ) : null}

      {lastQuery && !searching ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Results for &ldquo;{lastQuery}&rdquo;
          </h2>
          {results.length ? (
            <ul className="space-y-3">
              {results.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onSearch(
                        `Explain ${hit.title}${hit.referenceId ? ` (${hit.referenceId})` : ""}: ${lastQuery}`
                      )
                    }
                    className="buek-card w-full rounded-2xl border border-white/10 text-left hover:border-cyan-400/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="buek-card-title text-white">{hit.title}</p>
                      {hit.referenceId ? (
                        <span className="shrink-0 buek-small text-cyan-400">{hit.referenceId}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 buek-small text-slate-500">{hit.excerpt}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No matching knowledge found. Try Ask AI for help.</p>
          )}
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Quick Search
        </h2>
        <div className="flex flex-wrap gap-2">
          {daily.recentSearchCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => void runSearch(category)}
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
