// Entrar com Google — a regra de VINCULAR a conta.
//
// O ponto perigoso do login social é este: a pessoa entra com Google usando um
// e-mail que JÁ tem conta aqui (criada com senha). Se cada provedor criasse a
// sua própria conta, o mesmo cliente teria duas — com convites diferentes em
// cada uma, e nenhuma delas "errada". Então vinculamos pelo e-mail.
//
// Vincular por e-mail só é seguro com uma condição, e ela é obrigatória: o
// provedor precisa AFIRMAR que verificou o endereço. Sem isso, bastaria alguém
// criar uma conta Google com o e-mail de outra pessoa para cair dentro da conta
// dela aqui. Quem checa isso é o callback `signIn` em `auth.ts`; esta camada
// recebe o e-mail já considerado verificado.
import { prisma } from "@/lib/db";

/** As credenciais do Google existem neste ambiente? */
export function googleConfigurado(env?: { AUTH_GOOGLE_ID?: string; AUTH_GOOGLE_SECRET?: string }): boolean {
  const source = env ?? process.env;
  return !!(source.AUTH_GOOGLE_ID?.trim() && source.AUTH_GOOGLE_SECRET?.trim());
}

/**
 * O e-mail do Google, normalizado do jeito que a nossa coluna única guarda.
 *
 * Caixa alta é o caso real: `Joao@Gmail.com` e `joao@gmail.com` são a MESMA
 * caixa no Google, e sem baixar a caixa aqui o `findUnique` não acharia a conta
 * existente — criaria uma segunda, que é exatamente o que este arquivo evita.
 */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Acha a conta deste e-mail ou cria uma. Devolve o id, que é o que viaja no
 * token da sessão.
 *
 * Conta criada por aqui nasce **sem senha** (`passwordHash` nulo) — e o
 * `authorize` das credenciais já recusa conta sem senha, então ninguém entra
 * nela por e-mail+senha sem antes definir uma (pelo "esqueci minha senha", que
 * funciona igual e serve também para "nunca tive senha").
 *
 * O nome e o avatar do Google só PREENCHEM buracos: se a pessoa já escolheu um
 * nome no cadastro, o Google não sobrescreve — ela mora no painel com o nome que
 * escolheu, e um login não é hora de trocar isso.
 */
export async function contaDoGoogle(perfil: {
  email: string;
  nome?: string | null;
  avatarUrl?: string | null;
}): Promise<string> {
  const email = normalizarEmail(perfil.email);
  const existente = await prisma.professional.findUnique({
    where: { email },
    select: { id: true, name: true, avatarUrl: true },
  });

  if (existente) {
    const faltando: { name?: string; avatarUrl?: string } = {};
    if (!existente.name?.trim() && perfil.nome?.trim()) faltando.name = perfil.nome.trim();
    if (!existente.avatarUrl && perfil.avatarUrl) faltando.avatarUrl = perfil.avatarUrl;
    if (Object.keys(faltando).length > 0) {
      await prisma.professional.update({ where: { id: existente.id }, data: faltando });
    }
    return existente.id;
  }

  const criada = await prisma.professional.create({
    data: {
      email,
      name: perfil.nome?.trim() || email.split("@")[0],
      avatarUrl: perfil.avatarUrl ?? null,
      // Sem senha: quem entrou pelo Google entra pelo Google.
      passwordHash: null,
      plan: "BASICO",
    },
    select: { id: true },
  });
  return criada.id;
}
