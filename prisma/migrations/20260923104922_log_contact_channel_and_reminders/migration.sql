-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('PHONE_CALL', 'EMAIL', 'WHATSAPP', 'OTHER');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "channel" "ContactChannel";

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "channel" "ContactChannel" NOT NULL DEFAULT 'OTHER',
    "note" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reminder_contactId_idx" ON "Reminder"("contactId");

-- CreateIndex
CREATE INDEX "Reminder_authorId_dueAt_idx" ON "Reminder"("authorId", "dueAt");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
