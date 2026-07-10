// Prisma client singleton.
//
// RUNTIME usa a conexao DIRETA (DIRECT_URL), nao o pooler.
//
// Motivo: o pooler do Supabase em modo transaction + os prepared statements do
// Prisma estouram sob concorrencia com `prepared statement "sN" already exists`
// (Postgres 42P05) — foi o que derrubou o login/painel em producao. A cura
// canonica seria `pgbouncer=true` na DATABASE_URL do pooler, mas injetar esse
// parametro por override no client NAO surtiu efeito aqui (duas tentativas, dois
// deploys, o 42P05 persistiu). A conexao direta nao passa por pooler, entao o
// bug simplesmente nao existe nela.
//
// Trade-off: a conexao direta abre uma sessao Postgres por instancia de funcao;
// nao escala para altissima concorrencia como o pooler. Para o trafego atual
// (testes) e o correto e estavel. O caminho de escala e voltar ao pooler COM
// `pgbouncer=true` setado NA PROPRIA env var DATABASE_URL (nao por override) —
// e uma mudanca de config, nao de banco.
//
// Cacheado em `globalThis` fora de producao para nao esgotar conexoes no
// hot-reload do dev (cada reload criaria um novo client).
import { PrismaClient } from "@prisma/client";

// Em producao, DIRECT_URL sempre existe (o vercel-build a usa no `migrate
// deploy`). Em dev, cai para DATABASE_URL (Postgres local, sessao dedicada).
const runtimeUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: runtimeUrl });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
