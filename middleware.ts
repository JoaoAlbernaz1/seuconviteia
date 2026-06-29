import { NextResponse, type NextRequest } from "next/server";
import { resolveSubdomain } from "@/lib/tenant";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

/**
 * Resolucao de tenant por subdominio.
 *
 *  - dominio raiz / www / labels reservados (app, api, admin, send) -> segue normal
 *    (marketing na raiz, painel em app., rotas de API em /api).
 *  - <slug>.<root> -> reescreve para /_sites/<slug> (site publico do evento).
 *
 * Testar localmente: acesse `cliente.localhost:3000`
 * (com NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000 no .env.local).
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host");
  const subdomain = resolveSubdomain(host, ROOT_DOMAIN);

  // Raiz, www ou reservado: deixa o roteamento padrao seguir.
  if (!subdomain) {
    return NextResponse.next();
  }

  // Subdominio de evento: reescreve preservando o path do site.
  const url = req.nextUrl.clone();
  url.pathname = `/_sites/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Exclui assets do Next, rotas de API e arquivos estaticos.
  matcher: [
    "/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w]+$).*)",
  ],
};
