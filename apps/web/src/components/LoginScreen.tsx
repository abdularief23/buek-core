import { Button } from "@buek/ui";
import type { FormEvent } from "react";

interface LoginScreenProps {
  companyId: string;
  username: string;
  password: string;
  loginError: string | null;
  onCompanyIdChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function LoginScreen({
  companyId,
  username,
  password,
  loginError,
  onCompanyIdChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit
}: LoginScreenProps) {
  return (
    <section className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="text-center">
          <img src="/logo-mark.svg" alt="" className="mx-auto h-14 w-14 rounded-2xl bg-white p-2" />
          <h1 className="mt-6 text-2xl font-semibold">Buek Core</h1>
          <p className="mt-2 text-sm text-slate-500">Enterprise AI Operating System</p>
        </div>

        <label className="block text-sm text-slate-400">
          Company ID
          <input
            value={companyId}
            onChange={(event) => onCompanyIdChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400/50"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Username
          <input
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400/50"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Password
          <input
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            type="password"
            className="mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400/50"
          />
        </label>

        {loginError ? <p className="text-center text-sm text-red-400">{loginError}</p> : null}

        <Button className="w-full bg-white text-slate-950 hover:bg-slate-200">Sign In</Button>

        <p className="text-center text-xs text-slate-600">
          Your company is determined by your account — no company selection needed.
        </p>
      </form>
    </section>
  );
}
