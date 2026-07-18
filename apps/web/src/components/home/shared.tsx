import type { DemoUser, RoleHomeData, Workspace } from "../../types.js";

export interface RoleHomeProps {
  user: DemoUser;
  workspace: Workspace;
  roleHome: RoleHomeData;
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onAsk: (prompt: string) => void;
  onAction: (prompt: string, contextLabel: string) => void;
}

export function RoleHomeHeader({
  user,
  workspace,
  subtitle
}: {
  user: DemoUser;
  workspace: Workspace;
  subtitle: string;
}) {
  return (
    <header className="space-y-3 border-b border-white/10 pb-8">
      <h1 className="buek-heading text-white">Good Morning, {user.name} 👋</h1>
      <p className="buek-body text-slate-400">
        {user.role} <span className="text-slate-600">•</span> {workspace.organization}
      </p>
      <p className="buek-subtitle text-slate-500">{subtitle}</p>
    </header>
  );
}
