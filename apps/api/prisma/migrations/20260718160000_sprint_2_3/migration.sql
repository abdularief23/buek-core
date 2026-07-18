-- Sprint 2/3: SOP revisions, engineering reports, operator checklists, memory, agent actions

CREATE TABLE "SopRevision" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "submitterId" TEXT,
    "aiReview" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SopRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EngineeringReport" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "issueId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EngineeringReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperatorChecklistRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "targetOutput" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "items" JSONB NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperatorChecklistRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoryRecord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentAction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SopRevision_workspaceId_status_idx" ON "SopRevision"("workspaceId", "status");
CREATE INDEX "EngineeringReport_workspaceId_status_idx" ON "EngineeringReport"("workspaceId", "status");
CREATE INDEX "OperatorChecklistRun_workspaceId_runDate_idx" ON "OperatorChecklistRun"("workspaceId", "runDate");
CREATE INDEX "MemoryRecord_workspaceId_scope_idx" ON "MemoryRecord"("workspaceId", "scope");
CREATE INDEX "AgentAction_workspaceId_createdAt_idx" ON "AgentAction"("workspaceId", "createdAt");

ALTER TABLE "SopRevision" ADD CONSTRAINT "SopRevision_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SopRevision" ADD CONSTRAINT "SopRevision_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngineeringReport" ADD CONSTRAINT "EngineeringReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngineeringReport" ADD CONSTRAINT "EngineeringReport_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngineeringReport" ADD CONSTRAINT "EngineeringReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperatorChecklistRun" ADD CONSTRAINT "OperatorChecklistRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryRecord" ADD CONSTRAINT "MemoryRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
