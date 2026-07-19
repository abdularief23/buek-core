import { useEffect, useState } from "react";
import {
  advanceInvestigation,
  approveReport,
  approveSopRevision,
  approveWorkOrder,
  createDraftReport,
  fetchAiSuggestion,
  fetchIssueByKey,
  fetchKpiDetail,
  fetchPendingReports,
  fetchPendingSopRevisions,
  fetchPendingWorkOrders,
  fetchComplaint,
  fetchComplaints,
  fetchProductionDashboard,
  fetchReport,
  fetchSopRevision,
  fetchWorkOrder,
  rejectReport,
  rejectWorkOrder,
  requestReportRevision,
  submitReportForApproval,
  updateReportSections,
  type AiSuggestion,
  type CustomerComplaint,
  type EngineeringReport,
  type ReportSections,
  type KpiDetail,
  type ProductionDashboard,
  type SopRevision,
  type WorkOrder
} from "../lib/data-api.js";
import { canApprove, isEngineer } from "../lib/roles.js";

export type DynamicWorkspaceState =
  | { kind: "approval-queue"; slug: string }
  | { kind: "work-order"; slug: string; workOrderId: string }
  | { kind: "investigation"; slug: string; issueKey: string }
  | { kind: "sop-revisions"; slug: string }
  | { kind: "sop-revision"; slug: string; revisionId: string }
  | { kind: "engineering-reports"; slug: string }
  | { kind: "engineering-report"; slug: string; reportId: string }
  | { kind: "production-dashboard"; slug: string }
  | { kind: "kpi-detail"; slug: string; kpiLabel: string }
  | { kind: "customer-complaints"; slug: string }
  | { kind: "customer-complaint"; slug: string; complaintId: string };

interface DynamicWorkspaceProps {
  workspace: DynamicWorkspaceState;
  userName: string;
  userRole: string;
  onClose: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
  onWorkspaceChange: (next: DynamicWorkspaceState) => void;
  onDataChange?: () => void;
}

export function DynamicWorkspace({
  workspace,
  userName,
  userRole,
  onClose,
  onAskAi,
  onWorkspaceChange,
  onDataChange
}: DynamicWorkspaceProps) {
  const notifyChange = onDataChange ?? (() => {});

  if (workspace.kind === "customer-complaints") {
    return (
      <CustomerComplaintListWorkspace
        slug={workspace.slug}
        onClose={onClose}
        onSelect={(complaintId) =>
          onWorkspaceChange({ kind: "customer-complaint", slug: workspace.slug, complaintId })
        }
      />
    );
  }

  if (workspace.kind === "customer-complaint") {
    return (
      <CustomerComplaintDetailWorkspace
        slug={workspace.slug}
        complaintId={workspace.complaintId}
        onClose={onClose}
        onBack={() => onWorkspaceChange({ kind: "customer-complaints", slug: workspace.slug })}
        onAskAi={onAskAi}
      />
    );
  }

  if (workspace.kind === "production-dashboard") {
    return (
      <ProductionDashboardWorkspace
        slug={workspace.slug}
        onClose={onClose}
        onAskAi={onAskAi}
      />
    );
  }

  if (workspace.kind === "kpi-detail") {
    return (
      <KpiDetailWorkspace
        slug={workspace.slug}
        kpiLabel={workspace.kpiLabel}
        onClose={onClose}
        onAskAi={onAskAi}
      />
    );
  }

  if (workspace.kind === "approval-queue") {
    return (
      <ApprovalQueueWorkspace
        slug={workspace.slug}
        onClose={onClose}
        onSelect={(workOrderId) =>
          onWorkspaceChange({ kind: "work-order", slug: workspace.slug, workOrderId })
        }
      />
    );
  }

  if (workspace.kind === "work-order") {
    return (
      <WorkOrderDetailWorkspace
        slug={workspace.slug}
        workOrderId={workspace.workOrderId}
        userName={userName}
        userRole={userRole}
        onClose={onClose}
        onBack={() => onWorkspaceChange({ kind: "approval-queue", slug: workspace.slug })}
        onAskAi={onAskAi}
        onDataChange={notifyChange}
      />
    );
  }

  if (workspace.kind === "investigation") {
    return (
      <InvestigationWorkspace
        slug={workspace.slug}
        issueKey={workspace.issueKey}
        userName={userName}
        userRole={userRole}
        onClose={onClose}
        onAskAi={onAskAi}
        onDataChange={notifyChange}
        onWorkspaceChange={onWorkspaceChange}
      />
    );
  }

  if (workspace.kind === "sop-revisions") {
    return (
      <SopRevisionQueueWorkspace
        slug={workspace.slug}
        onClose={onClose}
        onSelect={(revisionId) =>
          onWorkspaceChange({ kind: "sop-revision", slug: workspace.slug, revisionId })
        }
      />
    );
  }

  if (workspace.kind === "sop-revision") {
    return (
      <SopRevisionDetailWorkspace
        slug={workspace.slug}
        revisionId={workspace.revisionId}
        userName={userName}
        userRole={userRole}
        onClose={onClose}
        onBack={() => onWorkspaceChange({ kind: "sop-revisions", slug: workspace.slug })}
        onAskAi={onAskAi}
        onDataChange={notifyChange}
      />
    );
  }

  if (workspace.kind === "engineering-reports") {
    return (
      <ReportQueueWorkspace
        slug={workspace.slug}
        onClose={onClose}
        onSelect={(reportId) =>
          onWorkspaceChange({ kind: "engineering-report", slug: workspace.slug, reportId })
        }
      />
    );
  }

  return (
    <ReportDetailWorkspace
      slug={workspace.slug}
      reportId={workspace.reportId}
      userName={userName}
      userRole={userRole}
      onClose={onClose}
      onBack={() => onWorkspaceChange({ kind: "engineering-reports", slug: workspace.slug })}
      onAskAi={onAskAi}
      onDataChange={notifyChange}
    />
  );
}

function ApprovalQueueWorkspace({
  slug,
  onClose,
  onSelect
}: {
  slug: string;
  onClose: () => void;
  onSelect: (workOrderId: string) => void;
}) {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingWorkOrders(slug)
      .then((data) => setOrders(data.workOrders))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">AI Workspace</p>
          <h1 className="buek-heading text-white">Waiting Approval</h1>
          <p className="mt-2 buek-body text-slate-400">
            {loading ? "Loading..." : `${orders.length} Work Orders`}
          </p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Back
        </button>
      </header>

      <div className="space-y-4">
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => onSelect(order.id)}
            className="buek-card w-full rounded-2xl border border-white/10 text-left hover:border-cyan-400/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="buek-card-title text-white">{order.number}</p>
                <p className="mt-1 buek-body text-slate-300">{order.title}</p>
              </div>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
                {order.risk} risk
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-6 buek-small text-slate-500">
              <span>{order.machine?.code}</span>
              <span>{order.engineer?.name}</span>
              <span>{order.reason}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkOrderDetailWorkspace({
  slug,
  workOrderId,
  userName,
  userRole,
  onClose,
  onBack,
  onAskAi,
  onDataChange
}: {
  slug: string;
  workOrderId: string;
  userName: string;
  userRole: string;
  onClose: () => void;
  onBack: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
  onDataChange?: () => void;
  }) {
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchWorkOrder(slug, workOrderId).then((data) => setOrder(data.workOrder));
  }, [slug, workOrderId]);

  async function handleApprove() {
    if (!order || acting) return;
    setActing(true);
    try {
      const result = await approveWorkOrder(slug, order.id, userName, userRole);
      setOrder(result.workOrder);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!order || acting) return;
    setActing(true);
    try {
      const result = await rejectWorkOrder(slug, order.id, userName);
      setOrder(result.workOrder);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  if (!order) {
    return <p className="buek-body text-slate-500">Loading work order...</p>;
  }

  const isDecided = order.status === "approved" || order.status === "rejected";
  const mayApprove = canApprove(userRole);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <button type="button" onClick={onBack} className="buek-small text-cyan-400 hover:text-cyan-300">
            ← Waiting Approval
          </button>
          <h1 className="mt-3 buek-heading text-white">{order.number}</h1>
          <p className="mt-2 buek-body text-slate-400">{order.machine?.name}</p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          Close
        </button>
      </header>

      <div className="buek-card grid gap-6 rounded-2xl border border-white/10 sm:grid-cols-2">
        <div>
          <p className="buek-small text-slate-500">Engineer</p>
          <p className="buek-body text-white">{order.engineer?.name}</p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Reason</p>
          <p className="buek-body text-white">{order.reason}</p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Risk</p>
          <p className="buek-body capitalize text-amber-300">{order.risk}</p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Status</p>
          <p className="buek-body capitalize text-white">{order.status.replace("_", " ")}</p>
        </div>
      </div>

      {order.aiReview ? (
        <section className="space-y-4">
          <h2 className="buek-card-title text-slate-400">AI Review</h2>
          <ul className="space-y-3">
            {order.aiReview.checks.map((check) => (
              <li
                key={check.label}
                className="buek-card flex items-start gap-3 rounded-xl border border-white/10"
              >
                <span className="text-lg">
                  {check.status === "pass" ? "✓" : check.status === "warning" ? "⚠" : "✕"}
                </span>
                <div>
                  <p className="buek-body text-white">{check.label}</p>
                  <p className="buek-small text-slate-500">{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!isDecided && mayApprove ? (
          <>
            <button
              type="button"
              disabled={acting}
              onClick={() => void handleApprove()}
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => void handleReject()}
              className="rounded-xl border border-red-500/40 px-6 py-3 font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        ) : null}
        {!mayApprove && !isDecided ? (
          <p className="buek-small text-slate-500">
            Hanya Supervisor yang dapat menyetujui work order.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() =>
            onAskAi(`Why should I ${isDecided ? "have" : ""} approve work order ${order.number}?`, order.number)
          }
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/5"
        >
          ✨ Jelaskan
        </button>
      </div>
    </div>
  );
}

function InvestigationWorkspace({
  slug,
  issueKey,
  userName,
  userRole,
  onClose,
  onAskAi,
  onDataChange,
  onWorkspaceChange
}: {
  slug: string;
  issueKey: string;
  userName: string;
  userRole: string;
  onClose: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
  onDataChange?: () => void;
  onWorkspaceChange: (next: DynamicWorkspaceState) => void;
}) {
  const [issue, setIssue] = useState<import("../lib/data-api.js").IssueRecord | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [rootCause, setRootCause] = useState("");
  const [countermeasure, setCountermeasure] = useState("");
  const [verification, setVerification] = useState("");
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [suggestionStatus, setSuggestionStatus] = useState<"pending" | "accepted" | "rejected">("pending");

  useEffect(() => {
    fetchIssueByKey(slug, issueKey).then((data) => setIssue(data.issue));
    fetchAiSuggestion(slug, issueKey)
      .then((data) => setAiSuggestion(data.suggestion))
      .catch(() => setAiSuggestion(null));
  }, [slug, issueKey]);

  async function completeStep(stepKey: string) {
    if (!issue || advancing) return;
    setAdvancing(true);
    try {
      const result = await advanceInvestigation(slug, issue.id, stepKey);
      setIssue(result.issue);
      onDataChange?.();
    } finally {
      setAdvancing(false);
    }
  }

  async function handleCreateDraft() {
    if (!issue || creatingDraft) return;
    setCreatingDraft(true);
    try {
      const result = await createDraftReport(slug, issueKey, userName);
      onWorkspaceChange({ kind: "engineering-report", slug, reportId: result.report.id });
      onDataChange?.();
    } finally {
      setCreatingDraft(false);
    }
  }

  function acceptSuggestion() {
    if (!aiSuggestion) return;
    setRootCause(`${aiSuggestion.candidate} (${aiSuggestion.confidence})\n${aiSuggestion.basis}`);
    setSuggestionStatus("accepted");
  }

  if (!issue) {
    return <p className="buek-body text-slate-500">Loading investigation...</p>;
  }

  const engineerView = isEngineer(userRole);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">Investigation Workspace</p>
          <h1 className="buek-heading text-white">{issue.title}</h1>
          <p className="mt-2 buek-body text-slate-400">
            {issue.machine?.code} · Issue #{issue.id.slice(-3)}
          </p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Back
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
          <h2 className="buek-card-title text-slate-400">Issue & Evidence</h2>
          <p className="buek-body text-slate-300">{issue.description ?? issue.title}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="buek-small text-slate-500">Machine</p>
              <p className="buek-body text-white">{issue.machine?.code ?? "—"}</p>
            </div>
            <div>
              <p className="buek-small text-slate-500">Severity</p>
              <p className="buek-body capitalize text-amber-300">{issue.severity}</p>
            </div>
            <div>
              <p className="buek-small text-slate-500">Owner</p>
              <p className="buek-body text-white">{issue.owner?.name ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="buek-small text-slate-500">Progress</p>
              <p className="buek-body text-cyan-300">{issue.progress}%</p>
            </div>
          </div>
        </section>

        <section className="buek-card space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h2 className="buek-card-title text-cyan-300">AI Suggestion — Root Cause</h2>
          {aiSuggestion ? (
            <>
              <p className="text-lg font-semibold text-white">{aiSuggestion.candidate}</p>
              <p className="buek-body text-slate-400">
                Confidence: <span className="text-cyan-300">{aiSuggestion.confidence}</span>
              </p>
              <p className="buek-small text-slate-500">{aiSuggestion.basis}</p>
              {engineerView && suggestionStatus === "pending" ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={acceptSuggestion}
                    className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionStatus("rejected")}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
              {suggestionStatus === "accepted" ? (
                <p className="buek-small text-emerald-400">✓ Accepted — engineer decides final root cause</p>
              ) : null}
            </>
          ) : (
            <p className="buek-body text-slate-500">AI sedang menganalisis histori...</p>
          )}
        </section>
      </div>

      {issue.graph?.length ? (
        <section className="space-y-3">
          <h2 className="buek-card-title text-slate-400">Company Brain — Related Knowledge</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {issue.graph.map((edge) => (
              <div key={`${edge.relation}-${edge.toId}`} className="buek-card rounded-xl border border-white/10 px-4 py-3">
                <p className="buek-small text-slate-500">{edge.relation.replace("_", " ")}</p>
                <p className="buek-body text-white">{edge.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {engineerView ? (
        <section className="space-y-4">
          <h2 className="buek-card-title text-slate-400">Engineer Investigation</h2>
          <label className="block space-y-2">
            <span className="buek-small text-slate-500">Root Cause</span>
            <textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              placeholder="Engineer menentukan root cause..."
            />
          </label>
          <label className="block space-y-2">
            <span className="buek-small text-slate-500">Countermeasure</span>
            <textarea
              value={countermeasure}
              onChange={(e) => setCountermeasure(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              placeholder="Tindakan perbaikan..."
            />
          </label>
          <label className="block space-y-2">
            <span className="buek-small text-slate-500">Verification Plan</span>
            <textarea
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              placeholder="Cara verifikasi setelah perbaikan..."
            />
          </label>
          <button
            type="button"
            disabled={creatingDraft}
            onClick={() => void handleCreateDraft()}
            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            {creatingDraft ? "Creating Draft..." : "Create Draft Report (AI)"}
          </button>
          <p className="buek-small text-slate-500">
            AI membuat draft — engineer mengedit dan submit untuk approval supervisor.
          </p>
        </section>
      ) : null}

      {issue.investigation ? (
        <section className="space-y-4">
          <h2 className="buek-card-title text-slate-400">Workflow Steps</h2>
          <ul className="space-y-2">
            {issue.investigation.steps.map((step) => (
              <li key={step.key}>
                <button
                  type="button"
                  disabled={step.done || advancing || !engineerView}
                  onClick={() => void completeStep(step.key)}
                  className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left ${
                    step.done
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                      : "border-white/10 hover:border-cyan-400/30"
                  }`}
                >
                  <span className="buek-body">{step.label}</span>
                  <span>{step.done ? "✓" : "□"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {["Find Similar Case", "Search SOP", "Machine History"].map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onAskAi(`${action} for ${issue.title}`, issue.title)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400/30 hover:text-white"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

function SopRevisionQueueWorkspace({
  slug,
  onClose,
  onSelect
}: {
  slug: string;
  onClose: () => void;
  onSelect: (revisionId: string) => void;
}) {
  const [revisions, setRevisions] = useState<SopRevision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSopRevisions(slug)
      .then((data) => setRevisions(data.revisions))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">AI Workspace</p>
          <h1 className="buek-heading text-white">SOP Revisions</h1>
          <p className="mt-2 buek-body text-slate-400">
            {loading ? "Loading..." : `${revisions.length} pending revisions`}
          </p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Back
        </button>
      </header>

      <div className="space-y-4">
        {revisions.map((revision) => (
          <button
            key={revision.id}
            type="button"
            onClick={() => onSelect(revision.id)}
            className="buek-card w-full rounded-2xl border border-white/10 text-left hover:border-cyan-400/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="buek-card-title text-white">
                  {revision.referenceId} · {revision.revision}
                </p>
                <p className="mt-1 buek-body text-slate-300">{revision.title}</p>
              </div>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
                pending
              </span>
            </div>
            <p className="mt-4 buek-small text-slate-500">{revision.summary}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SopRevisionDetailWorkspace({
  slug,
  revisionId,
  userName,
  userRole,
  onClose,
  onBack,
  onAskAi,
  onDataChange
}: {
  slug: string;
  revisionId: string;
  userName: string;
  userRole: string;
  onClose: () => void;
  onBack: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
  onDataChange?: () => void;
}) {
  const [revision, setRevision] = useState<SopRevision | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchSopRevision(slug, revisionId).then((data) => setRevision(data.revision));
  }, [slug, revisionId]);

  async function handleApprove() {
    if (!revision || acting) return;
    setActing(true);
    try {
      const result = await approveSopRevision(slug, revision.id, userName, userRole);
      setRevision(result.revision);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  if (!revision) {
    return <p className="buek-body text-slate-500">Loading SOP revision...</p>;
  }

  const isDecided = revision.status === "approved" || revision.status === "rejected";
  const mayApprove = canApprove(userRole);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <button type="button" onClick={onBack} className="buek-small text-cyan-400 hover:text-cyan-300">
            ← SOP Revisions
          </button>
          <h1 className="mt-3 buek-heading text-white">
            {revision.referenceId} · {revision.revision}
          </h1>
          <p className="mt-2 buek-body text-slate-400">{revision.title}</p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          Close
        </button>
      </header>

      <div className="buek-card grid gap-6 rounded-2xl border border-white/10 sm:grid-cols-2">
        <div>
          <p className="buek-small text-slate-500">Submitter</p>
          <p className="buek-body text-white">{revision.submitter?.name ?? "—"}</p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Status</p>
          <p className="buek-body capitalize text-white">{revision.status.replace("_", " ")}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="buek-card-title text-slate-400">Summary</h2>
        <p className="buek-body text-slate-300">{revision.summary}</p>
      </section>

      {revision.aiReview ? (
        <section className="space-y-4">
          <h2 className="buek-card-title text-slate-400">AI Review</h2>
          <ul className="space-y-3">
            {revision.aiReview.checks.map((check) => (
              <li
                key={check.label}
                className="buek-card flex items-start gap-3 rounded-xl border border-white/10"
              >
                <span className="text-lg">
                  {check.status === "pass" ? "✓" : check.status === "warning" ? "⚠" : "✕"}
                </span>
                <div>
                  <p className="buek-body text-white">{check.label}</p>
                  <p className="buek-small text-slate-500">{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!isDecided && mayApprove ? (
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleApprove()}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            Approve
          </button>
        ) : null}
        {!mayApprove && !isDecided ? (
          <p className="buek-small text-slate-500">Hanya Supervisor yang dapat menyetujui SOP revision.</p>
        ) : null}
        <button
          type="button"
          onClick={() =>
            onAskAi(`Review SOP revision ${revision.referenceId} ${revision.revision}`, revision.referenceId)
          }
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/5"
        >
          ✨ Jelaskan
        </button>
      </div>
    </div>
  );
}

function ReportQueueWorkspace({
  slug,
  onClose,
  onSelect
}: {
  slug: string;
  onClose: () => void;
  onSelect: (reportId: string) => void;
}) {
  const [reports, setReports] = useState<EngineeringReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingReports(slug)
      .then((data) => setReports(data.reports))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">AI Workspace</p>
          <h1 className="buek-heading text-white">Engineering Reports</h1>
          <p className="mt-2 buek-body text-slate-400">
            {loading ? "Loading..." : `${reports.length} reports pending`}
          </p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Back
        </button>
      </header>

      <div className="space-y-4">
        {reports.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => onSelect(report.id)}
            className="buek-card w-full rounded-2xl border border-white/10 text-left hover:border-cyan-400/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="buek-card-title text-white">{report.title}</p>
                <p className="mt-1 buek-small text-slate-500">
                  {report.author?.name}
                  {report.issueTitle ? ` · ${report.issueTitle}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
                {report.status.replace("_", " ")}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportDetailWorkspace({
  slug,
  reportId,
  userName,
  userRole,
  onClose,
  onBack,
  onAskAi,
  onDataChange
}: {
  slug: string;
  reportId: string;
  userName: string;
  userRole: string;
  onClose: () => void;
  onBack: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
  onDataChange?: () => void;
}) {
  const [report, setReport] = useState<EngineeringReport | null>(null);
  const [sections, setSections] = useState<ReportSections | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchReport(slug, reportId).then((data) => {
      setReport(data.report);
      if (data.report.sections) setSections(data.report.sections);
    });
  }, [slug, reportId]);

  async function handleApprove() {
    if (!report || acting) return;
    setActing(true);
    try {
      const result = await approveReport(slug, report.id, userName, userRole);
      setReport(result.report);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!report || acting) return;
    setActing(true);
    try {
      const result = await rejectReport(slug, report.id, userName, userRole);
      setReport(result.report);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleRequestRevision() {
    if (!report || acting) return;
    setActing(true);
    try {
      const result = await requestReportRevision(slug, report.id, userName, userRole);
      setReport(result.report);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleSave() {
    if (!report || !sections || acting) return;
    setActing(true);
    try {
      const result = await updateReportSections(slug, report.id, sections, userName);
      setReport(result.report);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  async function handleSubmit() {
    if (!report || acting) return;
    setActing(true);
    try {
      const result = await submitReportForApproval(slug, report.id, userName);
      setReport(result.report);
      onDataChange?.();
    } finally {
      setActing(false);
    }
  }

  if (!report) {
    return <p className="buek-body text-slate-500">Loading report...</p>;
  }

  const isDecided = report.status === "approved" || report.status === "rejected";
  const mayApprove = canApprove(userRole);
  const engineerView = isEngineer(userRole);
  const editable = engineerView && (report.status === "draft" || report.status === "revision_requested");
  const displaySections = sections ?? report.sections;

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <button type="button" onClick={onBack} className="buek-small text-cyan-400 hover:text-cyan-300">
            ← Engineering Reports
          </button>
          <h1 className="mt-3 buek-heading text-white">Investigation Report</h1>
          <p className="mt-2 buek-body text-slate-400">
            {report.reportNumber ?? report.id} · v{report.version ?? 1} · {report.author?.name}
          </p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          Close
        </button>
      </header>

      <div className="buek-card rounded-2xl border border-white/10 bg-slate-900/50 p-8 font-mono text-sm leading-relaxed text-slate-200">
        <p className="text-center text-base font-bold tracking-widest text-white">INVESTIGATION REPORT</p>
        <p className="my-4 text-center text-slate-500">--------------------------------</p>
        <div className="grid gap-1 sm:grid-cols-2">
          <p>Problem     : {report.issueTitle ?? report.title}</p>
          <p>Machine     : {report.machineCode ?? "—"}</p>
          <p>Engineer    : {report.author?.name ?? "—"}</p>
          <p>Document No : {report.reportNumber ?? "—"}</p>
        </div>
        <p className="my-4 text-center text-slate-500">--------------------------------</p>

        {displaySections ? (
          <>
            {(
              [
                ["1. Background", "background"],
                ["2. Evidence", "evidence"],
                ["3. Root Cause", "rootCause"],
                ["4. Countermeasure", "countermeasure"],
                ["5. Verification", "verification"]
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="mb-6">
                <p className="font-semibold text-white">{label}</p>
                <p className="my-2 text-slate-500">--------------------------------</p>
                {editable && sections ? (
                  <textarea
                    value={sections[key]}
                    onChange={(e) => setSections({ ...sections, [key]: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-sans text-slate-200"
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{displaySections[key] || "____________________"}</p>
                )}
              </div>
            ))}
            <div>
              <p className="font-semibold text-white">Attachments</p>
              <p className="my-2 text-slate-500">--------------------------------</p>
              {(displaySections.attachments ?? ["Photo", "SOP", "Trend"]).map((a) => (
                <p key={a}>□ {a}</p>
              ))}
            </div>
          </>
        ) : (
          <pre className="whitespace-pre-wrap">{report.content}</pre>
        )}

        <p className="my-4 text-center text-slate-500">--------------------------------</p>
        <p>
          Status: <span className="font-semibold uppercase text-cyan-300">{report.status.replace("_", " ")}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {editable ? (
          <>
            <button
              type="button"
              disabled={acting || !sections}
              onClick={() => void handleSave()}
              className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/5 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => void handleSubmit()}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              Submit for Approval
            </button>
          </>
        ) : null}
        {!isDecided && mayApprove && report.status === "pending_approval" ? (
          <>
            <button
              type="button"
              disabled={acting}
              onClick={() => void handleApprove()}
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => void handleRequestRevision()}
              className="rounded-xl border border-amber-500/40 px-6 py-3 font-semibold text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
            >
              Request Revision
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => void handleReject()}
              className="rounded-xl border border-red-500/40 px-6 py-3 font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        ) : null}
        {!mayApprove && report.status === "pending_approval" && !isDecided ? (
          <p className="buek-small text-slate-500">
            Laporan menunggu persetujuan Supervisor. Engineer tidak dapat approve.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => onAskAi(`Review engineering report: ${report.title}`, report.title)}
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/5"
        >
          ✨ AI Summary
        </button>
      </div>
    </div>
  );
}

const shiftIcon = { done: "✔", running: "▶", waiting: "○" } as const;

function CustomerComplaintListWorkspace({
  slug,
  onClose,
  onSelect
}: {
  slug: string;
  onClose: () => void;
  onSelect: (complaintId: string) => void;
}) {
  const [complaints, setComplaints] = useState<CustomerComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints(slug)
      .then((data) => setComplaints(data.complaints))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">Workspace</p>
          <h1 className="buek-heading text-white">Customer Complaint</h1>
          <p className="mt-2 buek-body text-slate-400">
            {loading ? "Loading..." : `${complaints.length} complaint aktif`}
          </p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Back
        </button>
      </header>

      <div className="space-y-4">
        {complaints.map((complaint) => (
          <button
            key={complaint.id}
            type="button"
            onClick={() => onSelect(complaint.id)}
            className="buek-card w-full rounded-2xl border border-white/10 text-left hover:border-cyan-400/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="buek-card-title text-white">{complaint.complaintNumber}</p>
                <p className="mt-1 buek-body text-slate-300">
                  {complaint.customerName} · {complaint.product}
                </p>
              </div>
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300 capitalize">
                {complaint.priority}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomerComplaintDetailWorkspace({
  slug,
  complaintId,
  onClose,
  onBack,
  onAskAi
}: {
  slug: string;
  complaintId: string;
  onClose: () => void;
  onBack: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
}) {
  const [complaint, setComplaint] = useState<CustomerComplaint | null>(null);

  useEffect(() => {
    fetchComplaint(slug, complaintId).then((data) => setComplaint(data.complaint));
  }, [slug, complaintId]);

  if (!complaint) {
    return <p className="buek-body text-slate-500">Memuat customer complaint...</p>;
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <button type="button" onClick={onBack} className="buek-small text-cyan-400 hover:text-cyan-300">
            ← Customer Complaint
          </button>
          <h1 className="mt-3 buek-heading text-white">{complaint.complaintNumber}</h1>
          <p className="mt-2 buek-body text-slate-400">{complaint.customerName}</p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          Close
        </button>
      </header>

      <div className="buek-card rounded-2xl border border-white/10 bg-slate-900/50 p-8 font-mono text-sm text-slate-200">
        <p className="text-center font-bold tracking-widest text-white">CUSTOMER COMPLAINT</p>
        <p className="my-4 text-center text-slate-500">--------------------------------</p>
        <p>Complaint ID : {complaint.complaintNumber}</p>
        <p>Customer     : {complaint.customerName}</p>
        <p>Product      : {complaint.product}</p>
        <p>Reported     : {new Date(complaint.reportedAt).toLocaleDateString("id-ID")}</p>
        <p>Priority     : {complaint.priority}</p>
        <p>Status       : {complaint.status}</p>
        <p>PIC          : {complaint.engineer?.name ?? "—"}</p>
        <p className="my-4 text-center text-slate-500">--------------------------------</p>
        {complaint.description ? <p className="whitespace-pre-wrap">{complaint.description}</p> : null}
      </div>

      {complaint.timeline.length > 0 ? (
        <section className="space-y-3">
          <h2 className="buek-card-title text-slate-400">Timeline</h2>
          <ul className="space-y-2">
            {complaint.timeline.map((entry) => (
              <li key={`${entry.time}-${entry.title}`} className="buek-body text-slate-300">
                {entry.time} — {entry.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {complaint.attachments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="buek-card-title text-slate-400">Attachments</h2>
          {complaint.attachments.map((a) => (
            <p key={a} className="buek-body text-slate-400">
              □ {a}
            </p>
          ))}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {[
          { label: "✨ Ringkas", prompt: `Ringkas customer complaint ${complaint.complaintNumber}` },
          { label: "✨ Cari kasus serupa", prompt: `Cari kasus serupa untuk ${complaint.product}` },
          { label: "✨ Draft Report", prompt: `Buat draft laporan investigasi untuk ${complaint.complaintNumber}` }
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => onAskAi(action.prompt, complaint.complaintNumber)}
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductionDashboardWorkspace({
  slug,
  onClose,
  onAskAi
}: {
  slug: string;
  onClose: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
}) {
  const [data, setData] = useState<ProductionDashboard | null>(null);

  useEffect(() => {
    fetchProductionDashboard(slug).then((res) => setData(res.dashboard));
  }, [slug]);

  if (!data) {
    return <p className="buek-body text-slate-500">Memuat data produksi...</p>;
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">Workspace</p>
          <h1 className="buek-heading text-white">Produksi Hari Ini</h1>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Kembali
        </button>
      </header>

      <div className="buek-card grid gap-6 rounded-2xl border border-white/10 sm:grid-cols-3">
        <div>
          <p className="buek-small text-slate-500">Target</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {data.target.toLocaleString("id-ID")} {data.unit}
          </p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Saat Ini</p>
          <p className="mt-2 text-3xl font-bold text-cyan-400">
            {data.current.toLocaleString("id-ID")} {data.unit}
          </p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Pencapaian</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{data.achievement}%</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="buek-card-title text-slate-400">Shift</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {data.shifts.map((shift) => (
            <div key={shift.name} className="buek-card rounded-xl border border-white/10 px-5 py-4">
              <p className="buek-body text-white">{shift.name}</p>
              <p className="mt-2 buek-small text-slate-400">
                {shiftIcon[shift.status]}{" "}
                {shift.status === "done"
                  ? "Selesai"
                  : shift.status === "running"
                    ? "Berjalan"
                    : "Menunggu"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="buek-card grid gap-4 rounded-2xl border border-white/10 sm:grid-cols-2">
        <div>
          <p className="buek-small text-slate-500">Issue Terbuka</p>
          <p className="mt-1 text-2xl font-bold text-white">{data.issues.total}</p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Kritis</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{data.issues.critical}</p>
        </div>
      </section>

      {data.risks.length ? (
        <section className="space-y-2">
          <h2 className="buek-card-title text-slate-400">Risiko</h2>
          {data.risks.map((risk) => (
            <p key={risk} className="buek-body text-amber-300/90">
              ⚠ {risk}
            </p>
          ))}
        </section>
      ) : null}

      <button
        type="button"
        onClick={() =>
          onAskAi(
            "Jelaskan status produksi hari ini dan risiko yang perlu diperhatikan supervisor",
            "Produksi Hari Ini"
          )
        }
        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 font-semibold text-cyan-300 hover:bg-cyan-500/20"
      >
        ✨ Jelaskan
      </button>
    </div>
  );
}

function KpiDetailWorkspace({
  slug,
  kpiLabel,
  onClose,
  onAskAi
}: {
  slug: string;
  kpiLabel: string;
  onClose: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
}) {
  const [kpi, setKpi] = useState<KpiDetail | null>(null);

  useEffect(() => {
    fetchKpiDetail(slug, kpiLabel).then((res) => setKpi(res.kpi));
  }, [slug, kpiLabel]);

  if (!kpi) {
    return <p className="buek-body text-slate-500">Memuat KPI {kpiLabel}...</p>;
  }

  const trendLabel = kpi.trend === "up" ? "▲ Naik" : kpi.trend === "down" ? "▼ Turun" : "→ Stabil";

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">KPI</p>
          <h1 className="buek-heading text-white">{kpi.label}</h1>
          <p className="mt-2 buek-body text-slate-400">Target: {kpi.target}</p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Kembali
        </button>
      </header>

      <div className="buek-card rounded-2xl border border-white/10 text-center">
        <p className="text-5xl font-bold text-white">{kpi.value}</p>
        <p className="mt-2 buek-body text-slate-400">{trendLabel}</p>
      </div>

      <section className="space-y-3">
        <h2 className="buek-card-title text-slate-400">Sorotan</h2>
        <ul className="space-y-2">
          {kpi.highlights.map((item) => (
            <li key={item} className="buek-body text-slate-300">
              • {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="h-24 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex h-full items-end gap-1">
          {kpi.series.map((point) => (
            <div
              key={point.time}
              className="flex-1 rounded-t bg-cyan-500/70"
              style={{ height: `${Math.max(12, point.value)}%` }}
              title={`${point.time}: ${point.value}%`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onAskAi(`Jelaskan KPI ${kpi.label} hari ini dan berikan rekomendasi`, kpi.label)
        }
        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 font-semibold text-cyan-300 hover:bg-cyan-500/20"
      >
        ✨ Jelaskan
      </button>
    </div>
  );
}
