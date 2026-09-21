-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "renewal3DaySent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "renewal7DaySent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "renewalDaySent" BOOLEAN NOT NULL DEFAULT false;
