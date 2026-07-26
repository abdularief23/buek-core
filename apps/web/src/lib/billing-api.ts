const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export type PlanTier = "starter" | "pro" | "enterprise";

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceMonthlyUsd: number | null;
  priceLabel: string;
  description: string;
  limits: {
    plants: number;
    users: number;
    investigationsPerMonth: number | null;
    copilotQueriesPerMonth: number | null;
  };
  features: string[];
  highlighted?: boolean;
}

export interface UsageMetric {
  used: number;
  limit: number | null;
  percent: number | null;
}

export interface SubscriptionSummary {
  planTier: PlanTier;
  plan: PlanDefinition;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usage: {
    copilotQueries: UsageMetric;
    investigations: UsageMetric;
  };
  canUpgrade: boolean;
}

export async function fetchPlans(): Promise<PlanDefinition[]> {
  const response = await fetch(`${configuredApiUrl}/api/billing/plans`);
  if (!response.ok) throw new Error("Unable to load plans.");
  const data = (await response.json()) as { plans: PlanDefinition[] };
  return data.plans;
}

export async function fetchSubscription(workspaceId: string): Promise<SubscriptionSummary> {
  const response = await fetch(
    `${configuredApiUrl}/api/billing/subscription?workspaceId=${encodeURIComponent(workspaceId)}`
  );
  if (!response.ok) throw new Error("Unable to load subscription.");
  const data = (await response.json()) as { subscription: SubscriptionSummary };
  return data.subscription;
}

export async function checkoutPlan(input: {
  email: string;
  companyName: string;
  planTier: PlanTier;
}): Promise<{ success: boolean; message: string; trialDays: number }> {
  const response = await fetch(`${configuredApiUrl}/api/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(error.error?.message ?? "Checkout failed.");
  }
  return (await response.json()) as { success: boolean; message: string; trialDays: number };
}

export async function upgradePlan(
  workspaceId: string,
  planTier: PlanTier
): Promise<{ success: boolean; message: string; subscription: SubscriptionSummary }> {
  const response = await fetch(`${configuredApiUrl}/api/billing/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, planTier })
  });
  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(error.error?.message ?? "Unable to upgrade plan.");
  }
  return (await response.json()) as {
    success: boolean;
    message: string;
    subscription: SubscriptionSummary;
  };
}

export function formatUsageLabel(used: number, limit: number | null): string {
  if (limit === null) return `${used} (unlimited)`;
  return `${used} / ${limit}`;
}
