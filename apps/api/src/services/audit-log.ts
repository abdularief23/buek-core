import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import type { GoalLink } from "./goal-alignment.js";

export type AiAuditSource = "copilot" | "investigation" | "background_agent";

export interface AiAuditInput {
  slug: string;
  toolName: string;
  source: AiAuditSource;
  input: unknown;
  output: unknown;
  status?: string;
  actorRole?: string;
  actorEmail?: string;
  goalChain?: GoalLink[];
}

async function getWorkspaceId(slug: string): Promise<string | null> {
  return (await prisma.workspace.findUnique({ where: { slug }, select: { id: true } }))?.id ?? null;
}

export async function logAiAudit(entry: AiAuditInput): Promise<void> {
  const workspaceId = await getWorkspaceId(entry.slug);
  if (!workspaceId) return;

  await prisma.agentAction.create({
    data: {
      workspaceId,
      toolName: entry.toolName,
      input: entry.input as object,
      output: entry.output as object,
      status: entry.status ?? "completed",
      actorRole: entry.actorRole ?? null,
      actorEmail: entry.actorEmail ?? null,
      traceId: randomUUID(),
      source: entry.source,
      ...(entry.goalChain ? { goalChain: entry.goalChain as object[] } : {})
    }
  });
}

export async function listAiAuditLog(slug: string, limit = 30) {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const rows = await prisma.agentAction.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return rows.map((row) => ({
    id: row.id,
    toolName: row.toolName,
    source: row.source,
    status: row.status,
    actorRole: row.actorRole,
    actorEmail: row.actorEmail,
    traceId: row.traceId,
    goalChain: row.goalChain,
    input: row.input,
    output: row.output,
    createdAt: row.createdAt.toISOString()
  }));
}
