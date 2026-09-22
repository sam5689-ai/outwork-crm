-- AlterTable
ALTER TABLE "EmailMessage" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "syncedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_syncedByUserId_fkey" FOREIGN KEY ("syncedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
