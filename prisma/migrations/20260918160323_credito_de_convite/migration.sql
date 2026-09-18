-- CreateTable
CREATE TABLE "CreditoConvite" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerId" TEXT,
    "paidAt" TIMESTAMP(3),
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditoConvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditoConvite_providerId_key" ON "CreditoConvite"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditoConvite_eventId_key" ON "CreditoConvite"("eventId");

-- CreateIndex
CREATE INDEX "CreditoConvite_professionalId_idx" ON "CreditoConvite"("professionalId");

-- AddForeignKey
ALTER TABLE "CreditoConvite" ADD CONSTRAINT "CreditoConvite_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoConvite" ADD CONSTRAINT "CreditoConvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
