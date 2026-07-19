import { useEffect, useMemo, useState } from "react";
import { fetchWorkflows, type WorkflowItem } from "../lib/data-api.js";
import { roleKey } from "../lib/roles.js";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";

interface WorkflowViewProps {
  workspaceSlug: string;
  userRole: string;
  onAsk: (prompt: string) => void;
  onOpenWorkspace?: (workspace: DynamicWorkspaceState) => void;
}

function workflowStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function workflowTypeLabel(type: string) {
  if (type === "investigation") return "Investigation";
  if (type === "work_order") return "Work Order";
  if (type === "sop_revision") return "SOP Revision";
  if (type === "engineering_report") return "Engineering Report";
  if (type === "operator_checklist") return "Operator Checklist";
  return type;
}

function workflowsForRole(workflows: WorkflowItem[], role: string): WorkflowItem[] {
  switch (roleKey(role)) {
    case "engineer":
      return workflows.filter((workflow) =>
        ["investigation", "engineering_report"].includes(workflow.type)
      );
    case "supervisor":
      return workflows.filter((workflow) =>
        ["work_order", "sop_revision", "engineering_report", "investigation"].includes(workflow.type)
      );
    default:
      return workflows;
  }
}

export function WorkflowView({ workspaceSlug, userRole, onAsk, onOpenWorkspace }: WorkflowViewProps) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const filteredWorkflows = useMemo(
    () => workflowsForRole(workflows, userRole),
    [workflows, userRole]
  );

  useEffect(() => {
    fetchWorkflows(workspaceSlug)
      .then((data) => setWorkflows(data.workflows))
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  function handleSelect(workflow: WorkflowItem) {
    if (!onOpenWorkspace) {
      onAsk(`Continue ${workflow.title} workflow`);
      return;
    }

    if (workflow.type === "investigation" && workflow.issueKey) {
      onOpenWorkspace({ kind: "investigation", slug: workspaceSlug, issueKey: workflow.issueKey });
      return;
    }
    if (workflow.type === "work_order") {
      onOpenWorkspace({ kind: "approval-queue", slug: workspaceSlug });
      return;
    }
    if (workflow.type === "sop_revision") {
      onOpenWorkspace({ kind: "sop-revision", slug: workspaceSlug, revisionId: workflow.entityId });
      return;
    }
    if (workflow.type === "engineering_report") {
      onOpenWorkspace({ kind: "engineering-report", slug: workspaceSlug, reportId: workflow.entityId });
      return;
    }

    onAsk(`Continue ${workflow.title} workflow`);
  }

  const roleDescriptions: Record<string, string> = {
    engineer: "Investigasi dan laporan engineering — tugas engineer hari ini.",
    supervisor: "Approval queue, investigasi tim, dan SOP revision — tugas supervisor.",
    operator: "",
    manager: ""
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">Workflow</h1>
        <p className="mt-2 text-base text-slate-400">
          {roleDescriptions[roleKey(userRole)] ??
            "Live workflows from the operating graph — investigations, approvals, and checklists."}
        </p>
      </header>

      {loading ? (
        <p className="text-slate-500">Loading workflows...</p>
      ) : filteredWorkflows.length === 0 ? (
        <p className="text-slate-500">Tidak ada workflow aktif untuk role Anda saat ini.</p>
      ) : (
        <ul className="space-y-3">
          {filteredWorkflows.map((workflow) => (
            <li key={`${workflow.type}-${workflow.id}`}>
              <button
                type="button"
                onClick={() => handleSelect(workflow)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 px-6 py-5 text-left transition hover:border-cyan-400/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {workflowTypeLabel(workflow.type)}
                  </p>
                  <p className="mt-1 text-lg font-medium text-white">{workflow.title}</p>
                  {workflow.owner ? (
                    <p className="mt-1 text-sm text-slate-500">{workflow.owner}</p>
                  ) : null}
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm capitalize text-cyan-300">
                    {workflowStatusLabel(workflow.status)}
                  </p>
                  <p className="text-xs text-slate-500">{workflow.progress}%</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
