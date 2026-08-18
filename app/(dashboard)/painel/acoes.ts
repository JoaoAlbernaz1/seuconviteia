"use server";

/**
 * Acoes PARCIAIS por evento — o painel DARK edita o site em telas focadas
 * (Detalhes · Estilo · Fotos · Presentes · Programacao · Recursos · Convidados),
 * entao cada acao grava SO o seu pedaco, com MERGE no `customization`
 * (nunca substitui o JSON inteiro — o resto do evento fica intacto).
 *
 * Regras herdadas de `actions.ts`:
 *  - Zod na borda; tenant SEMPRE da sessao; ownership revalidado por acao.
 *  - Datas parseiam FIXO em -03:00 (fuso de Brasilia) — nunca cru.
 *  - Erros voltam como estado (sem throw); redirects sobem.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { mergeCustomization, removeCustomizationWhenMissing } from "@/lib/customizationMerge";
import { gerarSlugUnico } from "@/lib/slug";
import { calcularExpiracao, dataDeHojeSP } from "@/lib/dates";
import { acentoDoTema } from "@/lib/temas";
import { FONTE_KEYS, FONTE_PADRAO } from "@/lib/fontes";
import { TEMPLATES, TEMPLATE_PADRAO } from "@/lib/templates";
import { limiteEventos, planoEfetivo, podeVitrine, rotuloPlano, SELECT_ASSINATURA } from "@/lib/plans";
import {
  TEMA_KEYS,
  montarMapsUrls,
  parseProgramacao,
  parsePresentes,
  parseFotos,
  parseRecursosForm,
} from "@/lib/eventoForm";

export type AcaoEventoState = {
  error?: string;
  fieldErrors?: Record<string, string | undefined>;
};

const EVENT_TYPES = [
  "CASAMENTO",
  "QUINZE_ANOS",
  "SESSENTA_ANOS",
  "BODAS",
  "ANIVERSARIO",
] as const;

const urlish = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v),
    "Use uma URL (https://...) ou um caminho iniciado por /.",
  );

/** Le string do FormData ("" -> undefined). */
function str(formData: FormData, k: string): string | undefined {
  const v = formData.get(k);
  return typeof v === "string" && v.trim() ? v : undefined;
}

/** Ownership: o evento precisa ser do profissional logado. */
async function eventoDoDono(eventId: unknown) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  if (typeof eventId !== "string" || !eventId) return null;
  return prisma.event.findFirst({
    where: { id: eventId, professionalId: session.user.id },
  });
}

const mesclar = (atual: unknown, patch: Record<string, unknown>): Prisma.InputJsonValue =>
  mergeCustomization(atual, patch) as Prisma.InputJsonValue;

/** Destino do "Pronto, voltar" — so caminhos internos do painel. */
function destinoVoltar(formData: FormData, fallback: string): string {
  const v = formData.get("voltar");
  return typeof v === "string" && v.startsWith("/painel") ? v : fallback;
}

/** Data+hora (-03:00) com as regras de negocio. Devolve erro legivel. */
function parseDataHora(
  date: string,
  time: string | undefined,
  modo: "create" | "edit",
): { ok: true; eventDate: Date; expiresAt: Date } | { ok: false; erro: string } {
  const eventDate = new Date(`${date}T${time || "20:00"}:00-03:00`);
  if (Number.isNaN(eventDate.getTime())) {
    return { ok: false, erro: "Data ou horário inválido." };
  }
  const agora = new Date();
  const expiresAt = calcularExpiracao(eventDate);
  if (modo === "create" && date < dataDeHojeSP(agora)) {
    return { ok: false, erro: "A data não pode estar no passado. Confira o ano." };
  }
  if (expiresAt.getTime() <= agora.getTime()) {
    return {
      ok: false,
      erro: "Com essa data, o site já estaria expirado. Escolha uma data futura.",
    };
  }
  return { ok: true, eventDate, expiresAt };
}

// ----------------------------------------------------------------------------
// Wizard — cria o RASCUNHO ao fim do passo 3 (Detalhes)
// ----------------------------------------------------------------------------

const rascunhoSchema = z.object({
  type: z.enum(EVENT_TYPES, { message: "Escolha a ocasião." }),
  tema: z
    .string()
    .refine((k) => (TEMA_KEYS as readonly string[]).includes(k), "Cor inválida."),
  fontes: z
    .string()
    .refine((k) => (FONTE_KEYS as readonly string[]).includes(k), "Estilo inválido.")
    .optional()
    .default(FONTE_PADRAO),
  template: z
    .string()
    .refine((k) => k in TEMPLATES, "Modelo inválido.")
    .optional(),
  title: z.string().trim().min(2, "Informe o nome.").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.")
    .optional(),
  local: z.string().trim().max(200).optional(),
  mensagem: z.string().trim().max(2000).optional(),
  slug: z.string().trim().max(80).optional(),
});

/**
 * Cria o evento como RASCUNHO com o essencial do wizard e leva pro passo 4
 * (o editor, /painel/criar?id=<id>). O slug desejado e respeitado quando livre (senao
 * ganha sufixo unico — a tela seguinte mostra o endereco final).
 */
export async function criarRascunho(
  _prev: AcaoEventoState,
  formData: FormData,
): Promise<AcaoEventoState> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: SELECT_ASSINATURA,
  });
  if (!professional) redirect("/entrar");

  // Limite de eventos do plano EFETIVO (assinatura vencida volta ao Basico).
  const plano = planoEfetivo(professional, new Date());
  const limite = limiteEventos(plano);
  if (limite !== null) {
    const existentes = await prisma.event.count({ where: { professionalId, expiresAt: { gt: new Date() } } });
    if (existentes >= limite) {
      return {
        error: `O plano ${rotuloPlano(plano)} inclui até ${limite} eventos. Exclua um site que não usa mais ou faça upgrade em Plano.`,
      };
    }
  }

  const parsed = rascunhoSchema.safeParse({
    type: formData.get("type"),
    tema: formData.get("tema"),
    fontes: str(formData, "fontes"),
    template: str(formData, "template"),
    title: formData.get("title"),
    date: formData.get("date"),
    time: str(formData, "time"),
    local: str(formData, "local"),
    mensagem: str(formData, "mensagem"),
    slug: str(formData, "slug"),
  });
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: Object.fromEntries(
        Object.entries(f).map(([k, v]) => [k, v?.[0]]),
      ),
    };
  }
  const { type, tema, fontes, template: templateSite, title, date, time, local, mensagem, slug } =
    parsed.data;

  const dh = parseDataHora(date, time, "create");
  if (!dh.ok) return { fieldErrors: { date: dh.erro } };

  const subdomain = await gerarSlugUnico(slug || title, async (s) =>
    Boolean(await prisma.event.findUnique({ where: { subdomain: s } })),
  );

  const templateDb = await prisma.template.findFirst({
    where: { nicho: type },
    orderBy: { createdAt: "asc" },
  });

  const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(local, undefined);
  const customization = mesclar(
    {},
    {
      tema,
      accent: acentoDoTema(tema),
      fontes: fontes === FONTE_PADRAO ? undefined : fontes,
      template: templateSite,
      mensagem,
      local,
      mapsUrl,
      mapsEmbedUrl,
    },
  );

  const event = await prisma.event.create({
    data: {
      professionalId,
      type,
      templateId: templateDb?.id ?? null,
      title,
      subdomain,
      eventDate: dh.eventDate,
      expiresAt: dh.expiresAt,
      status: "DRAFT",
      plan: plano,
      customization,
    },
  });

  revalidatePath("/painel");
  redirect(`/painel/criar?id=${event.id}`);
}

// ----------------------------------------------------------------------------
// Detalhes (essencial) — tela "Editar o site"
// ----------------------------------------------------------------------------

const detalhesSchema = z.object({
  title: z.string().trim().min(2, "Informe o nome.").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.")
    .optional(),
  local: z.string().trim().max(200).optional(),
  endereco: z.string().trim().max(300).optional(),
  traje: z.string().trim().max(120).optional(),
  mensagem: z.string().trim().max(2000).optional(),
});

export async function atualizarDetalhes(
  _prev: AcaoEventoState,
  formData: FormData,
): Promise<AcaoEventoState> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) return { error: "Evento não encontrado." };

  const parsed = detalhesSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    time: str(formData, "time"),
    local: str(formData, "local"),
    endereco: str(formData, "endereco"),
    traje: str(formData, "traje"),
    mensagem: str(formData, "mensagem"),
  });
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: Object.fromEntries(
        Object.entries(f).map(([k, v]) => [k, v?.[0]]),
      ),
    };
  }
  const { title, date, time, local, endereco, traje, mensagem } = parsed.data;

  const dh = parseDataHora(date, time, "edit");
  if (!dh.ok) return { fieldErrors: { date: dh.erro } };

  const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(local, endereco);
  await prisma.event.update({
    where: { id: event.id },
    data: {
      title,
      eventDate: dh.eventDate,
      expiresAt: dh.expiresAt,
      customization: mesclar(event.customization, {
        mensagem: removeCustomizationWhenMissing(mensagem),
        local,
        endereco: removeCustomizationWhenMissing(endereco),
        traje: removeCustomizationWhenMissing(traje),
        mapsUrl,
        mapsEmbedUrl,
      }),
    },
  });

  revalidatePath("/painel");
  redirect(destinoVoltar(formData, `/painel/${event.id}`));
}

// ----------------------------------------------------------------------------
// Estilo (template/cor/letras) e Recursos (toggles)
// ----------------------------------------------------------------------------

export async function salvarEstilo(formData: FormData): Promise<void> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) redirect("/painel");

  const tema = formData.get("tema");
  const fontes = formData.get("fontes");
  const patch: Record<string, unknown> = {};
  if (typeof tema === "string" && TEMA_KEYS.includes(tema)) {
    patch.tema = tema;
    patch.accent = acentoDoTema(tema);
  }
  if (typeof fontes === "string" && FONTE_KEYS.includes(fontes)) {
    patch.fontes = removeCustomizationWhenMissing(fontes === FONTE_PADRAO ? undefined : fontes);
  }
  const template = formData.get("template");
  if (typeof template === "string" && template in TEMPLATES) {
    patch.template = removeCustomizationWhenMissing(template === TEMPLATE_PADRAO ? undefined : template);
  }
  // Tamanho das letras (multiplicador do lockup da capa: 0.9 / 1 / 1.15).
  const capaEscala = Number(formData.get("capaEscala"));
  if (Number.isFinite(capaEscala) && capaEscala >= 0.5 && capaEscala <= 2) {
    patch.capaEscala = removeCustomizationWhenMissing(capaEscala === 1 ? undefined : capaEscala);
  }
  await prisma.event.update({
    where: { id: event.id },
    data: { customization: mesclar(event.customization, patch) },
  });
  revalidatePath("/painel");
  redirect(destinoVoltar(formData, `/painel/${event.id}`));
}

export async function salvarRecursos(formData: FormData): Promise<void> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) redirect("/painel");
  await prisma.event.update({
    where: { id: event.id },
    data: {
      customization: mesclar(event.customization, {
        recursos: removeCustomizationWhenMissing(parseRecursosForm((k) => formData.get(k))),
      }),
    },
  });
  revalidatePath("/painel");
  redirect(destinoVoltar(formData, `/painel/${event.id}`));
}

// ----------------------------------------------------------------------------
// Fotos (capa + álbum + foto da lista)
// ----------------------------------------------------------------------------

export async function salvarFotos(
  _prev: AcaoEventoState,
  formData: FormData,
): Promise<AcaoEventoState> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) return { error: "Evento não encontrado." };

  const fotoUrl = urlish.safeParse(formData.get("fotoUrl") ?? "");
  const presentesFotoUrl = urlish.safeParse(formData.get("presentesFotoUrl") ?? "");
  if (!fotoUrl.success || !presentesFotoUrl.success) {
    return { error: "Foto inválida." };
  }
  const fotos = parseFotos(formData.getAll("fotos").map(String));

  await prisma.event.update({
    where: { id: event.id },
    data: {
      customization: mesclar(event.customization, {
        fotoUrl: removeCustomizationWhenMissing(fotoUrl.data || undefined),
        presentesFotoUrl: removeCustomizationWhenMissing(presentesFotoUrl.data || undefined),
      }),
    },
  });
  await prisma.photo.deleteMany({ where: { eventId: event.id } });
  if (fotos.length) {
    await prisma.photo.createMany({
      data: fotos.map((url, i) => ({ eventId: event.id, url, order: i })),
    });
  }
  revalidatePath("/painel");
  redirect(destinoVoltar(formData, `/painel/${event.id}`));
}

// ----------------------------------------------------------------------------
// Lista de presentes (Pix + QR + texto + itens)
// ----------------------------------------------------------------------------

const presentesSchema = z.object({
  pixNome: z.string().trim().max(140).optional(),
  pixChave: z.string().trim().max(200).optional(),
  pixQrUrl: urlish.optional(),
  presentesTexto: z.string().trim().max(500).optional(),
});

export async function salvarPresentes(
  _prev: AcaoEventoState,
  formData: FormData,
): Promise<AcaoEventoState> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) return { error: "Evento não encontrado." };

  const parsed = presentesSchema.safeParse({
    pixNome: str(formData, "pixNome"),
    pixChave: str(formData, "pixChave"),
    pixQrUrl: str(formData, "pixQrUrl"),
    presentesTexto: str(formData, "presentesTexto"),
  });
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: Object.fromEntries(
        Object.entries(f).map(([k, v]) => [k, v?.[0]]),
      ),
    };
  }
  const { pixNome, pixChave, pixQrUrl, presentesTexto } = parsed.data;

  // Modelo da lista (painel/vitrine). A vitrine é gateada pelo plano EFETIVO do
  // dono — quem parou de pagar volta ao modelo do Básico.
  const prof = await prisma.professional.findUnique({
    where: { id: event.professionalId },
    select: SELECT_ASSINATURA,
  });
  const listaModelo =
    str(formData, "listaModelo") === "vitrine" && prof && podeVitrine(planoEfetivo(prof, new Date()))
      ? "vitrine"
      : "painel";

  const presentes = parsePresentes(
    formData.getAll("gift_titulo").map(String),
    formData.getAll("gift_descricao").map(String),
    formData.getAll("gift_valor").map(String),
    formData.getAll("gift_foto").map(String),
    formData.getAll("gift_modo").map(String),
    formData.getAll("gift_cotas").map(String),
  );

  await prisma.event.update({
    where: { id: event.id },
    data: {
      customization: mesclar(event.customization, {
        pixNome: removeCustomizationWhenMissing(pixNome),
        pixChave: removeCustomizationWhenMissing(pixChave),
        pixQrUrl: removeCustomizationWhenMissing(pixQrUrl),
        presentesTexto: removeCustomizationWhenMissing(presentesTexto),
        listaModelo,
      }),
    },
  });

  // PROTEÇÃO DO LEDGER: se já houve contribuição, NÃO reescreve a lista — o
  // deleteMany cascatearia (onDelete: Cascade) e apagaria o histórico de Pix.
  const temContrib = await prisma.giftContribution.count({
    where: { eventId: event.id },
  });
  if (temContrib === 0) {
    await prisma.giftItem.deleteMany({ where: { eventId: event.id } });
    if (presentes.length) {
      await prisma.giftItem.createMany({
        data: presentes.map((g) => {
          const cents = g.valorCents ?? 0;
          const ehCota = g.modo === "COTAS" && !!g.cotas && cents > 0;
          // Valor único SEM preço não pode existir (checkout quebra): vira valor livre.
          const pricingMode = ehCota ? "COTAS" : cents > 0 ? "FIXO" : "LIVRE";
          return {
            eventId: event.id,
            title: g.titulo,
            description: g.descricao ?? null,
            priceCents: cents,
            imageUrl: g.foto ?? null,
            mode: "PIX" as const,
            pricingMode: pricingMode as "FIXO" | "COTAS" | "LIVRE",
            quotaCount: ehCota ? g.cotas : null,
          };
        }),
      });
    }
  }
  revalidatePath("/painel");
  redirect(destinoVoltar(formData, `/painel/${event.id}`));
}

// ----------------------------------------------------------------------------
// Programação (linha do tempo)
// ----------------------------------------------------------------------------

export async function salvarProgramacao(formData: FormData): Promise<void> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) redirect("/painel");
  const programacao = parseProgramacao(
    formData.getAll("programacao_hora").map(String),
    formData.getAll("programacao_titulo").map(String),
  );
  await prisma.event.update({
    where: { id: event.id },
    data: {
      customization: mesclar(event.customization, {
        programacao: removeCustomizationWhenMissing(programacao.length ? programacao : undefined),
      }),
    },
  });
  revalidatePath("/painel");
  redirect(destinoVoltar(formData, `/painel/${event.id}`));
}

// ----------------------------------------------------------------------------
// Excluir evento (site) — remove tudo do evento, de vez
// ----------------------------------------------------------------------------

export async function excluirEvento(formData: FormData): Promise<void> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) redirect("/painel");
  // Filhos primeiro (nem todas as relacoes tem onDelete: Cascade).
  await prisma.guest.deleteMany({ where: { eventId: event.id } });
  await prisma.giftItem.deleteMany({ where: { eventId: event.id } });
  await prisma.photo.deleteMany({ where: { eventId: event.id } });
  await prisma.recado.deleteMany({ where: { eventId: event.id } });
  await prisma.event.delete({ where: { id: event.id } });
  revalidatePath("/painel");
  redirect("/painel");
}

// Exclusao EM LOTE (selecao multipla em "Meus convites"). Recebe os ids,
// mantem so os que sao MESMO do dono (nunca apaga de outro tenant) e remove
// tudo de cada evento. Nao redireciona: quem chama e um client component que
// revalida a lista no lugar.
export async function excluirEventos(ids: string[]): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const uid = session.user.id;

  const alvos = Array.from(new Set(ids)).filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  if (alvos.length === 0) return;

  // Ownership: so os ids que pertencem ao profissional logado.
  const meus = await prisma.event.findMany({
    where: { id: { in: alvos }, professionalId: uid },
    select: { id: true },
  });
  const idsOk = meus.map((e) => e.id);
  if (idsOk.length === 0) return;

  const emEventos = { where: { eventId: { in: idsOk } } };
  // Filhos primeiro, depois os eventos.
  await prisma.guest.deleteMany(emEventos);
  await prisma.giftItem.deleteMany(emEventos);
  await prisma.photo.deleteMany(emEventos);
  await prisma.recado.deleteMany(emEventos);
  await prisma.giftContribution.deleteMany(emEventos);
  await prisma.transaction.deleteMany(emEventos);
  await prisma.payout.deleteMany(emEventos);
  await prisma.event.deleteMany({ where: { id: { in: idsOk } } });

  revalidatePath("/painel/convites");
  revalidatePath("/painel");
}

// ----------------------------------------------------------------------------
// Convidados (lista manual para acompanhar confirmações)
// ----------------------------------------------------------------------------

export async function adicionarConvidado(formData: FormData): Promise<void> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) redirect("/painel");
  const nome = str(formData, "name");
  if (!nome || nome.length > 140) return;
  await prisma.guest.create({
    data: { eventId: event.id, name: nome, status: "PENDING" },
  });
  revalidatePath(`/painel/${event.id}/convidados`);
}

export async function removerConvidado(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const guestId = formData.get("guestId");
  if (typeof guestId !== "string" || !guestId) return;
  // Ownership via join: o convidado precisa ser de um evento do profissional.
  await prisma.guest.deleteMany({
    where: { id: guestId, event: { professionalId: session.user.id } },
  });
  const eventId = formData.get("eventId");
  if (typeof eventId === "string" && eventId) {
    revalidatePath(`/painel/${eventId}/convidados`);
  }
}
