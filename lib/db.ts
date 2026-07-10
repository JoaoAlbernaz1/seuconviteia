// Prisma client singleton.
//
// RUNTIME conecta pelo POOLER do Supabase via `env("DATABASE_URL")` (pooler
// transaction-mode, porta 6543) — e o que escala. A DATABASE_URL PRECISA
// terminar com `?pgbouncer=true`: isso desliga os prepared statements do Prisma,
// senao o pooler estoura em `prepared statement "sN" already exists` (42P05)
// sob concorrencia (foi o que derrubou o login/painel).
//
// SEM override aqui, de proposito: injetar a URL/pgbouncer pelo construtor
// (datasourceUrl / datasources) NAO faz o Prisma parsear o pgbouncer — testado
// em producao, o 42P05 persistiu. So o caminho canonico (o engine lendo
// `env("DATABASE_URL")` direto do schema) aplica o parametro. Por isso o
// `new PrismaClient()` puro.
//
// DIRECT_URL (session-mode pooler, porta 5432) fica so para as migrations
// (schema.prisma -> directUrl), nao para o runtime.
//
// Cacheado em `globalThis` fora de producao para nao esgotar conexoes no
// hot-reload do dev (cada reload criaria um novo client).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
