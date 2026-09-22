-- CreateEnum
CREATE TYPE "EmailFolder" AS ENUM ('INBOX', 'SENT', 'ARCHIVE', 'TRASH', 'DRAFT');

-- AlterTable
ALTER TABLE "EmailMessage" ADD COLUMN     "bcc" TEXT,
ADD COLUMN     "cc" TEXT,
ADD COLUMN     "folder" "EmailFolder" NOT NULL DEFAULT 'INBOX',
ADD COLUMN     "inReplyToMessageId" TEXT,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isStarred" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "contactId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "EmailMessage_syncedByUserId_folder_idx" ON "EmailMessage"("syncedByUserId", "folder");

-- CreateIndex
CREATE INDEX "EmailMessage_gmailThreadId_idx" ON "EmailMessage"("gmailThreadId");
