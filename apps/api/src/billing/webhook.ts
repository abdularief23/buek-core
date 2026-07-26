import type Stripe from "stripe";
import type { ApiEnv } from "../config/env.js";
import { prisma } from "../db.js";
import {
  activateSubscriptionFromStripe,
  cancelSubscriptionByStripeId,
  resolveCompanyIdForCheckout
} from "./service.js";
import { readPlanTierFromMetadata } from "./stripe.js";
import type { PlanTier } from "./plans.js";

export async function processStripeWebhook(env: ApiEnv, event: Stripe.Event): Promise<void> {
  const processed = await prisma.stripeWebhookEvent.findUnique({ where: { id: event.id } });
  if (processed) return;

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  await prisma.stripeWebhookEvent.create({
    data: { id: event.id, type: event.type }
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const planTier = readPlanTierFromMetadata(session.metadata);
  if (!planTier) return;

  const companyName = session.metadata?.companyName ?? "New Customer";
  const workspaceId = session.metadata?.workspaceId || undefined;
  const companyId = resolveCompanyIdForCheckout(workspaceId, companyName);

  const periodStart = session.created ? new Date(session.created * 1000) : new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await activateSubscriptionFromStripe({
    companyId,
    planTier,
    stripeCustomerId:
      (typeof session.customer === "string" ? session.customer : session.customer?.id) ?? null,
    stripeSubscriptionId:
      (typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id) ?? null,
    status: "active",
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd
  });
}

function readSubscriptionPeriod(subscription: Stripe.Subscription): { start: Date; end: Date } {
  const raw = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const startUnix = raw.current_period_start ?? subscription.start_date ?? subscription.created;
  const endUnix = raw.current_period_end ?? startUnix + 30 * 24 * 60 * 60;
  return {
    start: new Date(startUnix * 1000),
    end: new Date(endUnix * 1000)
  };
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });
  if (!existing) return;

  const planTier =
    readPlanTierFromMetadata(subscription.metadata) ?? (existing.planTier as PlanTier);
  const period = readSubscriptionPeriod(subscription);

  await activateSubscriptionFromStripe({
    companyId: existing.companyId,
    planTier,
    stripeCustomerId:
      (typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id) ?? null,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  await cancelSubscriptionByStripeId(subscription.id);
}
