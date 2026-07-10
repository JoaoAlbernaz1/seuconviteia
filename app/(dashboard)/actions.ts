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
import { enviarEmail } from "@/lib/email";
import { MARCA } from "@/lib/email/remetente";
import { emailBoasVindas } from "@/lib/email/templates";

// ----------------------------------------------------------------------------
// Cadastro (signup)
// ----------------------------------------------------------------------------

/** Planos validos (espelha o enum `Plan` do Prisma). */
const PLAN_VALUES = ["BASICO", "CLASSICO", "PREMIUM"] as const;

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail invalido."),
  password: z.string().min(8, "A senha precisa de ao menos 8 caracteres.").max(200),
  // Plano da CONTA (escolhido no cadastro; herdado pelos eventos). Ausente -> BASICO.
  plan: z.enum(PLAN_VALUES, { message: "Plano invalido." }).optional().default("BASICO"),
});

export type SignupState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "plan", string>>;
};

/**
 * URL do painel no dominio de entao. O painel e servido no subdominio `app.`
 * (reservado no middleware). Localhost usa http; qualquer outro dominio, https.
 */
function urlDoPainel(): string {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "seuconviteia.com";
  const protocolo = root.startsWith("localhost") ? "http" : "https";
  return `${protocolo}://app.${root}/painel`;
}

export async function cadastrarProfissional(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const planRaw = formData.get("plan");
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    plan: typeof planRaw === "string" && planRaw ? planRaw : undefined,
  });

  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: {
        name: f.name?.[0],
        email: f.email?.[0],
        password: f.password?.[0],
        plan: f.plan?.[0],
      },
    };
  }

  const { name, email, password, plan } = parsed.data;

  const existing = await prisma.professional.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "Este e-mail ja esta cadastrado." } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.professional.create({
    data: { name, email, passwordHash, plan },
  });

  // Boas-vindas (transacional). `enviarEmail` engole qualquer falha e NAO propaga:
  // e-mail nunca pode quebrar o cadastro. O painel mora em `app.<root>` (http no
  // localhost, https em prod). Remetente = marca (a plataforma dando as boas-vindas).
  const { subject, html } = emailBoasVindas({ nome: name, painelUrl: urlDoPainel() });
  await enviarEmail({ to: email, subject, html, fromName: MARCA });

  // Loga e redireciona para o painel. `signIn` lanca o redirect (NEXT_REDIRECT)
  // em caso de sucesso; so tratamos AuthError aqui.
  try {
    await signIn("credentials", { email, password, redirectTo: "/painel" });
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
});

export type LoginState = { error?: string };

export async function entrarComCredenciais(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Informe um e-mail e uma senha validos." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/painel",
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
// Status do site (despublicar) — ownership revalidado pela sessao
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

/** Despublica o site (volta a rascunho — sai do ar). */
export async function despublicarEvento(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");
  await prisma.event.update({ where: { id }, data: { status: "DRAFT" } });
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
// Plano (assinatura) — troca de plano. STUB: sem cobranca real ainda.
// ----------------------------------------------------------------------------

export async function trocarPlano(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const planRaw = formData.get("plan");
  if (typeof planRaw !== "string" || !PLAN_VALUES.includes(planRaw as (typeof PLAN_VALUES)[number])) {
    return;
  }
  await prisma.professional.update({
    where: { id: session.user.id },
    data: { plan: planRaw as (typeof PLAN_VALUES)[number] },
  });
  revalidatePath("/painel/plano");
  revalidatePath("/painel");
}
