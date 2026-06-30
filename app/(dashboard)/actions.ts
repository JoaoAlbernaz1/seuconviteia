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
import { acentoDoTema } from "@/lib/temas";
import {
  TEMA_KEYS,
  montarMapsUrls,
  parseProgramacao,
  parsePresentes,
  semUndefined,
} from "@/lib/eventoForm";

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

/** Campos de erro possiveis no form de evento. */
type CampoEvento =
  | "type"
  | "tema"
  | "title"
  | "date"
  | "time"
  | "mensagem"
  | "local"
  | "endereco"
  | "traje"
  | "pixNome"
  | "pixChave"
  | "fotoUrl";

const novoEventoSchema = z.object({
  type: z.enum(EVENT_TYPES, { message: "Escolha o tipo de evento." }),
  // Paleta de cor: precisa ser uma chave conhecida de `lib/temas.ts`.
  tema: z
    .string()
    .refine((k) => (TEMA_KEYS as readonly string[]).includes(k), "Paleta invalida."),
  title: z.string().trim().min(2, "Informe o titulo do evento.").max(120),
  // <input type="date"> -> "yyyy-mm-dd".
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida."),
  // <input type="time"> -> "HH:MM" (opcional; cai para 20:00).
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido.")
    .optional(),
  mensagem: z.string().trim().max(2000).optional(),
  local: z.string().trim().max(200).optional(),
  endereco: z.string().trim().max(300).optional(),
  traje: z.string().trim().max(120).optional(),
  pixNome: z.string().trim().max(140).optional(),
  pixChave: z.string().trim().max(200).optional(),
  fotoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine(
      (v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v),
      "Use uma URL (https://...) ou um caminho iniciado por /.",
    ),
});

export type NovoEventoState = {
  error?: string;
  fieldErrors?: Partial<Record<CampoEvento, string>>;
};

export async function criarEvento(
  _prev: NovoEventoState,
  formData: FormData,
): Promise<NovoEventoState> {
  // Tenant SEMPRE da sessao — nunca do cliente.
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v : undefined;
  };

  const parsed = novoEventoSchema.safeParse({
    type: formData.get("type"),
    tema: formData.get("tema"),
    title: formData.get("title"),
    date: formData.get("date"),
    time: str("time"),
    mensagem: str("mensagem"),
    local: str("local"),
    endereco: str("endereco"),
    traje: str("traje"),
    pixNome: str("pixNome"),
    pixChave: str("pixChave"),
    fotoUrl: str("fotoUrl"),
  });

  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: {
        type: f.type?.[0],
        tema: f.tema?.[0],
        title: f.title?.[0],
        date: f.date?.[0],
        time: f.time?.[0],
        mensagem: f.mensagem?.[0],
        local: f.local?.[0],
        endereco: f.endereco?.[0],
        traje: f.traje?.[0],
        pixNome: f.pixNome?.[0],
        pixChave: f.pixChave?.[0],
        fotoUrl: f.fotoUrl?.[0],
      },
    };
  }

  const {
    type,
    tema,
    title,
    date,
    time,
    mensagem,
    local,
    endereco,
    traje,
    pixNome,
    pixChave,
    fotoUrl,
  } = parsed.data;

  // Data + horario do evento (horario default 20:00). Localizado no fuso do
  // servidor; a renderizacao formata em America/Sao_Paulo.
  const eventDate = new Date(`${date}T${time || "20:00"}:00`);
  if (Number.isNaN(eventDate.getTime())) {
    return { fieldErrors: { date: "Data ou horario invalido." } };
  }

  // Listas repetiveis: arrays paralelos no FormData -> linhas sanitizadas.
  const programacao = parseProgramacao(
    formData.getAll("programacao_hora").map(String),
    formData.getAll("programacao_titulo").map(String),
  );
  const presentes = parsePresentes(
    formData.getAll("gift_titulo").map(String),
    formData.getAll("gift_descricao").map(String),
    formData.getAll("gift_valor").map(String),
  );

  // Subdominio unico (considera RESERVED + colisoes no banco).
  const subdomain = await gerarSlugUnico(title, async (s) =>
    Boolean(await prisma.event.findUnique({ where: { subdomain: s } })),
  );

  const expiresAt = calcularExpiracao(eventDate);

  // Template do nicho (auto): mantem `templateId` valido sem expor a escolha no
  // form. Se nao houver modelo para o nicho, fica `null` (a coluna e opcional).
  const template = await prisma.template.findFirst({
    where: { nicho: type },
    orderBy: { createdAt: "asc" },
  });

  const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(local, endereco);

  // `customization` = contrato lido pela template "festa" (lib/convite +
  // lib/eventoFesta). Chaves vazias sao omitidas (JSON limpo).
  const customization = semUndefined({
    tema,
    accent: acentoDoTema(tema),
    mensagem,
    local,
    endereco,
    mapsUrl,
    mapsEmbedUrl,
    traje,
    programacao: programacao.length ? programacao : undefined,
    fotoUrl,
    pixNome,
    pixChave,
  });

  const event = await prisma.event.create({
    data: {
      professionalId,
      type,
      templateId: template?.id ?? null,
      title,
      subdomain,
      eventDate,
      expiresAt,
      status: "PUBLISHED",
      plan: "BASICO",
      customization,
    },
  });

  // Itens da lista de presentes (Pix). `priceCents` e obrigatorio (0 = sem valor).
  if (presentes.length) {
    await prisma.giftItem.createMany({
      data: presentes.map((g) => ({
        eventId: event.id,
        title: g.titulo,
        description: g.descricao ?? null,
        priceCents: g.valorCents ?? 0,
        mode: "PIX" as const,
      })),
    });
  }

  revalidatePath("/painel");
  redirect("/painel");
}
