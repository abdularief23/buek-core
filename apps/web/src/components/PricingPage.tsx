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
    subtitle: "Harga disesuaikan dengan skala pabrik manufaktur Indonesia — lebih hemat dari ERP konvensional.",
    promoBanner: "🔥 Peluncuran Galuxium — diskon hingga 60% · Trial 14 hari gratis",
    back: "← Kembali ke login",
    getStarted: "Mulai Trial Gratis",
    contactSales: "Hubungi Sales",
    perMonth: "/bulan",
    save: "HEMAT",
    surveyTitle: "Berdasarkan survei pasar manufaktur Indonesia",
    surveyItems: [
      { stat: "5–19", label: "karyawan — UMKM kecil (BPS)" },
      { stat: "20–99", label: "karyawan — pabrik menengah" },
      { stat: "35.134", label: "perusahaan manufaktur menengah-besar" }
    ],
    benchmark: "Benchmark: ERP manufaktur Rp 1,5–10 jt/bulan · Buek Core fokus AI investigasi mulai Rp 599 rb",
    checkoutTitle: "Mulai trial 14 hari gratis",
    companyName: "Nama perusahaan",
    email: "Email kerja",
    cancel: "Batal",
    confirm: "Aktifkan trial",
    confirmStripe: "Lanjut ke pembayaran",
    success: "Berhasil!",
    stripeNote: "Pembayaran aman · Trial 14 hari · Batal kapan saja",
    demoNote: "Mode demo — pembayaran nyata akan diaktifkan setelah gateway terhubung.",
    guarantee: "✓ Tanpa kartu kredit · ✓ Setup 5 menit · ✓ Dukungan Bahasa Indonesia"
  },
  en: {
    title: "Pricing & Plans",
    subtitle: "Priced for Indonesian manufacturing scale — more affordable than conventional ERP.",
    promoBanner: "🔥 Galuxium launch — up to 60% off · 14-day free trial",
    back: "← Back to login",
    getStarted: "Start Free Trial",
    contactSales: "Contact Sales",
    perMonth: "/mo",
    save: "SAVE",
    surveyTitle: "Based on Indonesian manufacturing market research",
    surveyItems: [
      { stat: "5–19", label: "employees — small SMEs (BPS)" },
      { stat: "20–99", label: "employees — medium plants" },
      { stat: "35,134", label: "medium-large manufacturing firms" }
    ],
    benchmark:
      "Benchmark: manufacturing ERP Rp 1.5–10M/mo · Buek Core AI investigations from Rp 599K",
    checkoutTitle: "Start your 14-day free trial",
    companyName: "Company name",
    email: "Work email",
    cancel: "Cancel",
    confirm: "Activate trial",
    confirmStripe: "Continue to payment",
    success: "Success!",
    stripeNote: "Secure checkout · 14-day trial · Cancel anytime",
    demoNote: "Demo mode — live payments activate once the gateway is connected.",
    guarantee: "✓ No credit card · ✓ 5-min setup · ✓ Indonesian support"
  }
} as const;

const PLAN_ICONS: Record<PlanTier, string> = {
  starter: "🏭",
  pro: "⚡",
  enterprise: "🏢"
};

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
    <div className="pricing-page login-page min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <button type="button" onClick={onBack} className="text-sm text-slate-400 hover:text-white">
          {copy.back}
        </button>
        <PreferencesMenu />
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="pricing-hero text-center">
          <div className="pricing-promo-banner mx-auto inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold">
            {copy.promoBanner}
          </div>
          <img src="/logo-mark.svg" alt="" className="mx-auto mt-6 h-14 w-14 rounded-2xl bg-white p-2 shadow-lg" />
          <h1 className="pricing-hero-title mt-5 text-4xl font-bold tracking-tight text-white">{copy.title}</h1>
          <p className="pricing-hero-subtitle mx-auto mt-3 max-w-2xl text-lg text-slate-400">{copy.subtitle}</p>
        </div>

        <div className="pricing-survey mt-10 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 p-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-cyan-300">{copy.surveyTitle}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {copy.surveyItems.map((item) => (
              <div key={item.stat} className="pricing-survey-stat rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                <p className="text-2xl font-bold text-white">{item.stat}</p>
                <p className="mt-1 text-xs text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">{copy.benchmark}</p>
        </div>

        {loading ? (
          <p className="mt-12 text-center text-slate-500">Loading plans…</p>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.tier}
                className={`pricing-plan-card group flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  plan.highlighted
                    ? "pricing-plan-card-featured border-cyan-400/60 bg-gradient-to-b from-cyan-500/15 to-transparent shadow-xl shadow-cyan-500/20 lg:scale-[1.03]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl" aria-hidden>
                    {PLAN_ICONS[plan.tier]}
                  </span>
                  {plan.discountPercent ? (
                    <span className="pricing-discount-badge rounded-full px-2.5 py-1 text-xs font-bold">
                      {copy.save} {plan.discountPercent}%
                    </span>
                  ) : null}
                </div>

                {plan.badge ? (
                  <span
                    className={`mt-3 inline-flex w-fit rounded-full px-3 py-0.5 text-xs font-semibold ${
                      plan.highlighted
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {plan.badge}
                  </span>
                ) : null}

                <h2 className="mt-3 text-xl font-bold text-white">{plan.name}</h2>
                <p className="pricing-audience-label mt-1 text-xs font-medium text-cyan-400/90">{plan.audienceLabel}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{plan.description}</p>

                <div className="mt-5">
                  {plan.comparePriceLabel ? (
                    <p className="pricing-compare-price text-base text-slate-500 line-through decoration-red-400/70">
                      {plan.comparePriceLabel}
                      {plan.tier !== "enterprise" ? copy.perMonth : ""}
                    </p>
                  ) : null}
                  <p className="pricing-current-price mt-1 text-3xl font-extrabold tracking-tight text-white">
                    {plan.priceLabel}
                    {plan.tier !== "enterprise" && plan.priceMonthlyIdr ? (
                      <span className="text-base font-normal text-slate-500">{copy.perMonth}</span>
                    ) : null}
                  </p>
                </div>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs text-cyan-400">
                        ✓
                      </span>
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

        <p className="pricing-guarantee mt-8 text-center text-sm text-slate-400">{copy.guarantee}</p>
        <p className="mt-3 text-center text-sm text-slate-500">
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
                  {(() => {
                    const plan = plans.find((candidate) => candidate.tier === selectedPlan);
                    if (!plan) return null;
                    return (
                      <div className="mt-3 space-y-1">
                        <p className="pricing-modal-plan inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-medium text-cyan-200">
                          {plan.name}
                        </p>
                        {plan.comparePriceLabel ? (
                          <p className="text-sm text-slate-500 line-through">{plan.comparePriceLabel}{copy.perMonth}</p>
                        ) : null}
                        <p className="text-lg font-bold text-white">
                          {plan.priceLabel}
                          {copy.perMonth}
                        </p>
                      </div>
                    );
                  })()}
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
