import type { DemoUser, Workspace } from "../types.js";

interface WorkspaceViewProps {
  workspace: Workspace;
  user: DemoUser;
}

export function WorkspaceView({ workspace, user }: WorkspaceViewProps) {
  const totalDocuments = workspace.documentStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="mx-auto max-w-md space-y-8">
      <h2 className="text-lg font-medium text-slate-200">Workspace</h2>

      <dl className="space-y-5 text-sm">
        <div>
          <dt className="text-slate-500">Company</dt>
          <dd className="mt-1 text-slate-100">{workspace.organization}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Industry</dt>
          <dd className="mt-1 text-slate-100">{workspace.industry}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Role</dt>
          <dd className="mt-1 text-slate-100">{user.role}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Knowledge</dt>
          <dd className="mt-1 text-slate-100">{totalDocuments} Documents</dd>
        </div>
        <div>
          <dt className="text-slate-500">Last Sync</dt>
          <dd className="mt-1 text-slate-100">{workspace.lastSync}</dd>
        </div>
      </dl>

      {workspace.status === "no-knowledge" ? (
        <p className="text-sm text-slate-500">
          Upload SOP to activate the AI worker for this workspace.
        </p>
      ) : null}
    </div>
  );
}
