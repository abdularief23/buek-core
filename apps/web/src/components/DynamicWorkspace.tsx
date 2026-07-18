import { useEffect, useState } from "react";
import {
  advanceInvestigation,
  approveReport,
  approveSopRevision,
  approveWorkOrder,
  fetchIssueByKey,
  fetchPendingReports,
  fetchPendingSopRevisions,
  fetchPendingWorkOrders,
  fetchReport,
  fetchSopRevision,
  fetchWorkOrder,
  rejectWorkOrder,
  type EngineeringReport,
  type SopRevision,
  type WorkOrder
} from "../lib/data-api.js";

export type DynamicWorkspaceState =
  | { kind: "approval-queue"; slug: string }
  | { kind: "work-order"; slug: string; workOrderId: string }
  | { kind: "investigation"; slug: string; issueKey: string }
  | { kind: "sop-revisions"; slug: string }
  | { kind: "sop-revision"; slug: string; revisionId: string }
  | { kind: "engineering-reports"; slug: string }
  | { kind: "engineering-report"; slug: string; reportId: string };

interface DynamicWorkspaceProps {
  workspace: DynamicWorkspaceState;
  userName: string;
  onClose: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
  onWorkspaceChange: (next: DynamicWorkspaceState) => void;
  onDataChange?: () => void;
}

export function DynamicWorkspace({
  workspace,
  userName,
  onClose,
  onAskAi,
  onWorkspaceChange,
  onDataChange
}: DynamicWorkspaceProps) {
  const notifyChange = onDataChange ?? (() => {});

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
        onClose={onClose}
        onAskAi={onAskAi}
        onDataChange={notifyChange}
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
  onClose,
  onBack,
  onAskAi,
  onDataChange
}: {
  slug: string;
  workOrderId: string;
  userName: string;
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
      const result = await approveWorkOrder(slug, order.id, userName);
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
        {!isDecided ? (
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
        <button
          type="button"
          onClick={() =>
            onAskAi(`Why should I ${isDecided ? "have" : ""} approve work order ${order.number}?`, order.number)
          }
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/5"
        >
          Ask AI
        </button>
      </div>
    </div>
  );
}

function InvestigationWorkspace({
  slug,
  issueKey,
  onClose,
  onAskAi,
  onDataChange
}: {
  slug: string;
  issueKey: string;
  onClose: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
  onDataChange?: () => void;
}) {
  const [issue, setIssue] = useState<import("../lib/data-api.js").IssueRecord | null>(null);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    fetchIssueByKey(slug, issueKey).then((data) => setIssue(data.issue));
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

  if (!issue) {
    return <p className="buek-body text-slate-500">Loading investigation...</p>;
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="buek-small text-slate-500">AI Workspace · Investigation</p>
          <h1 className="buek-heading text-white">{issue.title}</h1>
          <p className="mt-2 buek-body text-slate-400">{issue.machine?.code}</p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          ← Back
        </button>
      </header>

      <div className="buek-card grid gap-4 rounded-2xl border border-white/10 sm:grid-cols-4">
        <div>
          <p className="buek-small text-slate-500">Status</p>
          <p className="buek-body capitalize text-white">{issue.status}</p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Owner</p>
          <p className="buek-body text-white">{issue.owner?.name}</p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Due</p>
          <p className="buek-body text-white">Today</p>
        </div>
        <div>
          <p className="buek-small text-slate-500">Progress</p>
          <p className="buek-body text-cyan-300">{issue.progress}%</p>
        </div>
      </div>

      {issue.investigation ? (
        <section className="space-y-4">
          <h2 className="buek-card-title text-slate-400">Workflow</h2>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-cyan-500 transition-all"
              style={{ width: `${issue.investigation.progress}%` }}
            />
          </div>
          <ul className="space-y-2">
            {issue.investigation.steps.map((step) => (
              <li key={step.key}>
                <button
                  type="button"
                  disabled={step.done || advancing}
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

      {issue.graph?.length ? (
        <section className="space-y-3">
          <h2 className="buek-card-title text-slate-400">Knowledge Graph</h2>
          {issue.graph.map((edge) => (
            <p key={`${edge.relation}-${edge.toId}`} className="buek-small text-slate-500">
              {edge.relation.replace("_", " ")} → {edge.label}
            </p>
          ))}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {["Generate 5 Why", "Fishbone", "Find Similar Case", "Create Report"].map((action) => (
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
  onClose,
  onBack,
  onAskAi,
  onDataChange
}: {
  slug: string;
  revisionId: string;
  userName: string;
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
      const result = await approveSopRevision(slug, revision.id, userName);
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
        {!isDecided ? (
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleApprove()}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            Approve
          </button>
        ) : null}
        <button
          type="button"
          onClick={() =>
            onAskAi(`Review SOP revision ${revision.referenceId} ${revision.revision}`, revision.referenceId)
          }
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/5"
        >
          Ask AI
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
  onClose,
  onBack,
  onAskAi,
  onDataChange
}: {
  slug: string;
  reportId: string;
  userName: string;
  onClose: () => void;
  onBack: () => void;
  onAskAi: (prompt: string, contextLabel: string) => void;
  onDataChange?: () => void;
}) {
  const [report, setReport] = useState<EngineeringReport | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchReport(slug, reportId).then((data) => setReport(data.report));
  }, [slug, reportId]);

  async function handleApprove() {
    if (!report || acting) return;
    setActing(true);
    try {
      const result = await approveReport(slug, report.id, userName);
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

  return (
    <div className="space-y-8 pb-16">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <button type="button" onClick={onBack} className="buek-small text-cyan-400 hover:text-cyan-300">
            ← Engineering Reports
          </button>
          <h1 className="mt-3 buek-heading text-white">{report.title}</h1>
          <p className="mt-2 buek-body text-slate-400">{report.author?.name}</p>
        </div>
        <button type="button" onClick={onClose} className="buek-small text-slate-500 hover:text-white">
          Close
        </button>
      </header>

      <div className="buek-card rounded-2xl border border-white/10">
        <p className="buek-small text-slate-500">Status</p>
        <p className="mt-1 buek-body capitalize text-white">{report.status.replace("_", " ")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="buek-card-title text-slate-400">Report Content</h2>
        <pre className="whitespace-pre-wrap buek-body text-slate-300">{report.content}</pre>
      </section>

      <div className="flex flex-wrap gap-3">
        {!isDecided ? (
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleApprove()}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            Approve
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onAskAi(`Review engineering report: ${report.title}`, report.title)}
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/5"
        >
          Ask AI
        </button>
      </div>
    </div>
  );
}
