/**
 * Aumento de tipos do Auth.js (next-auth) para o projeto.
 *
 * - `session.user.id` passa a existir (preenchido no callback `session`).
 * - `token.id` (JWT) carrega o id do Professional entre requisicoes.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
