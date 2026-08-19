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
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/pagamentos";
import {
  PASSE_PRECO_CENTS,
  RECUSA_FESTA_PASSOU,
  edicaoAberta,
  fimDoPasse,
  passesIncluidos,
  temPasseIncluido,
} from "@/lib/edicao";
import { conviteEncerrado } from "@/lib/event";
import { SELECT_ASSINATURA, planoEfetivo, type ContaAssinatura } from "@/lib/plans";

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
    return { ok: false, erro: RECUSA_FESTA_PASSOU };
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
    return { ok: false, erro: RECUSA_FESTA_PASSOU };
  }
  const recusa = recusaDaCota(prof, event.passesGratisUsados, agora);
  if (recusa) return { ok: false, erro: recusa };

  // COMPARE-AND-SET: `passesGratisUsados` entra no WHERE com o valor que acabou
  // de ser lido, entao esta escrita so vale se NINGUEM tiver mexido no contador
  // no meio. O que ela impede e a escrita VELHA: entre o SELECT e o UPDATE o
  // numero pode ter virado 2, e gravar "o que eu li + 1" o faria voltar para 1 —
  // uma cota gasta ressuscitada, com 48h de brinde. Nao ha transacao explicita
  // porque e um UPDATE unico e condicional: o Postgres trava a linha, e o
  // segundo a chegar reavalia o WHERE depois do commit do primeiro.
  //
  // `fimDoPasse(agora)` SOBRESCREVE em vez de empilhar de proposito: so se chega
  // ate aqui com a janela fechada, entao nao ha tempo vivo para encurtar.
  const aplicado = await prisma.event.updateMany({
    where: { id: event.id, passesGratisUsados: event.passesGratisUsados },
    data: { passesGratisUsados: event.passesGratisUsados + 1, edicaoAte: fimDoPasse(agora) },
  });

  if (aplicado.count !== 1) {
    // Nao aplicou. O caso comum e o proprio dono clicando duas vezes: o outro
    // clique ja abriu a janela e gastou UMA cota so. Por isso releia antes de
    // dar erro — dizer "tente de novo" com a edicao ja liberada faz a pessoa
    // clicar de novo achando que falhou.
    const atual = await prisma.event.findUnique({
      where: { id: event.id },
      select: { status: true, expiresAt: true, edicaoAte: true },
    });
    if (!atual || !edicaoAberta(atual, new Date())) {
      return { ok: false, erro: "Tente de novo." };
    }
    revalidarConvite(event.id);
    return { ok: true };
  }

  revalidarConvite(event.id);
  return { ok: true };
}

/**
 * Por que a liberacao incluida foi recusada — ou `null` quando ela pode sair.
 *
 * Sao TRES estados diferentes, e uma frase so os escondia. O que mais doia era o
 * do meio: quem assinou, publicou e deixou a assinatura vencer ouvia "voce ja
 * usou" sem nunca ter usado nada — e sem descobrir que renovar resolvia.
 */
function recusaDaCota(prof: ContaAssinatura, usadas: number, agora: Date): string | null {
  if (temPasseIncluido(planoEfetivo(prof, agora), usadas)) return null;

  // Teto do plano CONTRATADO: o maior que esta conta ja deu a este convite.
  const contratado = passesIncluidos(prof.plan);
  // Gastou tudo o que o plano dava. Renovar nao devolve — a cota e por convite.
  if (contratado > 0 && usadas >= contratado) {
    return "Você já usou as liberações incluídas neste convite.";
  }
  // Ainda sobrava cota e mesmo assim o direito sumiu. `assinaturaAte` NAO-NULO e
  // o que separa "venceu" de "nunca pagou": `planoEfetivo` rebaixa para Basico
  // nos dois casos, e quem escolheu plano pago na landing e abandonou o cartao
  // fica exatamente assim (plano contratado gravado, vencimento nulo). Sem esta
  // pergunta ele ouviria "sua assinatura venceu" — mentira, e ainda vendendo uma
  // renovacao a quem nunca assinou.
  if (contratado > 0 && prof.assinaturaAte !== null) {
    return "Sua assinatura venceu, então este convite não tem mais liberações incluídas.";
  }
  return "Seu plano não inclui liberações de edição.";
}

/**
 * A janela abriu AGORA e o proximo clique da pessoa e em "editar": sem
 * revalidar, o painel serviria do cache a versao que ainda diz "fechado" — e o
 * botao que ela acabou de usar continuaria dizendo para pagar. A publicacao
 * (`painel/criar/acoes.ts`) faz o mesmo.
 */
function revalidarConvite(eventId: string): void {
  revalidatePath("/painel");
  revalidatePath(`/painel/${eventId}`);
}
