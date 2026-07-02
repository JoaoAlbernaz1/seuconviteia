/**
 * Helpers PUROS do formulario de criacao/edicao de evento (painel).
 *
 * Ficam aqui (em vez de na server action) por serem logica de parsing sem banco
 * nem sessao — faceis de testar no Vitest. A action so faz: auth -> Zod ->
 * chamar estes helpers -> Prisma.
 *
 * Decisoes:
 *  - As listas repetiveis (programacao, presentes) viajam no FormData como arrays
 *    paralelos de mesmo nome (`programacao_hora` / `programacao_titulo`, etc.).
 *    A action faz `formData.getAll(name)`; estes helpers fazem o "zip" + sanitize.
 *  - Valores em BRL ("150,00", "1.250,50", "R$ 90") viram centavos (Int).
 *  - Tudo aqui e tolerante: linhas vazias somem, valor invalido vira `undefined`.
 */
import { TEMAS } from "./temas";
import {
  RECURSOS_SITE,
  togglesParaCustomization,
  type RecursoSite,
  type TogglesSite,
} from "./recursos";

/** Chaves de paleta validas (para a validacao do `tema` na action). */
export const TEMA_KEYS = Object.keys(TEMAS);

/**
 * Le os toggles de recurso do FormData (campos `rec_<key>` com "on"/"off",
 * emitidos pela tela "Recursos do site" do editor). Ausente ou qualquer valor
 * diferente de "off" = ligado (tolerante; o default do produto e ligado).
 * Devolve o objeto pronto pro `customization.recursos` (so os desligados;
 * `undefined` quando todos ligados).
 */
export function parseRecursosForm(
  get: (name: string) => FormDataEntryValue | null,
): Partial<Record<RecursoSite, false>> | undefined {
  const toggles = {} as TogglesSite;
  for (const def of RECURSOS_SITE) {
    toggles[def.key] = get(`rec_${def.key}`) !== "off";
  }
  return togglesParaCustomization(toggles);
}

/** Uma linha da programacao do evento (`{hora, titulo}`). */
export type ProgramacaoRow = { hora: string; titulo: string };

/** Um item da lista de presentes, ja com o valor convertido em centavos. */
export type PresenteParsed = {
  titulo: string;
  descricao?: string;
  valorCents?: number;
};

/** Texto limpo -> `undefined` quando vazio. */
function texto(valor: string | null | undefined): string | undefined {
  const limpo = valor?.trim();
  return limpo ? limpo : undefined;
}

/**
 * Converte um valor monetario digitado em centavos (Int >= 0).
 *
 *  - Aceita formato pt-BR ("150,00", "1.250,50"), inteiro ("150"), ou com prefixo
 *    ("R$ 90"). Quando ha virgula, ela e o separador decimal e os pontos sao
 *    milhares; sem virgula, um ponto e tratado como separador decimal.
 *  - Vazio / invalido / negativo -> `null` (a action trata como "sem valor").
 *
 * @example brlParaCents("150,00") // 15000
 * @example brlParaCents("1.250,50") // 125050
 * @example brlParaCents("90") // 9000
 */
export function brlParaCents(valor: string | null | undefined): number | null {
  if (valor == null) return null;
  let s = valor.trim();
  if (!s) return null;
  // Dinheiro nunca e negativo: um sinal "-" invalida a entrada.
  if (s.includes("-")) return null;

  // Mantem apenas digitos, virgula e ponto.
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;

  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");

  if (temVirgula && temPonto) {
    // pt-BR: ponto = milhar, virgula = decimal.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    s = s.replace(",", ".");
  }
  // So ponto: tratado como separador decimal (deixa como esta).

  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/**
 * "Zip" das colunas paralelas da programacao -> linhas sanitizadas.
 * Mantem a linha se tiver hora OU titulo (espelha o filtro de `lerConteudo`).
 */
export function parseProgramacao(
  horas: readonly string[],
  titulos: readonly string[],
): ProgramacaoRow[] {
  const n = Math.max(horas.length, titulos.length);
  const linhas: ProgramacaoRow[] = [];
  for (let i = 0; i < n; i += 1) {
    const hora = (horas[i] ?? "").trim();
    const titulo = (titulos[i] ?? "").trim();
    if (hora || titulo) linhas.push({ hora, titulo });
  }
  return linhas;
}

/**
 * "Zip" das colunas paralelas da lista de presentes -> itens sanitizados.
 * Mantem o item somente se tiver titulo. `descricao`/`valor` vazios viram
 * `undefined`; `valor` e convertido de BRL para centavos.
 */
export function parsePresentes(
  titulos: readonly string[],
  descricoes: readonly string[],
  valores: readonly string[],
): PresenteParsed[] {
  const n = Math.max(titulos.length, descricoes.length, valores.length);
  const itens: PresenteParsed[] = [];
  for (let i = 0; i < n; i += 1) {
    const titulo = texto(titulos[i]);
    if (!titulo) continue;
    const cents = brlParaCents(valores[i]);
    itens.push({
      titulo,
      descricao: texto(descricoes[i]),
      valorCents: cents != null ? cents : undefined,
    });
  }
  return itens;
}

/**
 * Sanitiza a lista de URLs de fotos do album (campos `fotos` repetidos no
 * FormData). Aparada, sem vazios, so caminhos `/...` ou `http(s)://...`,
 * deduplicada (preservando ordem) e limitada a `max` itens. PURO.
 */
export function parseFotos(urls: readonly string[], max = 40): string[] {
  const out: string[] = [];
  const vistos = new Set<string>();
  for (const raw of urls) {
    const u = raw?.trim();
    if (!u) continue;
    if (!(u.startsWith("/") || /^https?:\/\//i.test(u))) continue;
    if (vistos.has(u)) continue;
    vistos.add(u);
    out.push(u);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Deriva os links do Google Maps a partir do local + endereco (sem campo
 * separado). Sem nenhum dos dois -> objeto vazio.
 */
export function montarMapsUrls(
  local?: string | null,
  endereco?: string | null,
): { mapsUrl?: string; mapsEmbedUrl?: string } {
  const query = [local, endereco]
    .filter(Boolean)
    .map((s) => (s as string).trim())
    .filter(Boolean)
    .join(", ");
  if (!query) return {};
  const enc = encodeURIComponent(query);
  return {
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${enc}`,
    mapsEmbedUrl: `https://www.google.com/maps?q=${enc}&output=embed`,
  };
}

/** Remove chaves `undefined` de um objeto (mantem o JSON do customization limpo). */
export function semUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k as keyof T] = v as T[keyof T];
  }
  return out;
}
