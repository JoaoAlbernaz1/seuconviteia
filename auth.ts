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
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { contaDoGoogle, googleConfigurado } from "@/lib/contaGoogle";

/** Validacao das credenciais cruas recebidas no `authorize`. */
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  providers: [
    // O Google entra na lista SO quando as credenciais existem. Provider
    // declarado sem credencial responde erro no callback, e a tela mostraria um
    // botao que leva a uma pagina de erro — pior do que nao ter botao. A tela
    // pergunta a mesma coisa (`googleConfigurado`) para decidir se desenha.
    ...(googleConfigurado()
      ? [
          Google({
            // `allowDangerousEmailAccountLinking` NAO entra aqui: quem vincula
            // por e-mail e o nosso `jwt`, e so depois do `signIn` conferir que o
            // Google VERIFICOU o endereco.
            authorization: {
              params: { prompt: "select_account" },
            },
          }),
        ]
      : []),
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
    /**
     * A TRAVA do login social: so passa Google com e-mail VERIFICADO.
     *
     * Vincular conta por e-mail e o que evita a mesma pessoa ter duas contas
     * aqui — mas so e seguro se o provedor afirmar que o endereco e dela. Sem
     * esta checagem, bastaria criar uma conta Google com o e-mail de outra
     * pessoa para cair dentro da conta dela na plataforma.
     */
    signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return Boolean(profile?.email && profile.email_verified !== false);
    },
    // Persiste o id do Professional no token na hora do login.
    async jwt({ token, user, account, profile }) {
      if (user?.id) token.id = user.id;
      // Login pelo Google: `user.id` vem do Google, nao do nosso banco. Aqui a
      // conta e achada (ou criada) por e-mail e o id que viaja na sessao passa a
      // ser o NOSSO — tudo no sistema pendura dados nele.
      //
      // `account` so existe na requisicao do login; nas seguintes o token ja tem
      // o id e nada disto roda de novo.
      if (account?.provider === "google" && profile?.email) {
        token.id = await contaDoGoogle({
          email: profile.email,
          nome: typeof profile.name === "string" ? profile.name : null,
          avatarUrl: typeof profile.picture === "string" ? profile.picture : null,
        });
        token.email = profile.email;
      }
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
