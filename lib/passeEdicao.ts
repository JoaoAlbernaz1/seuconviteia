// Nucleo (server-only, SEM "use server") do passe de edicao. Chamado SO pelo
// webhook do Mercado Pago — e por ninguem mais.
//
// Quem abre a janela de edicao de um convite publicado e o gateway, depois de
// confirmar o dinheiro; nunca o clique no painel (a action `comprarPasseEdicao`
// so pede a cobranca e a deixa PENDING). Mesmo principio do presente do
// convidado em `presentearCore.ts` e da assinatura em `assinaturaCore.ts`.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PASSE_HORAS } from "@/lib/edicao";
import { conviteEncerrado } from "@/lib/event";

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
    // FAILED tambem entra. `comprarPasseEdicao` marca FAILED quando
    // `criarCobrancaPix` LANCA — e o caso classico e o timeout de rede DEPOIS de
    // o Mercado Pago ter criado a cobranca: o QR existe, o cliente paga, e uma
    // linha presa em FAILED faria este compare-and-set nao pegar nada. Dinheiro
    // dentro, janela fechada.
    //
    // Aceitar FAILED nao afrouxa nada: quem chega aqui e o webhook, que ja
    // reconsultou o pagamento no MP e ouviu dele que esta PAID — a verdade e do
    // gateway, e o FAILED do nosso lado era so um palpite. E o CAS continua
    // garantindo concessao unica: depois da primeira passada a linha esta PAID,
    // que nao esta na lista.
    const marcada = await db.transaction.updateMany({
      where: { id: transactionId, kind: "EDIT_PASS", status: { in: ["PENDING", "FAILED"] } },
      data: { status: "PAID", ...(providerId ? { providerId } : {}) },
    });
    if (marcada.count !== 1) {
      await avisarQueNaoAplicou(db, transactionId, providerId);
      return;
    }

    // O evento existe: `Transaction.eventId` e FK com cascade, entao linha viva
    // implica convite vivo.
    const tx = await db.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      select: { eventId: true, event: { select: { status: true, expiresAt: true } } },
    });
    // Pix pago DEPOIS de o convite vencer: a janela e gravada mesmo assim (o
    // UPDATE abaixo nao pergunta a data), mas `edicaoAberta` reprova em seguida
    // por convite encerrado — dinheiro dentro, nada aberto, e o estorno e manual.
    // Nao da para calar isso: sem o log, ninguem nunca fica sabendo.
    if (conviteEncerrado(tx.event, agora)) {
      console.error(
        `[passe-edicao] passe PAGO de convite ENCERRADO — tx=${transactionId} evento=${tx.eventId} ` +
          `expirou=${tx.event.expiresAt.toISOString()} status=${tx.event.status}. ` +
          "A janela nao abre (`edicaoAberta` reprova): ESTORNAR na mao.",
      );
    }

    // EMPILHA, e a soma e feita PELO BANCO num UPDATE so.
    //
    // Ler `edicaoAte` aqui e escrever depois perde atualizacao: a transacao
    // interativa do Prisma roda em READ COMMITTED, entao duas notificacoes do MP
    // em paralelo leem a MESMA base e a segunda sobrescreve a primeira — duas
    // cobrancas pagas, 48h entregues. No UPDATE atomico a linha do evento fica
    // travada e a segunda soma em cima do valor ja commitado: 96h.
    //
    // As 48h contam do fim da janela que ainda corre (ou de `agora`, se ja
    // venceu). Sem teto: cinco passes, cinco janelas; ele pagou por elas.
    //
    // SQL cru porque o Prisma nao expressa `GREATEST(...) + interval` num update
    // so; o banco e Postgres no local E na producao (cabecalho do schema), e
    // `PASSE_HORAS` continua sendo a fonte do prazo — nao ha 48 escrito aqui.
    //
    // O `AT TIME ZONE 'UTC'` NAO E ENFEITE: `edicaoAte` e `timestamp` (sem
    // fuso) e o Prisma amarra o `Date` como `timestamptz`, entao `COALESCE`/
    // `GREATEST` promoveriam a coluna usando o TimeZone da SESSAO. Com a sessao
    // em America/Sao_Paulo a janela sai 45h em vez de 48h, calada — basta um
    // `options=-c timezone=...` na URL ou um `ALTER DATABASE ... SET timezone`.
    // Fixando os dois lados em UTC, a conta e a mesma em qualquer fuso.
    const linhas = await db.$executeRaw`
      UPDATE "Event"
         SET "edicaoAte" = GREATEST(
                             COALESCE("edicaoAte", ${agora}::timestamptz AT TIME ZONE 'UTC'),
                             ${agora}::timestamptz AT TIME ZONE 'UTC'
                           )
                           + make_interval(hours => ${PASSE_HORAS}::int)
       WHERE "id" = ${tx.eventId}
    `;
    // `$executeRaw` nao reclama de zero linha — o `event.update` do Prisma
    // lancava P2025. Sem esta pergunta, o PAID commitaria com a janela intacta:
    // dinheiro recebido, nada concedido, e a reentrega seguinte sairia pelo
    // caminho "rotina", calada. Lancar aqui desfaz o PAID e o MP reentrega.
    if (linhas !== 1) {
      throw new Error(
        `[passe-edicao] janela nao abriu: UPDATE afetou ${linhas} linha(s) — ` +
          `tx=${transactionId} evento=${tx.eventId}`,
      );
    }
  });
}

/**
 * A confirmacao NAO aplicou. Reentrega da mesma notificacao e rotina (a linha ja
 * esta PAID com a mesma cobranca) e sai calada; o resto e incidente de DINHEIRO
 * e vai para o log alto. A conta do Mercado Pago e NOSSA: todo pagamento
 * aprovado que chega aqui e nosso, entao "nao consegui aplicar" nunca e normal.
 */
async function avisarQueNaoAplicou(
  db: Prisma.TransactionClient,
  transactionId: string,
  providerId: string | null,
): Promise<void> {
  const tx = await db.transaction.findUnique({
    where: { id: transactionId },
    select: { status: true, kind: true, providerId: true, eventId: true },
  });
  if (!tx) {
    console.error(
      `[passe-edicao] pagamento aprovado para cobrança que sumiu — tx=${transactionId} charge=${providerId ?? "-"}`,
    );
    return;
  }
  if (tx.status === "PAID" && (!providerId || tx.providerId === providerId)) return; // reentrega

  console.error(
    "[passe-edicao] pagamento APROVADO que não abriu janela nenhuma — " +
      `tx=${transactionId} status=${tx.status} kind=${tx.kind} ` +
      `vínculo=${tx.providerId ?? "-"} charge=${providerId ?? "-"} evento=${tx.eventId}`,
  );
}

/**
 * Estorno de um passe: marca a linha e LOGA. A janela NAO fecha — o dono pode
 * ja ter editado, e tirar no meio do trabalho o que ele pagou e pior do que o
 * prejuizo. Fica visivel no ledger para alguem olhar.
 */
export async function registrarEstornoPasse(transactionId: string, dataId: string): Promise<void> {
  const marcada = await prisma.transaction.updateMany({
    where: { id: transactionId, kind: "EDIT_PASS", status: { not: "REFUNDED" } },
    data: { status: "REFUNDED" },
  });
  if (marcada.count !== 1) return; // ja registrado — reentrega da mesma notificacao

  console.error(
    `[passe-edicao] ESTORNO de passe — tx=${transactionId} charge=${dataId}. ` +
      "A janela de edição continua aberta de propósito (o dono pode já estar editando).",
  );
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
