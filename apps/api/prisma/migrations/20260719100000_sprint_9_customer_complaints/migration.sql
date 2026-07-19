CREATE TABLE IF NOT EXISTS "CustomerComplaint" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "complaintNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "description" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "engineerId" TEXT,
    "timeline" JSONB,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerComplaint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomerComplaint_workspaceId_status_idx" ON "CustomerComplaint"("workspaceId", "status");
CREATE INDEX IF NOT EXISTS "CustomerComplaint_workspaceId_complaintNumber_idx" ON "CustomerComplaint"("workspaceId", "complaintNumber");

ALTER TABLE "CustomerComplaint" ADD CONSTRAINT "CustomerComplaint_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerComplaint" ADD CONSTRAINT "CustomerComplaint_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
