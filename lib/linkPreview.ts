// Leitura de "prévia" de um link de loja (Amazon, Magalu…): busca a página e
// extrai og:title / og:image / preço (Open Graph / meta). Usado quando o dono
// cola um link no editor — auto-preenche nome + foto (cai pro manual se a loja
// bloquear). A parte de PARSE é pura (testável); o fetch roda só no servidor.

export type PreviaLink = {
  ok: boolean;
  titulo?: string;
  imagem?: string;
  precoCents?: number;
  erro?: string;
};

/** Decodifica as entidades HTML mais comuns (og:title costuma ter &amp; etc.). */
export function decodeEntidades(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x2F;/gi, "/")
    .trim();
}

/** Lê um atributo (property/name/content) de uma tag `<meta ...>`. */
function attr(tag: string, nome: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${nome}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[2] ?? m[3]) : undefined;
}

/** Preço "1.234,56" / "1234.56" / "R$ 99,90" -> centavos. */
export function precoParaCents(s: string): number | undefined {
  const limpo = s.replace(/[^\d.,]/g, "");
  if (!limpo) return undefined;
  // Se tem vírgula E ponto, o último separador é o decimal.
  let norm = limpo;
  if (limpo.includes(",") && limpo.includes(".")) {
    norm = limpo.lastIndexOf(",") > limpo.lastIndexOf(".")
      ? limpo.replace(/\./g, "").replace(",", ".")
      : limpo.replace(/,/g, "");
  } else if (limpo.includes(",")) {
    norm = limpo.replace(",", ".");
  }
  const n = parseFloat(norm);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
}

/**
 * Extrai título / imagem / preço de um HTML. PURO. Prioriza Open Graph; cai para
 * <title> quando não há og:title.
 */
export function extrairMetaOg(html: string): {
  titulo?: string;
  imagem?: string;
  precoCents?: number;
} {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const map: Record<string, string> = {};
  for (const tag of metas) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? attr(tag, "itemprop"))?.toLowerCase();
    const content = attr(tag, "content");
    if (key && content && !(key in map)) map[key] = content;
  }

  let titulo: string | undefined = map["og:title"] ?? map["twitter:title"];
  if (!titulo) {
    const t = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    titulo = t?.[1];
  }
  const imagem = map["og:image"] ?? map["og:image:secure_url"] ?? map["twitter:image"];
  const precoStr =
    map["og:price:amount"] ?? map["product:price:amount"] ?? map["price"];

  return {
    titulo: titulo ? decodeEntidades(titulo).slice(0, 140) : undefined,
    imagem: imagem ? imagem.trim() : undefined,
    precoCents: precoStr ? precoParaCents(precoStr) : undefined,
  };
}

/**
 * Bloqueia hosts internos (proteção contra SSRF): localhost, IPs privados,
 * loopback, link-local e endpoints de metadata de nuvem.
 */
export function hostBloqueado(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h || h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) return true;
  if (h === "0.0.0.0" || h === "::1" || h === "metadata.google.internal") return true;
  if (h === "169.254.169.254") return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^fe80:/i.test(h) || /^fc00:/i.test(h) || /^fd/i.test(h)) return true;
  return false;
}

/** Busca a página do link e devolve a prévia (nome/foto/preço). Só no servidor. */
export async function lerPreviaLink(url: string): Promise<PreviaLink> {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return { ok: false, erro: "Link inválido." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, erro: "Use um link começando com http:// ou https://." };
  }
  if (hostBloqueado(u.hostname)) {
    return { ok: false, erro: "Esse endereço não é permitido." };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      return { ok: false, erro: "Não consegui abrir o link. Preencha nome e foto manualmente." };
    }
    const html = (await res.text()).slice(0, 800_000);
    const og = extrairMetaOg(html);
    if (!og.titulo && !og.imagem) {
      return { ok: false, erro: "A loja não deixou ler os dados. Preencha manualmente." };
    }
    const imagem = og.imagem ? new URL(og.imagem, u).toString() : undefined;
    return { ok: true, titulo: og.titulo, imagem, precoCents: og.precoCents };
  } catch {
    return { ok: false, erro: "A loja bloqueou a leitura. Preencha nome e foto manualmente." };
  }
}
