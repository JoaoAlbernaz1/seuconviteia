"use server";

/**
 * Server Actions do painel do profissional (Fase 4).
 *
 * Regras seguidas:
 *  - **Zod na borda**: toda entrada de form e validada antes de tocar no banco.
 *  - **Isolamento por tenant**: o `professionalId` vem SEMPRE da sessao (`auth()`),
 *    nunca do cliente. Eventos sao criados/consultados so para o profissional logado.
 *  - Erros voltam como estado para o form (sem `throw`), exceto os redirects.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { protocoloDe, rootDomain } from "@/lib/tenant";
import { ehDowngrade, planoEfetivo, SELECT_ASSINATURA } from "@/lib/plans";
import { cancelarAssinaturaMp } from "@/lib/pagamentos/assinatura";
import { iniciarAssinatura, planoPago } from "@/lib/assinarFluxo";
import { soDigitos, telefoneValido } from "@/lib/documento";
import { enviarEmail } from "@/lib/email";
import { MARCA } from "@/lib/email/remetente";
import { emailBoasVindas } from "@/lib/email/templates";

// ----------------------------------------------------------------------------
// Cadastro (signup)
// ----------------------------------------------------------------------------

/** Planos validos (espelha o enum `Plan` do Prisma). */
const PLAN_VALUES = ["BASICO", "CLASSICO", "PREMIUM"] as const;

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(120)
    // Nome COMPLETO: e o nome que vai no convite, no e-mail e no atendimento.
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome."),
  email: z.string().trim().toLowerCase().email("E-mail invalido."),
  password: z.string().min(8, "A senha precisa de ao menos 8 caracteres.").max(200),
  // WhatsApp: e por onde o suporte alcanca quem esta com a festa em cima da hora.
  telefone: z.string().trim().refine(telefoneValido, "Informe o WhatsApp com DDD."),
  perfilUso: z.enum(["proprio", "profissional"]).optional().default("proprio"),
  // Plano da CONTA (escolhido no cadastro; herdado pelos eventos). Ausente -> BASICO.
  plan: z.enum(PLAN_VALUES, { message: "Plano invalido." }).optional().default("BASICO"),
});

export type SignupState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "telefone" | "plan", string>>;
};

/**
 * URL do painel no dominio de entao. O painel e servido no subdominio `app.`
 * (reservado no middleware). Localhost usa http; qualquer outro dominio, https.
 */
function urlDoPainel(): string {
  const root = rootDomain();
  const protocolo = protocoloDe(root);
  return `${protocolo}://app.${root}/painel`;
}

export async function cadastrarProfissional(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const planRaw = formData.get("plan");
  const perfilRaw = formData.get("perfilUso");
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    telefone: formData.get("telefone"),
    perfilUso: typeof perfilRaw === "string" && perfilRaw ? perfilRaw : undefined,
    plan: typeof planRaw === "string" && planRaw ? planRaw : undefined,
  });

  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: {
        name: f.name?.[0],
        email: f.email?.[0],
        password: f.password?.[0],
        telefone: f.telefone?.[0],
        plan: f.plan?.[0],
      },
    };
  }

  const { name, email, password, telefone, perfilUso, plan } = parsed.data;

  const existing = await prisma.professional.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "Este e-mail ja esta cadastrado." } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.professional.create({
    // Telefone guardado so em digitos: mascara e assunto de tela, e assim a
    // busca e a comparacao nao dependem de como a pessoa digitou.
    data: { name, email, passwordHash, plan, telefone: soDigitos(telefone), perfilUso },
  });

  // Boas-vindas (transacional). `enviarEmail` engole qualquer falha e NAO propaga:
  // e-mail nunca pode quebrar o cadastro. O painel mora em `app.<root>` (http no
  // localhost, https em prod). Remetente = marca (a plataforma dando as boas-vindas).
  const { subject, html } = emailBoasVindas({ nome: name, painelUrl: urlDoPainel() });
  await enviarEmail({ to: email, subject, html, fromName: MARCA });

  // Loga e leva ao destino. Quem escolheu um plano PAGO na landing vai direto
  // para o checkout (`/assinar/<plano>`): o cadastro e so a etapa do meio entre
  // clicar no plano e digitar o cartao. `signIn` lanca o redirect
  // (NEXT_REDIRECT) em caso de sucesso; so tratamos AuthError aqui.
  const pago = planoPago(plan);
  const destino = pago ? `/assinar/${pago.toLowerCase()}` : "/painel";
  try {
    await signIn("credentials", { email, password, redirectTo: destino });
  } catch (error) {
    if (error instanceof AuthError) {
      // Conta criada, mas o auto-login falhou por algum motivo: manda pro login.
      redirect("/entrar");
    }
    throw error;
  }

  return {};
}

// ----------------------------------------------------------------------------
// Login (entrar)
// ----------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail invalido."),
  password: z.string().min(1, "Informe sua senha."),
  /** Plano que a pessoa clicou na landing antes de cair aqui. */
  plan: z.string().optional(),
});

export type LoginState = { error?: string };

export async function entrarComCredenciais(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    plan: formData.get("plan") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Informe um e-mail e uma senha validos." };
  }

  // Quem clicou num plano na landing e JA TINHA conta entrava por aqui e caia
  // no painel, perdendo a escolha no meio do caminho — o cadastro levava o
  // plano adiante, o login nao. Agora os dois terminam no mesmo lugar.
  const pago = planoPago(String(parsed.data.plan ?? "").toUpperCase());
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: pago ? `/assinar/${pago.toLowerCase()}` : "/painel",
    });
  } catch (error) {
    // Credenciais invalidas viram AuthError; o redirect de sucesso deve subir.
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha incorretos." };
    }
    throw error;
  }

  return {};
}

// ----------------------------------------------------------------------------
// Logout (sair)
// ----------------------------------------------------------------------------

export async function sair(): Promise<void> {
  await signOut({ redirectTo: "/entrar" });
}

// ----------------------------------------------------------------------------
// Status do site (tirar do ar / voltar ao ar) — ownership revalidado pela sessao
// ----------------------------------------------------------------------------

/** Ownership: o evento precisa ser do profissional logado. Retorna o id ou null. */
async function eventoDoDono(eventId: unknown): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;
  if (typeof eventId !== "string" || !eventId) return null;
  const ev = await prisma.event.findFirst({
    where: { id: eventId, professionalId: session.user.id },
    select: { id: true },
  });
  return ev?.id ?? null;
}

/**
 * Tira o site do ar SEM destravar a edicao (o status continua PUBLISHED).
 *
 * Voltar para DRAFT era a porta dos fundos: bastava tirar do ar para reabrir o
 * editor de graca e publicar tudo de novo. O nome tambem mudou por isso — isto
 * NAO despublica, so pausa.
 */
export async function tirarDoAr(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");
  await prisma.event.update({ where: { id }, data: { foraDoAr: true } });
  revalidatePath("/painel");
}

/** Coloca o site de volta no ar. */
export async function voltarAoAr(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");
  await prisma.event.update({ where: { id }, data: { foraDoAr: false } });
  revalidatePath("/painel");
}

// ----------------------------------------------------------------------------
// Perfil do profissional
// ----------------------------------------------------------------------------

const perfilSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  brandName: z.string().trim().max(140).optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine(
      (v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v),
      "URL de imagem inválida.",
    ),
  // Se preenchida, troca a senha (>= 8). Vazia = mantem a atual.
  novaSenha: z
    .string()
    .min(8, "A nova senha precisa de ao menos 8 caracteres.")
    .max(200)
    .optional(),
});

export type PerfilState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "brandName" | "novaSenha", string>>;
};

export async function atualizarPerfil(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v : undefined;
  };

  const parsed = perfilSchema.safeParse({
    name: formData.get("name"),
    brandName: str("brandName"),
    avatarUrl: str("avatarUrl"),
    novaSenha: str("novaSenha"),
  });
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: {
        name: f.name?.[0],
        brandName: f.brandName?.[0],
        novaSenha: f.novaSenha?.[0],
      },
    };
  }

  const { name, brandName, avatarUrl, novaSenha } = parsed.data;

  const data: Prisma.ProfessionalUpdateInput = {
    name,
    brandName: brandName ?? null,
    avatarUrl: avatarUrl ?? null,
  };
  if (novaSenha) {
    data.passwordHash = await bcrypt.hash(novaSenha, 10);
  }

  await prisma.professional.update({
    where: { id: session.user.id },
    data,
  });

  revalidatePath("/painel/perfil");
  revalidatePath("/painel");
  return { ok: true };
}


// ----------------------------------------------------------------------------
// Plano (assinatura) — DESCER de plano. Subir passa pelo Mercado Pago.
// ----------------------------------------------------------------------------

/**
 * Descer de plano — na pratica, CANCELAR a assinatura.
 *
 * Ate 17/08/2026 esta action fazia um `update({ plan })` seco: qualquer conta
 * clicava em "Fazer upgrade" e virava PREMIUM (R$ 149/mes) de graca. Quem
 * concede plano pago e o webhook do gateway, nunca um clique nosso — subir
 * agora e com `assinarPlano`.
 *
 * Descer nao precisa de autorizacao de gateway, mas precisa AVISAR o gateway:
 * sem o cancelamento no Mercado Pago, a pessoa cancela aqui e continua sendo
 * cobrada todo mes la.
 *
 * O mes ja pago nao evapora: quando ha prazo corrente, `plan` fica como esta e
 * quem tira o direito e `planoEfetivo()`, no vencimento. So quando nao ha nada
 * pago e que a linha desce na hora.
 */
export async function trocarPlano(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const planRaw = formData.get("plan");
  if (typeof planRaw !== "string" || !PLAN_VALUES.includes(planRaw as (typeof PLAN_VALUES)[number])) {
    return;
  }
  const destino = planRaw as (typeof PLAN_VALUES)[number];

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { ...SELECT_ASSINATURA, mpPreapprovalId: true },
  });
  if (!prof) return;
  // O que vale e o plano de HOJE (efetivo), o mesmo que a tela mostra.
  const atual = planoEfetivo(prof, new Date());
  if (!ehDowngrade(atual, destino)) return;

  // Para de cobrar no MP. Se o gateway recusar, nao mexemos em nada: e melhor a
  // pessoa tentar de novo do que a gente dizer "cancelado" e seguir cobrando.
  if (prof.mpPreapprovalId && prof.assinaturaStatus !== "cancelled") {
    const cancelou = await cancelarAssinaturaMp(prof.mpPreapprovalId).catch((err: unknown) => {
      console.error("[trocarPlano] cancelamento no Mercado Pago falhou:", err);
      return false;
    });
    if (!cancelou) redirect("/painel/plano?assinatura=erro-cancelar");
  }

  const temPrazoPago = !!prof.assinaturaAte && prof.assinaturaAte.getTime() > Date.now();
  await prisma.professional.update({
    where: { id: session.user.id },
    data: {
      assinaturaStatus: prof.mpPreapprovalId ? "cancelled" : prof.assinaturaStatus,
      // Com mes pago em curso, o plano contratado segue ate vencer.
      ...(temPrazoPago ? {} : { plan: destino }),
    },
  });
  revalidatePath("/painel/plano");
  revalidatePath("/painel");
}

/**
 * SUBIR de plano: cria a assinatura no Mercado Pago e manda a pessoa para o
 * checkout DELES, onde o cartao e digitado.
 *
 * A regra toda vive em `iniciarAssinatura` (compartilhada com a rota
 * `/assinar/[plano]`, por onde entra quem vem da landing). Aqui so traduzimos o
 * resultado em navegacao: gateway fora do ar leva de volta a tela com aviso, em
 * vez de bater na tela de erro do Next.
 */
export async function assinarPlano(formData: FormData) {
  const destino = planoPago(formData.get("plan"));
  if (!destino) return;

  const r = await iniciarAssinatura(destino);
  if (!r.ok) {
    if (r.motivo === "sem-sessao") redirect("/entrar");
    redirect("/painel/plano?assinatura=erro");
  }
  redirect(r.initPoint);
}
