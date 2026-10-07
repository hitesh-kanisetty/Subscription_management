-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "two_factor_otps" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "two_factor_otps_userId_idx" ON "two_factor_otps"("userId");

-- CreateIndex
CREATE INDEX "two_factor_otps_expiresAt_idx" ON "two_factor_otps"("expiresAt");

-- AddForeignKey
ALTER TABLE "two_factor_otps" ADD CONSTRAINT "two_factor_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
