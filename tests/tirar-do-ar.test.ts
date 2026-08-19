// "Tirar do ar" NAO pode destravar a edicao: o convite some para o convidado,
// mas o status continua PUBLISHED. Antes ele voltava para DRAFT — e DRAFT edita
// de graca, o que fazia do botao a porta dos fundos do passe de edicao.
//
// So o banco de verdade prova isso (as actions escrevem no Prisma), entao fica
// atras da mesma env var dos outros testes que precisam de banco — o nome fala
// de pagamento por historico, mas hoje ele e o interruptor de "teste com banco":
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/tirar-do-ar.test.ts
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "tirar-do-ar-teste";

/** As actions leem a sessao do Auth.js; aqui ela e fixada na conta do teste. */
const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));
// `actions.ts` importa `AuthError` de next-auth so para o login; o pacote nao
// resolve fora do bundler do Next, e nada aqui depende dele.
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
// `revalidatePath` so existe dentro de um request do Next; aqui o que importa e
// o que ficou gravado no banco.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { tirarDoAr, voltarAoAr } = await import("@/app/(dashboard)/actions");

/** Conta + convite PUBLICADO e no ar, do jeito que o painel mostra. */
async function convitePublicado(db: PrismaClient) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x" },
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
    },
  });
  sessionMock.mockResolvedValue({ user: { id: prof.id, email: prof.email } });
  return { prof, event };
}

/** O form do painel manda o id do evento; as actions recebem FormData. */
function form(eventId: string) {
  const fd = new FormData();
  fd.set("eventId", eventId);
  return fd;
}

beforeEach(() => {
  sessionMock.mockReset();
});

describe("tirar do ar / voltar ao ar", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("tirar do ar liga foraDoAr e MANTEM o status PUBLISHED", async () => {
    const db = prisma!;
    const { event } = await convitePublicado(db);

    await tirarDoAr(form(event.id));

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.foraDoAr).toBe(true);
    // O assert que importa: voltar para DRAFT destravaria a edicao de graca.
    expect(depois.status).toBe("PUBLISHED");
  });

  it.skipIf(!enabled)("voltar ao ar desliga foraDoAr e nao encosta no status", async () => {
    const db = prisma!;
    const { event } = await convitePublicado(db);
    await tirarDoAr(form(event.id));

    await voltarAoAr(form(event.id));

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.foraDoAr).toBe(false);
    expect(depois.status).toBe("PUBLISHED");
  });
});
