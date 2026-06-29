/**
 * Adapter: mapeia um `Event` do SeuConvite IA (+ relacoes) para o shape que a
 * HOME portada do festa-15-maria-clara espera (`EventoFesta`).
 *
 * Reaproveita `lerConteudo` (lib/convite.ts) para os campos comuns (titulo, data,
 * mensagem, local, programacao, fotos, pix...) e acrescenta o que a capa "festa"
 * precisa: idade (do nicho), horario formatado, foto de capa de desktop opcional,
 * a linha do rodape e o `tema` (preset de cor).
 *
 * PURO: recebe um shape estrutural (o payload do Prisma satisfaz). A query em si
 * fica em `carregarEventoFesta` (cacheada por request).
 */
import { cache } from "react";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  lerConteudo,
  type EventoParaConteudo,
  type NichoEvento,
  type ProgramacaoItem,
} from "@/lib/convite";
import { TEMA_PADRAO } from "@/lib/temas";

export type EventoFesta = {
  /** Nome em destaque na capa / nav / rodape (event.title). */
  primeiroNome: string;
  /** Rotulo do nicho ("15 anos", "Casamento", ...). */
  nichoLabel: string;
  /** Idade comemorada, quando faz sentido (15 / 60). Senao `undefined`. */
  idade?: number;
  /** Data por extenso (pt-BR, America/Sao_Paulo). */
  data: string;
  /** Horario "20h30" / "20h" (America/Sao_Paulo). */
  horario: string;
  /** Alvo da contagem regressiva (ISO 8601). */
  dataAlvoISO: string;
  mensagemBoasVindas?: string;
  local?: string;
  endereco?: string;
  mapsLinkUrl?: string;
  traje?: string;
  programacao: ProgramacaoItem[];
  pixNome?: string;
  pixChave?: string;
  /** Foto da capa (hero) — mobile/retrato. */
  fotoUrl?: string;
  /** Foto da capa para DESKTOP (paisagem); cai para `fotoUrl` se ausente. */
  fotoDesktopUrl?: string;
  /** Album do ensaio (carrossel + galeria). */
  fotos: string[];
  /** Linha discreta do rodape: "DD . MM . AAAA · Local". */
  footerInfo: string;
  /** Preset de cor do site (chave de `lib/temas.ts`). */
  tema: string;
};

/** Idade comemorada por nicho (quando ha uma). */
const IDADE_POR_NICHO: Partial<Record<NichoEvento, number>> = {
  QUINZE_ANOS: 15,
  SESSENTA_ANOS: 60,
};

/** Campos extras do `customization` que o festa usa alem de `lerConteudo`. */
const extrasSchema = z
  .object({
    tema: z.string(),
    fotoDesktopUrl: z.string(),
  })
  .partial();

const formatadorHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const partesData = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "20:30" -> "20h30"; "20:00" -> "20h". */
function horarioBR(date: Date): string {
  const [h, m] = formatadorHora.format(date).split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

/** "DD . MM . AAAA" no fuso America/Sao_Paulo. */
function dataPontilhada(date: Date): string {
  const partes = partesData.formatToParts(date);
  const dd = partes.find((p) => p.type === "day")?.value ?? "";
  const mm = partes.find((p) => p.type === "month")?.value ?? "";
  const yyyy = partes.find((p) => p.type === "year")?.value ?? "";
  return `${dd} . ${mm} . ${yyyy}`;
}

function texto(valor: string | undefined | null): string | undefined {
  const limpo = valor?.trim();
  return limpo ? limpo : undefined;
}

/** Mapeia o evento (Prisma) para o shape da HOME festa. */
export function lerEventoFesta(event: EventoParaConteudo): EventoFesta {
  const c = lerConteudo(event);

  const extrasParsed = extrasSchema.safeParse(event.customization);
  const extras = extrasParsed.success ? extrasParsed.data : {};

  const idade = IDADE_POR_NICHO[event.type as NichoEvento];

  const footerLocal = c.local ? ` · ${c.local}` : "";

  return {
    primeiroNome: c.titulo,
    nichoLabel: c.nichoLabel,
    idade,
    data: c.dataLabel,
    horario: horarioBR(event.eventDate),
    dataAlvoISO: c.dataISO,
    mensagemBoasVindas: c.mensagem,
    local: c.local,
    endereco: c.endereco,
    mapsLinkUrl: c.mapsUrl,
    traje: c.traje,
    programacao: c.programacao,
    pixNome: c.pixNome,
    pixChave: c.pixChave,
    fotoUrl: c.fotoUrl,
    fotoDesktopUrl: texto(extras.fotoDesktopUrl) ?? c.fotoUrl,
    fotos: c.fotos,
    footerInfo: `${dataPontilhada(event.eventDate)}${footerLocal}`,
    tema: texto(extras.tema) ?? TEMA_PADRAO,
  };
}

/**
 * Carrega o Event do subdominio (+ relacoes usadas pela home). Cacheado por
 * request (React `cache`) para o layout e a page compartilharem a mesma query.
 */
export const carregarEventoFesta = cache(async (sub: string) => {
  return prisma.event.findUnique({
    where: { subdomain: sub },
    include: { professional: true, template: true, gifts: true, photos: true },
  });
});
