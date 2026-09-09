-- AlterTable
ALTER TABLE "ticket_messages" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ticket_messages_ticketId_isRead_idx" ON "ticket_messages"("ticketId", "isRead");
