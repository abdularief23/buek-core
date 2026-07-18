const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, init);
  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }
  return (await response.json()) as T;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  detail?: string;
  category: string;
}

export interface WorkOrder {
  id: string;
  number: string;
  title: string;
  reason: string;
  risk: string;
  status: string;
  machine?: { code: string; name: string };
  engineer?: { name: string; role: string };
  aiReview?: {
    checks: Array<{ label: string; status: string; detail: string }>;
    summary?: string;
  };
  approval?: { status: string; decidedAt?: string };
}

export interface IssueRecord {
  id: string;
  title: string;
  description?: string;
  status: string;
  severity: string;
  progress: number;
  dueAt?: string;
  owner?: { name: string };
  machine?: { code: string; name: string };
  investigation?: {
    status: string;
    progress: number;
    steps: Array<{ key: string; label: string; done: boolean }>;
  };
  graph?: Array<{ relation: string; label: string; toType: string; toId: string }>;
}

export interface LiveKpi {
  label: string;
  value: string;
  status: "green" | "yellow" | "red";
  series: Array<{ time: string; value: number }>;
}

export function fetchTimeline(slug: string) {
  return fetchJson<{ timeline: TimelineEvent[] }>(`/api/data/${slug}/timeline`);
}

export function fetchPendingWorkOrders(slug: string) {
  return fetchJson<{ workOrders: WorkOrder[] }>(`/api/data/${slug}/work-orders/pending`);
}

export function fetchWorkOrder(slug: string, workOrderId: string) {
  return fetchJson<{ workOrder: WorkOrder }>(`/api/data/${slug}/work-orders/${workOrderId}`);
}

export function approveWorkOrder(slug: string, workOrderId: string, supervisorName: string) {
  return fetchJson<{ workOrder: WorkOrder }>(`/api/data/${slug}/work-orders/${workOrderId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supervisorName })
  });
}

export function rejectWorkOrder(slug: string, workOrderId: string, supervisorName: string) {
  return fetchJson<{ workOrder: WorkOrder }>(`/api/data/${slug}/work-orders/${workOrderId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supervisorName })
  });
}

export function fetchIssueByKey(slug: string, issueKey: string) {
  return fetchJson<{ issue: IssueRecord }>(`/api/data/${slug}/issues/key/${issueKey}`);
}

export function advanceInvestigation(slug: string, issueId: string, stepKey: string) {
  return fetchJson<{ issue: IssueRecord }>(`/api/data/${slug}/issues/${issueId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stepKey })
  });
}

export function fetchLiveKpis(slug: string) {
  return fetchJson<{ kpis: LiveKpi[] }>(`/api/data/${slug}/kpis/live`);
}
