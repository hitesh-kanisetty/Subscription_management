-- CreateEnum
CREATE TYPE "SupportAgentSpecialization" AS ENUM ('PAYMENT', 'SUBSCRIPTION', 'ACCOUNT', 'TECHNICAL', 'GENERAL');

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN     "assignedAgentId" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "supportSpecialization" "SupportAgentSpecialization";

-- CreateIndex
CREATE INDEX "support_tickets_assignedAgentId_idx" ON "support_tickets"("assignedAgentId");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
