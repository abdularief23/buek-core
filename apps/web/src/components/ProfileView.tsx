import { Button } from "@buek/ui";
import { useEffect, useState } from "react";
import type { DemoUser, ModuleSummary, Workspace } from "../types.js";
import {
  checkoutPlan,
  fetchBillingConfig,
  fetchSubscription,
  formatUsageLabel,
  type PlanTier,
  type SubscriptionSummary
} from "../lib/billing-api.js";
import { type AppearanceMode, getAppearanceMode, setAppearanceMode } from "../lib/user-preferences.js";
import { useLanguage } from "../lib/language-context.js";

interface ProfileViewProps {
  workspace: Workspace;
  user: DemoUser;
  installedModule?: ModuleSummary | undefined;
  status?: string;
}

function UsageBar({ label, metric }: { label: string; metric: { used: number; limit: number | null; percent: number | null } }) {
  const percent = metric.percent ?? (metric.limit === null ? 0 : 0);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200">{formatUsageLabel(metric.used, metric.limit)}</span>
      </div>
      {metric.limit !== null ? (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${
              percent >= 90 ? "bg-red-400" : percent >= 70 ? "bg-amber-400" : "bg-cyan-400"
            }`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ProfileView({ workspace, user, installedModule, status }: ProfileViewProps) {
  const totalDocuments = workspace.documentStats.reduce((sum, item) => sum + item.count, 0);
  const [appearance, setAppearance] = useState<AppearanceMode>(getAppearanceMode());
  const { language, setLanguage } = useLanguage();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    fetchSubscription(workspace.id)
      .then(setSubscription)
      .catch((error: unknown) => {
        setBillingError(error instanceof Error ? error.message : "Unable to load billing.");
      });

    fetchBillingConfig()
      .then((config) => setStripeEnabled(config.stripeEnabled))
      .catch(() => undefined);
  }, [workspace.id]);

  const settings = [
    { label: "AI Provider", value: workspace.aiProvider },
    { label: "Knowledge Sync", value: workspace.lastSync },
    { label: "Notifications", value: "Enabled" },
    { label: "Connected Systems", value: installedModule ? `${installedModule.name} v${installedModule.version}` : workspace.moduleId },
    { label: "API", value: "Connected" }
  ];

  async function handleUpgrade(planTier: PlanTier) {
    setUpgrading(true);
    setBillingError(null);
    try {
      const result = await checkoutPlan({
        email: user.email,
        companyName: workspace.organization,
        planTier,
        workspaceId: workspace.id
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      const refreshed = await fetchSubscription(workspace.id);
      setSubscription(refreshed);
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : "Upgrade failed.");
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-12 pb-16">
      <header>
        <h1 className="buek-heading text-white">Me</h1>
        <p className="mt-3 buek-body text-slate-400">Your workspace identity and settings.</p>
      </header>

      <div className="flex items-center gap-5 rounded-2xl border border-white/10 px-6 py-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-2xl font-semibold text-cyan-300">
          {user.name.charAt(0)}
        </span>
        <div>
          <p className="buek-card-title text-white">{user.name}</p>
          <p className="buek-subtitle text-slate-400">{user.email}</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="buek-card-title text-slate-400">Plan & Billing</h2>
        {billingError ? <p className="text-sm text-red-400">{billingError}</p> : null}
        {subscription ? (
          <div className="space-y-4 rounded-2xl border border-white/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{subscription.plan.name}</p>
                <p className="text-sm text-slate-400">
                  {subscription.plan.priceLabel}
                  {subscription.plan.priceMonthlyIdr ? ` ${language === "id" ? "/bulan" : "/month"}` : ""} ·{" "}
                  <span className="capitalize">{subscription.status}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Billing period ends{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    language === "id" ? "id-ID" : "en-US"
                  )}
                </p>
              </div>
              {subscription.canUpgrade ? (
                <Button
                  type="button"
                  disabled={upgrading || subscription.planTier === "pro"}
                  className="shrink-0 border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
                  onClick={() => void handleUpgrade(subscription.planTier === "starter" ? "pro" : "enterprise")}
                >
                  {upgrading
                    ? "Redirecting…"
                    : stripeEnabled
                      ? subscription.planTier === "starter"
                        ? "Upgrade via Stripe"
                        : "Contact Enterprise"
                      : subscription.planTier === "starter"
                        ? "Upgrade to Pro"
                        : "Contact Enterprise"}
                </Button>
              ) : null}
            </div>
            <div className="space-y-4 border-t border-white/5 pt-4">
              <UsageBar label="AI Copilot queries" metric={subscription.usage.copilotQueries} />
              <UsageBar label="Investigations" metric={subscription.usage.investigations} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading billing…</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="buek-card-title text-slate-400">Profile</h2>
        <dl className="divide-y divide-white/5 rounded-2xl border border-white/10">
          {[
            ["Company", workspace.organization],
            ["Industry", workspace.industry],
            ["Role", user.role],
            ["Plant", workspace.plant],
            ["Shift", workspace.shift],
            ["Knowledge", `${totalDocuments} documents`],
            ["Installed Modules", installedModule?.name ?? workspace.moduleId],
            ["Last Sync", workspace.lastSync]
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-6 py-4 buek-body">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-slate-200">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="buek-card-title text-slate-400">Appearance</h2>
        <div className="space-y-2 rounded-2xl border border-white/10 p-4">
          {(
            [
              ["light", "Light Mode"],
              ["dark", "Dark Mode"],
              ["system", "Auto (System)"]
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5">
              <input
                type="radio"
                name="appearance"
                checked={appearance === value}
                onChange={() => {
                  setAppearance(value);
                  setAppearanceMode(value);
                }}
              />
              <span className="buek-body text-slate-200">{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="buek-card-title text-slate-400">Language</h2>
        <div className="space-y-2 rounded-2xl border border-white/10 p-4">
          {(
            [
              ["id", "Indonesia"],
              ["en", "English"]
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5">
              <input
                type="radio"
                name="language"
                checked={language === value}
                onChange={() => {
                  setLanguage(value);
                }}
              />
              <span className="buek-body text-slate-200">{label}</span>
            </label>
          ))}
        </div>
        <p className="buek-small text-slate-500">AI akan merespons dalam bahasa yang dipilih.</p>
      </section>

      <section className="space-y-4">
        <h2 className="buek-card-title text-slate-400">Settings</h2>
        {status ? <p className="buek-small text-slate-500">{status}</p> : null}
        <dl className="divide-y divide-white/5 rounded-2xl border border-white/10">
          {settings.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-6 py-4 buek-body">
              <dt className="text-slate-500">{item.label}</dt>
              <dd className="text-slate-200">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
