// Carregamento comum das telas de evento do painel DARK: ownership pela
// sessão (404 se não for dono), relações que as telas usam e a serialização
// do evento salvo para o preview real (/preview-evento?s=).
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rascunhoDoEvento } from "@/lib/previewEvento";
import { protocoloDe, rootDomain } from "@/lib/tenant";
import { SELECT_ASSINATURA } from "@/lib/plans";

export const ROOT_DOMAIN = rootDomain();

/** Host público do evento (sem porta, para exibição). */
export function hostDoEvento(subdomain: string): string {
  return `${subdomain}.${ROOT_DOMAIN.replace(/:\d+$/, "")}`;
}

/** URL pública completa do evento (com porta em dev). */
export function urlDoEvento(subdomain: string): string {
  const proto = protocoloDe(ROOT_DOMAIN);
  return `${proto}://${subdomain}.${ROOT_DOMAIN}`;
}

/** Evento do dono (com tudo que as telas precisam) ou 404. */
export async function carregarEventoDono(id: string) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const event = await prisma.event.findFirst({
    where: { id, professionalId: session.user.id },
    include: {
      gifts: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { order: "asc" } },
      // `assinaturaStatus`/`assinaturaAte` vem junto porque o direito de verdade
      // e o `planoEfetivo` — a coluna `plan` sozinha continua dizendo PREMIUM
      // depois da assinatura vencer.
      professional: { select: { ...SELECT_ASSINATURA, name: true, brandName: true } },
      _count: {
        select: {
          guests: { where: { status: "CONFIRMED" } },
          recados: true,
        },
      },
    },
  });
  if (!event) notFound();
  return event;
}

export type EventoDono = Awaited<ReturnType<typeof carregarEventoDono>>;

/** JSON do rascunho de preview a partir do evento salvo. */
export function previewJsonDoEvento(event: EventoDono): string {
  return JSON.stringify(rascunhoDoEvento(event));
}

/** Lê uma string do customization ("" -> undefined). */
export function lerCustomStr(c: unknown, k: string): string | undefined {
  if (c && typeof c === "object" && k in c) {
    const v = (c as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

/** Destino de volta vindo de ?voltar= (só caminhos do painel). */
export function voltarDe(
  searchParams: { voltar?: string | string[] },
  fallback: string,
): string {
  const v = searchParams.voltar;
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.startsWith("/painel") ? s : fallback;
}
