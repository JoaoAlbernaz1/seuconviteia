// Prova que comprar o passe NAO libera nada sozinho: a cobranca nasce PENDING e
// a janela continua fechada. Quem abre e o webhook, depois de reconsultar o MP.
// So o banco de verdade prova isso (`Transaction` + `Event.edicaoAte`), entao o
// teste fica atras da mesma env var dos outros que precisam de banco:
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/passe-edicao.test.ts
//
// Sem `MERCADO_PAGO_ACCESS_TOKEN` no ambiente, `getPaymentProvider()` devolve o
// FakePaymentProvider — o teste nao fala com o Mercado Pago de verdade.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { FakePaymentProvider } from "@/lib/pagamentos";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;
const MARCA = "passe-edicao-teste";

/** A action le a sessao do Auth.js; aqui ela e fixada na conta do teste. */
const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));

/**
 * `getPaymentProvider()` e chamado em runtime, entao da para trocar o provider
 * por teste. O padrao continua sendo o Fake (o resto do modulo fica real); so o
 * caso "gateway fora do ar" derruba a cobranca de proposito.
 */
const providerMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/pagamentos", async (original) => {
  const real = await original<typeof import("@/lib/pagamentos")>();
  return { ...real, getPaymentProvider: providerMock };
});

const { comprarPasseEdicao } = await import("@/app/(dashboard)/painel/[id]/liberar/acoes");

/** Conta + convite PUBLICADO com a janela ja vencida (o caso real da tela). */
async function conviteFechado(db: PrismaClient, plan: "BASICO" | "CLASSICO" | "PREMIUM" = "BASICO") {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x", plan },
  });
  const event = await db.event.create({
    data: {
      professionalId: prof.id,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa de teste",
      eventDate: new Date("2030-01-01T00:00:00Z"),
      expiresAt: new Date("2030-02-01T00:00:00Z"),
      status: "PUBLISHED",
      plan,
      edicaoAte: new Date(Date.now() - 60_000), // venceu ha um minuto
    },
  });
  sessionMock.mockResolvedValue({ user: { id: prof.id, email: prof.email } });
  return { prof, event };
}

beforeEach(() => {
  sessionMock.mockReset();
  providerMock.mockReset();
  providerMock.mockImplementation(() => new FakePaymentProvider());
});

/** Provider que sempre recusa — simula o Mercado Pago fora do ar. */
function gatewayQueCai() {
  return {
    nome: "fake",
    criarCobrancaPix: vi.fn(async () => {
      throw new Error("gateway fora do ar");
    }),
    consultarCobranca: vi.fn(async () => ({ status: "PENDING" as const })),
    transferir: vi.fn(async () => ({ transferId: "x", status: "PAID" as const })),
  };
}

describe("passe de edicao", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("comprar cria EDIT_PASS PENDING de 1990 e NAO abre a janela", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);

    const r = await comprarPasseEdicao(event.id);
    expect(r.ok).toBe(true);

    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });
    expect(tx.kind).toBe("EDIT_PASS");
    expect(tx.amountCents).toBe(1990);
    expect(tx.status).toBe("PENDING");
    // O webhook casa pelo `providerId`; sem ele o pagamento nunca acha a linha.
    expect(tx.providerId).toBeTruthy();

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
  });

  it.skipIf(!enabled)("com a janela ja aberta, recusa a compra", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await db.event.update({ where: { id: event.id }, data: { edicaoAte: new Date(Date.now() + 3_600_000) } });

    const r = await comprarPasseEdicao(event.id);
    expect(r).toEqual({ ok: false, erro: "A edição deste convite já está liberada." });
    expect(await db.transaction.count({ where: { eventId: event.id } })).toBe(0);
  });

  it.skipIf(!enabled)("convite de outra conta nao vende passe", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    // Sessao trocada para um estranho: o convite existe, mas nao e dele.
    const { prof: outro } = await conviteFechado(db);
    sessionMock.mockResolvedValue({ user: { id: outro.id, email: outro.email } });

    const r = await comprarPasseEdicao(event.id);
    expect(r).toEqual({ ok: false, erro: "Convite não encontrado." });
    expect(await db.transaction.count({ where: { eventId: event.id } })).toBe(0);
  });

  it.skipIf(!enabled)("festa que ja passou nao vende passe", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await db.event.update({
      where: { id: event.id },
      data: { eventDate: new Date("2020-01-01T00:00:00Z"), expiresAt: new Date("2020-02-01T00:00:00Z") },
    });

    const r = await comprarPasseEdicao(event.id);
    expect(r).toEqual({ ok: false, erro: "Esta festa já passou. Crie um convite novo para a próxima." });
    expect(await db.transaction.count({ where: { eventId: event.id } })).toBe(0);
  });

  it.skipIf(!enabled)("dois cliques seguidos reaproveitam a MESMA cobranca", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);

    const primeiro = await comprarPasseEdicao(event.id);
    const segundo = await comprarPasseEdicao(event.id);

    // Sem isto sao dois Pix de verdade: o `X-Idempotency-Key` do provider e a
    // referencia (o id da linha), entao linha nova = cobranca nova = R$ 39,80.
    expect(await db.transaction.count({ where: { eventId: event.id } })).toBe(1);
    expect(primeiro).toEqual(segundo);
  });

  it.skipIf(!enabled)("sem sessao (ou sessao sem id) nao vende passe", async () => {
    const db = prisma!;
    const { prof, event } = await conviteFechado(db);

    sessionMock.mockResolvedValue(null);
    expect(await comprarPasseEdicao(event.id)).toEqual({
      ok: false,
      erro: "Sua sessão expirou. Entre de novo.",
    });

    // Sessao legada sem `id`: o Prisma ignora `undefined` no where, entao a
    // consulta viraria "qualquer convite com esse id".
    sessionMock.mockResolvedValue({ user: { email: prof.email } });
    expect(await comprarPasseEdicao(event.id)).toEqual({
      ok: false,
      erro: "Sua sessão expirou. Entre de novo.",
    });

    expect(await db.transaction.count({ where: { eventId: event.id } })).toBe(0);
  });

  it.skipIf(!enabled)("gateway fora do ar: marca FAILED e nao entrega Pix", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    providerMock.mockImplementation(gatewayQueCai);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await comprarPasseEdicao(event.id);
    expect(r).toEqual({ ok: false, erro: "Não foi possível gerar o Pix agora. Tente de novo." });

    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });
    expect(tx.status).toBe("FAILED");
    expect(tx.providerId).toBeNull();
    log.mockRestore();
  });

  it.skipIf(!enabled)("cobranca ja aberta nao vira FAILED quando o gateway cai depois", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await comprarPasseEdicao(event.id); // Pix vivo

    providerMock.mockImplementation(gatewayQueCai);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await comprarPasseEdicao(event.id);
    expect(r.ok).toBe(false);
    log.mockRestore();

    // Derrubar a linha derrubaria o unico rastro de um Pix que continua pagavel.
    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });
    expect(tx.status).toBe("PENDING");
    expect(tx.providerId).toBeTruthy();
  });
});
