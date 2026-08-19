"use server";

/**
 * As duas portas do painel para reabrir por 48h (`PASSE_HORAS`) a edicao de um
 * convite publicado: o Pix de R$ 19,90 (`comprarPasseEdicao`) e a liberacao ja
 * INCLUIDA no plano (`usarPasseIncluido`).
 *
 * `comprarPasseEdicao` espelha `lib/presentear.ts`: cria a linha PENDING
 * primeiro (o id vira a referencia da cobranca) e marca FAILED se o gateway
 * recusar. E NUNCA concede — nada nela toca `Event.edicaoAte`. Quem abre a
 * janela depois de um Pix e o webhook (/api/webhooks/mercadopago), depois de
 * reconsultar o pagamento no MP; a action so sabe pedir a cobranca.
 */
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/pagamentos";
import { PASSE_PRECO_CENTS, edicaoAberta, fimDoPasse, temPasseIncluido } from "@/lib/edicao";
import { conviteEncerrado } from "@/lib/event";
import { SELECT_ASSINATURA, planoEfetivo } from "@/lib/plans";

export type ComprarPasseResult =
  | { ok: true; pixCode: string; pixQrUrl: string; transactionId: string }
  | { ok: false; erro: string };

export type UsarPasseIncluidoResult = { ok: true } | { ok: false; erro: string };

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

/**
 * Usa uma liberacao INCLUIDA no plano (Gratis 0, Profissional 1, Estudio 3 —
 * `passesIncluidos`). O teto e POR CONVITE: sem teto, "editar de graca" viraria
 * edicao infinita e o passe pago nao existiria para quem assina.
 *
 * Esta e a TERCEIRA (e ultima) escrita de `Event.edicaoAte` no repo, ao lado da
 * cortesia da primeira publicacao (`painel/criar/acoes.ts`) e do webhook
 * (`lib/passeEdicao.ts`). Aqui e legitimo porque a cota nao e cortesia nem venda
 * nova: e direito JA PAGO na mensalidade, entao a janela abre no ato, sem passar
 * pelo gateway. Um quarto escritor precisa da mesma justificativa.
 */
export async function usarPasseIncluido(eventId: string): Promise<UsarPasseIncluidoResult> {
  const session = await auth();
  // Mesma guarda da compra: sem `id`, o `undefined` some do `where` do Prisma e
  // a consulta viraria "qualquer convite com esse id" — gastando a cota (e
  // abrindo a edicao) de convite alheio.
  if (!session?.user?.id) return { ok: false, erro: "Sua sessão expirou. Entre de novo." };

  const id = eventIdSchema.safeParse(eventId);
  if (!id.success) return { ok: false, erro: "Convite não encontrado." };

  const [event, prof] = await Promise.all([
    // Ownership pelo `professionalId` da SESSAO, como na compra.
    prisma.event.findFirst({
      where: { id: id.data, professionalId: session.user.id },
      select: { id: true, status: true, expiresAt: true, edicaoAte: true, passesGratisUsados: true },
    }),
    // A conta vem com `SELECT_ASSINATURA` porque o direito e o `planoEfetivo`,
    // nunca o `prof.plan`: quem cancelou o Estudio nao fica com as 3 liberacoes.
    prisma.professional.findUnique({
      where: { id: session.user.id },
      select: SELECT_ASSINATURA,
    }),
  ]);
  if (!event || !prof) return { ok: false, erro: "Convite não encontrado." };

  const agora = new Date();
  // A ordem e a mesma da compra, e ela e a regra: `edicaoAberta` e
  // DRAFT-primeiro, entao rascunho ouve "ja esta liberada" — e nao "a festa
  // passou", que o mandaria criar convite novo por causa da data que ele ainda
  // esta consertando.
  if (edicaoAberta(event, agora)) {
    return { ok: false, erro: "A edição deste convite já está liberada." };
  }
  // Convite encerrado cai fora da janela como qualquer outro: sem esta pergunta
  // a pessoa queimaria uma cota do plano para editar um site que nao volta ao ar.
  if (conviteEncerrado(event, agora)) {
    return { ok: false, erro: "Esta festa já passou. Crie um convite novo para a próxima." };
  }
  if (!temPasseIncluido(planoEfetivo(prof, agora), event.passesGratisUsados)) {
    return { ok: false, erro: "Você já usou as liberações incluídas neste convite." };
  }

  // COMPARE-AND-SET: `passesGratisUsados` entra no WHERE com o valor que acabou de ser
  // lido. Dois cliques simultaneos leem o mesmo 0, os dois UPDATEs disputam a
  // MESMA linha e o Postgres reavalia o WHERE do segundo depois do commit do
  // primeiro — ele nao acha linha e nao consome a segunda cota. Sem isto os dois
  // gravariam 1 e o convite teria recebido duas liberacoes por uma so cota (e
  // por isso nao ha transacao explicita aqui: e um UPDATE unico e condicional).
  //
  // `fimDoPasse(agora)` SOBRESCREVE em vez de empilhar de proposito: so se chega
  // ate aqui com a janela fechada, entao nao ha tempo vivo para encurtar.
  const aplicado = await prisma.event.updateMany({
    where: { id: event.id, passesGratisUsados: event.passesGratisUsados },
    data: { passesGratisUsados: event.passesGratisUsados + 1, edicaoAte: fimDoPasse(agora) },
  });
  // Perdeu a corrida (ou a linha sumiu). "Tente de novo" e a verdade util: no
  // recarregar, a tela ja mostra a edicao liberada pelo clique que venceu.
  if (aplicado.count !== 1) return { ok: false, erro: "Tente de novo." };
  return { ok: true };
}
