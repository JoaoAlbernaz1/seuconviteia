/**
 * Credito avulso de convite: o preco, o saldo e o gasto.
 *
 * Papel equivalente ao de `lib/edicao.ts` para o passe. A CONCESSAO (virar
 * PENDING em PAID) nao mora aqui — mora em `lib/creditoConvite.ts`, chamado so
 * pelo webhook.
 */
import type { PrismaClient } from "@prisma/client";

/** Preco do credito de convite, em centavos. */
export const CREDITO_PRECO_CENTS = 2990;

/**
 * O minimo que estas funcoes precisam do Prisma.
 *
 * Existe para elas aceitarem tanto o `prisma` global quanto o `db` de dentro de
 * um `$transaction` — a criacao do convite gasta o credito na MESMA transacao, e
 * passar o cliente global ali deixaria o gasto FORA do rollback.
 */
export type PrismaLike = Pick<PrismaClient, "creditoConvite">;

/**
 * Quantos creditos a conta tem NA MAO.
 *
 * Contagem, nunca coluna: saldo guardado sai de sincronia no primeiro caminho
 * que esquece de decrementar. Mesmo principio de `planoEfetivo`, que deriva o
 * plano na leitura em vez de rebaixar por cron.
 */
export async function saldoDeCreditos(db: PrismaLike, professionalId: string): Promise<number> {
  return db.creditoConvite.count({
    where: { professionalId, status: "PAID", eventId: null },
  });
}

/**
 * Gasta UM credito da conta, amarrando-o a `eventId`. `true` se gastou.
 *
 * COMPARE-AND-SET, como `usarPasseIncluido`: o `eventId: null` entra no WHERE,
 * entao ninguem vira a mesma linha duas vezes. A varredura de candidatos existe
 * porque duas criacoes simultaneas escolhem o mesmo primeiro candidato: sem
 * tentar o proximo, uma delas seria recusada com saldo sobrando.
 *
 * O indice unico em `eventId` e a rede final: mesmo que dois caminhos escapem,
 * o banco recusa o segundo credito para o mesmo convite.
 */
export async function gastarCredito(
  db: PrismaLike,
  professionalId: string,
  eventId: string,
): Promise<boolean> {
  const candidatos = await db.creditoConvite.findMany({
    where: { professionalId, status: "PAID", eventId: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  for (const candidato of candidatos) {
    const gasto = await db.creditoConvite.updateMany({
      where: { id: candidato.id, eventId: null },
      data: { eventId },
    });
    if (gasto.count === 1) return true;
  }
  return false;
}
