-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "filledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Job_filledAt_idx" ON "Job"("filledAt");

-- Backfill: best available approximation for jobs already closed out.
UPDATE "Job" SET "filledAt" = "updatedAt" WHERE "stage" = 'FILLED_WON';
UPDATE "Job" SET "cancelledAt" = "updatedAt" WHERE "stage" = 'CANCELLED_LOST';
