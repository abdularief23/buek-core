import type { Request, Response } from "express";
import {
  getSubscriptionForWorkspace,
  listPlans,
  startCheckout,
  subscribeToPlan
} from "../billing/service.js";

export function handleListPlans(_req: Request, res: Response) {
  res.json({ plans: listPlans() });
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

export async function handleSubscribe(req: Request, res: Response) {
  try {
    const body = req.body as Partial<{
      workspaceId: string;
      planTier: string;
      email: string;
    }>;

    if (!body.workspaceId || !body.planTier) {
      res.status(400).json({ error: { message: "workspaceId and planTier are required." } });
      return;
    }

    const result = await subscribeToPlan(body.workspaceId, body.planTier, body.email);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: { message: error instanceof Error ? error.message : "Unable to subscribe." }
    });
  }
}

export async function handleCheckout(req: Request, res: Response) {
  try {
    const body = req.body as Partial<{
      email: string;
      companyName: string;
      planTier: string;
    }>;

    if (!body.email || !body.companyName || !body.planTier) {
      res.status(400).json({
        error: { message: "email, companyName, and planTier are required." }
      });
      return;
    }

    const result = await startCheckout({
      email: body.email,
      companyName: body.companyName,
      planTier: body.planTier
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: { message: error instanceof Error ? error.message : "Checkout failed." }
    });
  }
}
