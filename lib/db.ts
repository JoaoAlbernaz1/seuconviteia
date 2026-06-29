// Prisma client singleton. Cacheado em `globalThis` fora de producao para nao
// esgotar conexoes no hot-reload do dev (cada reload criaria um novo client).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
