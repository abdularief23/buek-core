import { LoadingState } from "@buek/ui";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Workspace } from "../types.js";
import {
  fetchBusinessRules,
  fetchCompanyBrain,
  fetchConnectors,
  fetchCriticalAlerts,
  fetchKnowledgeDocuments,
  fetchLessonsLearned,
  searchKnowledge,
  uploadKnowledgeDocument,
  uploadKnowledgeFiles,
  type BusinessRule,
  type CompanyBrainMachineNode,
  type CriticalAlert,
  type KnowledgeDocumentSummary,
  type KnowledgeSearchHit,
  type LessonLearned
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
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [brain, setBrain] = useState<CompanyBrainMachineNode[]>([]);
  const [expandedMachine, setExpandedMachine] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const daily = workspace.dailyWorkspace;

  const supportedFormats = "PDF · Word (.docx) · Excel (.xlsx) · Text · Markdown · CSV";

  const knowledgeCategories = [
    "Policies",
    "SOP",
    "Work Instruction",
    "Drawing",
    "Checklist",
    "Training",
    "Manual",
    "Lessons Learned"
  ];

  const importSources = [
    { id: "folder", label: "Upload Folder", hint: "PDF, Word, Excel, TXT" },
    { id: "pdf", label: "PDF Documents", hint: ".pdf" },
    { id: "word", label: "Word Documents", hint: ".docx" },
    { id: "excel", label: "Excel Spreadsheets", hint: ".xlsx" }
  ] as const;

  useEffect(() => {
    setLoading(true);
    void Promise.all([
      fetchKnowledgeDocuments(workspace.id),
      fetchBusinessRules(workspace.id),
      fetchCriticalAlerts(workspace.id),
      fetchConnectors(workspace.id),
      fetchLessonsLearned(workspace.id),
      fetchCompanyBrain(workspace.id)
    ])
      .then(([docsRes, rulesRes, alertsRes, connRes, lessonsRes, brainRes]) => {
        setDocuments(docsRes.documents);
        setRules(rulesRes.rules);
        setAlerts(alertsRes.alerts);
        setConnectorLabel(connRes.connectors[0]?.label ?? "Operational Connector");
        setLessons(lessonsRes.lessons);
        setBrain(brainRes.machines);
      })
      .finally(() => setLoading(false));
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

  async function handleBatchUpload(files: FileList | File[] | null, label: string) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadMessage(null);
    setBatchProgress(`${label}: 0/${files.length}`);
    try {
      const result = await uploadKnowledgeFiles(workspace.id, files);
      setUploadMessage(result.message);
      if (result.errors.length) {
        setUploadMessage(
          `${result.message} Errors: ${result.errors.map((e) => e.fileName).join(", ")}`
        );
      }
      setBatchProgress(`${label}: ${result.documents.length}/${files.length} indexed`);
      const docsRes = await fetchKnowledgeDocuments(workspace.id);
      setDocuments(docsRes.documents);
    } catch {
      setUploadMessage("Batch upload failed. Please try again.");
      setBatchProgress(null);
    } finally {
      setUploading(false);
    }
  }

  function triggerFolderPicker() {
    folderInputRef.current?.click();
  }

  function triggerFilePicker(accept: string) {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  }

  function handleImportSource(sourceId: (typeof importSources)[number]["id"]) {
    if (sourceId === "folder") {
      triggerFolderPicker();
      return;
    }
    if (sourceId === "pdf") triggerFilePicker(".pdf,application/pdf");
    if (sourceId === "word") triggerFilePicker(".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (sourceId === "excel") triggerFilePicker(".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    await handleBatchUpload(files, "File upload");
    event.target.value = "";
  }

  async function handleFolderSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    await handleBatchUpload(files, "Folder import");
    event.target.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
    setQuery("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">Company Brain</h1>
        <p className="mt-2 text-base text-slate-400">
          SOP + Manual + Issue History + Lessons Learned + Best Practice — indexed by AI, owned by your company.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Operational data via: {connectorLabel} (read-only)
        </p>
      </header>

      {loading ? <LoadingState label="Loading Company Brain..." /> : null}

      {brain.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h2 className="buek-card-title text-cyan-300">Machine → Issue → Technical Report</h2>
          <p className="buek-small text-slate-500">Navigasi hierarki investigasi yang disetujui.</p>
          <div className="space-y-2">
            {brain.map((machine) => (
              <div key={machine.code} className="rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedMachine((current) => (current === machine.code ? null : machine.code))
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="buek-body text-white">
                    {machine.code} — {machine.name}
                  </span>
                  <span className="text-slate-500">{expandedMachine === machine.code ? "▼" : "▶"}</span>
                </button>
                {expandedMachine === machine.code ? (
                  <div className="space-y-3 border-t border-white/10 px-4 py-3">
                    {machine.issues.map((issue) => (
                      <div key={issue.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <p className="buek-body text-white">{issue.title}</p>
                        <p className="buek-small text-slate-500">
                          Issue #{issue.issueKey} · {issue.status} · {new Date(issue.createdAt).toLocaleString("id-ID")} · oleh {issue.createdBy}
                        </p>
                        {issue.reports.length ? (
                          <div className="mt-2 space-y-1">
                            <p className="buek-small text-cyan-400">Technical Reports</p>
                            {issue.reports.map((report) => (
                              <p key={report.id} className="buek-small text-slate-300">
                                → {report.reportNumber}: {report.title} ({report.status})
                              </p>
                            ))}
                          </div>
                        ) : null}
                        {issue.lessonsLearned.length ? (
                          <div className="mt-2 space-y-1">
                            <p className="buek-small text-emerald-400">Lessons Learned</p>
                            {issue.lessonsLearned.map((lesson) => (
                              <p key={lesson.id} className="buek-small text-slate-400">
                                → {lesson.title}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        {issue.countermeasures.length ? (
                          <div className="mt-2">
                            <p className="buek-small text-amber-300">Countermeasure</p>
                            <p className="buek-small text-slate-400">{issue.countermeasures[0]}</p>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        {...{ webkitdirectory: "", directory: "" }}
        onChange={(e) => void handleFolderSelect(e)}
      />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => void handleFileSelect(e)} />

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="buek-card-title text-slate-400">Import Knowledge</h2>
        <p className="mt-2 buek-small text-slate-500">
          Upload folder or files — {supportedFormats}. Parsed, chunked, and indexed automatically.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {importSources.map((source) => (
            <button
              key={source.id}
              type="button"
              disabled={uploading}
              onClick={() => handleImportSource(source.id)}
              className="buek-card-hover rounded-xl border border-dashed border-white/20 px-4 py-5 text-left hover:border-tenant disabled:opacity-50"
            >
              <p className="text-sm font-medium text-white">{source.label}</p>
              <p className="mt-1 text-xs text-slate-500">{source.hint}</p>
            </button>
          ))}
        </div>
        {batchProgress ? <p className="mt-3 text-sm text-tenant">{batchProgress}</p> : null}
        {uploadMessage ? <p className="mt-2 text-sm text-green-400">{uploadMessage}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {knowledgeCategories.map((cat) => (
            <span key={cat} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
              {cat}
            </span>
          ))}
        </div>
      </section>

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
          Quick Upload (single document)
        </h2>
        <p className="mt-2 buek-small text-slate-500">
          Paste text for quick indexing, or use Import above for PDF / Word / Excel files.
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
            Content (paste text)
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
            className="btn-tenant rounded-xl px-6 py-3 font-semibold disabled:opacity-50"
          >
            {uploading ? "Indexing..." : "Upload Text to Knowledge Base"}
          </button>
          {uploadMessage && !batchProgress ? <p className="text-sm text-green-400">{uploadMessage}</p> : null}
        </form>
      </section>

      {lessons.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Lessons Learned ({lessons.length})
          </h2>
          <ul className="divide-y divide-white/5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="px-6 py-4">
                <p className="font-medium text-amber-100">{lesson.title}</p>
                <p className="mt-1 text-sm text-slate-400">{lesson.content}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

      {searching ? <LoadingState label="Searching knowledge base..." /> : null}

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
                    className="buek-card buek-card-hover w-full rounded-2xl border border-white/10 text-left hover:border-cyan-400/30"
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
