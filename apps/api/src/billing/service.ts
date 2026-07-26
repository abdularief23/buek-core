import { prisma } from "../db.js";
import {
  getPlan,
  isOverLimit,
  isValidPlanTier,
  type PlanDefinition,
  type PlanTier,
  PLANS,
  usagePercent
} from "./plans.js";

const WORKSPACE_TO_COMPANY: Record<string, string> = {
  "epson-factory": "company-epson-factory",
  "toyota-plant": "company-toyota-plant",
  "nestle-factory": "company-nestle-factory",
  "custom-company": "company-custom-company"
};

const WORKSPACE_COMPANY_NAMES: Record<string, string> = {
  "epson-factory": "Epson Demo",
  "toyota-plant": "Toyota Demo",
  "nestle-factory": "Nestle Demo",
  "custom-company": "Custom Company"
};

const DEFAULT_PLAN_BY_WORKSPACE: Record<string, PlanTier> = {
  "epson-factory": "pro",
  "toyota-plant": "starter",
  "nestle-factory": "starter",
  "custom-company": "starter"
};

function currentPeriodBounds(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function resolveCompanyId(workspaceId: string): string {
  return WORKSPACE_TO_COMPANY[workspaceId] ?? `company-${workspaceId}`;
}

function slugifyCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function resolveCompanyIdForCheckout(workspaceId: string | undefined, companyName: string): string {
  if (workspaceId) {
    return resolveCompanyId(workspaceId);
  }
  const slug = slugifyCompanyName(companyName) || "new-customer";
  return `company-${slug}`;
}

export interface UsageSummary {
  copilotQueries: { used: number; limit: number | null; percent: number | null };
  investigations: { used: number; limit: number | null; percent: number | null };
}

export interface SubscriptionSummary {
  planTier: PlanTier;
  plan: PlanDefinition;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usage: UsageSummary;
  canUpgrade: boolean;
}

export function listPlans(): PlanDefinition[] {
  return PLANS;
}

async function ensureCompany(
  companyId: string,
  name: string,
  industry = "Manufacturing"
): Promise<void> {
  await prisma.company.upsert({
    where: { id: companyId },
    update: { name },
    create: {
      id: companyId,
      name,
      industry
    }
  });
}

async function ensureSubscription(companyId: string, workspaceId: string) {
  const companyName = WORKSPACE_COMPANY_NAMES[workspaceId] ?? companyId.replace(/^company-/, "");
  await ensureCompany(companyId, companyName);

  const existing = await prisma.subscription.findUnique({ where: { companyId } });
  if (existing) return existing;

  const { start, end } = currentPeriodBounds();
  const planTier = DEFAULT_PLAN_BY_WORKSPACE[workspaceId] ?? "starter";

  return prisma.subscription.create({
    data: {
      companyId,
      planTier,
      status: workspaceId === "epson-factory" ? "active" : "trial",
      billingCycle: "monthly",
      currentPeriodStart: start,
      currentPeriodEnd: end
    }
  });
}

async function countUsage(companyId: string, metric: string): Promise<number> {
  const { start } = currentPeriodBounds();
  const result = await prisma.usageRecord.aggregate({
    where: {
      companyId,
      metric,
      recordedAt: { gte: start }
    },
    _sum: { count: true }
  });
  return result._sum.count ?? 0;
}

export async function getSubscriptionForWorkspace(workspaceId: string): Promise<SubscriptionSummary> {
  const companyId = resolveCompanyId(workspaceId);
  const subscription = await ensureSubscription(companyId, workspaceId);
  const plan = getPlan(subscription.planTier as PlanTier);

  const copilotUsed = await countUsage(companyId, "copilot_queries");
  const investigationsUsed = await countUsage(companyId, "investigations");

  return {
    planTier: subscription.planTier as PlanTier,
    plan,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    currentPeriodStart: subscription.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    usage: {
      copilotQueries: {
        used: copilotUsed,
        limit: plan.limits.copilotQueriesPerMonth,
        percent: usagePercent(copilotUsed, plan.limits.copilotQueriesPerMonth)
      },
      investigations: {
        used: investigationsUsed,
        limit: plan.limits.investigationsPerMonth,
        percent: usagePercent(investigationsUsed, plan.limits.investigationsPerMonth)
      }
    },
    canUpgrade: subscription.planTier !== "enterprise"
  };
}

export async function activateSubscriptionFromStripe(input: {
  companyId: string;
  companyName?: string;
  planTier: PlanTier;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}): Promise<void> {
  const { start, end } = currentPeriodBounds();
  const companyName = input.companyName ?? input.companyId.replace(/^company-/, "");
  await ensureCompany(input.companyId, companyName);

  await prisma.subscription.upsert({
    where: { companyId: input.companyId },
    update: {
      planTier: input.planTier,
      status: input.status ?? "active",
      billingCycle: "monthly",
      currentPeriodStart: input.currentPeriodStart ?? start,
      currentPeriodEnd: input.currentPeriodEnd ?? end,
      ...(input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {}),
      ...(input.stripeSubscriptionId ? { stripeSubscriptionId: input.stripeSubscriptionId } : {})
    },
    create: {
      companyId: input.companyId,
      planTier: input.planTier,
      status: input.status ?? "active",
      billingCycle: "monthly",
      currentPeriodStart: input.currentPeriodStart ?? start,
      currentPeriodEnd: input.currentPeriodEnd ?? end,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null
    }
  });
}

export async function cancelSubscriptionByStripeId(stripeSubscriptionId: string): Promise<void> {
  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId }
  });
  if (!existing) return;

  const { start, end } = currentPeriodBounds();
  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      planTier: "starter",
      status: "cancelled",
      currentPeriodStart: start,
      currentPeriodEnd: end
    }
  });
}

export async function subscribeToPlan(
  workspaceId: string,
  planTier: string,
  email?: string
): Promise<{ success: boolean; subscription: SubscriptionSummary; message: string }> {
  if (!isValidPlanTier(planTier)) {
    throw new Error("Invalid plan tier.");
  }

  const companyId = resolveCompanyId(workspaceId);
  const { start, end } = currentPeriodBounds();

  await prisma.subscription.upsert({
    where: { companyId },
    update: {
      planTier,
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: start,
      currentPeriodEnd: end
    },
    create: {
      companyId,
      planTier,
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: start,
      currentPeriodEnd: end
    }
  });

  const subscription = await getSubscriptionForWorkspace(workspaceId);
  const planName = getPlan(planTier).name;

  return {
    success: true,
    subscription,
    message: email
      ? `Checkout complete. ${planName} plan activated for ${email}.`
      : `${planName} plan activated.`
  };
}

export async function startCheckout(input: {
  email: string;
  companyName: string;
  planTier: string;
  workspaceId?: string;
}): Promise<{ success: boolean; message: string; trialDays: number }> {
  if (!isValidPlanTier(input.planTier)) {
    throw new Error("Invalid plan tier.");
  }

  if (input.planTier === "enterprise") {
    return {
      success: true,
      message: `Thanks ${input.email}! Our team will contact ${input.companyName} about Enterprise pricing within 1 business day.`,
      trialDays: 0
    };
  }

  const companyId = resolveCompanyIdForCheckout(input.workspaceId, input.companyName);
  const planTier = input.planTier as PlanTier;
  await ensureCompany(companyId, input.companyName.trim());

  await prisma.subscription.upsert({
    where: { companyId },
    update: {
      planTier,
      status: "trial",
      billingCycle: "monthly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    create: {
      companyId,
      planTier,
      status: "trial",
      billingCycle: "monthly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  const planName = getPlan(input.planTier).name;
  return {
    success: true,
    message: `Welcome to Buek Core! Your 14-day ${planName} trial for ${input.companyName} is ready. Sign in to activate your workspace.`,
    trialDays: 14
  };
}

export { resolveCompanyIdForCheckout };

export async function recordUsage(
  workspaceId: string,
  metric: "copilot_queries" | "investigations"
): Promise<{ allowed: boolean; reason?: string }> {
  const companyId = resolveCompanyId(workspaceId);
  const subscription = await ensureSubscription(companyId, workspaceId);
  const plan = getPlan(subscription.planTier as PlanTier);

  const limit =
    metric === "copilot_queries"
      ? plan.limits.copilotQueriesPerMonth
      : plan.limits.investigationsPerMonth;

  const used = await countUsage(companyId, metric);

  if (isOverLimit(used, limit)) {
    return {
      allowed: false,
      reason: `Monthly ${metric === "copilot_queries" ? "AI Copilot" : "investigation"} limit reached. Upgrade to Pro for unlimited access.`
    };
  }

  await prisma.usageRecord.create({
    data: {
      companyId,
      workspaceId,
      metric,
      count: 1
    }
  });

  return { allowed: true };
}
