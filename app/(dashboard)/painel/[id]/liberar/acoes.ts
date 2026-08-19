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

export async function comprarPasseEdicao(eventId: string): Promise<ComprarPasseResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, erro: "Sua sessão expirou. Entre de novo." };

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

  const provider = getPaymentProvider();
  // A linha nasce PENDING: e ela que o webhook vai reencontrar pelo `providerId`.
  const tx = await prisma.transaction.create({
    data: { eventId: event.id, amountCents: PASSE_PRECO_CENTS, kind: "EDIT_PASS", status: "PENDING" },
  });

  try {
    const cobranca = await provider.criarCobrancaPix({
      valorCents: PASSE_PRECO_CENTS,
      descricao: `Liberar edição — ${event.title}`,
      referencia: tx.id,
      pagador: { email: session.user.email ?? undefined },
    });
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { providerId: cobranca.chargeId },
    });
    return {
      ok: true,
      pixCode: cobranca.pixCode,
      pixQrUrl: cobranca.pixQrUrl,
      transactionId: tx.id,
    };
  } catch (err) {
    console.error("[passe-edicao] falha ao criar cobrança Pix:", err);
    await prisma.transaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
    return { ok: false, erro: "Não foi possível gerar o Pix agora. Tente de novo." };
  }
}
