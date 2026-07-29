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
  type PresenteItem,
  type ProgramacaoItem,
} from "@/lib/convite";
import { TEMA_PADRAO } from "@/lib/temas";
import { lerTemplateId } from "@/lib/templates";
import { lerSecoes, type SecoesConvite } from "@/lib/secoes";

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
  /** Linha de abertura do convite (ex.: "Os pais de X convidam você..."). */
  conviteIntro?: string;
  /** Assinatura da carta (ex.: "Adalberto, Ivânia e Maria Clara"). */
  assinatura?: string;
  local?: string;
  endereco?: string;
  /** Link "Abrir no Google Maps" (texto). */
  mapsLinkUrl?: string;
  /** URL de embed do Google Maps (`?output=embed`) — alimenta o <iframe> da /evento. */
  mapsEmbedUrl?: string;
  traje?: string;
  programacao: ProgramacaoItem[];
  pixNome?: string;
  pixChave?: string;
  /** QR do Pix (opcional) — so aparece se preenchido. */
  pixQrUrl?: string;
  /** Itens da lista de presentes (gifts do evento; Pix direto, sem checkout). */
  presentes: PresenteItem[];
  /** Foto da capa (hero) — mobile/retrato. */
  fotoUrl?: string;
  /** Foto da capa para DESKTOP (paisagem); cai para `fotoUrl` se ausente. */
  fotoDesktopUrl?: string;
  /** Foto ao lado da lista de presentes (editavel; cai para a capa/album). */
  presentesFotoUrl?: string;
  /** Texto de abertura da lista de presentes (editavel; a page tem o padrao). */
  presentesTexto?: string;
  /** Album do ensaio (carrossel + galeria). */
  fotos: string[];
  /** Linha discreta do rodape: "DD . MM . AAAA · Local". */
  footerInfo: string;
  /** Monograma/logo do evento (opcional; a nav usa as iniciais do nome se ausente). */
  logoUrl?: string;
  /** Mostrar o monograma na barra do site (default: true). */
  monograma: boolean;
  /** Animações de entrada ao carregar a página (default: true). */
  animacoes: boolean;
  /** Preset de cor do site (chave de `lib/temas.ts`). */
  tema: string;
  /** Multiplicador do tamanho do lockup da capa (1 = padrão). */
  capaEscala: number;
  /** Escurecer a foto da capa para melhorar a leitura (default: não). */
  capaOverlay: boolean;
  /** Id do template de DESIGN do site (chave de `lib/templates.ts`). */
  templateId: string;
  /** Copy editavel das secoes (cliente -> default do nicho). */
  secoes: SecoesConvite;
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
    logoUrl: z.string(),
    /** Idade comemorada, editável (sobrepõe o padrão do nicho). */
    idade: z.coerce.number().int().min(1).max(120),
    /** Mostrar o monograma/logo na barra (default: mostra). */
    monograma: z.boolean(),
    /** Animações de entrada do site ao carregar (default: ligadas). */
    animacoes: z.boolean(),
    conviteIntro: z.string(),
    assinatura: z.string(),
    cidade: z.string(),
    fotoDesktopUrl: z.string(),
    presentesFotoUrl: z.string(),
    presentesTexto: z.string(),
    mapsEmbedUrl: z.string(),
    pixQrUrl: z.string(),
    /** Multiplicador do tamanho do lockup da capa (0.9 / 1 / 1.15). */
    capaEscala: z.coerce.number().min(0.5).max(2),
    /** Escurecer a foto da capa p/ melhorar a leitura. */
    capaOverlay: z.boolean(),
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

  // Idade: valor editável do cliente (extras.idade) tem prioridade sobre o
  // padrão do nicho (15 p/ quinze anos). Assim dá pra comemorar outra idade.
  const idade = extras.idade ?? IDADE_POR_NICHO[event.type as NichoEvento];

  // Rodapé: "DD . MM . AAAA · Local · Cidade" (partes vazias somem).
  const footerInfo = [dataPontilhada(event.eventDate), c.local, texto(extras.cidade)]
    .filter(Boolean)
    .join(" · ");

  return {
    primeiroNome: c.titulo,
    nichoLabel: c.nichoLabel,
    idade,
    data: c.dataLabel,
    horario: horarioBR(event.eventDate),
    dataAlvoISO: c.dataISO,
    mensagemBoasVindas: c.mensagem,
    conviteIntro: texto(extras.conviteIntro),
    assinatura: texto(extras.assinatura),
    local: c.local,
    endereco: c.endereco,
    mapsLinkUrl: c.mapsUrl,
    mapsEmbedUrl: texto(extras.mapsEmbedUrl),
    traje: c.traje,
    programacao: c.programacao,
    pixNome: c.pixNome,
    pixChave: c.pixChave,
    pixQrUrl: texto(extras.pixQrUrl),
    presentes: c.presentes,
    fotoUrl: c.fotoUrl,
    fotoDesktopUrl: texto(extras.fotoDesktopUrl) ?? c.fotoUrl,
    presentesFotoUrl: texto(extras.presentesFotoUrl) ?? c.fotoUrl ?? c.fotos[0],
    presentesTexto: texto(extras.presentesTexto),
    fotos: c.fotos,
    footerInfo,
    logoUrl: texto(extras.logoUrl),
    monograma: extras.monograma ?? true,
    animacoes: extras.animacoes ?? true,
    tema: texto(extras.tema) ?? TEMA_PADRAO,
    capaEscala: extras.capaEscala ?? 1,
    capaOverlay: extras.capaOverlay ?? false,
    templateId: lerTemplateId(event.customization),
    secoes: lerSecoes(event.customization, event.type),
  };
}

/**
 * Carrega o Event do subdominio (+ relacoes usadas pela home). Cacheado por
 * request (React `cache`) para o layout e a page compartilharem a mesma query.
 */
export const carregarEventoFesta = cache(async (sub: string) => {
  return prisma.event.findUnique({
    where: { subdomain: sub },
    include: { professional: true, template: true, gifts: { orderBy: { id: "asc" } }, photos: true },
  });
});
