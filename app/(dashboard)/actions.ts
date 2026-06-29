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
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { gerarSlugUnico } from "@/lib/slug";
import { calcularExpiracao } from "@/lib/dates";

// ----------------------------------------------------------------------------
// Cadastro (signup)
// ----------------------------------------------------------------------------

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail invalido."),
  password: z.string().min(8, "A senha precisa de ao menos 8 caracteres.").max(200),
});

export type SignupState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
};

export async function cadastrarProfissional(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: {
        name: f.name?.[0],
        email: f.email?.[0],
        password: f.password?.[0],
      },
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.professional.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "Este e-mail ja esta cadastrado." } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.professional.create({
    data: { name, email, passwordHash, plan: "BASICO" },
  });

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
// Criar evento
// ----------------------------------------------------------------------------

const EVENT_TYPES = [
  "CASAMENTO",
  "QUINZE_ANOS",
  "SESSENTA_ANOS",
  "BODAS",
  "ANIVERSARIO",
] as const;

const novoEventoSchema = z.object({
  type: z.enum(EVENT_TYPES),
  templateId: z.string().trim().min(1, "Escolha um modelo."),
  title: z.string().trim().min(2, "Informe o titulo do evento.").max(120),
  // <input type="date"> -> "yyyy-mm-dd".
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida."),
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor invalida.")
    .optional(),
  welcomeMessage: z.string().trim().max(500).optional(),
});

export type NovoEventoState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"type" | "templateId" | "title" | "eventDate" | "accent" | "welcomeMessage", string>
  >;
};

export async function criarEvento(
  _prev: NovoEventoState,
  formData: FormData,
): Promise<NovoEventoState> {
  // Tenant SEMPRE da sessao — nunca do cliente.
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  const parsed = novoEventoSchema.safeParse({
    type: formData.get("type"),
    templateId: formData.get("templateId"),
    title: formData.get("title"),
    eventDate: formData.get("eventDate"),
    accent: formData.get("accent") || undefined,
    welcomeMessage: formData.get("welcomeMessage") || undefined,
  });

  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: {
        type: f.type?.[0],
        templateId: f.templateId?.[0],
        title: f.title?.[0],
        eventDate: f.eventDate?.[0],
        accent: f.accent?.[0],
        welcomeMessage: f.welcomeMessage?.[0],
      },
    };
  }

  const { type, templateId, title, eventDate, accent, welcomeMessage } = parsed.data;

  // O template precisa existir e ser do mesmo nicho selecionado.
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template || template.nicho !== type) {
    return { fieldErrors: { templateId: "Modelo invalido para esse tipo de evento." } };
  }

  // Constroi a data ao meio-dia para evitar deslocamento de fuso (off-by-one).
  const data = new Date(`${eventDate}T12:00:00`);
  if (Number.isNaN(data.getTime())) {
    return { fieldErrors: { eventDate: "Data invalida." } };
  }

  // Subdominio unico (considera RESERVED + colisoes no banco).
  const subdomain = await gerarSlugUnico(title, async (s) =>
    Boolean(await prisma.event.findUnique({ where: { subdomain: s } })),
  );

  const expiresAt = calcularExpiracao(data);

  const accentFinal =
    accent ??
    (template.config as { accent?: string } | null)?.accent ??
    "#6D28D9";

  await prisma.event.create({
    data: {
      professionalId,
      type,
      templateId,
      title,
      subdomain,
      eventDate: data,
      expiresAt,
      status: "PUBLISHED",
      plan: "BASICO",
      customization: {
        accent: accentFinal,
        message: welcomeMessage ?? null,
      },
    },
  });

  revalidatePath("/painel");
  redirect("/painel");
}
