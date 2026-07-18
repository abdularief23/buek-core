import { useEffect, useState, type FormEvent } from "react";
import type { Workspace } from "../types.js";
import {
  fetchBusinessRules,
  fetchConnectors,
  fetchCriticalAlerts,
  fetchKnowledgeDocuments,
  searchKnowledge,
  uploadKnowledgeDocument,
  type BusinessRule,
  type CriticalAlert,
  type KnowledgeDocumentSummary,
  type KnowledgeSearchHit
} from "../lib/data-api.js";

interface KnowledgeViewProps {
  workspace: Workspace;
  onSearch: (query: string) => void;
}

export function KnowledgeView({ workspace, onSearch }: KnowledgeViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [documents, setDocuments] = useState<KnowledgeDocumentSummary[]>([]);
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [connectorLabel, setConnectorLabel] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("sop");
  const [uploadRef, setUploadRef] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const daily = workspace.dailyWorkspace;

  useEffect(() => {
    void Promise.all([
      fetchKnowledgeDocuments(workspace.id),
      fetchBusinessRules(workspace.id),
      fetchCriticalAlerts(workspace.id),
      fetchConnectors(workspace.id)
    ]).then(([docsRes, rulesRes, alertsRes, connRes]) => {
      setDocuments(docsRes.documents);
      setRules(rulesRes.rules);
      setAlerts(alertsRes.alerts);
      setConnectorLabel(connRes.connectors[0]?.label ?? "Operational Connector");
    });
  }, [workspace.id]);

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

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadTitle.trim() || !uploadContent.trim()) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      const result = await uploadKnowledgeDocument({
        workspaceId: workspace.id,
        title: uploadTitle.trim(),
        type: uploadType,
        content: uploadContent.trim(),
        ...(uploadRef.trim() ? { referenceId: uploadRef.trim() } : {})
      });
      setUploadMessage(result.message);
      setUploadTitle("");
      setUploadRef("");
      setUploadContent("");
      const docsRes = await fetchKnowledgeDocuments(workspace.id);
      setDocuments(docsRes.documents);
    } catch {
      setUploadMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setUploadContent(text);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    if (!uploadRef) setUploadRef(file.name);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
    setQuery("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">Knowledge Layer</h1>
        <p className="mt-2 text-base text-slate-400">
          Read-only company knowledge — SOP, manuals, QC. Buek indexes; your files stay in your systems.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Operational data via: {connectorLabel} (read-only)
        </p>
      </header>

      {alerts.length > 0 ? (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-300">
            Critical Alerts — Business Rules
          </h2>
          <p className="mt-1 text-xs text-slate-400">AI tidak menentukan critical. Rule perusahaan yang menentukan.</p>
          <ul className="mt-4 space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="text-sm text-red-100">
                🔴 <strong>{alert.ruleName}</strong> — {alert.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Upload Knowledge (Level 1 MVP)
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Upload → OCR → Chunking → Embedding → Knowledge Base. Supports .txt, .md, .csv (PDF via OCR in production).
        </p>
        <form onSubmit={(e) => void handleUpload(e)} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-400">
              Title
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                placeholder="SOP Printer Maintenance"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Reference ID
              <input
                value={uploadRef}
                onChange={(e) => setUploadRef(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                placeholder="SOP-015"
              />
            </label>
          </div>
          <label className="block text-sm text-slate-400">
            Type
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            >
              <option value="sop">SOP</option>
              <option value="work-instruction">Work Instruction</option>
              <option value="qc-standard">QC Standard</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label className="block text-sm text-slate-400">
            File (.txt, .md, .csv)
            <input
              type="file"
              accept=".txt,.md,.csv,.pdf,text/plain,text/markdown"
              onChange={(e) => void handleFileSelect(e)}
              className="mt-1 w-full text-sm text-slate-400"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Content
            <textarea
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              placeholder="Paste SOP content or upload a text file..."
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            {uploading ? "Indexing..." : "Upload to Knowledge Base"}
          </button>
          {uploadMessage ? <p className="text-sm text-green-400">{uploadMessage}</p> : null}
        </form>
      </section>

      {documents.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Uploaded Documents ({documents.length})
          </h2>
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-white">{doc.title}</p>
                  <p className="text-sm text-slate-500">
                    {doc.type} · {doc.chunkCount} chunks
                    {doc.referenceId ? ` · ${doc.referenceId}` : ""}
                  </p>
                </div>
                <span className="text-xs text-green-400">{doc.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rules.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Business Rules ({rules.length})
          </h2>
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400"
              >
                <span className="font-medium text-white">{rule.name}</span>
                {rule.description ? ` — ${rule.description}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

      {searching ? <p className="text-slate-500">Searching knowledge base...</p> : null}

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
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">Quick Search</h2>
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
    </div>
  );
}
