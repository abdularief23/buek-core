import type { Request, Response } from "express";
import {
  advanceInvestigationStep,
  approveWorkOrder,
  getIssueById,
  getIssueByKey,
  getIssues,
  getLiveKpis,
  getMachineTelemetry,
  getPendingWorkOrders,
  getSupervisorStats,
  getTimeline,
  getWorkOrderById,
  rejectWorkOrder
} from "../services/data-engine.js";

function getSlug(req: Request): string {
  return String(req.params.slug ?? req.query.workspaceId ?? "");
}

export async function handleTimeline(req: Request, res: Response) {
  try {
    const timeline = await getTimeline(getSlug(req));
    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleLiveKpis(req: Request, res: Response) {
  try {
    const kpis = await getLiveKpis(getSlug(req));
    res.json({ kpis });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleSupervisorStats(req: Request, res: Response) {
  try {
    const stats = await getSupervisorStats(getSlug(req));
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handlePendingWorkOrders(req: Request, res: Response) {
  try {
    const workOrders = await getPendingWorkOrders(getSlug(req));
    res.json({ workOrders });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleWorkOrderDetail(req: Request, res: Response) {
  try {
    const order = await getWorkOrderById(getSlug(req), String(req.params.workOrderId));
    if (!order) {
      res.status(404).json({ error: { message: "Work order not found" } });
      return;
    }
    res.json({ workOrder: order });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleApproveWorkOrder(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string };
    const order = await approveWorkOrder(
      getSlug(req),
      String(req.params.workOrderId),
      body.supervisorName ?? "Supervisor"
    );
    if (!order) {
      res.status(404).json({ error: { message: "Work order not found" } });
      return;
    }
    res.json({ workOrder: order });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleRejectWorkOrder(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string; notes?: string };
    const order = await rejectWorkOrder(
      getSlug(req),
      String(req.params.workOrderId),
      body.supervisorName ?? "Supervisor",
      body.notes
    );
    if (!order) {
      res.status(404).json({ error: { message: "Work order not found" } });
      return;
    }
    res.json({ workOrder: order });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleIssues(req: Request, res: Response) {
  try {
    const status = req.query.status ? String(req.query.status).split(",") : undefined;
    const issues = await getIssues(getSlug(req), status);
    res.json({ issues });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleIssueDetail(req: Request, res: Response) {
  try {
    const issue = await getIssueById(getSlug(req), String(req.params.issueId));
    if (!issue) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json({ issue });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleIssueByKey(req: Request, res: Response) {
  try {
    const issue = await getIssueByKey(getSlug(req), String(req.params.issueKey));
    if (!issue) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json({ issue });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleAdvanceInvestigation(req: Request, res: Response) {
  try {
    const body = req.body as { stepKey: string };
    const issue = await advanceInvestigationStep(
      getSlug(req),
      String(req.params.issueId),
      body.stepKey
    );
    if (!issue) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json({ issue });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleMachineTelemetry(req: Request, res: Response) {
  try {
    const telemetry = await getMachineTelemetry(getSlug(req), String(req.params.machineCode));
    res.json({ telemetry });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}
