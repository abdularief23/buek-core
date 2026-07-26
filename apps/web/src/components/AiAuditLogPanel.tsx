import { useEffect, useState } from "react";
import { fetchAuditLog, type AuditLogEntry } from "../lib/governance-api.js";

interface AiAuditLogPanelProps {
  workspaceId: string;
  limit?: number;
}

const SOURCE_LABELS: Record<string, string> = {
  copilot: "AI Copilot",
  investigation: "Investigasi",
  background_agent: "Agent Background"
};

export function AiAuditLogPanel({ workspaceId, limit = 15 }: AiAuditLogPanelProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog(workspaceId, limit)
      .then((data) => setEntries(data.entries))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Gagal memuat audit log.");
      })
      .finally(() => setLoading(false));
  }, [workspaceId, limit]);

  if (loading) {
    return <p className="text-sm text-slate-500">Memuat audit log AI…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!entries.length) {
    return <p className="text-sm text-slate-500">Belum ada aktivitas AI tercatat.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-white">{entry.toolName.replaceAll("_", " ")}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                entry.status === "failed"
                  ? "bg-red-500/15 text-red-300"
                  : "bg-emerald-500/15 text-emerald-300"
              }`}
            >
              {entry.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {SOURCE_LABELS[entry.source] ?? entry.source}
            {entry.actorRole ? ` · ${entry.actorRole}` : ""}
            {" · "}
            {new Date(entry.createdAt).toLocaleString("id-ID")}
          </p>
          {entry.traceId ? (
            <p className="mt-1 truncate font-mono text-[10px] text-slate-600">trace: {entry.traceId}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
