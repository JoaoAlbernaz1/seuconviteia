"use server";

/**
 * Passe de edicao: o convite publicado reabre por 48h (`PASSE_HORAS`) contra um
 * Pix de R$ 19,90.
 *
 * Espelha `lib/presentear.ts`: cria a linha PENDING primeiro (o id vira a
 * referencia da cobranca) e marca FAILED se o gateway recusar. E NUNCA concede
 * — nada aqui toca `Event.edicaoAte`. Quem abre a janela e o webhook
 * (/api/webhooks/mercadopago), depois de reconsultar o pagamento no MP; esta
 * action so sabe pedir a cobranca.
 */
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/pagamentos";
import { PASSE_PRECO_CENTS, edicaoAberta } from "@/lib/edicao";
import { conviteEncerrado } from "@/lib/event";

export type ComprarPasseResult =
  | { ok: true; pixCode: string; pixQrUrl: string; transactionId: string }
  | { ok: false; erro: string };

/** O id vem do cliente: valida na borda antes de virar query (CLAUDE.md). */
const eventIdSchema = z.string().trim().min(1).max(40);

/**
 * Por quanto tempo uma cobranca PENDENTE deste convite ainda e REAPROVEITADA em
 * vez de virar uma segunda. Duas abas (ou dois cliques) criariam duas linhas com
 * ids diferentes — e o `X-Idempotency-Key` do provider E a referencia, ou seja,
 * o id da linha (`lib/pagamentos/mercadopago.ts`). Ids diferentes = dois Pix de
 * verdade, os dois pagaveis: R$ 39,80 por uma janela de 48h, sem estorno
 * automatico. Reaproveitando a linha, a referencia se repete e a idempotencia do
 * Mercado Pago finalmente morde: volta o MESMO QR.
 */
const REAPROVEITAR_MINUTOS = 30;

export async function comprarPasseEdicao(eventId: string): Promise<ComprarPasseResult> {
  const session = await auth();
  // O `id` entra em `where`, e o Prisma IGNORA campo `undefined`: sem esta
  // pergunta, uma sessao velha sem `id` transformaria o findFirst em "qualquer
  // convite com esse id" — de qualquer conta.
  if (!session?.user?.id) return { ok: false, erro: "Sua sessão expirou. Entre de novo." };

  const id = eventIdSchema.safeParse(eventId);
  if (!id.success) return { ok: false, erro: "Convite não encontrado." };

  // Ownership pelo `professionalId` da SESSAO: id de convite alheio nao compra
  // passe (e nem revela que o convite existe).
  const event = await prisma.event.findFirst({
    where: { id: id.data, professionalId: session.user.id },
    select: { id: true, title: true, status: true, expiresAt: true, edicaoAte: true },
  });
  if (!event) return { ok: false, erro: "Convite não encontrado." };

  const agora = new Date();
  // Janela aberta = nao ha o que vender. Perguntar isto ANTES do fim da festa e
  // a mesma ordem DRAFT-primeiro de `edicaoAberta`: rascunho edita sempre, entao
  // rascunho tambem nao compra passe — e a resposta certa para ele e "ja esta
  // liberada", nao "a festa passou".
  if (edicaoAberta(event, agora)) {
    return { ok: false, erro: "A edição deste convite já está liberada." };
  }
  // Convite encerrado cai FORA da janela como qualquer outro, e nesse ponto
  // `edicaoAberta` sozinha ja teria deixado cobrar R$ 19,90 por um convite morto
  // — o passe abriria 48h de edicao num site que nao volta ao ar.
  if (conviteEncerrado(event, agora)) {
    return { ok: false, erro: "Esta festa já passou. Crie um convite novo para a próxima." };
  }

  // Cobranca recente ainda em aberto deste convite: e ela que sera repedida ao
  // provider, com a mesma referencia. Vale inclusive para a linha que ficou sem
  // `providerId` (ver o catch la embaixo): repedir devolve o mesmo chargeId e
  // conserta o vinculo que o webhook precisa.
  const aberta = await prisma.transaction.findFirst({
    where: {
      eventId: event.id,
      kind: "EDIT_PASS",
      status: "PENDING",
      createdAt: { gt: new Date(agora.getTime() - REAPROVEITAR_MINUTOS * 60_000) },
    },
    orderBy: { createdAt: "desc" },
  });

  // A linha nasce PENDING: e ela que o webhook vai reencontrar pelo `providerId`.
  const tx =
    aberta ??
    (await prisma.transaction.create({
      data: { eventId: event.id, amountCents: PASSE_PRECO_CENTS, kind: "EDIT_PASS", status: "PENDING" },
    }));

  let cobranca;
  try {
    cobranca = await getPaymentProvider().criarCobrancaPix({
      valorCents: PASSE_PRECO_CENTS,
      descricao: `Liberar edição — ${event.title}`,
      referencia: tx.id,
      pagador: { email: session.user.email ?? undefined },
    });
  } catch (err) {
    console.error("[passe-edicao] falha ao criar cobrança Pix:", err);
    // FAILED so vale AQUI, onde a cobranca provavelmente nem nasceu. A linha
    // REAPROVEITADA fica quieta: o Pix dela pode estar vivo desde a tentativa
    // anterior, e derrubar a linha derrubaria o unico rastro dele.
    if (!aberta) {
      await prisma.transaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
    }
    return { ok: false, erro: "Não foi possível gerar o Pix agora. Tente de novo." };
  }

  // Daqui para baixo a cobranca EXISTE no gateway. Marcar FAILED depois disto
  // seria mentir para o ledger: o cliente pagaria um Pix vivo, o webhook
  // procuraria pelo `providerId` que nao gravamos e o dinheiro entraria sem
  // ninguem receber a janela de edicao.
  if (tx.providerId !== cobranca.chargeId) {
    if (tx.providerId) {
      // Idempotencia do MP nao segurou (janela dela vencida?). O QR que o cliente
      // recebe agora e o novo, entao e o novo que o webhook precisa reconhecer.
      console.error(
        `[passe-edicao] cobrança trocou de id — tx=${tx.id} antigo=${tx.providerId} novo=${cobranca.chargeId}`,
      );
    }
    try {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { providerId: cobranca.chargeId },
      });
    } catch (err) {
      console.error(
        `[passe-edicao] cobrança criada mas o providerId não gravou — tx=${tx.id} charge=${cobranca.chargeId}`,
        err,
      );
      // A linha continua PENDING de proposito: e a verdade (Pix vivo) e da ao
      // webhook a chance de achar. Tentar de novo cai no reaproveitamento acima,
      // que repede a MESMA cobranca e grava o vinculo que faltou.
      return { ok: false, erro: "Não foi possível gerar o Pix agora. Tente de novo." };
    }
  }

  return {
    ok: true,
    pixCode: cobranca.pixCode,
    pixQrUrl: cobranca.pixQrUrl,
    transactionId: tx.id,
  };
}
