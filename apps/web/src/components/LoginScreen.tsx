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
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/30"
      >
        <div className="flex flex-col items-center text-center">
          <img
            src="/logo-mark.svg"
            alt="Buek Core logo"
            className="h-20 w-20 rounded-3xl bg-white p-3"
          />
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Buek Core
          </p>
          <h1 className="mt-3 text-3xl font-bold">Enterprise AI Operating System</h1>
          <p className="mt-3 text-sm text-slate-400">Sign in to your workspace. No company selection.</p>
        </div>

        <label className="mt-8 block text-sm text-slate-300">
          Company ID
          <input
            value={companyId}
            onChange={(event) => onCompanyIdChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none ring-cyan-300 focus:ring-2"
          />
        </label>
        <label className="mt-4 block text-sm text-slate-300">
          Username
          <input
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none ring-cyan-300 focus:ring-2"
          />
        </label>
        <label className="mt-4 block text-sm text-slate-300">
          Password
          <input
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            type="password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none ring-cyan-300 focus:ring-2"
          />
        </label>

        {loginError ? <p className="mt-4 text-center text-sm text-red-400">{loginError}</p> : null}

        <Button className="mt-6 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">Sign In</Button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Epson Demo / demo / demo123 → Epson Indonesia
        </p>
      </form>
    </section>
  );
}
