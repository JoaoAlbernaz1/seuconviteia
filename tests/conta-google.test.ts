// VINCULO da conta do Google, contra banco de verdade.
//
// O risco aqui nao e login falhar — e login FUNCIONAR errado: a mesma pessoa
// acabar com duas contas (uma por senha, outra pelo Google), cada uma com os
// convites dela, e nenhuma "errada". Isso so aparece em banco.
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/conta-google.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { contaDoGoogle } from "@/lib/contaGoogle";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;
const MARCA = "conta-google-teste";

afterAll(async () => {
  if (!prisma) return;
  await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
  await prisma.$disconnect();
});

describe("contaDoGoogle", () => {
  it.skipIf(!enabled)("quem ja tem conta com SENHA entra na MESMA conta", async () => {
    const db = prisma!;
    const email = `${MARCA}-a${Date.now()}@exemplo.test`;
    const existente = await db.professional.create({
      data: {
        email,
        name: "Nome Que Ela Escolheu",
        passwordHash: await bcrypt.hash("senha-dela-123", 10),
        plan: "PREMIUM",
      },
    });

    const id = await contaDoGoogle({ email, nome: "Nome Do Google", avatarUrl: "https://x/f.png" });

    expect(id).toBe(existente.id);
    expect(await db.professional.count({ where: { email } })).toBe(1);
    const depois = await db.professional.findUniqueOrThrow({ where: { id } });
    // O nome escolhido no cadastro NAO e sobrescrito por um login.
    expect(depois.name).toBe("Nome Que Ela Escolheu");
    // O plano e a senha continuam de pe: entrar pelo Google nao rebaixa ninguem.
    expect(depois.plan).toBe("PREMIUM");
    expect(depois.passwordHash).toBe(existente.passwordHash);
    // Buraco vazio, esse sim, o Google preenche.
    expect(depois.avatarUrl).toBe("https://x/f.png");
  });

  it.skipIf(!enabled)("CAIXA ALTA no e-mail nao cria uma segunda conta", async () => {
    const db = prisma!;
    const email = `${MARCA}-b${Date.now()}@exemplo.test`;
    const primeiro = await contaDoGoogle({ email });
    const segundo = await contaDoGoogle({ email: email.toUpperCase() });
    expect(segundo).toBe(primeiro);
    expect(await db.professional.count({ where: { email } })).toBe(1);
  });

  it.skipIf(!enabled)("conta nova nasce SEM senha e no plano basico", async () => {
    const db = prisma!;
    const email = `${MARCA}-c${Date.now()}@exemplo.test`;
    const id = await contaDoGoogle({ email, nome: "  Maria Clara  " });
    const criada = await db.professional.findUniqueOrThrow({ where: { id } });
    // Sem senha: e o `authorize` das credenciais recusa conta sem senha, entao
    // ninguem entra nela por e-mail+senha sem antes definir uma.
    expect(criada.passwordHash).toBeNull();
    expect(criada.plan).toBe("BASICO");
    expect(criada.name).toBe("Maria Clara");
  });

  it.skipIf(!enabled)("sem nome no Google, o apelido sai do proprio e-mail", async () => {
    const email = `${MARCA}-d${Date.now()}@exemplo.test`;
    const id = await contaDoGoogle({ email, nome: null });
    const criada = await prisma!.professional.findUniqueOrThrow({ where: { id } });
    expect(criada.name).toBe(email.split("@")[0]);
  });
});
