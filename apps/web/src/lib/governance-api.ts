const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`);
  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }
  return (await response.json()) as T;
}

export type GoalLevel = "mission" | "project" | "investigation" | "task";

export interface GoalLink {
  level: GoalLevel;
  label: string;
  reason?: string;
}

export interface AuditLogEntry {
  id: string;
  toolName: string;
  source: string;
  status: string;
  actorRole: string | null;
  actorEmail: string | null;
  traceId: string | null;
  goalChain: GoalLink[] | null;
  input: unknown;
  output: unknown;
  createdAt: string;
}

export interface AgentHeartbeatRun {
  id: string;
  agentType: string;
  status: string;
  summary: string;
  output: unknown;
  startedAt: string;
  completedAt: string | null;
}

export function fetchGoalChain(slug: string, issueKey: string, taskStep?: number) {
  const query = taskStep !== undefined ? `?taskStep=${taskStep}` : "";
  return fetchJson<{ goalChain: GoalLink[] }>(`/api/data/${slug}/issues/${issueKey}/goal-chain${query}`);
}

export function fetchAuditLog(slug: string, limit = 20) {
  return fetchJson<{ entries: AuditLogEntry[] }>(`/api/data/${slug}/governance/audit-log?limit=${limit}`);
}

export function fetchAgentHeartbeats(slug: string, limit = 5) {
  return fetchJson<{ runs: AgentHeartbeatRun[] }>(
    `/api/data/${slug}/governance/agent-heartbeats?limit=${limit}`
  );
}
