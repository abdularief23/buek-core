import type { Workspace } from "../types.js";

interface KnowledgeViewProps {
  workspace: Workspace;
}

export function KnowledgeView({ workspace }: KnowledgeViewProps) {
  const totalDocuments = workspace.documentStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-white">Knowledge</h1>
        <p className="mt-1 text-sm text-slate-500">
          {totalDocuments} documents across {workspace.knowledgeCollections.length} collections
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xs font-medium tracking-wide text-slate-500">Collections</h2>
        <ul className="space-y-2">
          {workspace.knowledgeCollections.map((collection) => (
            <li
              key={collection}
              className="rounded-lg border border-white/5 px-4 py-3 text-sm text-slate-300"
            >
              {collection}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-medium tracking-wide text-slate-500">Documents</h2>
        <dl className="space-y-3">
          {workspace.documentStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3"
            >
              <dt className="text-sm text-slate-300">{stat.label}</dt>
              <dd className="text-sm text-slate-500">{stat.count}</dd>
            </div>
          ))}
        </dl>
      </section>

      {workspace.status === "no-knowledge" ? (
        <p className="text-sm text-slate-500">
          Upload SOP to activate the AI worker for this workspace.
        </p>
      ) : null}
    </div>
  );
}
