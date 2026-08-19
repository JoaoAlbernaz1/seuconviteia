// Nucleo (server-only, SEM "use server") do passe de edicao. Chamado SO pelo
// webhook do Mercado Pago — e por ninguem mais.
//
// Quem abre a janela de edicao de um convite publicado e o gateway, depois de
// confirmar o dinheiro; nunca o clique no painel (a action `comprarPasseEdicao`
// so pede a cobranca e a deixa PENDING). Mesmo principio do presente do
// convidado em `presentearCore.ts` e da assinatura em `assinaturaCore.ts`.
import { prisma } from "@/lib/db";
import { fimDoPasse } from "@/lib/edicao";

/** Violacao de indice unico do Prisma (`providerId` @unique). */
function ehDuplicata(err: unknown): boolean {
  return (err as { code?: unknown } | null)?.code === "P2002";
}

/**
 * Confirma o passe pago e ABRE a janela de 48h.
 *
 * Idempotente pelo COMPARE-AND-SET no status: o Mercado Pago reentrega a mesma
 * notificacao mais de uma vez por contrato, e so quem consegue virar a linha de
 * PENDING para PAID (`count === 1`) empurra `edicaoAte`. As duas escritas vao na
 * MESMA transacao: se a abertura da janela falhar, o PAID desfaz junto — senao
 * ficaria uma cobranca paga que nenhuma reentrega posterior conseguiria honrar
 * (a segunda passada acharia o status ja PAID e sairia por baixo).
 *
 * A janela e contada a partir de `agora`, nao da criacao da cobranca: um Pix
 * pago dias depois abre normalmente. A pessoa pagou.
 *
 * `providerId` e o id da cobranca no MP: grava-lo junto com o PAID conserta a
 * linha orfa (cobranca criada, vinculo nao gravado) e devolve ao ledger a rede
 * do indice unico.
 */
export async function confirmarPasseEdicao(
  transactionId: string,
  agora: Date,
  providerId?: string | null,
): Promise<void> {
  try {
    await aplicarPasse(transactionId, agora, providerId ?? null);
  } catch (err) {
    if (!ehDuplicata(err)) throw err;
    // O `providerId` ja pertence a OUTRA linha. O dinheiro entrou de qualquer
    // jeito, entao a janela abre sem o vinculo — e a colisao vai para o log,
    // alto, porque um 500 aqui faria o MP reentregar a mesma notificacao para
    // sempre, sem nunca conceder nada.
    console.error(
      `[passe-edicao] providerId ${providerId} ja e de outra cobrança — tx=${transactionId} confirmada SEM vínculo`,
      err,
    );
    await aplicarPasse(transactionId, agora, null);
  }
}

/** O compare-and-set e a abertura da janela, numa transacao so. */
async function aplicarPasse(
  transactionId: string,
  agora: Date,
  providerId: string | null,
): Promise<void> {
  await prisma.$transaction(async (db) => {
    const marcada = await db.transaction.updateMany({
      where: { id: transactionId, kind: "EDIT_PASS", status: "PENDING" },
      data: { status: "PAID", ...(providerId ? { providerId } : {}) },
    });
    if (marcada.count !== 1) return; // ja confirmada, ou nao e passe de edicao

    // O evento existe: `Transaction.eventId` e FK com cascade, entao linha viva
    // implica convite vivo.
    const tx = await db.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      select: { eventId: true },
    });
    const evento = await db.event.findUniqueOrThrow({
      where: { id: tx.eventId },
      select: { edicaoAte: true },
    });

    // EMPILHA: as 48h contam do fim da janela que ainda corre (ou de agora, se
    // ja venceu). Quem pagou dois passes ganha 96h — pagar duas vezes pela mesma
    // janela seria ficar com R$ 39,80 e entregar 48h. Sem teto: cinco passes,
    // cinco janelas; ele pagou por elas.
    const base = evento.edicaoAte && evento.edicaoAte > agora ? evento.edicaoAte : agora;
    await db.event.update({ where: { id: tx.eventId }, data: { edicaoAte: fimDoPasse(base) } });
  });
}

/**
 * Acha a cobranca do passe que uma notificacao de pagamento esta confirmando.
 *
 * O caminho normal e o `providerId` (o id da cobranca no MP, gravado na compra).
 * A `referencia` (o `external_reference`, que E o id da nossa linha) e a rede:
 * quando a compra criou a cobranca no gateway mas falhou ao gravar o vinculo,
 * a linha fica PENDING sem `providerId` — e sem esta segunda tentativa o Pix
 * pago nunca acharia dono.
 */
export async function acharPasseEdicao(
  dataId: string,
  referencia: string | null | undefined,
): Promise<string | null> {
  const porCobranca = await prisma.transaction.findFirst({
    where: { providerId: dataId, kind: "EDIT_PASS" },
    select: { id: true },
  });
  if (porCobranca) return porCobranca.id;

  if (!referencia) return null;
  const porReferencia = await prisma.transaction.findFirst({
    where: { id: referencia, kind: "EDIT_PASS" },
    select: { id: true },
  });
  return porReferencia?.id ?? null;
}
