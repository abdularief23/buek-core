import type { SubscriptionSummary } from "../lib/billing-api.js";

interface UsageBudgetBannerProps {
  subscription: SubscriptionSummary;
}

function metricTone(level: string | undefined) {
  if (level === "blocked") return "border-red-400/40 bg-red-500/10 text-red-200";
  if (level === "warning") return "border-amber-400/40 bg-amber-500/10 text-amber-200";
  return "border-cyan-400/20 bg-cyan-500/5 text-slate-300";
}

export function UsageBudgetBanner({ subscription }: UsageBudgetBannerProps) {
  const metrics = [
    { label: "AI Copilot", metric: subscription.usage.copilotQueries },
    { label: "Investigasi", metric: subscription.usage.investigations }
  ].filter((item) => item.metric.limit !== null);

  const hasWarning = metrics.some(
    (item) => item.metric.level === "warning" || item.metric.level === "blocked"
  );

  if (!hasWarning && metrics.every((item) => (item.metric.percent ?? 0) < 70)) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-4">
      <p className="text-sm font-semibold text-white">Kontrol kuota AI (inspirasi Paperclip)</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {metrics.map(({ label, metric }) => (
          <div
            key={label}
            className={`rounded-lg border px-3 py-2 text-sm ${metricTone(metric.level)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span>{label}</span>
              <span className="font-semibold">
                {metric.used}
                {metric.limit !== null ? ` / ${metric.limit}` : ""}
              </span>
            </div>
            {metric.level === "blocked" ? (
              <p className="mt-1 text-xs">Kuota habis — upgrade paket untuk melanjutkan.</p>
            ) : metric.level === "warning" ? (
              <p className="mt-1 text-xs">Peringatan: sudah {metric.percent}% dari batas bulanan.</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
