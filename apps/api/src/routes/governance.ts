import type { Request, Response } from "express";
import { listAgentHeartbeats } from "../agents/shift-monitor.js";
import { listAiAuditLog } from "../services/audit-log.js";
import { getGoalChainForIssue, listWorkspaceGoals } from "../services/goal-alignment.js";

function getSlug(req: Request): string {
  return String(req.params.slug);
}

export async function handleAuditLog(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit ?? 30);
    const entries = await listAiAuditLog(getSlug(req), Number.isFinite(limit) ? limit : 30);
    res.json({ entries });
  } catch (error) {
    res.status(500).json({
      error: { message: error instanceof Error ? error.message : "Failed to load audit log." }
    });
  }
}

export async function handleAgentHeartbeats(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit ?? 10);
    const runs = await listAgentHeartbeats(getSlug(req), Number.isFinite(limit) ? limit : 10);
    res.json({ runs });
  } catch (error) {
    res.status(500).json({
      error: { message: error instanceof Error ? error.message : "Failed to load agent heartbeats." }
    });
  }
}

export async function handleWorkspaceGoals(req: Request, res: Response) {
  try {
    const goals = await listWorkspaceGoals(getSlug(req));
    res.json({ goals });
  } catch (error) {
    res.status(500).json({
      error: { message: error instanceof Error ? error.message : "Failed to load workspace goals." }
    });
  }
}

export async function handleIssueGoalChain(req: Request, res: Response) {
  try {
    const taskStep = req.query.taskStep !== undefined ? Number(req.query.taskStep) : undefined;
    const goalChain = await getGoalChainForIssue(
      getSlug(req),
      String(req.params.issueKey),
      Number.isFinite(taskStep) ? taskStep : undefined
    );
    res.json({ goalChain });
  } catch (error) {
    res.status(500).json({
      error: { message: error instanceof Error ? error.message : "Failed to load goal chain." }
    });
  }
}
