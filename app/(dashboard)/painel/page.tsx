// Painel do profissional — protegido. Lista os eventos do profissional logado.
import Link from "next/link";
import { redirect } from "next/navigation";
import type { EventStatus, EventType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventPublicUrl } from "@/lib/tenant";
import { sair } from "../actions";

// Depende da sessao (cookies) e do banco -> sempre dinamico.
export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

const TIPO_LABEL: Record<EventType, string> = {
  CASAMENTO: "Casamento",
  QUINZE_ANOS: "15 anos",
  SESSENTA_ANOS: "60 anos",
  BODAS: "Bodas",
  ANIVERSARIO: "Aniversario",
};

const STATUS: Record<EventStatus, { label: string; className: string }> = {
  PUBLISHED: { label: "No ar", className: "bg-emerald-50 text-emerald-700" },
  DRAFT: { label: "Rascunho", className: "bg-slate-100 text-slate-600" },
  EXPIRED: { label: "Expirado", className: "bg-amber-50 text-amber-700" },
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "America/Sao_Paulo",
});

export default async function PainelPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const events = await prisma.event.findMany({
    where: { professionalId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { guests: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Meus eventos
          </h1>
          <p className="mt-1 text-sm text-texto-suave">
            {session.user.name ? `Ola, ${session.user.name}. ` : ""}
            Gerencie e publique os sites dos seus clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/painel/novo"
            className="rounded-lg bg-violeta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violeta/90"
          >
            Criar evento
          </Link>
          <form action={sair}>
            <button
              type="submit"
              className="rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-texto-suave transition hover:text-ink"
            >
              Sair
            </button>
          </form>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Nenhum evento ainda
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-texto-suave">
            Crie o seu primeiro site de evento — escolha o nicho, um modelo e
            publique no endereco proprio em minutos.
          </p>
          <Link
            href="/painel/novo"
            className="mt-6 inline-flex rounded-lg bg-violeta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violeta/90"
          >
            Criar primeiro evento
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {events.map((ev) => {
            const url = eventPublicUrl(ev.subdomain, ROOT_DOMAIN);
            const status = STATUS[ev.status];
            return (
              <li
                key={ev.id}
                className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-display text-lg font-semibold text-ink">
                        {ev.title}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-texto-suave">
                      {TIPO_LABEL[ev.type]} · {formatadorData.format(ev.eventDate)}
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block break-all text-sm font-medium text-violeta hover:underline"
                    >
                      {url}
                    </a>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-display text-2xl font-semibold text-ink">
                      {ev._count.guests}
                    </p>
                    <p className="text-xs text-texto-suave">
                      {ev._count.guests === 1 ? "convidado" : "convidados"}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
