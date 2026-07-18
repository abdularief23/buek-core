import { Button } from "@buek/ui";
import { useEffect, useState, type FormEvent } from "react";
import type { DemoWorkspaceOption } from "../types.js";

interface LoginScreenProps {
  loginError: string | null;
  onProductionSignIn: (email: string, password: string) => Promise<void>;
  onDemoLaunch: (workspaceId: string, role: string) => Promise<void>;
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const demoOptionsEndpoint = `${configuredApiUrl}/api/auth/demo-options`;

const fallbackWorkspaces: DemoWorkspaceOption[] = [
  { id: "epson-factory", label: "Epson Indonesia" },
  { id: "toyota-plant", label: "Toyota Indonesia" },
  { id: "nestle-factory", label: "Nestlé Indonesia" },
  { id: "custom-company", label: "Custom Workspace" }
];

const fallbackRoles = ["Operator", "Engineer", "Supervisor", "Plant Manager"];

export function LoginScreen({ loginError, onProductionSignIn, onDemoLaunch }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaces, setWorkspaces] = useState<DemoWorkspaceOption[]>(fallbackWorkspaces);
  const [roles, setRoles] = useState<string[]>(fallbackRoles);
  const [selectedWorkspace, setSelectedWorkspace] = useState("epson-factory");
  const [selectedRole, setSelectedRole] = useState("Engineer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(demoOptionsEndpoint)
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as {
          workspaces: DemoWorkspaceOption[];
          roles: string[];
        };
        if (data.workspaces.length) setWorkspaces(data.workspaces);
        if (data.roles.length) setRoles(data.roles);
      })
      .catch(() => undefined);
  }, []);

  async function handleProductionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onProductionSignIn(email, password);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLaunch() {
    setIsSubmitting(true);
    try {
      await onDemoLaunch(selectedWorkspace, selectedRole);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="text-center">
        <img src="/logo-mark.svg" alt="" className="mx-auto h-14 w-14 rounded-2xl bg-white p-2" />
        <h1 className="mt-6 text-2xl font-semibold">Buek Core</h1>
        <p className="mt-2 text-sm text-slate-500">Enterprise AI Operating System</p>
      </div>

      <form onSubmit={handleProductionSubmit} className="mt-10 space-y-4">
        <p className="text-xs font-medium tracking-wide text-slate-500">Production</p>
        <label className="block text-sm text-slate-400">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            className="mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400/50"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400/50"
          />
        </label>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white text-slate-950 hover:bg-slate-200"
        >
          Sign In
        </Button>
      </form>

      <div className="my-8 border-t border-white/10" />

      <div className="space-y-5">
        <p className="text-xs font-medium tracking-wide text-slate-500">Demo Workspace</p>

        <fieldset className="space-y-2">
          <legend className="sr-only">Select demo workspace</legend>
          {workspaces.map((workspace) => (
            <label
              key={workspace.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5"
            >
              <input
                type="radio"
                name="demo-workspace"
                value={workspace.id}
                checked={selectedWorkspace === workspace.id}
                onChange={() => setSelectedWorkspace(workspace.id)}
                className="accent-cyan-400"
              />
              {workspace.label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm text-slate-400">Role</legend>
          {roles.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5"
            >
              <input
                type="radio"
                name="demo-role"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="accent-cyan-400"
              />
              {role}
            </label>
          ))}
        </fieldset>

        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleDemoLaunch()}
          className="w-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
        >
          Launch Demo
        </Button>
      </div>

      {loginError ? <p className="mt-6 text-center text-sm text-red-400">{loginError}</p> : null}
    </section>
  );
}
