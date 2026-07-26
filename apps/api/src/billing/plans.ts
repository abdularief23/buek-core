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
  description: string;
  limits: PlanLimits;
  features: string[];
  highlighted?: boolean;
}

export function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export const PLANS: PlanDefinition[] = [
  {
    tier: "starter",
    name: "Starter",
    priceMonthlyIdr: 749_000,
    priceLabel: formatIdr(749_000),
    description: "Single-plant teams getting started with AI investigations.",
    limits: {
      plants: 1,
      users: 5,
      investigationsPerMonth: 50,
      copilotQueriesPerMonth: 200
    },
    features: [
      "1 plant workspace",
      "Up to 5 users",
      "50 investigations/month",
      "200 AI Copilot queries/month",
      "Knowledge base sync",
      "Email support"
    ]
  },
  {
    tier: "pro",
    name: "Pro",
    priceMonthlyIdr: 2_999_000,
    priceLabel: formatIdr(2_999_000),
    description: "Multi-plant operations with unlimited AI assistance.",
    limits: {
      plants: 3,
      users: 25,
      investigationsPerMonth: null,
      copilotQueriesPerMonth: null
    },
    features: [
      "Up to 3 plant workspaces",
      "Up to 25 users",
      "Unlimited investigations",
      "Unlimited AI Copilot",
      "Supervisor approval workflow",
      "PDF report export",
      "Priority support"
    ],
    highlighted: true
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    priceMonthlyIdr: null,
    priceLabel: "Kustom",
    description: "Multi-tenant deployments with SSO, SLA, and custom modules.",
    limits: {
      plants: Number.POSITIVE_INFINITY,
      users: Number.POSITIVE_INFINITY,
      investigationsPerMonth: null,
      copilotQueriesPerMonth: null
    },
    features: [
      "Unlimited plants & users",
      "SSO & audit logs",
      "Custom domain modules",
      "Dedicated support & SLA",
      "On-premise option",
      "Volume pricing"
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
