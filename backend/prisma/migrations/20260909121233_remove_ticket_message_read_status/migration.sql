/*
  Warnings:

  - You are about to drop the column `isRead` on the `ticket_messages` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ticket_messages_ticketId_isRead_idx";

-- AlterTable
ALTER TABLE "ticket_messages" DROP COLUMN "isRead";
