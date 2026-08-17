-- Rede de seguranca do ledger de pagamentos.
--
-- A confirmacao de um Pix chega por DOIS caminhos (webhook do gateway e polling
-- da action `confirmarPresente`). O codigo agora usa compare-and-set dentro de
-- uma transacao, mas o banco tem de recusar a duplicata mesmo assim: se algo
-- escapar, e melhor a segunda escrita falhar do que o mesmo pagamento ser
-- contado duas vezes no cofre.
--
-- Nulo continua permitido varias vezes (o Postgres nao considera NULL igual a
-- NULL num indice unico): lancamentos sem gateway seguem possiveis.
CREATE UNIQUE INDEX "Transaction_providerId_key" ON "Transaction"("providerId");

-- Uma cobranca do gateway pertence a UMA contribuicao.
CREATE UNIQUE INDEX "GiftContribution_providerChargeId_key" ON "GiftContribution"("providerChargeId");
