// Prisma client singleton. Cacheado em `globalThis` fora de producao para nao
// esgotar conexoes no hot-reload do dev (cada reload criaria um novo client).
import { PrismaClient } from "@prisma/client";

/**
 * Garante `pgbouncer=true` (e `connection_limit=1`) quando o `DATABASE_URL`
 * aponta para o POOLER do Supabase (porta 6543 / host `.pooler.`).
 *
 * Sem `pgbouncer=true`, o Prisma usa prepared statements que o pooler em modo
 * transaction NAO suporta — e sob concorrencia real isso estoura com
 * `prepared statement "sN" already exists` (Postgres 42P05), derrubando o app.
 * O erro e INTERMITENTE: some com tráfego zero, aparece quando ha requisicoes
 * concorrentes (login + painel). Corrigir na conexao evita depender de o
 * `DATABASE_URL` estar montado com o parametro certo.
 *
 * Conexao DIRETA (dev local, porta 5432 que nao seja pooler) fica intocada.
 */
function ajustarUrlPooler(url: string | undefined): string | undefined {
  if (!url) return url;
  const ehPooler = url.includes(":6543") || url.includes(".pooler.");
  if (!ehPooler) return url;
  const faltando: string[] = [];
  if (!url.includes("pgbouncer=")) faltando.push("pgbouncer=true");
  if (!url.includes("connection_limit=")) faltando.push("connection_limit=1");
  if (faltando.length === 0) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${faltando.join("&")}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: ajustarUrlPooler(process.env.DATABASE_URL) } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
