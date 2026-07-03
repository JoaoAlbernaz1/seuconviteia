/**
 * Preview AO VIVO do editor — transforma o RASCUNHO do formulario (serializado
 * na query `?s=` do iframe) num evento sintetico com o MESMO shape que o site
 * publico consome (`EventoParaConteudo` -> `lerEventoFesta`).
 *
 * E assim que o preview mostra EXATAMENTE o que vai publicar: ele passa pelo
 * mesmo adapter e renderiza os mesmos componentes de pagina do site.
 *
 * Regras:
 *  - Tolerante: o rascunho chega incompleto o tempo todo (usuario digitando).
 *    Nada aqui lanca; campo invalido e simplesmente ignorado.
 *  - Validado com Zod (entrada externa via URL) com limites de tamanho.
 */
import { z } from "zod";
import type { EventoParaConteudo } from "./convite";
import { brlParaCents, montarMapsUrls, semUndefined } from "./eventoForm";
import type { RecursoSite } from "./recursos";

const urlish = z
  .string()
  .max(500)
  .refine((v) => v.startsWith("/") || /^https?:\/\//i.test(v), "URL invalida");

const rascunhoSchema = z
  .object({
    type: z.string().max(40),
    tema: z.string().max(40),
    fontes: z.string().max(40),
    title: z.string().max(140),
    date: z.string().max(10),
    time: z.string().max(5),
    mensagem: z.string().max(2200),
    presentesTexto: z.string().max(600),
    local: z.string().max(220),
    endereco: z.string().max(320),
    traje: z.string().max(140),
    programacao: z
      .array(z.object({ hora: z.string().max(20), titulo: z.string().max(140) }))
      .max(30),
    presentes: z
      .array(
        z.object({
          titulo: z.string().max(140),
          descricao: z.string().max(240).optional(),
          valor: z.string().max(20).optional(),
        }),
      )
      .max(60),
    fotoUrl: urlish,
    presentesFotoUrl: urlish,
    fotos: z.array(urlish).max(40),
    recursosOff: z.array(z.string().max(20)).max(10),
  })
  .partial();

export type RascunhoPreview = z.infer<typeof rascunhoSchema>;

/** Parse tolerante do `?s=` (JSON). Qualquer coisa invalida vira `{}`. */
export function lerRascunho(s: string | undefined): RascunhoPreview {
  if (!s) return {};
  try {
    const parsed = rascunhoSchema.safeParse(JSON.parse(s));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function texto(v: string | undefined): string | undefined {
  const limpo = v?.trim();
  return limpo ? limpo : undefined;
}

/**
 * Monta o evento sintetico do rascunho, no shape que `lerEventoFesta` espera —
 * o `customization` e construido do MESMO jeito que a server action grava.
 * Sem data valida, cai num alvo futuro (contador vivo no preview).
 */
export function eventoDoRascunho(r: RascunhoPreview): EventoParaConteudo {
  let eventDate = new Date(`${r.date}T${r.time || "20:00"}:00-03:00`);
  if (!r.date || Number.isNaN(eventDate.getTime())) {
    eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const local = texto(r.local);
  const endereco = texto(r.endereco);
  const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(local, endereco);

  const programacao = (r.programacao ?? []).filter(
    (p) => p.hora.trim() || p.titulo.trim(),
  );

  const recursos =
    r.recursosOff && r.recursosOff.length
      ? Object.fromEntries(r.recursosOff.map((k) => [k as RecursoSite, false]))
      : undefined;

  const customization = semUndefined({
    tema: texto(r.tema),
    fontes: texto(r.fontes),
    recursos,
    mensagem: texto(r.mensagem),
    presentesTexto: texto(r.presentesTexto),
    local,
    endereco,
    mapsUrl,
    mapsEmbedUrl,
    traje: texto(r.traje),
    programacao: programacao.length ? programacao : undefined,
    fotoUrl: texto(r.fotoUrl),
    presentesFotoUrl: texto(r.presentesFotoUrl),
  });

  return {
    title: texto(r.title) ?? "Nome do evento",
    type: texto(r.type) ?? "QUINZE_ANOS",
    eventDate,
    customization,
    gifts: (r.presentes ?? [])
      .filter((g) => g.titulo.trim())
      .map((g) => ({
        title: g.titulo,
        description: texto(g.descricao) ?? null,
        priceCents: brlParaCents(g.valor ?? "") ?? 0,
      })),
    photos: (r.fotos ?? []).map((url, i) => ({ url, order: i })),
  };
}
