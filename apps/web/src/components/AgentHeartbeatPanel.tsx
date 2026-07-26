import { useEffect, useState } from "react";
import { fetchAgentHeartbeats, type AgentHeartbeatRun } from "../lib/governance-api.js";

interface AgentHeartbeatPanelProps {
  workspaceId: string;
}

export function AgentHeartbeatPanel({ workspaceId }: AgentHeartbeatPanelProps) {
  const [runs, setRuns] = useState<AgentHeartbeatRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentHeartbeats(workspaceId, 5)
      .then((data) => setRuns(data.runs))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Memuat agent background…</p>;
  }

  if (!runs.length) {
    return (
      <p className="text-sm text-slate-500">
        Agent shift monitor akan berjalan otomatis setiap 4 jam.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
      {runs.map((run) => (
        <li key={run.id} className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">🤖 {run.agentType.replaceAll("_", " ")}</p>
              <p className="mt-1 text-sm text-slate-400">{run.summary}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-500">
              {new Date(run.startedAt).toLocaleString("id-ID")}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
