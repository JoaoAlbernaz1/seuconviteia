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
import { gerarSlugUnico } from "@/lib/slug";
import { calcularExpiracao } from "@/lib/dates";
import { acentoDoTema } from "@/lib/temas";
import {
  TEMA_KEYS,
  montarMapsUrls,
  parseProgramacao,
  parsePresentes,
  parseFotos,
  semUndefined,
} from "@/lib/eventoForm";
import { UPSELLS, UPSELL_FIELD, type Upsell } from "@/lib/upsells";

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
    data: { name, email, passwordHash },
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
  | "fotoUrl"
  | "presentesFotoUrl";

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
 */
function interpretarEvento(
  formData: FormData,
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
      expiresAt: calcularExpiracao(eventDate),
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

  const result = interpretarEvento(formData);
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

  // Nasce como PREVIEW: PUBLISHED (visivel no subdominio) mas `purchased=false`
  // (marca d'agua) e upsells desligados — destravam por pagamento depois.
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
    select: { id: true, purchased: true },
  });
  if (!existente) {
    return { error: "Evento nao encontrado." };
  }

  // Regra do modelo: site PUBLICADO (pago) nao se altera de graca — e preciso
  // liberar a edicao (voltar para previa) antes. Defesa no servidor; a UI do
  // editor ja bloqueia, mas nunca confiamos so nela.
  if (existente.purchased) {
    return {
      error:
        "Este site está publicado. Libere a edição (ele volta a ser prévia) antes de alterar.",
    };
  }

  const result = interpretarEvento(formData);
  if (!result.ok) return result.state;
  const { type, title, eventDate, expiresAt, customization, presentes, fotos } =
    result.data;

  // Atualiza o evento. `subdomain`, `templateId`, `purchased` e os upsells ficam
  // ESTAVEIS (compra/destrave de upsell sao acoes proprias, nao mexem aqui).
  await prisma.event.update({
    where: { id: existente.id },
    data: { type, title, eventDate, expiresAt, customization },
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

/** Liga/desliga a compra (valor unico) do site — tira/poe a marca d'agua. */
export async function alternarCompra(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");
  const atual = await prisma.event.findUnique({
    where: { id },
    select: { purchased: true },
  });
  await prisma.event.update({
    where: { id },
    data: { purchased: !atual?.purchased },
  });
  revalidatePath("/painel");
}

/**
 * Libera a edicao de um site PUBLICADO: volta para PRÉVIA (despublica) e abre o
 * editor. No modelo, alterar um site pago exige "pagar de novo" — por ora (stub)
 * a liberacao e a despublicacao; com pagamento real vira um passo de cobranca.
 */
export async function liberarEdicao(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");
  await prisma.event.update({ where: { id }, data: { purchased: false } });
  redirect(`/painel/${id}/editar`);
}

/** Liga/desliga um upsell avulso do evento (rsvp/recados/galeria/dominio). */
export async function alternarUpsell(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");

  const upsellRaw = formData.get("upsell");
  if (typeof upsellRaw !== "string" || !UPSELLS.includes(upsellRaw as Upsell)) {
    return;
  }
  const field = UPSELL_FIELD[upsellRaw as Upsell];

  const ev = await prisma.event.findUnique({
    where: { id },
    select: {
      upsellRsvp: true,
      upsellRecados: true,
      upsellGaleria: true,
      upsellDominio: true,
    },
  });
  if (!ev) return;

  await prisma.event.update({
    where: { id },
    data: { [field]: !ev[field] } as Prisma.EventUpdateInput,
  });
  revalidatePath("/painel");
}
