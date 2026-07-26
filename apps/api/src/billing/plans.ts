export type PlanTier = "starter" | "pro" | "enterprise";

export interface PlanLimits {
  plants: number;
  users: number;
  investigationsPerMonth: number | null;
  copilotQueriesPerMonth: number | null;
}

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceMonthlyIdr: number | null;
  priceLabel: string;
  comparePriceIdr: number | null;
  comparePriceLabel: string | null;
  discountPercent: number | null;
  audienceLabel: string;
  description: string;
  limits: PlanLimits;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

export function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function discountPercent(original: number, current: number): number {
  return Math.round((1 - current / original) * 100);
}

/** Market-aligned launch pricing (survey: BPS SME bands + ERP benchmark IDR 1.5–10 jt/bulan). */
export const PLANS: PlanDefinition[] = [
  {
    tier: "starter",
    name: "Starter",
    priceMonthlyIdr: 599_000,
    priceLabel: formatIdr(599_000),
    comparePriceIdr: 1_290_000,
    comparePriceLabel: formatIdr(1_290_000),
    discountPercent: discountPercent(1_290_000, 599_000),
    audienceLabel: "5–19 karyawan · 1 pabrik",
    badge: "Paling hemat",
    description: "Pabrik kecil & UMKM manufaktur yang mulai digitalisasi investigasi AI.",
    limits: {
      plants: 1,
      users: 5,
      investigationsPerMonth: 50,
      copilotQueriesPerMonth: 200
    },
    features: [
      "1 workspace pabrik",
      "Hingga 5 pengguna",
      "50 investigasi/bulan",
      "200 query AI Copilot/bulan",
      "Sinkronisasi knowledge base",
      "Dukungan email"
    ]
  },
  {
    tier: "pro",
    name: "Pro",
    priceMonthlyIdr: 1_999_000,
    priceLabel: formatIdr(1_999_000),
    comparePriceIdr: 4_990_000,
    comparePriceLabel: formatIdr(4_990_000),
    discountPercent: discountPercent(4_990_000, 1_999_000),
    audienceLabel: "20–99 karyawan · 2–3 pabrik",
    badge: "Paling populer",
    description: "Operasi multi-pabrik dengan AI Copilot tanpa batas untuk tim produksi.",
    limits: {
      plants: 3,
      users: 25,
      investigationsPerMonth: null,
      copilotQueriesPerMonth: null
    },
    features: [
      "Hingga 3 workspace pabrik",
      "Hingga 25 pengguna",
      "Investigasi tanpa batas",
      "AI Copilot tanpa batas",
      "Workflow persetujuan supervisor",
      "Ekspor laporan PDF",
      "Dukungan prioritas"
    ],
    highlighted: true
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    priceMonthlyIdr: 7_500_000,
    priceLabel: `Mulai ${formatIdr(7_500_000)}`,
    comparePriceIdr: 15_000_000,
    comparePriceLabel: formatIdr(15_000_000),
    discountPercent: discountPercent(15_000_000, 7_500_000),
    audienceLabel: "100+ karyawan · multi-tenant",
    badge: "Korporasi",
    description: "Deployment multi-tenant dengan SSO, audit log, dan modul kustom.",
    limits: {
      plants: Number.POSITIVE_INFINITY,
      users: Number.POSITIVE_INFINITY,
      investigationsPerMonth: null,
      copilotQueriesPerMonth: null
    },
    features: [
      "Pabrik & pengguna tanpa batas",
      "SSO & audit log",
      "Modul domain kustom",
      "Dedicated support & SLA",
      "Opsi on-premise",
      "Harga volume"
    ]
  }
];

export function getPlan(tier: PlanTier): PlanDefinition {
  const plan = PLANS.find((candidate) => candidate.tier === tier);
  if (!plan) {
    throw new Error(`Unknown plan tier: ${tier}`);
  }
  return plan;
}

export function isValidPlanTier(value: string): value is PlanTier {
  return value === "starter" || value === "pro" || value === "enterprise";
}

export function usagePercent(used: number, limit: number | null): number | null {
  if (limit === null || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function isOverLimit(used: number, limit: number | null): boolean {
  if (limit === null) return false;
  return used >= limit;
}
