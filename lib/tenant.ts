/**
 * Resolucao de tenant por subdominio (usado a partir da Fase 2).
 *
 * Modelo de roteamento:
 *  - dominio raiz / www  -> site de marketing (grupo (marketing))
 *  - <slug>.<root>       -> site publico do evento (rewrite p/ /_sites/<slug>)
 *
 * O painel NAO tem host proprio: vive no mesmo dominio raiz, em /painel
 * (decisao do dono em 2026-08-16). `app` segue em RESERVED para nunca virar
 * slug de evento.
 */

/** Labels reservados que NUNCA representam um evento. */
export const RESERVED = ["www", "app", "api", "admin", "send"] as const;
export type ReservedSubdomain = (typeof RESERVED)[number];

/**
 * Normaliza um texto para um slug seguro de URL/subdominio:
 *  - minusculas
 *  - remove acentos (normalize NFD + remove diacriticos)
 *  - troca tudo que nao for [a-z0-9] por "-"
 *  - colapsa hifens repetidos e remove das pontas
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extrai o label CRU (de um unico nivel) de um host, relativo ao `rootDomain`,
 * SEM aplicar a regra de reservados. Util no middleware para distinguir labels
 * reservados entre si (ex.: `app` -> painel vs. `api`/`admin`/`send` -> infra),
 * coisa que `resolveSubdomain` esconde ao retornar `null`.
 *
 * Retorna `null` quando o host e o proprio dominio raiz, nao pertence ao
 * rootDomain, tem mais de um nivel de subdominio, ou e vazio/indefinido.
 *
 * @example
 *   extractLabel("ana.seuconviteia.com", "seuconviteia.com")   // "ana"
 *   extractLabel("app.seuconviteia.com", "seuconviteia.com")   // "app"
 *   extractLabel("www.seuconviteia.com", "seuconviteia.com")   // "www"
 *   extractLabel("seuconviteia.com", "seuconviteia.com")       // null
 *   extractLabel("a.b.seuconviteia.com", "seuconviteia.com")   // null
 */
export function extractLabel(
  host: string | null | undefined,
  rootDomain: string,
): string | null {
  if (!host) return null;

  // Descarta porta e normaliza.
  const hostname = host.split(":")[0]?.toLowerCase().trim();
  const root = rootDomain.split(":")[0]?.toLowerCase().trim();
  if (!hostname || !root) return null;

  // Host e exatamente o dominio raiz.
  if (hostname === root) return null;

  // Host precisa terminar em ".<root>" para ter um subdominio valido.
  const suffix = `.${root}`;
  if (!hostname.endsWith(suffix)) return null;

  const label = hostname.slice(0, -suffix.length);

  // So aceitamos um unico nivel de subdominio (sem pontos internos).
  if (!label || label.includes(".")) return null;

  return label;
}

/**
 * Extrai o label de subdominio de um host, relativo ao `rootDomain`, aplicando
 * a regra de reservados (so retorna labels que representam um EVENTO).
 *
 * Retorna `null` quando o host:
 *  - e o proprio dominio raiz (ou www),
 *  - e um label reservado (RESERVED),
 *  - nao pertence ao rootDomain,
 *  - e vazio/indefinido.
 *
 * @example
 *   resolveSubdomain("ana.seuconviteia.com", "seuconviteia.com")   // "ana"
 *   resolveSubdomain("seuconviteia.com", "seuconviteia.com")       // null
 *   resolveSubdomain("www.seuconviteia.com", "seuconviteia.com")   // null
 *   resolveSubdomain("app.seuconviteia.com", "seuconviteia.com")   // null (reservado)
 *   resolveSubdomain("ana.localhost:3000", "localhost:3000")       // "ana"
 */
export function resolveSubdomain(
  host: string | null | undefined,
  rootDomain: string,
): string | null {
  const label = extractLabel(host, rootDomain);
  if (!label) return null;

  // www e os labels reservados nao sao eventos.
  if (label === "www") return null;
  if ((RESERVED as readonly string[]).includes(label)) return null;

  return label;
}

/**
 * Dominio raiz do ambiente, JA NORMALIZADO. Todo mundo que precisa dele deve
 * ler daqui, nunca de `process.env` direto.
 *
 * O `.trim()` nao e paranoia: a env var e gravada por gente, e
 * `echo "dominio" | vercel env add` guarda um "\n" no fim. O caractere
 * invisivel viajava para dentro das URLs montadas
 * (`https://seuconvite.orivya.com.br\n/painel/plano`) e o Mercado Pago passou a
 * recusar TODO checkout com "Invalid value for back_url". `extractLabel` ja
 * aparava o valor — por isso os convites continuavam abrindo e ninguem
 * desconfiava —, mas quem montava URL nao aparava.
 */
export function rootDomain(): string {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "").trim() || "localhost:3000";
}

/**
 * Monta a URL publica de um evento a partir do seu subdominio e do `rootDomain`.
 * Em dev (root contendo `localhost`) usa `http://`; em producao usa `https://`.
 *
 * @example
 *   eventPublicUrl("ana", "localhost:3000")   // "http://ana.localhost:3000"
 *   eventPublicUrl("ana", "seuconviteia.com") // "https://ana.seuconviteia.com"
 */
export function eventPublicUrl(subdomain: string, rootDomain: string): string {
  return `${protocoloDe(rootDomain)}://${subdomain}.${rootDomain}`;
}

/**
 * Protocolo do link: `http` para dev/rede local (localhost, IP cru, ou wildcard
 * de teste nip.io/sslip.io); `https` para um dominio publico de verdade.
 */
export function protocoloDe(rootDomain: string): "http" | "https" {
  const localish = /localhost|nip\.io|sslip\.io|^\d{1,3}(\.\d{1,3}){3}(:|$)/;
  return localish.test(rootDomain) ? "http" : "https";
}

/**
 * Caminho do painel a partir do site de marketing.
 *
 * Decisao do dono (2026-08-16): o painel NAO fica num subdominio `app.` — ele
 * mora no MESMO host da landing. Entao o link e sempre relativo: `/entrar`,
 * `/cadastrar`. O parametro `rootDomain` fica na assinatura porque os
 * chamadores ja o passam e porque um dia pode voltar a existir separacao de
 * host; hoje ele nao muda o resultado.
 *
 * @example
 *   appUrl("/cadastrar", "seuconvite.orivya.com.br")  // "/cadastrar"
 *   appUrl("entrar", "localhost:3000")                // "/entrar"
 *   appUrl("", "qualquer")                            // "/painel"
 */
export function appUrl(path: string, _rootDomain?: string): string {
  if (!path) return "/painel";
  return path.startsWith("/") ? path : `/${path}`;
}

