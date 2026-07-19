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

export function approveWorkOrder(slug: string, workOrderId: string, supervisorName: string, role: string) {
  return fetchJson<{ workOrder: WorkOrder }>(`/api/data/${slug}/work-orders/${workOrderId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supervisorName, role })
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

export function advanceInvestigation(slug: string, issueId: string, stepKey: string, role: string) {
  return fetchJson<{ issue: IssueRecord }>(`/api/data/${slug}/issues/${issueId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stepKey, role })
  });
}

export function fetchLiveKpis(slug: string) {
  return fetchJson<{ kpis: LiveKpi[] }>(`/api/data/${slug}/kpis/live`);
}

export interface SopRevision {
  id: string;
  referenceId: string;
  title: string;
  revision: string;
  summary: string;
  status: string;
  submitter?: { name: string };
  aiReview?: WorkOrder["aiReview"];
}

export interface EngineeringReport {
  id: string;
  title: string;
  content: string;
  status: string;
  reportNumber?: string;
  version?: number;
  sections?: ReportSections;
  machineCode?: string;
  issueId?: string;
  submittedAt?: string;
  author?: { name: string };
  issueTitle?: string;
}

export interface ReportSections {
  background: string;
  evidence: string;
  analysis: string;
  decision: string;
  rootCause: string;
  countermeasure: string;
  executionPlan: string;
  verification: string;
  verificationResult: string;
  attachments: string[];
}

export interface PossibleCause {
  id: string;
  label: string;
  confidence: number;
  evidence: string[];
}

export interface CountermeasureOption {
  id: string;
  label: string;
  category: string;
}

export interface ExecutionPlanDto {
  pic: string;
  dueDate: string;
  machineStop: boolean;
  materialNeeded: string;
  estimatedDowntime: string;
}

export interface InvestigationCopilot {
  issueKey: string;
  issueTitle: string;
  machineCode?: string;
  autoLoadedContext: string[];
  similarCases: Array<{ id: string; title: string; reference?: string }>;
  sopReferences: Array<{ id: string; title: string; referenceId?: string }>;
  possibleCauses: PossibleCause[];
  countermeasureOptions: CountermeasureOption[];
  defaultExecutionPlan: ExecutionPlanDto;
}

export interface InvestigationDraftInput {
  evidence?: string;
  analysis?: string;
  decision?: string;
  rootCause?: string;
  countermeasure?: string;
  executionPlan?: string;
  verification?: string;
  verificationResult?: string;
  lessonsLearned?: string;
  selectedCauseLabel?: string;
  executionPlanFields?: ExecutionPlanDto;
}

export interface AiSuggestion {
  candidate: string;
  confidence: string;
  basis: string;
}

export interface LessonLearned {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface WorkflowItem {
  id: string;
  type: string;
  title: string;
  status: string;
  progress: number;
  owner?: string;
  entityId: string;
  issueKey?: string;
}

export interface OperatorChecklist {
  id: string;
  line: string;
  shift: string;
  targetOutput: number;
  progress: number;
  items: Array<{ id: string; label: string; done: boolean }>;
}

export interface AiActionResult {
  success: boolean;
  toolName: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export function fetchWorkflows(slug: string) {
  return fetchJson<{ workflows: WorkflowItem[] }>(`/api/data/${slug}/workflows`);
}

export function fetchPendingSopRevisions(slug: string) {
  return fetchJson<{ revisions: SopRevision[] }>(`/api/data/${slug}/sop-revisions/pending`);
}

export function fetchSopRevision(slug: string, revisionId: string) {
  return fetchJson<{ revision: SopRevision }>(`/api/data/${slug}/sop-revisions/${revisionId}`);
}

export function approveSopRevision(slug: string, revisionId: string, supervisorName: string, role: string) {
  return fetchJson<{ revision: SopRevision }>(`/api/data/${slug}/sop-revisions/${revisionId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supervisorName, role })
  });
}

export function fetchPendingReports(slug: string) {
  return fetchJson<{ reports: EngineeringReport[] }>(`/api/data/${slug}/reports/pending`);
}

export function fetchReport(slug: string, reportId: string) {
  return fetchJson<{ report: EngineeringReport }>(`/api/data/${slug}/reports/${reportId}`);
}

export function approveReport(slug: string, reportId: string, supervisorName: string, role: string) {
  return fetchJson<{ report: EngineeringReport }>(`/api/data/${slug}/reports/${reportId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supervisorName, role })
  });
}

export function rejectReport(slug: string, reportId: string, supervisorName: string, role: string) {
  return fetchJson<{ report: EngineeringReport }>(`/api/data/${slug}/reports/${reportId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supervisorName, role })
  });
}

export function requestReportRevision(
  slug: string,
  reportId: string,
  supervisorName: string,
  role: string,
  notes?: string
) {
  return fetchJson<{ report: EngineeringReport }>(
    `/api/data/${slug}/reports/${reportId}/request-revision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supervisorName, role, notes })
    }
  );
}

export function submitOperatorReport(
  slug: string,
  input: {
    problem: string;
    shift: string;
    machineCode: string;
    occurredAt: string;
    rejectCount: number;
    notes?: string;
    reporterName: string;
  },
  role: string
) {
  return fetchJson<{ issueId: string; issueKey: string; title: string; message: string }>(
    `/api/data/${slug}/operator/report`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, role })
    }
  );
}

export function createDraftReport(
  slug: string,
  issueKey: string,
  engineerName: string,
  role: string,
  investigationDraft?: InvestigationDraftInput
) {
  return fetchJson<{ report: EngineeringReport; aiSuggestion: AiSuggestion }>(
    `/api/data/${slug}/reports/draft`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueKey, engineerName, role, investigationDraft })
    }
  );
}

export function fetchInvestigationCopilot(slug: string, issueKey: string) {
  return fetchJson<{ copilot: InvestigationCopilot }>(`/api/data/${slug}/issues/${issueKey}/copilot`);
}

export function updateReportSections(
  slug: string,
  reportId: string,
  sections: ReportSections,
  engineerName: string,
  role: string
) {
  return fetchJson<{ report: EngineeringReport }>(`/api/data/${slug}/reports/${reportId}/sections`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sections, engineerName, role })
  });
}

export function submitReportForApproval(
  slug: string,
  reportId: string,
  engineerName: string,
  role: string
) {
  return fetchJson<{ report: EngineeringReport }>(`/api/data/${slug}/reports/${reportId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ engineerName, role })
  });
}

export function reportExportUrl(slug: string, reportId: string, print = true) {
  const printParam = print ? "?print=1" : "";
  return `${apiUrl}/api/data/${slug}/reports/${reportId}/export${printParam}`;
}

export function reportExportDocxUrl(slug: string, reportId: string) {
  return `${apiUrl}/api/data/${slug}/reports/${reportId}/export?format=docx`;
}

export function fetchAiSuggestion(slug: string, issueKey: string) {
  return fetchJson<{ suggestion: AiSuggestion }>(`/api/data/${slug}/issues/${issueKey}/ai-suggestion`);
}

export function fetchLessonsLearned(slug: string) {
  return fetchJson<{ lessons: LessonLearned[] }>(`/api/data/${slug}/lessons-learned`);
}

export interface CustomerComplaint {
  id: string;
  complaintNumber: string;
  customerName: string;
  product: string;
  priority: string;
  status: string;
  description?: string;
  reportedAt: string;
  dueAt?: string;
  engineer?: { name: string };
  timeline: Array<{ time: string; title: string }>;
  attachments: string[];
}

export function fetchComplaints(slug: string, status?: string) {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchJson<{ complaints: CustomerComplaint[] }>(`/api/data/${slug}/complaints${params}`);
}

export function fetchComplaint(slug: string, complaintId: string) {
  return fetchJson<{ complaint: CustomerComplaint }>(`/api/data/${slug}/complaints/${complaintId}`);
}

export function fetchOperatorChecklist(slug: string) {
  return fetchJson<{ checklist: OperatorChecklist | null }>(`/api/data/${slug}/operator/checklist`);
}

export function toggleChecklistItem(slug: string, itemId: string, role: string) {
  return fetchJson<{ checklist: OperatorChecklist | null }>(`/api/data/${slug}/operator/checklist/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, role })
  });
}

export function executeAiAction(slug: string, action: string, params: Record<string, string> = {}) {
  return fetchJson<{ result: AiActionResult }>(`/api/data/${slug}/ai/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params })
  });
}

export function isAiActionResult(data: unknown): data is AiActionResult {
  return Boolean(
    data &&
      typeof data === "object" &&
      typeof (data as AiActionResult).toolName === "string" &&
      typeof (data as AiActionResult).message === "string"
  );
}

export interface NotificationItem {
  id: string;
  category: string;
  message: string;
  prompt: string;
  time: string;
  entityType?: string;
  entityId?: string;
}

export function fetchNotifications(slug: string) {
  return fetchJson<{ notifications: NotificationItem[] }>(`/api/data/${slug}/notifications`);
}

export interface KnowledgeSearchHit {
  id: string;
  score: number;
  title: string;
  referenceId?: string;
  sourceId: string;
  excerpt: string;
}

export function searchKnowledge(query: string, moduleId?: string, workspaceId?: string) {
  const params = new URLSearchParams({ q: query });
  if (moduleId) params.set("module", moduleId);
  if (workspaceId) params.set("workspace", workspaceId);
  return fetchJson<{
    module: { id: string; name: string };
    query: string;
    totalChunks: number;
    results: KnowledgeSearchHit[];
  }>(`/api/knowledge/search?${params.toString()}`);
}

export interface KnowledgeDocumentSummary {
  id: string;
  title: string;
  type: string;
  referenceId: string | null;
  status: string;
  chunkCount: number;
  createdAt: string;
}

export function fetchKnowledgeDocuments(workspaceId: string) {
  const params = new URLSearchParams({ workspace: workspaceId });
  return fetchJson<{ documents: KnowledgeDocumentSummary[] }>(`/api/knowledge/documents?${params.toString()}`);
}

export function uploadKnowledgeDocument(input: {
  workspaceId: string;
  title: string;
  type: string;
  content: string;
  referenceId?: string;
  fileName?: string;
}) {
  return fetchJson<{ document: KnowledgeDocumentSummary; message: string }>(`/api/knowledge/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function uploadKnowledgeFiles(
  workspaceId: string,
  files: FileList | File[]
): Promise<{
  documents: KnowledgeDocumentSummary[];
  errors: Array<{ fileName: string; message: string }>;
  message: string;
}> {
  const formData = new FormData();
  formData.append("workspaceId", workspaceId);
  const list = Array.from(files);
  for (const file of list) {
    formData.append("files", file);
  }

  const response = await fetch(`${apiUrl}/api/knowledge/upload/files`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  return (await response.json()) as {
    documents: KnowledgeDocumentSummary[];
    errors: Array<{ fileName: string; message: string }>;
    message: string;
  };
}

export interface CriticalAlert {
  id: string;
  ruleName: string;
  category: string;
  severity: string;
  message: string;
  metric: string;
  currentValue: number | null;
  threshold: number | null;
}

export function fetchCriticalAlerts(slug: string) {
  return fetchJson<{ alerts: CriticalAlert[] }>(`/api/data/${slug}/critical-alerts`);
}

export interface BusinessRule {
  id: string;
  name: string;
  category: string;
  metric: string;
  operator: string;
  threshold: number | null;
  severity: string;
  enabled: boolean;
  description: string | null;
}

export function fetchBusinessRules(slug: string) {
  return fetchJson<{ rules: BusinessRule[]; principle: string }>(`/api/data/${slug}/business-rules`);
}

export function fetchConnectors(slug: string) {
  return fetchJson<{
    connectors: Array<{ id: string; label: string; type: string; status: string; readOnly: boolean }>;
    snapshot: { metrics: Record<string, number>; fetchedAt: string };
    principle: string;
  }>(`/api/data/${slug}/connectors`);
}

export function refreshRoleHome(workspaceId: string, role: string) {
  const params = new URLSearchParams({ workspaceId, role });
  return fetchJson<{ roleHome: import("../types.js").RoleHomeData }>(
    `/api/auth/refresh-role-home?${params.toString()}`
  );
}

export interface ProductionDashboard {
  target: number;
  current: number;
  achievement: number;
  unit: string;
  shifts: Array<{ name: string; status: "done" | "running" | "waiting" }>;
  issues: { total: number; critical: number };
  risks: string[];
}

export interface KpiDetail {
  label: string;
  value: string;
  status: "green" | "yellow" | "red";
  target: string;
  trend: "up" | "down" | "flat";
  series: Array<{ time: string; value: number }>;
  highlights: string[];
}

export function fetchProductionDashboard(slug: string) {
  return fetchJson<{ dashboard: ProductionDashboard }>(`/api/data/${slug}/production`);
}

export function fetchKpiDetail(slug: string, label: string) {
  return fetchJson<{ kpi: KpiDetail }>(`/api/data/${slug}/kpis/${encodeURIComponent(label)}`);
}
