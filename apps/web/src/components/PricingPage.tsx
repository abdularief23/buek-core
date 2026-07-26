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

const SALES_EMAIL = "info@buekwebsite.com";

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
    stripeNote: "Pembayaran aman · Trial 14 hari · Batal kapan saja",
    demoNote: "Mode demo — pembayaran nyata akan diaktifkan setelah gateway terhubung.",
    enterpriseTitle: "Hubungi tim sales",
    enterpriseBody: "Kirim email ke kami untuk penawaran Enterprise, SSO, dan SLA khusus.",
    enterpriseEmail: "Email sales",
    openEmail: "Buka email",
    copyEmail: "Salin alamat email"
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
    stripeNote: "Secure checkout · 14-day trial · Cancel anytime",
    demoNote: "Demo mode — live payments activate once the gateway is connected.",
    enterpriseTitle: "Contact sales",
    enterpriseBody: "Email us for Enterprise pricing, SSO, and custom SLA.",
    enterpriseEmail: "Sales email",
    openEmail: "Open email",
    copyEmail: "Copy email address"
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

  function enterpriseMailtoHref() {
    const subject = encodeURIComponent("Buek Core Enterprise Inquiry");
    const body = encodeURIComponent(
      "Halo tim Buek Core,\n\nSaya tertarik dengan paket Enterprise.\n\nNama perusahaan:\nKontak:\nKebutuhan:\n"
    );
    return `mailto:${SALES_EMAIL}?subject=${subject}&body=${body}`;
  }

  function selectPlan(plan: PlanDefinition) {
    setResultMessage(null);
    if (plan.tier === "enterprise") return;
    setSelectedPlan(plan.tier);
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
                className={`pricing-plan-card flex flex-col rounded-2xl border p-6 ${
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
                {plan.tier === "enterprise" ? (
                  <a
                    href={enterpriseMailtoHref()}
                    className="pricing-plan-cta pricing-plan-btn pricing-plan-btn-secondary w-full"
                  >
                    {copy.contactSales}
                  </a>
                ) : (
                  <button
                    type="button"
                    className={`pricing-plan-cta pricing-plan-btn w-full ${
                      plan.highlighted ? "pricing-plan-btn-primary" : "pricing-plan-btn-secondary"
                    }`}
                    onClick={() => selectPlan(plan)}
                  >
                    {copy.getStarted}
                  </button>
                )}
                {plan.tier === "enterprise" ? (
                  <p className="mt-2 text-center text-xs text-cyan-400">{SALES_EMAIL}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-400">
          {stripeEnabled ? copy.stripeNote : copy.demoNote}
        </p>
      </section>

      {selectedPlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="pricing-checkout-modal w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl">
            {resultMessage ? (
              <div className="text-center">
                <p className="pricing-modal-title text-lg font-semibold text-cyan-300">{copy.success}</p>
                <p className="pricing-modal-body mt-3 text-sm text-slate-200">{resultMessage}</p>
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
              <form onSubmit={(event) => void handleCheckout(event)} className="space-y-5">
                <div>
                  <h3 className="pricing-modal-title text-xl font-semibold text-white">{copy.checkoutTitle}</h3>
                  <p className="pricing-modal-plan mt-2 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-medium text-cyan-200">
                    {plans.find((plan) => plan.tier === selectedPlan)?.name ?? selectedPlan}
                  </p>
                </div>
                <label className="pricing-modal-label block text-sm font-medium text-slate-200">
                  {copy.companyName}
                  <input
                    required
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="login-input pricing-modal-input mt-2 w-full rounded-lg border border-white/15 bg-slate-800 px-4 py-3 text-base text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/50"
                    placeholder="PT Epson Indonesia"
                  />
                </label>
                <label className="pricing-modal-label block text-sm font-medium text-slate-200">
                  {copy.email}
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="login-input pricing-modal-input mt-2 w-full rounded-lg border border-white/15 bg-slate-800 px-4 py-3 text-base text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/50"
                    placeholder="nama@perusahaan.com"
                  />
                </label>
                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    className="pricing-cancel-btn flex-1 border border-white/25 bg-slate-800 text-slate-100 hover:bg-slate-700"
                    onClick={() => setSelectedPlan(null)}
                  >
                    {copy.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  >
                    {submitting ? "…" : stripeEnabled ? copy.confirmStripe : copy.confirm}
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
