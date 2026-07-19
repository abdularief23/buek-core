import { LoadingState } from "@buek/ui";
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

const INVESTIGATION_STEPS = ["Evidence", "Root Cause", "Countermeasure", "Execution", "Submit"];

function investigationStepIndex(progress: number) {
  if (progress >= 85) return 4;
  if (progress >= 65) return 3;
  if (progress >= 45) return 2;
  if (progress >= 25) return 1;
  return 0;
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
        <LoadingState label="Loading workflows..." />
      ) : filteredWorkflows.length === 0 ? (
        <p className="text-slate-500">Tidak ada workflow aktif untuk role Anda saat ini.</p>
      ) : (
        <ul className="space-y-4">
          {filteredWorkflows.map((workflow) => {
            const currentStep =
              workflow.type === "investigation" ? investigationStepIndex(workflow.progress) : -1;

            return (
            <li key={`${workflow.type}-${workflow.id}`}>
              <button
                type="button"
                onClick={() => handleSelect(workflow)}
                className="mobile-touch-card buek-card-hover flex w-full flex-col rounded-2xl border border-white/10 px-5 py-5 text-left transition hover:border-cyan-400/30 lg:px-6"
              >
                <div className="flex w-full items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="mobile-small text-xs uppercase tracking-wide text-slate-500">
                      {workflowTypeLabel(workflow.type)}
                    </p>
                    <p className="mobile-title mt-1 text-xl font-semibold text-white lg:text-lg">
                      {workflow.title}
                    </p>
                    {workflow.owner ? (
                      <p className="mobile-body mt-1 text-slate-500">{workflow.owner}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mobile-body text-2xl font-bold text-cyan-400">{workflow.progress}%</p>
                    <p className="mobile-small capitalize text-slate-500">
                      {workflowStatusLabel(workflow.status)}
                    </p>
                  </div>
                </div>

                {workflow.type === "investigation" ? (
                  <div className="mt-4 w-full border-t border-white/10 pt-4">
                    <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-500"
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                    <ol className="space-y-2">
                      {INVESTIGATION_STEPS.map((step, index) => {
                        const done = index < currentStep;
                        const active = index === currentStep;
                        return (
                          <li
                            key={step}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                              active ? "bg-cyan-500/10 text-cyan-300" : done ? "text-emerald-400" : "text-slate-500"
                            }`}
                          >
                            <span>{done ? "✔" : active ? "→" : "□"}</span>
                            <span className="mobile-body">{step}</span>
                            {active ? <span className="ml-auto mobile-small">Tap to Continue</span> : null}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : null}

                <p className="mobile-btn mt-4 w-full rounded-xl border border-cyan-500/30 py-3 text-center font-medium text-cyan-300 lg:hidden">
                  Continue →
                </p>
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
