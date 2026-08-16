-- CreateEnum
CREATE TYPE "GiftPricing" AS ENUM ('FIXO', 'COTAS', 'LIVRE');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "draftData" JSONB,
ADD COLUMN     "draftVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payoutPixKey" TEXT,
ADD COLUMN     "payoutPixName" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedData" JSONB,
ADD COLUMN     "publishedVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "schemaVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "GiftItem" ADD COLUMN     "pricingMode" "GiftPricing" NOT NULL DEFAULT 'FIXO',
ADD COLUMN     "quotaCount" INTEGER,
ADD COLUMN     "storeUrl" TEXT;

-- CreateTable
CREATE TABLE "GiftContribution" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "giftItemId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerContact" TEXT,
    "message" TEXT,
    "quotas" INTEGER,
    "grossCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "netCents" INTEGER NOT NULL,
    "status" "PayStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'fake',
    "providerChargeId" TEXT,
    "pixCode" TEXT,
    "pixQrUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "pixKey" TEXT NOT NULL,
    "pixName" TEXT,
    "status" "PayStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'fake',
    "providerTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GiftContribution_eventId_idx" ON "GiftContribution"("eventId");

-- CreateIndex
CREATE INDEX "GiftContribution_giftItemId_idx" ON "GiftContribution"("giftItemId");

-- CreateIndex
CREATE INDEX "GiftContribution_status_idx" ON "GiftContribution"("status");

-- CreateIndex
CREATE INDEX "Payout_eventId_idx" ON "Payout"("eventId");

-- AddForeignKey
ALTER TABLE "GiftContribution" ADD CONSTRAINT "GiftContribution_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftContribution" ADD CONSTRAINT "GiftContribution_giftItemId_fkey" FOREIGN KEY ("giftItemId") REFERENCES "GiftItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

