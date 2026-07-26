-- Paperclip-inspired governance: audit tracing, goals, background agent heartbeats

ALTER TABLE "AgentAction" ADD COLUMN IF NOT EXISTS "actorRole" TEXT;
ALTER TABLE "AgentAction" ADD COLUMN IF NOT EXISTS "actorEmail" TEXT;
ALTER TABLE "AgentAction" ADD COLUMN IF NOT EXISTS "traceId" TEXT;
ALTER TABLE "AgentAction" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'copilot';
ALTER TABLE "AgentAction" ADD COLUMN IF NOT EXISTS "goalChain" JSONB;

CREATE TABLE IF NOT EXISTS "AgentHeartbeatRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summary" TEXT NOT NULL,
    "output" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentHeartbeatRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkspaceGoal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metric" TEXT,
    "targetLabel" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AgentAction_workspaceId_source_createdAt_idx"
  ON "AgentAction"("workspaceId", "source", "createdAt");

CREATE INDEX IF NOT EXISTS "AgentHeartbeatRun_workspaceId_startedAt_idx"
  ON "AgentHeartbeatRun"("workspaceId", "startedAt");

CREATE INDEX IF NOT EXISTS "WorkspaceGoal_workspaceId_active_idx"
  ON "WorkspaceGoal"("workspaceId", "active");

ALTER TABLE "AgentHeartbeatRun"
  ADD CONSTRAINT "AgentHeartbeatRun_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceGoal"
  ADD CONSTRAINT "WorkspaceGoal_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
