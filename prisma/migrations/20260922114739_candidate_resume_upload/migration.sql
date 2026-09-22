-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "resumeData" BYTEA,
ADD COLUMN     "resumeFilename" TEXT,
ADD COLUMN     "resumeMimeType" TEXT;
