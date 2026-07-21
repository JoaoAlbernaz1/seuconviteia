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
import { acentoDoTema } from "@/lib/temas";
import { limiteEventos, rotuloPlano } from "@/lib/plans";
import { montarMapsUrls, brlParaCents } from "@/lib/eventoForm";

export type CriarConviteResult =
  | { ok: true; id: string; subdomain: string; host: string; url: string }
  | { ok: false; error: string };

const giftSchema = z.object({
  titulo: z.string().trim().min(1).max(140),
  descricao: z.string().trim().max(240).optional(),
  valor: z.string().trim().max(20).optional(),
});

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
  title: z.string().trim().min(2, "Informe o nome da debutante.").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida."),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido.")
    .optional(),
  local: z.string().trim().max(200).optional(),
  endereco: z.string().trim().max(320).optional(),
  traje: z.string().trim().max(120).optional(),
  slug: z.string().trim().max(80).optional(),
  mensagem: z.string().trim().max(2200).optional(),
  aberturaTitulo: z.string().trim().max(140).optional(),
  pixNome: z.string().trim().max(140).optional(),
  pixChave: z.string().trim().max(200).optional(),
  presentes: z.array(giftSchema).max(60).optional(),
  recursosOff: z.array(z.enum(RECURSO_KEYS)).max(6).optional(),
  pais: z
    .object({
      pai: z.string().trim().max(140).optional(),
      mae: z.string().trim().max(140).optional(),
      texto: z.string().trim().max(600).optional(),
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
  const proto = root.startsWith("localhost") ? "http" : "https";
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

  // Data + hora fixas em -03:00 (Brasilia) — server roda UTC.
  const eventDate = new Date(`${d.date}T${d.time || "20:00"}:00-03:00`);
  if (Number.isNaN(eventDate.getTime())) {
    return { ok: false, error: "Data ou horario invalido." };
  }
  const agora = new Date();
  const expiresAt = calcularExpiracao(eventDate);
  if (expiresAt.getTime() <= agora.getTime()) {
    return { ok: false, error: "Com essa data o site ja estaria expirado. Escolha uma data futura." };
  }

  const enderecoFull = txt(d.endereco);
  const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(txt(d.local), enderecoFull);
  const recursos = d.recursosOff?.length
    ? Object.fromEntries(d.recursosOff.map((k) => [k, false]))
    : undefined;
  const paisPreenchido =
    d.pais && (d.pais.pai?.trim() || d.pais.mae?.trim() || d.pais.texto?.trim())
      ? { pai: txt(d.pais.pai), mae: txt(d.pais.mae), texto: txt(d.pais.texto) }
      : undefined;

  // Patch do customization — os campos que o template `glamour-rose` consome.
  const patch: Record<string, unknown> = {
    tema: "rose",
    accent: acentoDoTema("rose"),
    template: "quinze-anos-glamour-rose",
    mensagem: txt(d.mensagem),
    secoes: txt(d.aberturaTitulo) ? { abertura: { titulo: txt(d.aberturaTitulo) } } : undefined,
    local: txt(d.local),
    endereco: enderecoFull,
    mapsUrl,
    mapsEmbedUrl,
    traje: txt(d.traje),
    pixNome: txt(d.pixNome),
    pixChave: txt(d.pixChave),
    recursos,
    pais: paisPreenchido,
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
        title: d.title,
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
    if (d.date < dataDeHojeSP(agora)) {
      return { ok: false, error: "A data nao pode estar no passado. Confira o ano." };
    }
    const sub = await gerarSlugUnico(d.slug || d.title, async (s) =>
      Boolean(await prisma.event.findUnique({ where: { subdomain: s } })),
    );
    const ev = await prisma.event.create({
      data: {
        professionalId,
        type: "QUINZE_ANOS",
        templateId: null,
        title: d.title,
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
  if (d.presentes) {
    await prisma.giftItem.deleteMany({ where: { eventId } });
    const itens = d.presentes.filter((g) => g.titulo.trim());
    if (itens.length) {
      await prisma.giftItem.createMany({
        data: itens.map((g) => ({
          eventId,
          title: g.titulo,
          description: txt(g.descricao) ?? null,
          priceCents: brlParaCents(g.valor ?? "") ?? 0,
          mode: "PIX" as const,
        })),
      });
    }
  }

  revalidatePath("/painel");
  const { host, url } = enderecoPublico(subdomain);
  return { ok: true, id: eventId, subdomain, host, url };
}
