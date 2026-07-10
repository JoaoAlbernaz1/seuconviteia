// Prisma client singleton. Cacheado em `globalThis` fora de producao para nao
// esgotar conexoes no hot-reload do dev (cada reload criaria um novo client).
import { PrismaClient } from "@prisma/client";

/**
 * Garante `pgbouncer=true` no `DATABASE_URL`, INCONDICIONALMENTE.
 *
 * Sem esse parametro, o Prisma usa prepared statements. No pooler do Supabase
 * (modo transaction) isso estoura, sob concorrencia real, com
 * `prepared statement "sN" already exists` (Postgres 42P05) — foi o que derrubou
 * a producao no login/painel. O erro e INTERMITENTE (some sem trafego).
 *
 * Fazemos incondicional porque o formato exato do `DATABASE_URL` de producao nao
 * e conhecido aqui (segredo), e `pgbouncer=true` e INOFENSIVO numa conexao direta
 * (o Prisma so desliga os prepared statements — sem perda de correcao). Dev local
 * (Postgres direto) tambem passa por aqui e funciona normalmente.
 */
function garantirPgBouncer(url: string | undefined): string | undefined {
  if (!url || url.includes("pgbouncer=")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}pgbouncer=true`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: garantirPgBouncer(process.env.DATABASE_URL) } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
