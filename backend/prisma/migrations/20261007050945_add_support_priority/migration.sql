-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN     "priority" "SupportPriority" NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");
