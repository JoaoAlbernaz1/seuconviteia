-- Estado da assinatura do SaaS na conta.
--
-- `plan` sozinho nao basta: ele guarda o plano CONTRATADO, e o direito acaba
-- quando o periodo pago vence. O vencimento vive aqui e e lido por
-- `planoEfetivo()`, em vez de um cron rebaixar contas — assim nao existe janela
-- em que o banco diz PREMIUM e a pessoa ja nao paga.
ALTER TABLE "Professional" ADD COLUMN "mpPreapprovalId" TEXT;
ALTER TABLE "Professional" ADD COLUMN "assinaturaStatus" TEXT;
ALTER TABLE "Professional" ADD COLUMN "assinaturaAte" TIMESTAMP(3);

-- UNICO: e por este id que o webhook do Mercado Pago encontra o dono da
-- assinatura. Duas contas apontando para a mesma assinatura seria um upgrade
-- pago por outra pessoa.
CREATE UNIQUE INDEX "Professional_mpPreapprovalId_key" ON "Professional"("mpPreapprovalId");

-- Cobranca mensal da assinatura. Nao cabe em `Transaction`, que exige um
-- `eventId` — assinatura e da conta, nao de um evento.
CREATE TABLE "CobrancaAssinatura" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CobrancaAssinatura_pkey" PRIMARY KEY ("id")
);

-- Mesma rede do ledger de presentes: a mesma notificacao entregue duas vezes
-- nao pode virar duas cobrancas.
CREATE UNIQUE INDEX "CobrancaAssinatura_providerId_key" ON "CobrancaAssinatura"("providerId");
CREATE INDEX "CobrancaAssinatura_professionalId_idx" ON "CobrancaAssinatura"("professionalId");

ALTER TABLE "CobrancaAssinatura" ADD CONSTRAINT "CobrancaAssinatura_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
