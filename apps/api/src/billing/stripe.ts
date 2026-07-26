import Stripe from "stripe";
import type { ApiEnv } from "../config/env.js";
import { isStripeConfigured } from "../config/env.js";
import { getPlan, isValidPlanTier, type PlanTier } from "./plans.js";

export function getStripeClient(env: ApiEnv): Stripe | null {
  if (!env.stripeSecretKey) return null;
  return new Stripe(env.stripeSecretKey);
}

export interface CheckoutSessionInput {
  email: string;
  companyName: string;
  planTier: PlanTier;
  workspaceId?: string;
}

export interface CheckoutSessionResult {
  provider: "stripe" | "mock";
  checkoutUrl?: string;
  sessionId?: string;
  message?: string;
  trialDays?: number;
}

function planAmountCents(planTier: PlanTier): number {
  const plan = getPlan(planTier);
  if (!plan.priceMonthlyUsd) {
    throw new Error("Enterprise plans require sales contact.");
  }
  return plan.priceMonthlyUsd * 100;
}

export async function createStripeCheckoutSession(
  env: ApiEnv,
  input: CheckoutSessionInput
): Promise<CheckoutSessionResult> {
  if (!isValidPlanTier(input.planTier) || input.planTier === "enterprise") {
    throw new Error("Invalid plan tier for checkout.");
  }

  const stripe = getStripeClient(env);
  if (!stripe || !isStripeConfigured(env)) {
    throw new Error("Stripe is not configured.");
  }

  const plan = getPlan(input.planTier);
  const successUrl = `${env.appPublicUrl}/?billing=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${env.appPublicUrl}/?billing=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: planAmountCents(input.planTier),
          recurring: { interval: "month" },
          product_data: {
            name: `Buek Core ${plan.name}`,
            description: plan.description
          }
        }
      }
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        planTier: input.planTier,
        companyName: input.companyName,
        workspaceId: input.workspaceId ?? ""
      }
    },
    metadata: {
      planTier: input.planTier,
      companyName: input.companyName,
      workspaceId: input.workspaceId ?? ""
    },
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return {
    provider: "stripe",
    checkoutUrl: session.url,
    sessionId: session.id
  };
}

export async function constructStripeEvent(
  env: ApiEnv,
  rawBody: Buffer,
  signature: string
): Promise<Stripe.Event> {
  if (!env.stripeWebhookSecret) {
    throw new Error("Stripe webhook secret is not configured.");
  }

  const stripe = getStripeClient(env);
  if (!stripe) {
    throw new Error("Stripe client is not configured.");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

export function readPlanTierFromMetadata(
  metadata: Stripe.Metadata | null | undefined
): PlanTier | null {
  const value = metadata?.planTier;
  if (!value || !isValidPlanTier(value) || value === "enterprise") {
    return null;
  }
  return value;
}
