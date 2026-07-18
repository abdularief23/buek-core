-- AlterTable EngineeringReport
ALTER TABLE "EngineeringReport" ADD COLUMN IF NOT EXISTS "reportNumber" TEXT;
ALTER TABLE "EngineeringReport" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "EngineeringReport" ADD COLUMN IF NOT EXISTS "sections" JSONB;
ALTER TABLE "EngineeringReport" ADD COLUMN IF NOT EXISTS "machineCode" TEXT;
ALTER TABLE "EngineeringReport" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "EngineeringReport" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "EngineeringReport" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "EngineeringReport" ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable LessonLearned
CREATE TABLE IF NOT EXISTS "LessonLearned" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "issueId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonLearned_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LessonLearned_workspaceId_idx" ON "LessonLearned"("workspaceId");
CREATE INDEX IF NOT EXISTS "EngineeringReport_workspaceId_reportNumber_idx" ON "EngineeringReport"("workspaceId", "reportNumber");

ALTER TABLE "LessonLearned" ADD CONSTRAINT "LessonLearned_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonLearned" ADD CONSTRAINT "LessonLearned_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LessonLearned" ADD CONSTRAINT "LessonLearned_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngineeringReport" ADD CONSTRAINT "EngineeringReport_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
