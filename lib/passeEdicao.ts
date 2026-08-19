// Nucleo (server-only, SEM "use server") do passe de edicao. Chamado SO pelo
// webhook do Mercado Pago — e por ninguem mais.
//
// Quem abre a janela de edicao de um convite publicado e o gateway, depois de
// confirmar o dinheiro; nunca o clique no painel (a action `comprarPasseEdicao`
// so pede a cobranca e a deixa PENDING). Mesmo principio do presente do
// convidado em `presentearCore.ts` e da assinatura em `assinaturaCore.ts`.
import { prisma } from "@/lib/db";
import { fimDoPasse } from "@/lib/edicao";

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
 */
export async function confirmarPasseEdicao(transactionId: string, agora: Date): Promise<void> {
  await prisma.$transaction(async (db) => {
    const marcada = await db.transaction.updateMany({
      where: { id: transactionId, kind: "EDIT_PASS", status: "PENDING" },
      data: { status: "PAID" },
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

    // Segundo passe pago com a janela ainda aberta ESTENDE, nunca encurta: quem
    // pagou duas vezes ganha tempo em vez de perder o dinheiro em silencio (nao
    // estornamos automaticamente).
    const ate = fimDoPasse(agora);
    await db.event.update({
      where: { id: tx.eventId },
      data: {
        edicaoAte: evento.edicaoAte && evento.edicaoAte > ate ? evento.edicaoAte : ate,
      },
    });
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
