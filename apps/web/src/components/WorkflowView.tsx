import { useEffect, useState } from "react";
import { fetchWorkflows, type WorkflowItem } from "../lib/data-api.js";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";

interface WorkflowViewProps {
  workspaceSlug: string;
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

export function WorkflowView({ workspaceSlug, onAsk, onOpenWorkspace }: WorkflowViewProps) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">Workflow</h1>
        <p className="mt-2 text-base text-slate-400">
          Live workflows from the operating graph — investigations, approvals, and checklists.
        </p>
      </header>

      {loading ? (
        <p className="text-slate-500">Loading workflows...</p>
      ) : (
        <ul className="space-y-3">
          {workflows.map((workflow) => (
            <li key={`${workflow.type}-${workflow.id}`}>
              <button
                type="button"
                onClick={() => handleSelect(workflow)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 px-6 py-5 text-left transition hover:border-cyan-400/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-white">{workflow.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{workflowTypeLabel(workflow.type)}</span>
                    <span>·</span>
                    <span className="capitalize">{workflowStatusLabel(workflow.status)}</span>
                    {workflow.owner ? (
                      <>
                        <span>·</span>
                        <span>{workflow.owner}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${workflow.progress}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 shrink-0 text-cyan-400">→</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
