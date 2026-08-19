-- RENAME, nao DROP + ADD: o `prisma migrate dev` geraria as duas e apagaria
-- quantas liberacoes cada convite ja consumiu — e e nesse numero que mora o teto
-- por convite (Profissional 1, Estudio 3).
--
-- O nome antigo (`passesGratis`) lia como saldo e guardava o CONSUMIDO; como e
-- `Int` contra `Int`, nada acusaria quem invertesse.

-- AlterTable
ALTER TABLE "Event" RENAME COLUMN "passesGratis" TO "passesGratisUsados";
