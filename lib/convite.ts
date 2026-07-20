/**
 * Normaliza o conteudo de um Event (campos + JSON `customization`) num objeto
 * tipado, puro e testavel que alimenta o `<Convite>` (site publico do evento).
 *
 * Decisoes:
 *  - PURO e desacoplado do banco: recebe um shape estrutural (`EventoParaConteudo`)
 *    que o payload do Prisma satisfaz, em vez de importar o tipo gerado. Mesmo
 *    padrao de `lib/event.ts`.
 *  - `customization` e Json externo (pode estar malformado): validado com Zod
 *    (`.safeParse`), caindo para `{}` se invalido — nunca quebra a renderizacao.
 *  - Campos vazios viram `undefined` (a secao correspondente some sozinha no
 *    componente). Arrays sempre presentes (possivelmente vazios).
 */
import { z } from "zod";

/** Espelha o enum `EventType` do Prisma (sem importar o client gerado). */
export type NichoEvento =
  | "CASAMENTO"
  | "QUINZE_ANOS"
  | "SESSENTA_ANOS"
  | "BODAS"
  | "ANIVERSARIO";

export type ProgramacaoItem = { hora: string; titulo: string };
export type PresenteItem = {
  titulo: string;
  descricao?: string;
  valorLabel?: string;
};

export type ConviteConteudo = {
  titulo: string;
  nichoLabel: string;
  /** Data formatada em pt-BR, fuso America/Sao_Paulo. */
  dataLabel: string;
  /** Data do evento em ISO 8601 — alvo da contagem regressiva (client). */
  dataISO: string;
  /** Cor de acento do evento (deriva todo o tema do `.cv`). */
  accent: string;
  mensagem?: string;
  local?: string;
  endereco?: string;
  mapsUrl?: string;
  traje?: string;
  programacao: ProgramacaoItem[];
  fotoUrl?: string;
  fotos: string[];
  pixNome?: string;
  pixChave?: string;
  /** Itens da lista de presentes (preview; checkout e Fase 6). */
  presentes: PresenteItem[];
};

/** Subconjunto do Event (+ relacoes) necessario para montar o conteudo. */
export type EventoParaConteudo = {
  title: string;
  type: NichoEvento | string;
  eventDate: Date;
  whiteLabel?: boolean;
  customization?: unknown;
  gifts?: {
    title: string;
    description?: string | null;
    priceCents?: number | null;
  }[];
  photos?: { url: string; order?: number }[];
};

const ACCENT_PADRAO = "#6D28D9";

const NICHO_LABEL: Record<NichoEvento, string> = {
  CASAMENTO: "Casamento",
  QUINZE_ANOS: "15 anos",
  SESSENTA_ANOS: "60 anos",
  BODAS: "Bodas de Ouro",
  ANIVERSARIO: "Aniversário",
};

const programacaoItemSchema = z.object({
  hora: z.string(),
  titulo: z.string(),
});

/** Shape esperado de `Event.customization` (tudo opcional). */
const customizationSchema = z
  .object({
    accent: z.string(),
    mensagem: z.string(),
    local: z.string(),
    endereco: z.string(),
    mapsUrl: z.string(),
    traje: z.string(),
    programacao: z.array(programacaoItemSchema),
    fotoUrl: z.string(),
    fotos: z.array(z.string()),
    pixNome: z.string(),
    pixChave: z.string(),
  })
  .partial();

type Customization = z.infer<typeof customizationSchema>;

// Data "por extenso" com dia da semana, SEM ano (ex.: "Sábado, 29 de agosto")
// — o ano aparece no rodapé (data pontilhada). Espelha o site da festa.
const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Sao_Paulo",
});

/** Primeira letra maiúscula ("sábado, ..." -> "Sábado, ..."). */
function capitalizar(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Texto limpo -> `undefined` quando vazio (faz a secao sumir). */
function texto(valor: string | undefined | null): string | undefined {
  const limpo = valor?.trim();
  return limpo ? limpo : undefined;
}

export function lerConteudo(event: EventoParaConteudo): ConviteConteudo {
  const parsed = customizationSchema.safeParse(event.customization);
  const custom: Customization = parsed.success ? parsed.data : {};

  const nichoLabel =
    NICHO_LABEL[event.type as NichoEvento] ?? "Convite";

  // Album: prioriza fotos reais do evento (ordenadas); cai para customization.fotos.
  const fotosEvento = (event.photos ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => p.url)
    .filter((url) => Boolean(url?.trim()));
  const fotos =
    fotosEvento.length > 0
      ? fotosEvento
      : (custom.fotos ?? []).map((f) => f.trim()).filter(Boolean);

  // Presentes (preview): itens reais do evento, valor formatado em BRL.
  const presentes: PresenteItem[] = (event.gifts ?? []).map((g) => ({
    titulo: g.title,
    descricao: texto(g.description),
    valorLabel:
      typeof g.priceCents === "number" && g.priceCents > 0
        ? formatadorMoeda.format(g.priceCents / 100)
        : undefined,
  }));

  const programacao = (custom.programacao ?? []).filter(
    (p) => texto(p.hora) || texto(p.titulo),
  );

  return {
    titulo: texto(event.title) ?? "Nosso convite",
    nichoLabel,
    dataLabel: capitalizar(formatadorData.format(event.eventDate)),
    dataISO: event.eventDate.toISOString(),
    accent: texto(custom.accent) ?? ACCENT_PADRAO,
    mensagem: texto(custom.mensagem),
    local: texto(custom.local),
    endereco: texto(custom.endereco),
    mapsUrl: texto(custom.mapsUrl),
    traje: texto(custom.traje),
    programacao,
    fotoUrl: texto(custom.fotoUrl),
    fotos,
    pixNome: texto(custom.pixNome),
    pixChave: texto(custom.pixChave),
    presentes,
  };
}
