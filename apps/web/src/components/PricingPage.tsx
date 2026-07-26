import { Button } from "@buek/ui";
import { useEffect, useState, type FormEvent } from "react";
import { PreferencesMenu } from "./PreferencesMenu.js";
import {
  checkoutPlan,
  fetchBillingConfig,
  fetchPlans,
  type PlanDefinition,
  type PlanTier
} from "../lib/billing-api.js";
import { useLanguage } from "../lib/language-context.js";

interface PricingPageProps {
  onBack: () => void;
}

const COPY = {
  id: {
    title: "Harga & Paket",
    subtitle: "Pilih paket yang sesuai dengan skala pabrik Anda. Mulai dari $49/bulan.",
    back: "← Kembali ke login",
    getStarted: "Mulai",
    contactSales: "Hubungi Sales",
    perMonth: "/bulan",
    checkoutTitle: "Mulai trial 14 hari",
    companyName: "Nama perusahaan",
    email: "Email kerja",
    cancel: "Batal",
    confirm: "Aktifkan trial",
    confirmStripe: "Lanjut ke Stripe",
    success: "Berhasil!",
    stripeNote: "Pembayaran aman via Stripe · Trial 14 hari · Batal kapan saja"
  },
  en: {
    title: "Pricing & Plans",
    subtitle: "Choose the plan that fits your plant. Starting at $49/month.",
    back: "← Back to login",
    getStarted: "Get Started",
    contactSales: "Contact Sales",
    perMonth: "/mo",
    checkoutTitle: "Start 14-day trial",
    companyName: "Company name",
    email: "Work email",
    cancel: "Cancel",
    confirm: "Activate trial",
    confirmStripe: "Continue to Stripe",
    success: "Success!",
    stripeNote: "Secure checkout via Stripe · 14-day trial · Cancel anytime"
  }
} as const;

export function PricingPage({ onBack }: PricingPageProps) {
  const { language } = useLanguage();
  const copy = COPY[language === "ja" ? "en" : language];
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(() => undefined)
      .finally(() => setLoading(false));

    fetchBillingConfig()
      .then((config) => setStripeEnabled(config.stripeEnabled))
      .catch(() => undefined);
  }, []);

  async function handleCheckout(event: FormEvent) {
    event.preventDefault();
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const result = await checkoutPlan({ email, companyName, planTier: selectedPlan });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setResultMessage(result.message ?? "Checkout complete.");
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <button type="button" onClick={onBack} className="text-sm text-slate-400 hover:text-white">
          {copy.back}
        </button>
        <PreferencesMenu />
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="text-center">
          <img src="/logo-mark.svg" alt="" className="mx-auto h-12 w-12 rounded-2xl bg-white p-2" />
          <h1 className="mt-4 text-3xl font-semibold text-white">{copy.title}</h1>
          <p className="mt-2 text-slate-400">{copy.subtitle}</p>
        </div>

        {loading ? (
          <p className="mt-12 text-center text-slate-500">Loading plans…</p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.tier}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlighted
                    ? "border-cyan-400/50 bg-cyan-400/5 shadow-lg shadow-cyan-500/10"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {plan.highlighted ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-3 py-0.5 text-xs font-semibold text-slate-950">
                    Popular
                  </span>
                ) : null}
                <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
                <p className="mt-4 text-3xl font-bold text-white">
                  {plan.priceLabel}
                  {plan.priceMonthlyUsd ? (
                    <span className="text-base font-normal text-slate-500">{copy.perMonth}</span>
                  ) : null}
                </p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-cyan-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  className={`mt-6 w-full ${
                    plan.highlighted
                      ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                      : "border border-white/20 bg-transparent text-white hover:bg-white/5"
                  }`}
                  onClick={() => {
                    setResultMessage(null);
                    if (plan.tier === "enterprise") {
                      setSelectedPlan("enterprise");
                    } else {
                      setSelectedPlan(plan.tier);
                    }
                  }}
                >
                  {plan.tier === "enterprise" ? copy.contactSales : copy.getStarted}
                </Button>
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          {stripeEnabled
            ? copy.stripeNote
            : "Demo checkout — configure STRIPE_SECRET_KEY on the API for live Stripe billing."}
        </p>
      </section>

      {selectedPlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
            {resultMessage ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-cyan-300">{copy.success}</p>
                <p className="mt-3 text-sm text-slate-300">{resultMessage}</p>
                <Button
                  type="button"
                  className="mt-6 w-full bg-white text-slate-950"
                  onClick={() => {
                    setSelectedPlan(null);
                    setResultMessage(null);
                    onBack();
                  }}
                >
                  {copy.back}
                </Button>
              </div>
            ) : (
              <form onSubmit={(event) => void handleCheckout(event)} className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{copy.checkoutTitle}</h3>
                <p className="text-sm capitalize text-slate-400">
                  {plans.find((plan) => plan.tier === selectedPlan)?.name ?? selectedPlan}
                </p>
                <label className="block text-sm text-slate-400">
                  {copy.companyName}
                  <input
                    required
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  {copy.email}
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border-0 bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  />
                </label>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    className="flex-1 border border-white/20 bg-transparent text-white"
                    onClick={() => setSelectedPlan(null)}
                  >
                    {copy.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  >
                    {submitting
                      ? "…"
                      : stripeEnabled && selectedPlan !== "enterprise"
                        ? copy.confirmStripe
                        : copy.confirm}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
