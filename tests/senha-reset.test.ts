// REDEFINIÇÃO DE SENHA de ponta a ponta, contra banco de verdade.
//
// O que só o banco prova: que o link vira senha nova, que ele MORRE depois de
// usado, que um pedido novo mata o anterior, e que a senha antiga para de valer.
// Tudo isso é credencial — errar aqui é entregar conta alheia.
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/senha-reset.test.ts
import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { gerarToken, hashDoToken } from "@/lib/senhaReset";
import { limparLimites } from "@/lib/limiteTaxa";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;
const MARCA = "senha-reset-teste";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// O e-mail de verdade nao sai no teste; o que importa e o que ficou no banco.
const enviado = vi.hoisted(() => vi.fn());
vi.mock("@/lib/email", async (original) => {
  const real = await original<typeof import("@/lib/email")>();
  return { ...real, enviarEmail: enviado, emailConfigurado: () => true };
});

const { pedirRedefinicao, redefinirSenha } = await import(
  "@/app/(dashboard)/entrar/senha/acoes"
);

async function conta(db: PrismaClient, sufixo: string) {
  return db.professional.create({
    data: {
      name: "Maria Clara Souza",
      email: `${MARCA}-${sufixo}@exemplo.test`,
      passwordHash: await bcrypt.hash("senha-antiga-123", 10),
      plan: "BASICO",
    },
  });
}

/** O token que foi para o e-mail — extraido do link do HTML enviado. */
function tokenDoEmail(): string {
  const html = String(enviado.mock.calls.at(-1)?.[0]?.html ?? "");
  return decodeURIComponent(html.match(/token=([^"&]+)/)?.[1] ?? "");
}

async function limpar(db: PrismaClient) {
  await db.professional.deleteMany({ where: { email: { contains: MARCA } } });
}

afterAll(async () => {
  if (!prisma) return;
  await limpar(prisma);
  await prisma.$disconnect();
});

describe("pedir e usar o link", () => {
  it.skipIf(!enabled)("o link do e-mail troca a senha, e a antiga para de valer", async () => {
    const db = prisma!;
    limparLimites();
    const prof = await conta(db, `a${Date.now()}`);

    const pedido = new FormData();
    pedido.set("email", prof.email.toUpperCase()); // caixa alta: nao pode atrapalhar
    const r1 = await pedirRedefinicao({}, pedido);
    expect(r1.ok).toBe(true);
    // A resposta NAO confirma que a conta existe.
    expect(r1.aviso).toMatch(/Se existe uma conta/i);

    const token = tokenDoEmail();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    // No banco fica o HASH, nunca o token.
    const linha = await db.passwordReset.findUniqueOrThrow({
      where: { tokenHash: hashDoToken(token) },
    });
    expect(linha.professionalId).toBe(prof.id);

    const troca = new FormData();
    troca.set("token", token);
    troca.set("senha", "senha-nova-456");
    troca.set("confirmacao", "senha-nova-456");
    expect(await redefinirSenha({}, troca)).toEqual({ ok: true });

    const depois = await db.professional.findUniqueOrThrow({ where: { id: prof.id } });
    expect(await bcrypt.compare("senha-nova-456", depois.passwordHash!)).toBe(true);
    expect(await bcrypt.compare("senha-antiga-123", depois.passwordHash!)).toBe(false);
  });

  it.skipIf(!enabled)("o mesmo link nao serve duas vezes", async () => {
    const db = prisma!;
    limparLimites();
    const prof = await conta(db, `b${Date.now()}`);
    const pedido = new FormData();
    pedido.set("email", prof.email);
    await pedirRedefinicao({}, pedido);
    const token = tokenDoEmail();

    const primeira = new FormData();
    primeira.set("token", token);
    primeira.set("senha", "primeira-senha-1");
    primeira.set("confirmacao", "primeira-senha-1");
    await redefinirSenha({}, primeira);

    // Link vive em caixa de entrada e historico: usado uma vez, morre.
    const segunda = new FormData();
    segunda.set("token", token);
    segunda.set("senha", "segunda-senha-2");
    segunda.set("confirmacao", "segunda-senha-2");
    const r = await redefinirSenha({}, segunda);
    expect(r.erro).toMatch(/já foi usado/i);

    const depois = await db.professional.findUniqueOrThrow({ where: { id: prof.id } });
    expect(await bcrypt.compare("primeira-senha-1", depois.passwordHash!)).toBe(true);
  });

  it.skipIf(!enabled)("pedir de novo mata o link anterior", async () => {
    const db = prisma!;
    limparLimites();
    const prof = await conta(db, `c${Date.now()}`);
    const um = new FormData();
    um.set("email", prof.email);
    await pedirRedefinicao({}, um);
    const antigo = tokenDoEmail();

    const dois = new FormData();
    dois.set("email", prof.email);
    await pedirRedefinicao({}, dois);
    const novo = tokenDoEmail();
    expect(novo).not.toBe(antigo);

    const comAntigo = new FormData();
    comAntigo.set("token", antigo);
    comAntigo.set("senha", "com-antigo-123");
    comAntigo.set("confirmacao", "com-antigo-123");
    expect((await redefinirSenha({}, comAntigo)).erro).toMatch(/já foi usado/i);

    const comNovo = new FormData();
    comNovo.set("token", novo);
    comNovo.set("senha", "com-novo-1234");
    comNovo.set("confirmacao", "com-novo-1234");
    expect(await redefinirSenha({}, comNovo)).toEqual({ ok: true });
  });

  it.skipIf(!enabled)("link expirado nao troca senha", async () => {
    const db = prisma!;
    limparLimites();
    const prof = await conta(db, `d${Date.now()}`);
    const { token, tokenHash } = gerarToken();
    await db.passwordReset.create({
      data: {
        professionalId: prof.id,
        tokenHash,
        expiresAt: new Date(Date.now() - 60_000), // venceu um minuto atras
      },
    });

    const form = new FormData();
    form.set("token", token);
    form.set("senha", "nao-deveria-valer");
    form.set("confirmacao", "nao-deveria-valer");
    expect((await redefinirSenha({}, form)).erro).toMatch(/expirou/i);
    const depois = await db.professional.findUniqueOrThrow({ where: { id: prof.id } });
    expect(await bcrypt.compare("senha-antiga-123", depois.passwordHash!)).toBe(true);
  });

  it.skipIf(!enabled)("e-mail sem conta nao vaza nada e nao cria pedido", async () => {
    const db = prisma!;
    limparLimites();
    enviado.mockClear();
    const form = new FormData();
    form.set("email", `${MARCA}-ninguem@exemplo.test`);
    const r = await pedirRedefinicao({}, form);
    // Mesma frase da conta que existe — e nenhum e-mail enviado.
    expect(r.ok).toBe(true);
    expect(r.aviso).toMatch(/Se existe uma conta/i);
    expect(enviado).not.toHaveBeenCalled();
    expect(await db.passwordReset.count({ where: { professional: { email: { contains: `${MARCA}-ninguem` } } } })).toBe(0);
  });

  it.skipIf(!enabled)("as senhas precisam bater, e ter o tamanho minimo", async () => {
    limparLimites();
    const prof = await conta(prisma!, `e${Date.now()}`);
    const pedido = new FormData();
    pedido.set("email", prof.email);
    await pedirRedefinicao({}, pedido);
    const token = tokenDoEmail();

    const curta = new FormData();
    curta.set("token", token);
    curta.set("senha", "1234");
    curta.set("confirmacao", "1234");
    expect((await redefinirSenha({}, curta)).erro).toMatch(/8 caracteres/i);

    const diferente = new FormData();
    diferente.set("token", token);
    diferente.set("senha", "senha-boa-123");
    diferente.set("confirmacao", "senha-boa-124");
    expect((await redefinirSenha({}, diferente)).erro).toMatch(/iguais/i);

    // Nenhuma das duas recusas pode ter queimado o link.
    const certa = new FormData();
    certa.set("token", token);
    certa.set("senha", "senha-boa-123");
    certa.set("confirmacao", "senha-boa-123");
    expect(await redefinirSenha({}, certa)).toEqual({ ok: true });
  });

  it.skipIf(!enabled)("o limite segura o canhao de e-mail na caixa de outra pessoa", async () => {
    limparLimites();
    const prof = await conta(prisma!, `f${Date.now()}`);
    enviado.mockClear();
    for (let i = 0; i < 5; i += 1) {
      const form = new FormData();
      form.set("email", prof.email);
      const r = await pedirRedefinicao({}, form);
      // A resposta e sempre a mesma, inclusive quando o limite corta.
      expect(r.ok).toBe(true);
    }
    expect(enviado.mock.calls.length).toBe(3);
  });
});
