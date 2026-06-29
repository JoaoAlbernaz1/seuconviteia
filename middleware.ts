import { NextResponse, type NextRequest } from "next/server";
import { extractLabel, resolveSubdomain, RESERVED } from "@/lib/tenant";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

/**
 * Roteamento de tenant por subdominio.
 *
 *  - dominio raiz / `www` / host externo -> `next()` (site de marketing).
 *  - `app.<root>` (raiz)                  -> rewrite p/ `/painel`; demais paths do
 *                                            painel (`/entrar`, `/cadastrar`, ...) seguem.
 *  - reservados de infra (`api`/`admin`/`send`) -> `next()`.
 *  - `<slug>.<root>` (evento)             -> rewrite p/ `/_sites/<slug>` (site publico).
 *
 * O destino do evento usa o segmento `/_sites/` (a pasta no disco e `app/%5Fsites`).
 *
 * Testar localmente (Chrome resolve `*.localhost`, NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000):
 *   localhost:3000 -> marketing · app.localhost:3000 -> painel · ana.localhost:3000 -> evento.
 */
function rewriteTo(req: NextRequest, basePath: string) {
  const url = req.nextUrl.clone();
  // Preserva o path interno do site (ex.: /rsvp), evitando "//" na raiz.
  url.pathname = `${basePath}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host");

  // Label cru (inclui reservados) para distinguir os destinos reservados.
  const label = extractLabel(host, ROOT_DOMAIN);

  // Dominio raiz, `www` ou host externo -> marketing.
  if (!label || label === "www") {
    return NextResponse.next();
  }

  // Painel do profissional (`app.<root>`).
  // So a raiz (`app.<root>/`) vai para `/painel`; os demais paths do painel
  // (`/entrar`, `/cadastrar`, `/painel/novo`, ...) seguem como estao, ja que o
  // grupo de rota `(dashboard)` os serve nesses mesmos caminhos.
  if (label === "app") {
    if (req.nextUrl.pathname === "/") {
      return rewriteTo(req, "/painel");
    }
    return NextResponse.next();
  }

  // Outros labels reservados (`api`, `admin`, `send`) -> segue normal.
  if ((RESERVED as readonly string[]).includes(label)) {
    return NextResponse.next();
  }

  // Subdominio de evento -> site publico (rewrite p/ /_sites/<slug>).
  const sub = resolveSubdomain(host, ROOT_DOMAIN);
  if (sub) {
    return rewriteTo(req, `/_sites/${sub}`);
  }

  // Defensivo: qualquer caso nao previsto segue o roteamento padrao.
  return NextResponse.next();
}

export const config = {
  // Exclui assets do Next, rotas de API e arquivos estaticos.
  matcher: [
    "/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w]+$).*)",
  ],
};
