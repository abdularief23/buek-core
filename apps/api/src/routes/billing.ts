import type { Request, Response } from "express";
import type { ApiEnv } from "../config/env.js";
import { isStripeConfigured } from "../config/env.js";
import {
  getSubscriptionForWorkspace,
  listPlans,
  startCheckout
} from "../billing/service.js";
import { constructStripeEvent, createStripeCheckoutSession } from "../billing/stripe.js";
import { processStripeWebhook } from "../billing/webhook.js";
import { isValidPlanTier, type PlanTier } from "../billing/plans.js";

export function handleListPlans(_req: Request, res: Response) {
  res.json({ plans: listPlans() });
}

export function handleBillingConfig(env: ApiEnv, _req: Request, res: Response) {
  res.json({
    provider: isStripeConfigured(env) ? "stripe" : "mock",
    stripeEnabled: isStripeConfigured(env)
  });
}

export async function handleGetSubscription(req: Request, res: Response) {
  try {
    const workspaceId = String(req.query.workspaceId ?? "");
    if (!workspaceId) {
      res.status(400).json({ error: { message: "workspaceId is required." } });
      return;
    }

    const subscription = await getSubscriptionForWorkspace(workspaceId);
    res.json({ subscription });
  } catch (error) {
    res.status(500).json({
      error: { message: error instanceof Error ? error.message : "Failed to load subscription." }
    });
  }
}

export async function handleCheckout(env: ApiEnv, req: Request, res: Response) {
  try {
    const body = req.body as Partial<{
      email: string;
      companyName: string;
      planTier: string;
      workspaceId: string;
    }>;

    if (!body.email || !body.companyName || !body.planTier) {
      res.status(400).json({
        error: { message: "email, companyName, and planTier are required." }
      });
      return;
    }

    if (!isValidPlanTier(body.planTier)) {
      res.status(400).json({ error: { message: "Invalid plan tier." } });
      return;
    }

    if (body.planTier === "enterprise") {
      const result = await startCheckout({
        email: body.email,
        companyName: body.companyName,
        planTier: body.planTier,
        ...(body.workspaceId ? { workspaceId: body.workspaceId } : {})
      });
      res.json({ provider: "mock", ...result });
      return;
    }

    if (isStripeConfigured(env)) {
      const session = await createStripeCheckoutSession(env, {
        email: body.email,
        companyName: body.companyName,
        planTier: body.planTier as PlanTier,
        ...(body.workspaceId ? { workspaceId: body.workspaceId } : {})
      });
      res.json(session);
      return;
    }

    const result = await startCheckout({
      email: body.email,
      companyName: body.companyName,
      planTier: body.planTier,
      ...(body.workspaceId ? { workspaceId: body.workspaceId } : {})
    });
    res.json({ provider: "mock", ...result });
  } catch (error) {
    res.status(400).json({
      error: { message: error instanceof Error ? error.message : "Checkout failed." }
    });
  }
}

export async function handleStripeWebhook(env: ApiEnv, req: Request, res: Response) {
  if (!isStripeConfigured(env)) {
    res.status(503).json({ error: { message: "Stripe is not configured." } });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).json({ error: { message: "Missing Stripe signature." } });
    return;
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ error: { message: "Webhook requires raw request body." } });
    return;
  }

  try {
    const event = await constructStripeEvent(env, rawBody, signature);
    await processStripeWebhook(env, event);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({
      error: { message: error instanceof Error ? error.message : "Webhook verification failed." }
    });
  }
}
