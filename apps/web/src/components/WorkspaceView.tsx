import { SurfaceCard } from "@buek/ui";
import type { Workspace } from "../types.js";

interface WorkspaceViewProps {
  workspace: Workspace;
}

export function WorkspaceView({ workspace }: WorkspaceViewProps) {
  const totalDocuments = workspace.documentStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-slate-400">Context for your AI worker — not a navigation menu.</p>
      </header>

      <SurfaceCard>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-slate-500">Company</dt>
            <dd className="mt-1 font-medium text-slate-100">{workspace.organization}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Industry</dt>
            <dd className="mt-1 font-medium text-slate-100">{workspace.industry}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Knowledge</dt>
            <dd className="mt-1 font-medium text-slate-100">{totalDocuments} Documents</dd>
          </div>
          <div>
            <dt className="text-slate-500">AI Worker</dt>
            <dd className="mt-1 font-medium text-slate-100">{workspace.aiWorker}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Last Sync</dt>
            <dd className="mt-1 font-medium text-slate-100">{workspace.lastSync}</dd>
          </div>
        </dl>
      </SurfaceCard>

      {workspace.status === "no-knowledge" ? (
        <p className="rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/5 p-4 text-sm text-yellow-100">
          Upload SOP, Work Instruction, and QC Standard to activate the AI worker.
        </p>
      ) : null}
    </div>
  );
}
