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
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { POST } from "@/app/api/webhooks/mercadopago/route";
import { FakePaymentProvider } from "@/lib/pagamentos";
import { MercadoPagoPaymentProvider } from "@/lib/pagamentos/mercadopago";
import type { UsarPasseIncluidoResult } from "@/app/(dashboard)/painel/[id]/liberar/acoes";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;
const MARCA = "passe-edicao-teste";
const SEGREDO = "segredo-do-webhook";
const URL_WEBHOOK = "https://seuconvite.orivya.com.br/api/webhooks/mercadopago";

/** A action le a sessao do Auth.js; aqui ela e fixada na conta do teste. */
const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));
// `revalidatePath` so existe dentro de um request do Next (fora dele o proprio
// Next lanca "static generation store missing"); aqui o que importa e o banco.
const revalidateMock = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));

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

const { comprarPasseEdicao, usarPasseIncluido } = await import(
  "@/app/(dashboard)/painel/[id]/liberar/acoes"
);

/** Conta + convite PUBLICADO com a janela ja vencida (o caso real da tela). */
async function conviteFechado(
  db: PrismaClient,
  plan: "BASICO" | "CLASSICO" | "PREMIUM" = "BASICO",
  // Assinatura VIVA por padrao nos planos pagos: `planoEfetivo` rebaixa para
  // BASICO quando `assinaturaAte` e nulo ou passado, entao um "CLASSICO" criado
  // so na coluna `plan` nao teria liberacao incluida nenhuma.
  assinatura: { ate?: Date | null; status?: string | null } = {},
) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: {
      name: "Dono",
      email: `${MARCA}-${sufixo}@exemplo.test`,
      passwordHash: "x",
      plan,
      assinaturaStatus:
        assinatura.status !== undefined ? assinatura.status : plan === "BASICO" ? null : "authorized",
      assinaturaAte:
        assinatura.ate !== undefined
          ? assinatura.ate
          : plan === "BASICO"
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60_000),
    },
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

/**
 * Rascunho com a data JA VENCIDA — o convite cuja data a pessoa esta consertando.
 * E o unico estado em que a ORDEM das duas guardas muda a resposta.
 */
async function rascunhoVencido(db: PrismaClient, plan: "BASICO" | "CLASSICO" | "PREMIUM" = "PREMIUM") {
  const { prof, event } = await conviteFechado(db, plan);
  await db.event.update({
    where: { id: event.id },
    data: {
      status: "DRAFT",
      eventDate: new Date("2020-01-01T00:00:00Z"),
      expiresAt: new Date("2020-02-01T00:00:00Z"),
      edicaoAte: null,
    },
  });
  return { prof, event };
}

beforeEach(() => {
  sessionMock.mockReset();
  revalidateMock.mockClear();
  providerMock.mockReset();
  providerMock.mockImplementation(() => new FakePaymentProvider());
});

/** Notificacao assinada como o MP assina (`x-signature: ts=..,v1=..`). */
function notificacao(tipo: string, dataId: string): Request {
  const ts = "1700000000";
  const requestId = "req-1";
  const v1 = createHmac("sha256", SEGREDO)
    .update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`)
    .digest("hex");
  return new Request(URL_WEBHOOK, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId,
      "x-signature": `ts=${ts},v1=${v1}`,
    },
    body: JSON.stringify({ type: tipo, data: { id: dataId } }),
  });
}

function respostaMp(json: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => json };
}

/**
 * Liga o Mercado Pago DE VERDADE no webhook (token + segredo + provider real) e
 * fixa o que a consulta do pagamento vai responder. Sem isto o `getPaymentProvider`
 * mockado devolve o Fake e a rota responde "provider inativo" sem processar nada.
 */
function mpResponde(json: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaMp(json)));
  providerMock.mockImplementation(() => new MercadoPagoPaymentProvider());
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = SEGREDO;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
  delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
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

  it.skipIf(!enabled)("Pix aprovado abre 48h — e a reentrega nao abre de novo", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    const r = await comprarPasseEdicao(event.id);
    expect(r.ok).toBe(true);
    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });

    // O webhook re-consulta o MP: aqui ele responde "aprovado".
    mpResponde({ id: tx.providerId, status: "approved", external_reference: tx.id });

    expect((await POST(notificacao("payment", tx.providerId!))).status).toBe(200);

    const aberto = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(aberto.edicaoAte!.getTime()).toBeGreaterThan(Date.now() + 47 * 60 * 60 * 1000);
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PAID");

    // Reentrega da MESMA notificacao: 200 e a janela nao anda de novo.
    const antes = aberto.edicaoAte!.toISOString();
    expect((await POST(notificacao("payment", tx.providerId!))).status).toBe(200);
    expect(
      (await db.event.findUniqueOrThrow({ where: { id: event.id } })).edicaoAte!.toISOString(),
    ).toBe(antes);
  });

  it.skipIf(!enabled)("cobranca sem providerId ainda e achada pelo external_reference", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await comprarPasseEdicao(event.id);
    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });
    // O buraco real da Task 4: a cobranca existe no MP, mas gravar o vinculo falhou.
    await db.transaction.update({ where: { id: tx.id }, data: { providerId: null } });

    mpResponde({ id: "mp-999", status: "approved", external_reference: tx.id });
    expect((await POST(notificacao("payment", "mp-999"))).status).toBe(200);

    const aberto = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(aberto.edicaoAte!.getTime()).toBeGreaterThan(Date.now() + 47 * 60 * 60 * 1000);
    // E o vinculo que faltava fica gravado: o `@unique` do ledger volta a valer.
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).providerId).toBe("mp-999");
  });

  it.skipIf(!enabled)("pagamento aprovado SEM DONO: 200, nada concedido e INCIDENTE no log", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    mpResponde({ id: "mp-sem-dono", status: "approved", external_reference: "nao-existe" });
    // 200 de proposito: 5xx faria o MP reentregar isto para sempre.
    expect((await POST(notificacao("payment", "mp-sem-dono"))).status).toBe(200);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
    // A conta do MP e NOSSA: dinheiro que entrou sem dono nao pode sair calado.
    expect(log.mock.calls.flat().join(" ")).toContain("mp-sem-dono");
    log.mockRestore();
  });

  it.skipIf(!enabled)("MP diz `pending`: nada e concedido (o gate do PAID)", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await comprarPasseEdicao(event.id);
    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });

    mpResponde({ id: tx.providerId, status: "pending", external_reference: tx.id });
    expect((await POST(notificacao("payment", tx.providerId!))).status).toBe(200);

    // Pix gerado nao e Pix pago.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PENDING");
  });

  it.skipIf(!enabled)("MP diz `rejected`: nada e concedido", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await comprarPasseEdicao(event.id);
    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });

    mpResponde({ id: tx.providerId, status: "rejected", external_reference: tx.id });
    expect((await POST(notificacao("payment", tx.providerId!))).status).toBe(200);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PENDING");
  });

  it.skipIf(!enabled)("estorno marca REFUNDED, loga e NAO fecha a janela", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await comprarPasseEdicao(event.id);
    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });

    mpResponde({ id: tx.providerId, status: "approved", external_reference: tx.id });
    await POST(notificacao("payment", tx.providerId!));
    const aberto = await db.event.findUniqueOrThrow({ where: { id: event.id } });

    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mpResponde({ id: tx.providerId, status: "refunded", external_reference: tx.id });
    expect((await POST(notificacao("payment", tx.providerId!))).status).toBe(200);

    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("REFUNDED");
    // Fechar a janela seria tirar do dono, no meio do trabalho, o que ele pagou.
    expect(
      (await db.event.findUniqueOrThrow({ where: { id: event.id } })).edicaoAte!.toISOString(),
    ).toBe(aberto.edicaoAte!.toISOString());
    expect(log.mock.calls.flat().join(" ")).toContain("ESTORNO");
    log.mockRestore();
  });

  it.skipIf(!enabled)("consulta ao MP que falha devolve 5xx e nao abre a janela", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await comprarPasseEdicao(event.id);
    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaMp({}, false, 500)));
    providerMock.mockImplementation(() => new MercadoPagoPaymentProvider());
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = SEGREDO;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    // 5xx = o MP reenvia depois; conceder sem saber o status e que nao pode.
    expect((await POST(notificacao("payment", tx.providerId!))).status).toBe(500);
    log.mockRestore();

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PENDING");
  });

  // --------------------------------------------------------------------------
  // Liberacao INCLUIDA no plano (Gratis 0, Profissional 1, Estudio 3)
  // --------------------------------------------------------------------------

  it.skipIf(!enabled)("Profissional usa 1 liberacao por convite — a segunda e recusada", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "CLASSICO");

    expect(await usarPasseIncluido(event.id)).toEqual({ ok: true });
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.passesGratisUsados).toBe(1);
    expect(depois.edicaoAte!.getTime()).toBeGreaterThan(Date.now() + 47 * 60 * 60 * 1000);
    // A janela abriu AGORA: sem revalidar, o painel em cache continuaria
    // mandando a pessoa pagar pelo que ela acabou de liberar.
    expect(revalidateMock.mock.calls.flat()).toEqual(
      expect.arrayContaining(["/painel", `/painel/${event.id}`]),
    );

    // Fecha a janela na mao para pedir a SEGUNDA liberacao do mesmo convite.
    await db.event.update({ where: { id: event.id }, data: { edicaoAte: new Date(Date.now() - 1000) } });
    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Você já usou as liberações incluídas neste convite.",
    });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratisUsados).toBe(1);
  });

  it.skipIf(!enabled)("Gratis ouve que o PLANO nao inclui (nunca teve liberacao nenhuma)", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "BASICO");
    // "Voce ja usou" seria mentira: ele nunca teve nenhuma para usar.
    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Seu plano não inclui liberações de edição.",
    });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratisUsados).toBe(0);
  });

  it.skipIf(!enabled)("Estudio usa 3 no mesmo convite — a quarta e recusada", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "PREMIUM");

    for (let i = 1; i <= 3; i++) {
      expect(await usarPasseIncluido(event.id)).toEqual({ ok: true });
      expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratisUsados).toBe(i);
      // Cada uso so acontece com a janela fechada — e assim que a tela chega aqui.
      await db.event.update({ where: { id: event.id }, data: { edicaoAte: new Date(Date.now() - 1000) } });
    }

    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Você já usou as liberações incluídas neste convite.",
    });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratisUsados).toBe(3);
  });

  it.skipIf(!enabled)("Estudio com assinatura VENCIDA ouve que a ASSINATURA venceu", async () => {
    const db = prisma!;
    // A coluna `plan` continua PREMIUM: quem diz o direito de hoje e
    // `planoEfetivo`. Ler `prof.plan` daria 3 liberacoes a quem parou de pagar.
    const { event } = await conviteFechado(db, "PREMIUM", { ate: new Date(Date.now() - 24 * 60 * 60_000) });

    // Das tres recusas, esta e a unica com conserto na mao do dono: renovar.
    // Escondê-la atras de "voce ja usou" tirava dele a saida.
    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Sua assinatura venceu, então este convite não tem mais liberações incluídas.",
    });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratisUsados).toBe(0);
  });

  it.skipIf(!enabled)("plano pago escolhido na landing, sem NUNCA pagar, ouve a frase do PLANO", async () => {
    const db = prisma!;
    // Estado real e comum: `cadastrarProfissional` grava o plano escolhido na
    // landing e so depois manda para o checkout; `iniciarAssinatura` grava
    // `pending` sem `assinaturaAte`. Quem abandona o cartao fica assim. Dizer
    // "sua assinatura venceu" aqui e mentira, e ainda vende uma renovacao a quem
    // nunca pagou nada.
    const { event } = await conviteFechado(db, "PREMIUM", { ate: null, status: "pending" });

    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Seu plano não inclui liberações de edição.",
    });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratisUsados).toBe(0);
  });

  it.skipIf(!enabled)("assinatura CANCELADA dentro da carencia ainda libera", async () => {
    const db = prisma!;
    // Cancelar nao corta na hora: o mes corrente ja foi pago (lib/plans.ts).
    // Quem manda e o VENCIMENTO, nao o status — este teste existe para que
    // ninguem "conserte" isso um dia trocando `assinaturaAte` por
    // `assinaturaStatus`.
    const { event } = await conviteFechado(db, "CLASSICO", {
      status: "cancelled",
      ate: new Date(Date.now() + 10 * 24 * 60 * 60_000),
    });

    expect(await usarPasseIncluido(event.id)).toEqual({ ok: true });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratisUsados).toBe(1);
  });

  it.skipIf(!enabled)("com a janela ja aberta, nao gasta cota", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "CLASSICO");
    await db.event.update({ where: { id: event.id }, data: { edicaoAte: new Date(Date.now() + 3_600_000) } });

    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "A edição deste convite já está liberada.",
    });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratisUsados).toBe(0);
  });

  it.skipIf(!enabled)("festa que ja passou nao libera edicao (nem queima cota)", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "PREMIUM");
    await db.event.update({
      where: { id: event.id },
      data: { eventDate: new Date("2020-01-01T00:00:00Z"), expiresAt: new Date("2020-02-01T00:00:00Z") },
    });

    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Esta festa já passou. Crie um convite novo para a próxima.",
    });
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.passesGratisUsados).toBe(0);
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
  });

  it.skipIf(!enabled)("convite de outra conta (ou sessao sem id) nao gasta cota", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "PREMIUM");
    // Sessao trocada para um estranho: o convite existe, mas nao e dele.
    const { prof: outro } = await conviteFechado(db, "PREMIUM");
    sessionMock.mockResolvedValue({ user: { id: outro.id, email: outro.email } });
    expect(await usarPasseIncluido(event.id)).toEqual({ ok: false, erro: "Convite não encontrado." });

    sessionMock.mockResolvedValue(null);
    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Sua sessão expirou. Entre de novo.",
    });

    // Sessao legada sem `id`: o Prisma ignora `undefined` no where, entao a
    // consulta viraria "qualquer convite com esse id".
    sessionMock.mockResolvedValue({ user: { email: outro.email } });
    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Sua sessão expirou. Entre de novo.",
    });

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.passesGratisUsados).toBe(0);
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
  });

  it.skipIf(!enabled)("dois cliques SIMULTANEOS gastam UMA cota (corrida FORCADA por lock)", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "CLASSICO");

    // `Promise.all` sozinho NAO reproduz a corrida: as duas chamadas terminam
    // antes de se cruzarem. O que morde e travar a linha do evento numa conexao
    // separada (`FOR UPDATE`): o `SELECT` do MVCC passa, entao as duas leem
    // `passesGratisUsados = 0`, e os dois UPDATEs ficam pendurados na trava — o
    // interleaving exato do bug. Quem prova o compare-and-set e o teste da
    // leitura velha, logo abaixo; aqui o que se prova e que UM clique duplo
    // gasta UMA cota e ninguem ouve erro.
    const bloqueador = new PrismaClient();
    let cliques: Promise<UsarPasseIncluidoResult[]> | undefined;
    // `finally` porque a conexao extra tem de fechar mesmo se a trava estourar:
    // pool vazado derruba os testes seguintes com um erro que nao e o de verdade.
    try {
      await bloqueador.$transaction(async (trava) => {
        await trava.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${event.id} FOR UPDATE`;
        cliques = Promise.all([usarPasseIncluido(event.id), usarPasseIncluido(event.id)]);
        // Tempo de as duas chegarem no UPDATE e ficarem penduradas na trava.
        await new Promise((r) => setTimeout(r, 300));
      });

      const resultados = await cliques!;
      // Quem perdeu o compare-and-set NAO leva erro: a janela que ele pediu
      // esta aberta (foi o proprio dono clicando duas vezes) e nenhuma cota
      // extra foi gasta. "Tente de novo" faria a pessoa clicar achando que
      // falhou — e o clique seguinte ouviria "ja esta liberada", pior ainda.
      expect(resultados).toEqual([{ ok: true }, { ok: true }]);
      const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
      expect(depois.passesGratisUsados).toBe(1);
      expect(depois.edicaoAte!.getTime()).toBeGreaterThan(Date.now() + 47 * 60 * 60 * 1000);
    } finally {
      await bloqueador.$disconnect();
    }
  });

  it.skipIf(!enabled)("leitura VELHA nao regride o contador (a prova do compare-and-set)", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "PREMIUM");

    // O que o CAS protege de verdade: a action LE `passesGratisUsados` e escreve
    // depois — e no meio o numero pode ter mudado. Aqui a mudanca e forcada: a
    // linha e travada numa conexao separada (o UPDATE da action fica pendurado)
    // e, dentro da mesma transacao, o contador vai para 2. Quando a trava solta,
    // a escrita da action esta velha. Com `passesGratisUsados` no WHERE ela nao
    // acha linha e desiste; sem ele, gravaria 0 + 1 = 1 — o convite RECUPERARIA
    // uma cota ja gasta, com 48h de brinde.
    const bloqueador = new PrismaClient();
    try {
      let clique: Promise<UsarPasseIncluidoResult> | undefined;
      await bloqueador.$transaction(async (trava) => {
        await trava.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${event.id} FOR UPDATE`;
        clique = usarPasseIncluido(event.id);
        // Tempo de a action ler (o SELECT do MVCC passa pela trava) e pendurar.
        await new Promise((r) => setTimeout(r, 300));
        await trava.$executeRaw`UPDATE "Event" SET "passesGratisUsados" = 2 WHERE "id" = ${event.id}`;
      });

      // A janela continua fechada, entao "Tente de novo." e a resposta honesta.
      expect(await clique!).toEqual({ ok: false, erro: "Tente de novo." });
      const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
      expect(depois.passesGratisUsados).toBe(2);
      expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
    } finally {
      await bloqueador.$disconnect();
    }
  });

  it.skipIf(!enabled)("rascunho com a data vencida ouve `ja esta liberada`, nao `a festa passou`", async () => {
    const db = prisma!;
    const { event } = await rascunhoVencido(db, "PREMIUM");

    // A ORDEM das guardas e a regra: `edicaoAberta` e DRAFT-primeiro. Invertida,
    // a resposta viraria "crie um convite novo" — jogar fora justamente o
    // convite cuja data a pessoa esta consertando.
    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "A edição deste convite já está liberada.",
    });
    expect(await comprarPasseEdicao(event.id)).toEqual({
      ok: false,
      erro: "A edição deste convite já está liberada.",
    });
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.passesGratisUsados).toBe(0);
    expect(await db.transaction.count({ where: { eventId: event.id } })).toBe(0);
  });
});
