import { useEffect, useState, type FormEvent } from "react";
import {
  fetchOperatorChecklist,
  submitOperatorReport,
  toggleChecklistItem,
  type OperatorChecklist
} from "../../lib/data-api.js";
import { TodayTimeline } from "../TodayTimeline.js";
import type { RoleHomeProps } from "./shared.js";

export function OperatorHome({
  user,
  workspace,
  roleHome
}: RoleHomeProps) {
  const op = roleHome.operator!;
  const [checklist, setChecklist] = useState<OperatorChecklist | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [machineCode, setMachineCode] = useState(op.line.includes("EA") ? "EA-04" : "M-312");
  const [rejectCount, setRejectCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOperatorChecklist(workspace.id)
      .then((data) => setChecklist(data.checklist))
      .catch(() => setChecklist(null));
  }, [workspace.id]);

  const line = checklist?.line ?? op.line;
  const shift = checklist?.shift ?? op.shift;
  const targetOutput = checklist?.targetOutput ?? op.targetOutput;
  const progress = checklist?.progress ?? op.progress;
  const items = checklist?.items ?? op.checklist;
  const progressPct = Math.round((progress / targetOutput) * 100);

  async function handleToggle(itemId: string) {
    if (toggling) return;
    setToggling(itemId);
    try {
      const result = await toggleChecklistItem(workspace.id, itemId, user.role);
      if (result.checklist) setChecklist(result.checklist);
    } finally {
      setToggling(null);
    }
  }

  async function handleReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!problem.trim() || submitting) return;
    setSubmitting(true);
    setReportMessage(null);
    try {
      const result = await submitOperatorReport(workspace.id, {
        problem: problem.trim(),
        shift,
        machineCode,
        occurredAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        rejectCount,
        reporterName: user.name,
        ...(notes.trim() ? { notes: notes.trim() } : {})
      }, user.role);
      setReportMessage(result.message);
      setProblem("");
      setNotes("");
      setRejectCount(1);
    } catch {
      setReportMessage("Gagal mengirim laporan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-12 pb-16">
      <header className="space-y-3 border-b border-white/10 pb-8">
        <h1 className="buek-heading text-white">Good Morning, {user.name} 👋</h1>
        <p className="buek-body text-slate-400">
          Operator <span className="text-slate-600">•</span> {line}
        </p>
        <p className="buek-subtitle text-slate-500">
          {workspace.organization} · {shift}
        </p>
      </header>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Laporkan Masalah</h2>
        <p className="buek-small text-slate-500">
          Isi form, submit — selesai. Engineer akan mendapat notifikasi.
        </p>
        <form onSubmit={(e) => void handleReportSubmit(e)} className="buek-card space-y-4 rounded-2xl border border-white/10 p-6">
          <label className="block space-y-2">
            <span className="buek-small text-slate-500">Problem</span>
            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Misalnya: White Streak"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block space-y-2">
              <span className="buek-small text-slate-500">Shift</span>
              <input value={shift} readOnly className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-400" />
            </label>
            <label className="block space-y-2">
              <span className="buek-small text-slate-500">Machine</span>
              <input
                value={machineCode}
                onChange={(e) => setMachineCode(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </label>
            <label className="block space-y-2">
              <span className="buek-small text-slate-500">Reject Count</span>
              <input
                type="number"
                min={1}
                value={rejectCount}
                onChange={(e) => setRejectCount(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="buek-small text-slate-500">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-red-500/90 px-6 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {submitting ? "Mengirim..." : "Submit Laporan"}
          </button>
          {reportMessage ? <p className="buek-small text-emerald-400">{reportMessage}</p> : null}
        </form>
      </section>

      <section className="buek-section space-y-6">
        <h2 className="buek-card-title text-slate-400">Today&apos;s Work</h2>
        <div className="buek-card rounded-2xl border border-white/10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="buek-small text-slate-500">✔ Target Output</p>
              <p className="mt-2 text-4xl font-bold text-white">{targetOutput} pcs</p>
            </div>
            <div className="text-right">
              <p className="buek-small text-slate-500">Progress</p>
              <p className="mt-2 text-4xl font-bold text-cyan-400">
                {progress} / {targetOutput}
              </p>
            </div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Today&apos;s Checklist</h2>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={toggling === item.id}
                onClick={() => void handleToggle(item.id)}
                className="buek-card flex w-full items-center gap-4 rounded-xl border border-white/10 text-left hover:border-cyan-400/30 disabled:opacity-50"
              >
                <span className="text-xl">{item.done ? "✔" : "□"}</span>
                <span className={item.done ? "text-slate-500 line-through" : "text-slate-200"}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="buek-section space-y-4">
        <h2 className="buek-card-title text-slate-400">Quality Reminder</h2>
        <ul className="space-y-2">
          {op.qualityReminders.map((reminder) => (
            <li key={reminder} className="buek-body text-amber-300/90">
              ⚠ {reminder}
            </li>
          ))}
        </ul>
      </section>

      <TodayTimeline workspaceSlug={workspace.id} />
    </div>
  );
}
