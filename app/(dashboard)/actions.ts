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
import { gerarSlugUnico } from "@/lib/slug";
import { calcularExpiracao, dataDeHojeSP } from "@/lib/dates";
import { acentoDoTema } from "@/lib/temas";
import { FONTE_KEYS, FONTE_PADRAO } from "@/lib/fontes";
import {
  TEMA_KEYS,
  montarMapsUrls,
  parseProgramacao,
  parsePresentes,
  parseFotos,
  parseRecursosForm,
  semUndefined,
} from "@/lib/eventoForm";

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
  | "fotoUrl"
  | "presentesFotoUrl"
  | "fontes"
  | "presentesTexto";

const novoEventoSchema = z.object({
  type: z.enum(EVENT_TYPES, { message: "Escolha o tipo de evento." }),
  // Paleta de cor: precisa ser uma chave conhecida de `lib/temas.ts`.
  tema: z
    .string()
    .refine((k) => (TEMA_KEYS as readonly string[]).includes(k), "Paleta invalida."),
  // Dupla de fontes: chave de `lib/fontes.ts`. Ausente -> "classica" (a da festa).
  fontes: z
    .string()
    .refine((k) => (FONTE_KEYS as readonly string[]).includes(k), "Estilo de letra invalido.")
    .optional()
    .default(FONTE_PADRAO),
  title: z.string().trim().min(2, "Informe o titulo do evento.").max(120),
  // <input type="date"> -> "yyyy-mm-dd".
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida."),
  // <input type="time"> -> "HH:MM" (opcional; cai para 20:00).
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido.")
    .optional(),
  mensagem: z.string().trim().max(2000).optional(),
  presentesTexto: z.string().trim().max(500).optional(),
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
  presentesFotoUrl: z
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

/** Dados validados + derivados de um form de evento (compartilhado criar/editar). */
type EventoInterpretado = {
  type: (typeof EVENT_TYPES)[number];
  title: string;
  eventDate: Date;
  expiresAt: Date;
  customization: Prisma.InputJsonValue;
  presentes: ReturnType<typeof parsePresentes>;
  fotos: string[];
};

/**
 * Valida (Zod) + monta os dados derivados de um form de evento. PURO em relacao a
 * sessao/banco (so le o FormData). Reusado por `criarEvento` e `editarEvento`.
 *
 * `modo` diferencia as regras de data:
 *  - `"create"`: rejeita data no passado (erro comum = ano errado — pegamos cedo,
 *    com mensagem clara, antes de publicar um site que ja nasceria expirado).
 *  - `"edit"`: permite data passada (evento que ja aconteceu segue editavel na
 *    janela de 30 dias — fotos/recados), MAS bloqueia se o site ja estaria expirado.
 */
function interpretarEvento(
  formData: FormData,
  modo: "create" | "edit",
):
  | { ok: true; data: EventoInterpretado }
  | { ok: false; state: NovoEventoState } {
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v : undefined;
  };

  const parsed = novoEventoSchema.safeParse({
    type: formData.get("type"),
    tema: formData.get("tema"),
    fontes: str("fontes"),
    title: formData.get("title"),
    date: formData.get("date"),
    time: str("time"),
    mensagem: str("mensagem"),
    presentesTexto: str("presentesTexto"),
    local: str("local"),
    endereco: str("endereco"),
    traje: str("traje"),
    pixNome: str("pixNome"),
    pixChave: str("pixChave"),
    fotoUrl: str("fotoUrl"),
    presentesFotoUrl: str("presentesFotoUrl"),
  });

  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      ok: false,
      state: {
        fieldErrors: {
          type: f.type?.[0],
          tema: f.tema?.[0],
          fontes: f.fontes?.[0],
          title: f.title?.[0],
          date: f.date?.[0],
          time: f.time?.[0],
          mensagem: f.mensagem?.[0],
          presentesTexto: f.presentesTexto?.[0],
          local: f.local?.[0],
          endereco: f.endereco?.[0],
          traje: f.traje?.[0],
          pixNome: f.pixNome?.[0],
          pixChave: f.pixChave?.[0],
          fotoUrl: f.fotoUrl?.[0],
          presentesFotoUrl: f.presentesFotoUrl?.[0],
        },
      },
    };
  }

  const {
    type,
    tema,
    fontes,
    title,
    date,
    time,
    mensagem,
    presentesTexto,
    local,
    endereco,
    traje,
    pixNome,
    pixChave,
    fotoUrl,
    presentesFotoUrl,
  } = parsed.data;

  // Data + horario do evento. Fixamos o fuso de BRASILIA (-03:00, sem horario de
  // verao desde 2019) para que a data/contador batam com o que foi digitado em
  // QUALQUER servidor — em prod a Vercel roda em UTC, e sem o offset o instante
  // deslocaria 3h (a renderizacao formata em America/Sao_Paulo).
  const eventDate = new Date(`${date}T${time || "20:00"}:00-03:00`);
  if (Number.isNaN(eventDate.getTime())) {
    return { ok: false, state: { fieldErrors: { date: "Data ou horario invalido." } } };
  }

  // Regras de data (evita publicar um site que ja nasceria expirado / "no ar" mas
  // morto — armadilha silenciosa: o form redirecionava como sucesso e o site
  // mostrava "convite expirou"). No cadastro, a causa comum e o ANO errado.
  const agora = new Date();
  const expiresAt = calcularExpiracao(eventDate);
  if (modo === "create" && date < dataDeHojeSP(agora)) {
    return {
      ok: false,
      state: {
        fieldErrors: {
          date: "A data do evento nao pode estar no passado. Confira o ano.",
        },
      },
    };
  }
  if (expiresAt.getTime() <= agora.getTime()) {
    return {
      ok: false,
      state: {
        fieldErrors: {
          date: "Com essa data, o site ja estaria expirado. Escolha uma data futura.",
        },
      },
    };
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
  // Album: URLs salvas pelo upload (hidden inputs `fotos` repetidos).
  const fotos = parseFotos(formData.getAll("fotos").map(String));

  const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(local, endereco);

  // Toggles de recurso da tela "Recursos do site" (so os DESLIGADOS entram).
  const recursos = parseRecursosForm((k) => formData.get(k));

  // `customization` = contrato lido pela template "festa" (lib/convite +
  // lib/eventoFesta). Chaves vazias sao omitidas (JSON limpo). A dupla padrao
  // de fontes nao e gravada (JSON limpo; ausente = "classica").
  const customization = semUndefined({
    tema,
    accent: acentoDoTema(tema),
    fontes: fontes === FONTE_PADRAO ? undefined : fontes,
    recursos,
    mensagem,
    presentesTexto,
    local,
    endereco,
    mapsUrl,
    mapsEmbedUrl,
    traje,
    programacao: programacao.length ? programacao : undefined,
    fotoUrl,
    presentesFotoUrl,
    pixNome,
    pixChave,
  });

  return {
    ok: true,
    data: {
      type,
      title,
      eventDate,
      expiresAt,
      customization,
      presentes,
      fotos,
    },
  };
}

/** Mapeia presentes parseados -> linhas do GiftItem (Pix). */
function giftRows(eventId: string, presentes: EventoInterpretado["presentes"]) {
  return presentes.map((g) => ({
    eventId,
    title: g.titulo,
    description: g.descricao ?? null,
    priceCents: g.valorCents ?? 0,
    mode: "PIX" as const,
  }));
}

/** Mapeia URLs do album -> linhas de Photo (ordenadas). */
function photoRows(eventId: string, fotos: string[]) {
  return fotos.map((url, i) => ({ eventId, url, order: i }));
}

export async function criarEvento(
  _prev: NovoEventoState,
  formData: FormData,
): Promise<NovoEventoState> {
  // Tenant SEMPRE da sessao — nunca do cliente.
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  // Plano HERDADO da conta (assinatura): o evento usa o plano do profissional.
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { plan: true },
  });
  if (!professional) redirect("/entrar");
  const plan = professional.plan;

  const result = interpretarEvento(formData, "create");
  if (!result.ok) return result.state;
  const { type, title, eventDate, expiresAt, customization, presentes, fotos } =
    result.data;

  // Subdominio unico (considera RESERVED + colisoes no banco).
  const subdomain = await gerarSlugUnico(title, async (s) =>
    Boolean(await prisma.event.findUnique({ where: { subdomain: s } })),
  );

  // Template do nicho (auto): mantem `templateId` valido sem expor a escolha no
  // form. Se nao houver modelo para o nicho, fica `null` (a coluna e opcional).
  const template = await prisma.template.findFirst({
    where: { nicho: type },
    orderBy: { createdAt: "asc" },
  });

  // Publicado (incluido no plano, sem marca d'agua); plano herdado da conta.
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
      plan,
      customization,
    },
  });

  // Itens da lista de presentes (Pix). `priceCents` e obrigatorio (0 = sem valor).
  if (presentes.length) {
    await prisma.giftItem.createMany({ data: giftRows(event.id, presentes) });
  }
  // Album do evento (Photo rows ordenadas).
  if (fotos.length) {
    await prisma.photo.createMany({ data: photoRows(event.id, fotos) });
  }

  revalidatePath("/painel");
  redirect("/painel");
}

// ----------------------------------------------------------------------------
// Editar evento
// ----------------------------------------------------------------------------

export async function editarEvento(
  _prev: NovoEventoState,
  formData: FormData,
): Promise<NovoEventoState> {
  // Tenant SEMPRE da sessao.
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  // O id viaja num hidden field — NUNCA confiado cru: revalidamos ownership.
  const eventId = formData.get("eventId");
  if (typeof eventId !== "string" || !eventId) {
    return { error: "Evento invalido." };
  }

  // Ownership: o evento precisa pertencer ao profissional logado.
  const existente = await prisma.event.findFirst({
    where: { id: eventId, professionalId },
    select: { id: true },
  });
  if (!existente) {
    return { error: "Evento nao encontrado." };
  }

  // Plano HERDADO da conta (assinatura): ao salvar, o evento reflete o plano atual.
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { plan: true },
  });
  if (!professional) redirect("/entrar");
  const plan = professional.plan;

  const result = interpretarEvento(formData, "edit");
  if (!result.ok) return result.state;
  const { type, title, eventDate, expiresAt, customization, presentes, fotos } =
    result.data;

  // Atualiza o evento. `subdomain`, `templateId`, `purchased` e os upsells ficam
  // ESTAVEIS (compra/destrave de upsell sao acoes proprias, nao mexem aqui).
  await prisma.event.update({
    where: { id: existente.id },
    data: { type, plan, title, eventDate, expiresAt, customization },
  });

  // Presentes e fotos: REPLACE total (delete + recria) para casar com o form.
  await prisma.giftItem.deleteMany({ where: { eventId: existente.id } });
  if (presentes.length) {
    await prisma.giftItem.createMany({ data: giftRows(existente.id, presentes) });
  }

  await prisma.photo.deleteMany({ where: { eventId: existente.id } });
  if (fotos.length) {
    await prisma.photo.createMany({ data: photoRows(existente.id, fotos) });
  }

  revalidatePath("/painel");
  redirect("/painel");
}

// ----------------------------------------------------------------------------
// Monetizacao (STUB) — comprar (valor unico) e destravar upsell
//
// SEM pagamento real ainda: estas acoes apenas ALTERNAM as flags do evento, para
// validar o modelo ao vivo (a marca d'agua some ao "comprar"; a aba/secao do
// upsell aparece ao destravar). O Pix real (Mercado Pago) entra depois e chamara
// o MESMO write. Ownership sempre revalidado pela sessao.
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

/** Publica o site (rascunho -> no ar). Incluido no plano; sem cobranca. */
export async function publicarEvento(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");
  await prisma.event.update({ where: { id }, data: { status: "PUBLISHED" } });
  revalidatePath("/painel");
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
