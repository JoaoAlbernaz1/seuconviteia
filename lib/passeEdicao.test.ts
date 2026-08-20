// Teste do NUCLEO do passe contra BANCO DE VERDADE: o que se prova aqui (a
// segunda confirmacao do mesmo pagamento nao empurra a janela de novo, duas
// confirmacoes simultaneas empurram uma vez so) mora no compare-and-set de uma
// linha, e mock nenhum reproduz isso. Atras da mesma env var de
// `assinaturaCore.test.ts`:
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run lib/passeEdicao.test.ts
import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PASSE_PRECO_CENTS, fimDoPasse } from "./edicao";
import { confirmarPasseEdicao } from "./passeEdicao";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "passe-core-teste";

/** Convite PUBLICADO com a janela ja vencida — o caso real de quem compra passe. */
async function conviteFechado(db: PrismaClient) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x", plan: "BASICO" },
  });
  return db.event.create({
    data: {
      professionalId: prof.id,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa de teste",
      eventDate: new Date("2030-01-01T00:00:00Z"),
      expiresAt: new Date("2030-02-01T00:00:00Z"),
      status: "PUBLISHED",
      plan: "BASICO",
      edicaoAte: new Date(Date.now() - 60_000), // venceu ha um minuto
    },
  });
}

/** Cobranca do passe como a Task 4 a cria: nasce PENDING. */
async function cobrancaPendente(
  db: PrismaClient,
  eventId: string,
  extra: { createdAt?: Date; kind?: string; providerId?: string } = {},
) {
  return db.transaction.create({
    data: {
      eventId,
      amountCents: PASSE_PRECO_CENTS,
      kind: extra.kind ?? "EDIT_PASS",
      status: "PENDING",
      ...(extra.createdAt ? { createdAt: extra.createdAt } : {}),
      ...(extra.providerId ? { providerId: extra.providerId } : {}),
    },
  });
}

describe("confirmarPasseEdicao", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("pagamento confirmado abre 48h a partir de AGORA", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id);
    const agora = new Date();

    await confirmarPasseEdicao(tx.id, agora);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(agora).toISOString());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PAID");
  });

  it.skipIf(!enabled)("a MESMA cobranca confirmada duas vezes nao empurra a janela de novo", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id);
    const agora = new Date();

    await confirmarPasseEdicao(tx.id, agora);
    // O MP reentrega a mesma notificacao por contrato; horas depois, inclusive.
    await confirmarPasseEdicao(tx.id, new Date(agora.getTime() + 3 * 60 * 60_000));

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(agora).toISOString());
  });

  it.skipIf(!enabled)("duas confirmacoes SIMULTANEAS abrem a janela uma vez so", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id);
    const a = new Date();
    const b = new Date(a.getTime() + 60 * 60_000);

    await Promise.all([confirmarPasseEdicao(tx.id, a), confirmarPasseEdicao(tx.id, b)]);

    // Uma das duas ganha a corrida; o que nao pode e a janela levar as duas.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    const venceu = [fimDoPasse(a).toISOString(), fimDoPasse(b).toISOString()];
    expect(venceu).toContain(depois.edicaoAte?.toISOString());
  });

  it.skipIf(!enabled)("Pix pago dias depois abre a janela contada da confirmacao", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id, {
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60_000),
    });
    const agora = new Date();

    // A pessoa pagou. Negar seria ficar com o dinheiro dela.
    await confirmarPasseEdicao(tx.id, agora);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(agora).toISOString());
  });

  it.skipIf(!enabled)("passe pago com a janela CORRENDO empilha 48h no que ainda falta", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const longe = new Date(Date.now() + 10 * 24 * 60 * 60_000);
    await db.event.update({ where: { id: event.id }, data: { edicaoAte: longe } });
    const tx = await cobrancaPendente(db, event.id);

    await confirmarPasseEdicao(tx.id, new Date());

    // 48h a partir de AGORA seria encurtar de 10 dias para 2; e 48h a partir do
    // fim vigente e o que ele comprou.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(longe).toISOString());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PAID");
  });

  it.skipIf(!enabled)("DOIS pagamentos distintos = 96h (quem pagou duas vezes ganha duas janelas)", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const um = await cobrancaPendente(db, event.id, { providerId: `${MARCA}-cob-a-${Date.now()}` });
    const dois = await cobrancaPendente(db, event.id, { providerId: `${MARCA}-cob-b-${Date.now()}` });
    const agora = new Date();

    await confirmarPasseEdicao(um.id, agora);
    await confirmarPasseEdicao(dois.id, agora);

    // Sao duas cobrancas pagas; ficar com o dinheiro e devolver 48h nao e opcao.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(fimDoPasse(agora)).toISOString());
  });

  it.skipIf(!enabled)("dois pagamentos CONCORRENTES somam 96h (corrida FORCADA por lock)", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const um = await cobrancaPendente(db, event.id, { providerId: `${MARCA}-par-a-${Date.now()}` });
    const dois = await cobrancaPendente(db, event.id, { providerId: `${MARCA}-par-b-${Date.now()}` });
    const agora = new Date();

    // `Promise.all` sozinho NAO reproduz o lost update: as duas confirmacoes
    // acabam antes de se cruzarem e o teste passa ate com read-then-write. O que
    // morde e travar a linha do evento numa conexao separada (`FOR UPDATE`): o
    // `SELECT` do MVCC nao bloqueia, mas o `UPDATE` sim, entao as duas leem a
    // MESMA base antes de qualquer escrita — o interleaving exato do bug.
    const bloqueador = new PrismaClient();
    let confirmacoes: Promise<unknown> | undefined;
    await bloqueador.$transaction(async (trava) => {
      await trava.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${event.id} FOR UPDATE`;
      confirmacoes = Promise.all([
        confirmarPasseEdicao(um.id, agora),
        confirmarPasseEdicao(dois.id, agora),
      ]);
      // Tempo de as duas chegarem no UPDATE e ficarem penduradas na trava.
      await new Promise((r) => setTimeout(r, 300));
    });
    await confirmacoes;
    await bloqueador.$disconnect();

    // Duas cobrancas pagas = 96h. 48h aqui seria ficar com R$ 19,90 calado.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(fimDoPasse(agora)).toISOString());
  });

  it.skipIf(!enabled)("confirmar grava o vinculo (`providerId`) na linha orfa", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id); // sem providerId: o buraco da Task 4
    const cobranca = `${MARCA}-orfa-${Date.now()}`;

    await confirmarPasseEdicao(tx.id, new Date(), cobranca);

    // Sem o vinculo, o indice unico do ledger deixa de ser rede contra lancar o
    // mesmo pagamento duas vezes.
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).providerId).toBe(cobranca);
  });

  it.skipIf(!enabled)("vinculo que ja e de outra cobranca nao impede a janela de abrir", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const cobranca = `${MARCA}-colidida-${Date.now()}`;
    await cobrancaPendente(db, event.id, { providerId: cobranca }); // dona do `@unique`
    const tx = await cobrancaPendente(db, event.id);
    const agora = new Date();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await confirmarPasseEdicao(tx.id, agora, cobranca);

    // O dinheiro entrou: a janela abre mesmo sem conseguir gravar o vinculo — e
    // a colisao vai para o log, alto, porque alguem precisa olhar.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(agora).toISOString());
    const confirmada = await db.transaction.findUniqueOrThrow({ where: { id: tx.id } });
    expect(confirmada.status).toBe("PAID");
    expect(confirmada.providerId).toBeNull();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  // O FAILED do nosso lado e um PALPITE: `comprarPasseEdicao` marca a linha
  // assim quando `criarCobrancaPix` LANCA, e o caso classico e o timeout de rede
  // depois de o MP ja ter criado a cobranca — o QR existe e o cliente paga. Quem
  // chega aqui e o webhook, que ja reconsultou o pagamento e ouviu PAID do
  // gateway: recusar seria ficar com o dinheiro e nao abrir a janela.
  it.skipIf(!enabled)("Pix pago de uma linha FAILED abre a janela (o QR estava vivo)", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id);
    await db.transaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
    const agora = new Date();

    await confirmarPasseEdicao(tx.id, agora, `${MARCA}-cob-failed-${Date.now()}`);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(agora).toISOString());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PAID");
  });

  it.skipIf(!enabled)("a linha FAILED confirmada duas vezes tambem so concede uma janela", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id);
    await db.transaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
    const cobranca = `${MARCA}-cob-failed2-${Date.now()}`;
    const agora = new Date();

    await confirmarPasseEdicao(tx.id, agora, cobranca);
    const primeira = (await db.event.findUniqueOrThrow({ where: { id: event.id } })).edicaoAte!;
    // Reentrega do MP: o CAS ja nao pega (a linha esta PAID) e nada empilha.
    await confirmarPasseEdicao(tx.id, new Date(), cobranca);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBe(primeira.getTime());
  });

  it.skipIf(!enabled)("SEGUNDO Pix sobre a mesma cobranca ja paga vira incidente no log", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id, { providerId: `${MARCA}-cob-1-${Date.now()}` });
    await confirmarPasseEdicao(tx.id, new Date(), `${MARCA}-cob-1-${Date.now()}`);

    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    // Outra cobranca (outro `data.id`) apontando para a MESMA linha, ja PAID.
    await confirmarPasseEdicao(tx.id, new Date(), `${MARCA}-cob-2`);
    expect(log.mock.calls.flat().join(" ")).toContain("APROVADO");
    log.mockRestore();
  });

  it.skipIf(!enabled)("reentrega da MESMA notificacao sai calada (e rotina, nao incidente)", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const cobranca = `${MARCA}-cob-re-${Date.now()}`;
    const tx = await cobrancaPendente(db, event.id, { providerId: cobranca });
    await confirmarPasseEdicao(tx.id, new Date(), cobranca);

    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await confirmarPasseEdicao(tx.id, new Date(), cobranca);
    // Log de incidente que grita em cima de rotina treina todo mundo a ignorar.
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it.skipIf(!enabled)("lancamento que nao e passe de edicao nao abre nada", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id, { kind: "GIFT_PIX" });

    await confirmarPasseEdicao(tx.id, new Date());

    // Presente de convidado paga o cofre do dono, nao a edicao do site.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PENDING");
  });
});
