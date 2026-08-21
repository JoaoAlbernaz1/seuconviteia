// RESGATE do cofre (repasse) contra banco de verdade.
//
// Duas coisas que só o banco prova:
//  1. Dois cliques (ou duas abas) pedindo resgate ao mesmo tempo não podem gerar
//     DOIS payouts do mesmo saldo — seria pagar o dono duas vezes.
//  2. Com o Mercado Pago ativo, que não tem API de saída, o pedido tem de ficar
//     PENDING na fila do operador. Marcar FAILED (o que acontecia antes, porque
//     `transferir()` lança) fazia o dinheiro VOLTAR para o saldo e o dono
//     pedir de novo, para sempre, sem nunca receber.
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/repasse.test.ts
import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { saldoDoEvento } from "@/lib/pagamentos/contribuicao";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "repasse-teste";

/** A action le a sessao do Auth.js; aqui ela e fixada na conta do teste. */
const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// O provedor do ambiente de teste seria o SIMULADO, que transfere e devolve
// PAID. Aqui o que interessa e a producao: Mercado Pago ativo, sem API de saida.
vi.mock("@/lib/pagamentos", async (original) => {
  const real = await original<typeof import("@/lib/pagamentos")>();
  return {
    ...real,
    getPaymentProvider: () => ({
      nome: "mercadopago",
      podeTransferir: false,
      criarCobrancaPix: async () => {
        throw new Error("nao usado neste teste");
      },
      consultarCobranca: async () => ({ status: "PENDING" as const, referencia: null }),
      transferir: async () => {
        throw new Error("Transferencia (payout) via Mercado Pago nao implementada.");
      },
    }),
  };
});

const { resgatar } = await import("@/lib/cofre");

/** Conta + convite com carteira ATIVA, chave de resgate e um presente pago. */
async function cenario(db: PrismaClient, sufixo: string, netCents = 9_500) {
  const prof = await db.professional.create({
    data: {
      name: "Repasse",
      email: `${MARCA}-${sufixo}@exemplo.test`,
      passwordHash: "x",
      plan: "PREMIUM",
    },
  });
  const event = await db.event.create({
    data: {
      professionalId: prof.id,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Repasse",
      eventDate: new Date("2026-12-01T23:00:00Z"),
      expiresAt: new Date("2027-06-01T23:00:00Z"),
      status: "PUBLISHED",
      plan: "PREMIUM",
      payoutPixKey: "dona@pix.test",
      payoutPixName: "Dona do Convite",
      // A carteira precisa estar ATIVA para o resgate existir (regra da action).
      customization: { carteira: { ativa: true, cpf: "00000000191", uf: "DF" } },
    },
  });
  const item = await db.giftItem.create({
    data: { eventId: event.id, title: MARCA, priceCents: 10_000, mode: "PIX", pricingMode: "FIXO" },
  });
  await db.giftContribution.create({
    data: {
      eventId: event.id,
      giftItemId: item.id,
      buyerName: "Convidado",
      grossCents: 10_000,
      feeCents: 10_000 - netCents,
      netCents,
      status: "PAID",
      provider: "mercadopago",
      providerChargeId: `${MARCA}-${sufixo}-charge`,
      paidAt: new Date(),
    },
  });
  sessionMock.mockResolvedValue({ user: { id: prof.id, email: prof.email } });
  return { prof, event };
}

async function saldo(db: PrismaClient, eventId: string) {
  const [contribs, payouts] = await Promise.all([
    db.giftContribution.findMany({ where: { eventId }, select: { netCents: true, status: true } }),
    db.payout.findMany({ where: { eventId }, select: { amountCents: true, status: true } }),
  ]);
  return saldoDoEvento(contribs, payouts);
}

async function limpar(db: PrismaClient) {
  await db.professional.deleteMany({ where: { email: { contains: MARCA } } });
}

// Limpeza no fim do ARQUIVO, e nao dentro do primeiro `describe`: o `afterAll`
// de um describe roda quando ELE acaba, entao o describe seguinte deixava conta
// de teste viva no banco.
afterAll(async () => {
  if (!prisma) return;
  await limpar(prisma);
  await prisma.$disconnect();
});

describe("resgatar", () => {
  it.skipIf(!enabled)("dois pedidos simultaneos geram UM payout so", async () => {
    const db = prisma!;
    const { event } = await cenario(db, `a${Date.now()}`);
    expect(await saldo(db, event.id)).toBe(9_500);

    const pedir = new FormData();
    pedir.set("eventId", event.id);
    const outro = new FormData();
    outro.set("eventId", event.id);
    await Promise.all([resgatar(pedir), resgatar(outro)]);

    const payouts = await db.payout.findMany({ where: { eventId: event.id } });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].amountCents).toBe(9_500);
    // Saldo zerado UMA vez: dois payouts levariam o cofre a −9.500.
    expect(await saldo(db, event.id)).toBe(0);
  });

  it.skipIf(!enabled)("com pedido em aberto, um novo pedido nao entra", async () => {
    const db = prisma!;
    const { event } = await cenario(db, `b${Date.now()}`);
    const um = new FormData();
    um.set("eventId", event.id);
    await resgatar(um);

    // Chegou mais dinheiro depois do pedido: o resgate novo tem de esperar a
    // fila andar, senao o operador paga duas linhas da mesma conta.
    const item = await db.giftItem.findFirstOrThrow({ where: { eventId: event.id } });
    await db.giftContribution.create({
      data: {
        eventId: event.id, giftItemId: item.id, buyerName: "Outro",
        grossCents: 5_000, feeCents: 250, netCents: 4_750, status: "PAID",
        provider: "mercadopago", providerChargeId: `${MARCA}-b-${Date.now()}`, paidAt: new Date(),
      },
    });

    const dois = new FormData();
    dois.set("eventId", event.id);
    await resgatar(dois);
    expect(await db.payout.count({ where: { eventId: event.id } })).toBe(1);
  });

  it.skipIf(!enabled)("sem API de saida, o pedido fica PENDING — nunca FAILED", async () => {
    const db = prisma!;
    const { event } = await cenario(db, `c${Date.now()}`);
    // O provedor do ambiente de teste nao transfere (nem o Mercado Pago
    // transfere): o pedido tem de sobreviver na fila.
    const form = new FormData();
    form.set("eventId", event.id);
    await resgatar(form);

    const payout = await db.payout.findFirstOrThrow({ where: { eventId: event.id } });
    expect(payout.status).toBe("PENDING");
    expect(payout.pixKey).toBe("dona@pix.test");
    expect(payout.paidAt).toBeNull();
    // E o saldo continua deduzido enquanto o pedido vive.
    expect(await saldo(db, event.id)).toBe(0);
  });

  it.skipIf(!enabled)("convite de outra conta nao resgata", async () => {
    const db = prisma!;
    const { event } = await cenario(db, `d${Date.now()}`);
    // A sessao passa a ser de outra conta (o `cenario` troca o mock).
    await cenario(db, `e${Date.now()}`);

    const form = new FormData();
    form.set("eventId", event.id);
    await resgatar(form);
    expect(await db.payout.count({ where: { eventId: event.id } })).toBe(0);
  });
});

// A FILA DO OPERADOR. Aqui mora o unico lugar do sistema que mexe em dinheiro de
// convite alheio — entao as duas guardas precisam de prova: quem pode entrar, e
// clicar duas vezes nao pode reescrever a data do pagamento.
const { marcarRepassePago, recusarRepasse } = await import(
  "@/app/(dashboard)/painel/repasses/acoes"
);

describe("fila de repasses", () => {
  it.skipIf(!enabled)("sem ADMIN_EMAILS, nem o dono liquida o proprio repasse", async () => {
    const db = prisma!;
    const { event } = await cenario(db, `f${Date.now()}`);
    const form = new FormData();
    form.set("eventId", event.id);
    await resgatar(form);
    const payout = await db.payout.findFirstOrThrow({ where: { eventId: event.id } });

    vi.stubEnv("ADMIN_EMAILS", "");
    const pagar = new FormData();
    pagar.set("payoutId", payout.id);
    await marcarRepassePago(pagar);
    expect((await db.payout.findUniqueOrThrow({ where: { id: payout.id } })).status).toBe("PENDING");
    vi.unstubAllEnvs();
  });

  it.skipIf(!enabled)("o operador marca pago UMA vez; o segundo clique nao mexe na data", async () => {
    const db = prisma!;
    const { prof, event } = await cenario(db, `g${Date.now()}`);
    const form = new FormData();
    form.set("eventId", event.id);
    await resgatar(form);
    const payout = await db.payout.findFirstOrThrow({ where: { eventId: event.id } });

    vi.stubEnv("ADMIN_EMAILS", prof.email);
    const pagar = new FormData();
    pagar.set("payoutId", payout.id);
    await marcarRepassePago(pagar);
    const depois = await db.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(depois.status).toBe("PAID");
    expect(depois.paidAt).not.toBeNull();

    // Segundo clique (ou aba antiga): compare-and-set nao acha mais PENDING.
    const denovo = new FormData();
    denovo.set("payoutId", payout.id);
    await marcarRepassePago(denovo);
    const final = await db.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(final.paidAt?.getTime()).toBe(depois.paidAt?.getTime());
    vi.unstubAllEnvs();
  });

  it.skipIf(!enabled)("recusar devolve o dinheiro ao saldo e libera um novo pedido", async () => {
    const db = prisma!;
    const { prof, event } = await cenario(db, `h${Date.now()}`);
    const form = new FormData();
    form.set("eventId", event.id);
    await resgatar(form);
    expect(await saldo(db, event.id)).toBe(0);

    vi.stubEnv("ADMIN_EMAILS", prof.email);
    const payout = await db.payout.findFirstOrThrow({ where: { eventId: event.id } });
    const recusar = new FormData();
    recusar.set("payoutId", payout.id);
    await recusarRepasse(recusar);
    vi.unstubAllEnvs();

    // FAILED nao conta como saida: o valor VOLTA para o dono, que precisa poder
    // corrigir a chave e pedir de novo.
    expect((await db.payout.findUniqueOrThrow({ where: { id: payout.id } })).status).toBe("FAILED");
    expect(await saldo(db, event.id)).toBe(9_500);

    const denovo = new FormData();
    denovo.set("eventId", event.id);
    await resgatar(denovo);
    expect(await db.payout.count({ where: { eventId: event.id, status: "PENDING" } })).toBe(1);
  });
});
