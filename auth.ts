/**
 * Auth.js v5 (next-auth) — configuracao central.
 *
 * Provider: **Credentials** (e-mail + senha). O login por link magico (magic link)
 * fica para a Fase 7.
 *
 * Sessao via **JWT** (sem tabela de sessao): o `id` do Professional viaja no token
 * e e exposto em `session.user.id` (tipado em `types/next-auth.d.ts`).
 *
 * IMPORTANTE: este modulo usa Prisma + bcrypt (APIs de Node) e por isso NAO deve
 * ser importado pelo `middleware.ts` (que roda no edge). O middleware faz apenas o
 * roteamento por subdominio; a protecao das rotas e feita nas paginas com `auth()`.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

/** Validacao das credenciais cruas recebidas no `authorize`. */
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      // Roda no runtime de Node (Prisma + bcrypt). Retorna o usuario ou `null`.
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();

        const professional = await prisma.professional.findUnique({
          where: { email },
        });
        // Sem conta ou sem senha definida (ex.: conta so de magic link, Fase 7).
        if (!professional?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, professional.passwordHash);
        if (!ok) return null;

        return {
          id: professional.id,
          email: professional.email,
          name: professional.name,
        };
      },
    }),
  ],
  callbacks: {
    // Persiste o id do Professional no token na hora do login.
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    // Expoe o id na sessao consumida pelo servidor (`auth()`).
    // `typeof` (em vez de checar a augmentation de JWT) garante o narrowing
    // independentemente de como o tipo `JWT` e re-exportado pelo next-auth.
    session({ session, token }) {
      if (typeof token.id === "string" && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
