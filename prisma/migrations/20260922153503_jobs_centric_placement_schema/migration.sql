-- CreateEnum
CREATE TYPE "JobStage" AS ENUM ('OPEN', 'MATCHING', 'CLIENT_REVIEW', 'SCHEDULED', 'FILLED_WON', 'CANCELLED_LOST');

-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('SUGGESTED', 'OUTREACHED', 'CLIENT_REVIEW', 'SCHEDULED', 'PLACED', 'REJECTED');
ALTER TABLE "public"."CandidateMatch" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CandidateMatch" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "public"."MatchStatus_old";
ALTER TABLE "CandidateMatch" ALTER COLUMN "status" SET DEFAULT 'SUGGESTED';
COMMIT;

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "agreedPay" DOUBLE PRECISION,
ADD COLUMN     "availabilityNote" TEXT,
ADD COLUMN     "availabilityStatus" TEXT NOT NULL DEFAULT 'Available',
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "payUnit" TEXT NOT NULL DEFAULT 'hourly',
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "CandidateMatch" ADD COLUMN     "agreedPayRate" DOUBLE PRECISION,
ALTER COLUMN "status" SET DEFAULT 'SUGGESTED';

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "companyName",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'US',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "employeeCount" INTEGER,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "payRate" DOUBLE PRECISION,
ADD COLUMN     "payUnit" TEXT NOT NULL DEFAULT 'hourly',
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "workHours" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "status",
ADD COLUMN     "billRate" DOUBLE PRECISION,
ADD COLUMN     "openingsCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stage" "JobStage" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "targetPayRate" DOUBLE PRECISION,
ADD COLUMN     "workHours" TEXT;

-- DropEnum
DROP TYPE "JobStatus";

-- CreateIndex
CREATE INDEX "Candidate_availabilityStatus_idx" ON "Candidate"("availabilityStatus");

-- CreateIndex
CREATE INDEX "Job_stage_idx" ON "Job"("stage");

