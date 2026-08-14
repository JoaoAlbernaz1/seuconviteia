"use server";

/**
 * Server action do editor guiado "Criar convite" (`CriarConvite.tsx`).
 *
 * O editor ate aqui era 100% LOCAL (o "Publicar" so abria um modal). Esta acao
 * liga os 6 passos ao banco: recebe o payload serializado do editor, monta o
 * `Event` + `customization` do MESMO jeito que as acoes por-tela (`acoes.ts`)
 * gravam, e cria OU atualiza (idempotente por `id`) — como rascunho (DRAFT) ou
 * ja publicado (PUBLISHED, sai no subdominio).
 *
 * Regras herdadas de `acoes.ts`:
 *  - Zod na borda; tenant SEMPRE da sessao; ownership revalidado.
 *  - Data em -03:00 (Brasilia). Slug unico. Limite de eventos por plano.
 *  - Nicho fixo = 15 anos, template = `quinze-anos-glamour-rose` (Maria Clara);
 *    cor `rose` + fontes `classica` (padrao). Outras opcoes ficam para U5+.
 */
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { gerarSlugUnico } from "@/lib/slug";
import { calcularExpiracao, dataDeHojeSP } from "@/lib/dates";
import { acentoDoTema, TEMAS } from "@/lib/temas";
import { FONTES, FONTE_HEADS, FONTE_CORPOS } from "@/lib/fontes";
import { limiteEventos, podeVitrine, rotuloPlano } from "@/lib/plans";
import { montarMapsUrls, brlParaCents } from "@/lib/eventoForm";
import { protocoloDe } from "@/lib/tenant";
import { EventEditorDocumentSchema } from "@/lib/event-editor/schema";
import type { EventEditorDocument } from "@/lib/event-editor/document";
import { documentToLegacyCustomization } from "@/lib/event-editor/legacy";

export type CriarConviteResult =
  | { ok: true; id: string; subdomain: string; host: string; url: string }
  | { ok: false; error: string };

export type SalvarDocumentoResult =
  | { ok: true; id: string; version: number; savedAt: string; host: string; url: string }
  | { ok: false; kind: "conflict"; currentVersion: number; error: string }
  | { ok: false; kind: "validation" | "auth" | "not_found" | "limit" | "server"; error: string };

export type PublicarDocumentoResult =
  | { ok: true; id: string; publishedVersion: number; publishedAt: string; host: string; url: string }
  | { ok: false; kind: "conflict"; currentVersion: number; error: string }
  | { ok: false; kind: "validation" | "auth" | "not_found" | "server"; error: string };

const giftSchema = z.object({
  titulo: z.string().trim().min(1).max(140),
  descricao: z.string().trim().max(240).optional(),
  valor: z.string().trim().max(20).optional(),
  modo: z.enum(["FIXO", "COTAS", "LIVRE"]).optional(),
  cotas: z.coerce.number().int().min(2).max(1000).optional(),
  // Presente tipo LINK (loja externa): link + foto (mode=ITEM no banco).
  tipo: z.enum(["PIX", "LINK"]).optional(),
  link: z.string().trim().max(2000).optional(),
  foto: z.string().trim().max(2000).optional(),
});

/**
 * `customization.secoes` — so a copy que o cliente MUDOU (o resto cai no default
 * do nicho em `lib/textos.ts`). Vazio -> `undefined`, pra nao sujar o JSON.
 */
function montarSecoes(d: {
  aberturaTitulo?: string;
  recadosEyebrow?: string;
  recadosTitulo?: string;
  recadosConvite?: string;
  recadosMural?: string;
}) {
  const recados: Record<string, string> = {};
  if (d.recadosEyebrow?.trim()) recados.eyebrow = d.recadosEyebrow.trim();
  if (d.recadosTitulo?.trim()) recados.titulo = d.recadosTitulo.trim();
  if (d.recadosConvite?.trim()) recados.convite = d.recadosConvite.trim();
  if (d.recadosMural?.trim()) recados.muralTitulo = d.recadosMural.trim();

  const out: Record<string, unknown> = {};
  if (d.aberturaTitulo?.trim()) out.abertura = { titulo: d.aberturaTitulo.trim() };
  if (Object.keys(recados).length) out.recados = recados;
  return Object.keys(out).length ? out : undefined;
}

const RECURSO_KEYS = [
  "rsvp",
  "presentes",
  "galeria",
  "recados",
  "contador",
  "programacao",
] as const;

const payloadSchema = z.object({
  /** Presente => atualiza o evento existente; ausente => cria um novo. */
  id: z.string().max(40).optional(),
  // Rascunho (autosave) grava incompleto; o rigor fica no PUBLICAR (ver abaixo).
  title: z.string().trim().max(120).optional(),
  date: z.string().max(10).optional(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido.")
    .optional(),
  local: z.string().trim().max(200).optional(),
  endereco: z.string().trim().max(320).optional(),
  traje: z.string().trim().max(120).optional(),
  slug: z.string().trim().max(80).optional(),
  /** Foto da capa — caminho interno (`/uploads/...` no dev, URL do Blob em prod). */
  fotoUrl: z.string().trim().max(400).optional(),
  /** Foto da capa para DESKTOP (paisagem); vazia = usa a do celular. */
  fotoDesktopUrl: z.string().trim().max(400).optional(),
  /** Idade comemorada (editável; sobrepõe o padrão do nicho). */
  idade: z.coerce.number().int().min(1).max(120).optional(),
  /** Monograma na barra: mostrar? + imagem opcional do monograma. */
  monograma: z.boolean().optional(),
  logoUrl: z.string().trim().max(400).optional(),
  /** Animações de entrada do site ao carregar. */
  animacoes: z.boolean().optional(),
  negrito: z.boolean().optional(),
  /** Preset de cor do site (chave de lib/temas, ou "custom"; validado no server). */
  tema: z.string().trim().max(20).optional(),
  /** Cor personalizada (hex) quando tema === "custom". */
  temaCor: z.string().trim().max(9).optional(),
  /** Estilo de letras (chave de lib/fontes; validado no server). */
  fontes: z.string().trim().max(20).optional(),
  /** Combinação de fontes personalizada (Premium): cabeça + corpo. */
  fontesCustom: z
    .object({ head: z.string().trim().max(40), corpo: z.string().trim().max(40) })
    .optional(),
  /** Multiplicador do tamanho do lockup da capa (0.9 / 1 / 1.15). */
  capaEscala: z.coerce.number().min(0.5).max(2).optional(),
  /** Escurecer a foto da capa p/ melhorar a leitura. */
  capaOverlay: z.boolean().optional(),
  /** Botão principal (CTA): rótulo, destino (rota interna) e linha acima. */
  ctaLabel: z.string().trim().max(120).optional(),
  ctaHref: z.enum(["/confirmar", "/evento", "/presentes"]).optional(),
  ctaLead: z.string().trim().max(200).optional(),
  /** Frase de fecho do rodapé (editável). */
  rodapeMsg: z.string().trim().max(240).optional(),
  mensagem: z.string().trim().max(2200).optional(),
  aberturaTitulo: z.string().trim().max(140).optional(),
  recadosEyebrow: z.string().trim().max(60).optional(),
  recadosTitulo: z.string().trim().max(80).optional(),
  recadosConvite: z.string().trim().max(220).optional(),
  recadosMural: z.string().trim().max(80).optional(),
  pixNome: z.string().trim().max(140).optional(),
  pixChave: z.string().trim().max(200).optional(),
  presentesTexto: z.string().trim().max(600).optional(),
  listaModelo: z.enum(["painel", "vitrine"]).optional(),
  programacao: z
    .array(z.object({ hora: z.string().trim().max(20), titulo: z.string().trim().max(140) }))
    .max(30)
    .optional(),
  presentes: z.array(giftSchema).max(60).optional(),
  recursosOff: z.array(z.enum(RECURSO_KEYS)).max(6).optional(),
  pais: z
    .object({
      pai: z.string().trim().max(140).optional(),
      mae: z.string().trim().max(140).optional(),
      texto: z.string().trim().max(600).optional(),
    })
    .optional(),
  /** Config do formulário de confirmação (RSVP). */
  rsvpConfig: z
    .object({
      permitirAcompanhantes: z.boolean().optional(),
      pedirNomeAcompanhantes: z.boolean().optional(),
      maxAcompanhantes: z.coerce.number().int().min(0).max(20).optional(),
      pedirTelefone: z.boolean().optional(),
      pedirEmail: z.boolean().optional(),
      pedirRestricao: z.boolean().optional(),
      permitirRecado: z.boolean().optional(),
      corBotao: z.string().trim().max(9).optional(),
      dataLimite: z.string().trim().max(20).optional(),
      msgConfirma: z.string().trim().max(400).optional(),
      msgRecusa: z.string().trim().max(400).optional(),
    })
    .optional(),
});

export type CriarConvitePayload = z.input<typeof payloadSchema>;

/** MERGE no customization (igual `acoes.ts`): `undefined` remove a chave. */
function mesclar(
  atual: unknown,
  patch: Record<string, unknown>,
): Prisma.InputJsonValue {
  const base: Record<string, unknown> =
    atual && typeof atual === "object" && !Array.isArray(atual)
      ? { ...(atual as Record<string, unknown>) }
      : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete base[k];
    else base[k] = v;
  }
  return base as Prisma.InputJsonValue;
}

/** Texto limpo -> `undefined` quando vazio. */
function txt(v: string | undefined): string | undefined {
  const s = v?.trim();
  return s ? s : undefined;
}

/** Host + URL publicos do subdominio (mesma regra de `_carregar.ts`). */
function enderecoPublico(subdomain: string): { host: string; url: string } {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const host = `${subdomain}.${root.replace(/:\d+$/, "")}`;
  const proto = protocoloDe(root);
  return { host, url: `${proto}://${subdomain}.${root}` };
}

/**
 * Cria (ou atualiza, se `id`) o convite a partir do editor. `publicar=true`
 * marca PUBLISHED (site no ar); senao fica DRAFT (rascunho). Nunca lanca —
 * devolve `{ ok:false, error }` para o editor mostrar.
 */
export async function criarConvite(
  input: unknown,
  publicar: boolean,
): Promise<CriarConviteResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sua sessao expirou. Entre de novo." };
  const professionalId = session.user.id;

  const prof = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { plan: true },
  });
  if (!prof) return { ok: false, error: "Conta nao encontrada." };

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos do convite." };
  }
  const d = parsed.data;

  // Nome + data só são OBRIGATÓRIOS para PUBLICAR. No rascunho (autosave) valem
  // placeholders — assim nunca se perde o trabalho com o convite incompleto.
  const titulo = txt(d.title);
  const dateOk = !!d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date);
  if (publicar && (!titulo || titulo.length < 2)) {
    return { ok: false, error: "Informe o nome da debutante." };
  }
  if (publicar && !dateOk) {
    return { ok: false, error: "Informe uma data valida." };
  }

  // Data + hora fixas em -03:00 (Brasilia) — server roda UTC. Sem data válida
  // (rascunho), usa um alvo futuro provisório (só vai pro ar ao PUBLICAR).
  const agora = new Date();
  const eventDate = dateOk
    ? new Date(`${d.date}T${d.time || "20:00"}:00-03:00`)
    : new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(eventDate.getTime())) {
    return { ok: false, error: "Data ou horario invalido." };
  }
  const expiresAt = calcularExpiracao(eventDate);
  if (publicar && expiresAt.getTime() <= agora.getTime()) {
    return { ok: false, error: "Com essa data o site ja estaria expirado. Escolha uma data futura." };
  }

  const enderecoFull = txt(d.endereco);
  const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(txt(d.local), enderecoFull);
  const recursos = d.recursosOff?.length
    ? Object.fromEntries(d.recursosOff.map((k) => [k, false]))
    : undefined;
  // Só os NOMES (a caixa "Pais e família" virou só assinatura; o texto de
  // apresentação foi removido). Salvar substitui o objeto pais inteiro, então
  // um `texto` antigo de rascunho some sozinho.
  const paisPreenchido =
    d.pais && (d.pais.pai?.trim() || d.pais.mae?.trim())
      ? { pai: txt(d.pais.pai), mae: txt(d.pais.mae) }
      : undefined;

  // Paleta escolhida: preset conhecido, ou "custom" (+ cor hex válida), senão "rose".
  const corCustom =
    d.temaCor && /^#[0-9a-fA-F]{6}$/.test(d.temaCor) ? d.temaCor : undefined;
  const tema =
    d.tema === "custom" && corCustom
      ? "custom"
      : d.tema && d.tema in TEMAS
        ? d.tema
        : "rose";
  // Estilo de letras (validado contra as duplas; cai p/ "classica" se desconhecido).
  const fontes = d.fontes && d.fontes in FONTES ? d.fontes : "classica";
  // Combinação personalizada de fontes: SÓ no plano PREMIUM (o mais caro) e com
  // cabeça+corpo válidos; senão não grava (usa a dupla `fontes`).
  const fontesCustom =
    prof.plan === "PREMIUM" &&
    d.fontesCustom &&
    d.fontesCustom.head in FONTE_HEADS &&
    d.fontesCustom.corpo in FONTE_CORPOS
      ? { head: d.fontesCustom.head, corpo: d.fontesCustom.corpo }
      : undefined;

  // Patch do customization — os campos que o template `glamour-rose` consome.
  const patch: Record<string, unknown> = {
    tema,
    temaCor: tema === "custom" ? corCustom : undefined,
    fontes,
    fontesCustom,
    accent: acentoDoTema(tema, corCustom),
    template: "quinze-anos-glamour-rose",
    fotoUrl: txt(d.fotoUrl),
    fotoDesktopUrl: txt(d.fotoDesktopUrl),
    idade: d.idade,
    monograma: d.monograma,
    animacoes: d.animacoes,
    negrito: d.negrito,
    logoUrl: txt(d.logoUrl),
    capaEscala: d.capaEscala,
    capaOverlay: d.capaOverlay,
    ctaLabel: txt(d.ctaLabel),
    ctaHref: d.ctaHref,
    ctaLead: txt(d.ctaLead),
    rodapeMsg: txt(d.rodapeMsg),
    mensagem: txt(d.mensagem),
    secoes: montarSecoes(d),
    local: txt(d.local),
    endereco: enderecoFull,
    mapsUrl,
    mapsEmbedUrl,
    traje: txt(d.traje),
    pixNome: txt(d.pixNome),
    pixChave: txt(d.pixChave),
    presentesTexto: txt(d.presentesTexto),
    listaModelo: podeVitrine(prof.plan) ? d.listaModelo ?? "painel" : "painel",
    programacao: (() => {
      const p = (d.programacao ?? []).filter((x) => x.hora.trim() || x.titulo.trim());
      return p.length ? p : undefined;
    })(),
    recursos,
    pais: paisPreenchido,
    rsvpConfig: d.rsvpConfig,
  };

  let eventId: string;
  let subdomain: string;

  if (d.id) {
    // ── Atualiza um convite existente (do dono) ──────────────────────────────
    const owned = await prisma.event.findFirst({
      where: { id: d.id, professionalId },
    });
    if (!owned) return { ok: false, error: "Convite nao encontrado." };
    const ev = await prisma.event.update({
      where: { id: owned.id },
      data: {
        title: titulo ?? owned.title,
        eventDate,
        expiresAt,
        status: publicar ? "PUBLISHED" : owned.status,
        customization: mesclar(owned.customization, patch),
      },
    });
    eventId = ev.id;
    subdomain = ev.subdomain;
  } else {
    // ── Cria um convite novo ─────────────────────────────────────────────────
    const limite = limiteEventos(prof.plan);
    if (limite !== null) {
      const existentes = await prisma.event.count({ where: { professionalId } });
      if (existentes >= limite) {
        return {
          ok: false,
          error: `O plano ${rotuloPlano(prof.plan)} inclui ate ${limite} convite(s). Exclua um que nao usa mais ou faca upgrade em Plano.`,
        };
      }
    }
    if (publicar && d.date && d.date < dataDeHojeSP(agora)) {
      return { ok: false, error: "A data nao pode estar no passado. Confira o ano." };
    }
    const sub = await gerarSlugUnico(d.slug || titulo || "convite", async (s) =>
      Boolean(await prisma.event.findUnique({ where: { subdomain: s } })),
    );
    const ev = await prisma.event.create({
      data: {
        professionalId,
        type: "QUINZE_ANOS",
        templateId: null,
        title: titulo ?? "Convite sem título",
        subdomain: sub,
        eventDate,
        expiresAt,
        status: publicar ? "PUBLISHED" : "DRAFT",
        plan: prof.plan,
        customization: mesclar({}, patch),
      },
    });
    eventId = ev.id;
    subdomain = ev.subdomain;
  }

  // Lista de presentes (substitui a lista inteira quando enviada).
  // PROTEÇÃO DO LEDGER: se o evento já recebeu contribuições, NÃO reescreve a
  // lista — o `deleteMany` cascatearia (onDelete: Cascade) e apagaria as
  // contribuições/histórico. Edição de presentes com histórico vem depois.
  if (d.presentes) {
    const temContrib = await prisma.giftContribution.count({ where: { eventId } });
    if (temContrib === 0) {
      await prisma.giftItem.deleteMany({ where: { eventId } });
      const itens = d.presentes.filter((g) => g.titulo.trim());
      if (itens.length) {
        await prisma.giftItem.createMany({
          data: itens.map((g) => {
            const cents = brlParaCents(g.valor ?? "") ?? 0;
            const ehCota = g.modo === "COTAS" && !!g.cotas && cents > 0;
            // Valor único SEM preço não pode existir (checkout quebra): vira valor livre.
            const pricingMode = ehCota ? "COTAS" : cents > 0 ? "FIXO" : "LIVRE";
            return {
              eventId,
              title: g.titulo,
              description: txt(g.descricao) ?? null,
              priceCents: cents,
              mode: "PIX" as const,
              pricingMode: pricingMode as "FIXO" | "COTAS" | "LIVRE",
              quotaCount: ehCota ? (g.cotas ?? null) : null,
              storeUrl: null,
              imageUrl: txt(g.foto) ?? null,
            };
          }),
        });
      }
    }
  }

  revalidatePath("/painel");
  const { host, url } = enderecoPublico(subdomain);
  return { ok: true, id: eventId, subdomain, host, url };
}

const salvarDocumentoSchema = z.object({
  id: z.string().max(40).optional(),
  expectedVersion: z.number().int().min(0),
  document: EventEditorDocumentSchema,
});

const publicarDocumentoSchema = z.object({
  id: z.string().max(40),
  expectedDraftVersion: z.number().int().min(0),
});

function dataDoDocumento(document: EventEditorDocument): Date {
  const candidate = new Date(`${document.schedule.date}T${document.schedule.time || "20:00"}:00-03:00`);
  return document.schedule.date && !Number.isNaN(candidate.getTime())
    ? candidate
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function jsonDoDocumento(document: EventEditorDocument): Prisma.InputJsonValue {
  return document as unknown as Prisma.InputJsonValue;
}

async function sincronizarPresentesDoDocumento(eventId: string, document: EventEditorDocument): Promise<void> {
  const contributions = await prisma.giftContribution.count({ where: { eventId } });
  if (contributions > 0) return;

  const current = await prisma.giftItem.findMany({ where: { eventId }, select: { id: true } });
  const currentIds = new Set(current.map((gift) => gift.id));
  const incomingIds = new Set(document.gifts.items.map((gift) => gift.id).filter(Boolean));

  for (const gift of document.gifts.items) {
    const cents = brlParaCents(gift.value) ?? 0;
    const pricingMode = gift.pricingMode === "COTAS" && gift.quotas && cents > 0 ? "COTAS" : cents > 0 ? "FIXO" : "LIVRE";
    const data = {
      title: gift.title,
      description: gift.description || null,
      imageUrl: gift.imageUrl || null,
      priceCents: cents,
      mode: "PIX" as const,
      pricingMode: pricingMode as "FIXO" | "COTAS" | "LIVRE",
      quotaCount: pricingMode === "COTAS" ? gift.quotas ?? null : null,
    };
    if (gift.id && currentIds.has(gift.id)) {
      await prisma.giftItem.update({ where: { id: gift.id }, data });
    } else {
      await prisma.giftItem.create({ data: { ...(gift.id ? { id: gift.id } : {}), eventId, ...data } });
    }
  }

  const removed = current.filter((gift) => !incomingIds.has(gift.id)).map((gift) => gift.id);
  if (removed.length) await prisma.giftItem.deleteMany({ where: { eventId, id: { in: removed } } });
}

/**
 * Salva exclusivamente o documento canônico. A condição `draftVersion =
 * expectedVersion` torna a atualização atômica: duas abas não podem vencer com a
 * mesma versão. O retorno nunca substitui o documento local do cliente.
 */
export async function salvarDocumentoConvite(input: unknown): Promise<SalvarDocumentoResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, kind: "auth", error: "Sua sessão expirou. Entre de novo." };
  const parsed = salvarDocumentoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: "validation", error: parsed.error.issues[0]?.message ?? "Documento inválido." };

  const { id, expectedVersion, document } = parsed.data;
  const professionalId = session.user.id;
  const professional = await prisma.professional.findUnique({ where: { id: professionalId }, select: { plan: true } });
  if (!professional) return { ok: false, kind: "auth", error: "Conta não encontrada." };

  const eventDate = dataDoDocumento(document);
  const expiresAt = calcularExpiracao(eventDate);
  const customization = documentToLegacyCustomization(document) as Prisma.InputJsonValue;
  const savedAt = new Date();

  if (!id) {
    if (expectedVersion !== 0) return { ok: false, kind: "conflict", currentVersion: 0, error: "O rascunho mudou. Recarregue antes de salvar." };
    const limit = limiteEventos(professional.plan);
    if (limit !== null) {
      const count = await prisma.event.count({ where: { professionalId } });
      if (count >= limit) return { ok: false, kind: "limit", error: `O plano ${rotuloPlano(professional.plan)} inclui até ${limit} convite(s).` };
    }
    const subdomain = await gerarSlugUnico(document.basic.slug || document.basic.name || "convite", async (slug) =>
      Boolean(await prisma.event.findUnique({ where: { subdomain: slug } })),
    );
    const event = await prisma.event.create({
      data: {
        professionalId,
        type: "QUINZE_ANOS",
        templateId: null,
        title: document.basic.name || "Convite sem título",
        subdomain,
        eventDate,
        expiresAt,
        status: "DRAFT",
        plan: professional.plan,
        customization,
        draftData: jsonDoDocumento(document),
        draftVersion: 1,
        schemaVersion: document.schemaVersion,
      },
    });
    await sincronizarPresentesDoDocumento(event.id, document);
    const address = enderecoPublico(event.subdomain);
    return { ok: true, id: event.id, version: 1, savedAt: savedAt.toISOString(), ...address };
  }

  const owned = await prisma.event.findFirst({ where: { id, professionalId }, select: { id: true, subdomain: true, draftVersion: true } });
  if (!owned) return { ok: false, kind: "not_found", error: "Convite não encontrado." };
  if (owned.draftVersion !== expectedVersion) {
    return { ok: false, kind: "conflict", currentVersion: owned.draftVersion, error: "Este convite foi alterado em outra aba. Recarregue para continuar." };
  }

  const updated = await prisma.event.updateMany({
    where: { id, professionalId, draftVersion: expectedVersion },
    data: {
      title: document.basic.name || "Convite sem título",
      eventDate,
      expiresAt,
      customization,
      draftData: jsonDoDocumento(document),
      draftVersion: { increment: 1 },
      schemaVersion: document.schemaVersion,
    },
  });
  if (updated.count !== 1) {
    const current = await prisma.event.findFirst({ where: { id, professionalId }, select: { draftVersion: true } });
    return { ok: false, kind: "conflict", currentVersion: current?.draftVersion ?? expectedVersion, error: "Este convite foi alterado em outra aba. Recarregue para continuar." };
  }
  await sincronizarPresentesDoDocumento(id, document);
  revalidatePath("/painel");
  const address = enderecoPublico(owned.subdomain);
  return { ok: true, id, version: expectedVersion + 1, savedAt: savedAt.toISOString(), ...address };
}

/** Publica um snapshot imutável do rascunho que possui a versão esperada. */
export async function publicarDocumentoConvite(input: unknown): Promise<PublicarDocumentoResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, kind: "auth", error: "Sua sessão expirou. Entre de novo." };
  const parsed = publicarDocumentoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: "validation", error: parsed.error.issues[0]?.message ?? "Publicação inválida." };
  const { id, expectedDraftVersion } = parsed.data;
  const professionalId = session.user.id;
  const event = await prisma.event.findFirst({
    where: { id, professionalId },
    select: { id: true, subdomain: true, draftData: true, draftVersion: true },
  });
  if (!event) return { ok: false, kind: "not_found", error: "Convite não encontrado." };
  if (event.draftVersion !== expectedDraftVersion) {
    return { ok: false, kind: "conflict", currentVersion: event.draftVersion, error: "Existem alterações mais novas. Salve antes de publicar." };
  }
  const document = EventEditorDocumentSchema.safeParse(event.draftData);
  if (!document.success) return { ok: false, kind: "validation", error: "O rascunho precisa ser revisado antes de publicar." };

  const publishedAt = new Date();
  const updated = await prisma.event.updateMany({
    where: { id, professionalId, draftVersion: expectedDraftVersion },
    data: {
      status: "PUBLISHED",
      publishedData: jsonDoDocumento(document.data),
      publishedVersion: expectedDraftVersion,
      publishedAt,
      schemaVersion: document.data.schemaVersion,
    },
  });
  if (updated.count !== 1) {
    const current = await prisma.event.findFirst({ where: { id, professionalId }, select: { draftVersion: true } });
    return { ok: false, kind: "conflict", currentVersion: current?.draftVersion ?? expectedDraftVersion, error: "Existem alterações mais novas. Salve antes de publicar." };
  }
  revalidatePath("/painel");
  const address = enderecoPublico(event.subdomain);
  return { ok: true, id, publishedVersion: expectedDraftVersion, publishedAt: publishedAt.toISOString(), ...address };
}
