// Painel do profissional (ASSINATURA) — lista de eventos em cards limpos com
// ícone. Publicar/despublicar é incluído no plano (sem cobrança, sem marca
// d'água). Os recursos liberam pelo plano da conta.
import Link from "next/link";
import { redirect } from "next/navigation";
import type { EventType, EventStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventPublicUrl } from "@/lib/tenant";
import { rotuloPlano } from "@/lib/plans";
import { publicarEvento, despublicarEvento } from "../actions";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

const TIPO_LABEL: Record<EventType, string> = {
  CASAMENTO: "Casamento",
  QUINZE_ANOS: "15 anos",
  SESSENTA_ANOS: "60 anos",
  BODAS: "Bodas",
  ANIVERSARIO: "Aniversário",
};

const TIPO_ICON: Record<EventType, string> = {
  CASAMENTO: "bi-suit-heart",
  QUINZE_ANOS: "bi-stars",
  SESSENTA_ANOS: "bi-balloon",
  BODAS: "bi-gem",
  ANIVERSARIO: "bi-balloon-heart",
};

const STATUS: Record<EventStatus, { label: string; className: string; icon: string }> = {
  PUBLISHED: { label: "No ar", className: "bg-emerald-50 text-emerald-700", icon: "bi-globe2" },
  DRAFT: { label: "Rascunho", className: "bg-slate-100 text-slate-600", icon: "bi-pencil" },
  EXPIRED: { label: "Expirado", className: "bg-amber-50 text-amber-700", icon: "bi-clock-history" },
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

  const noAr = events.filter((e) => e.status === "PUBLISHED").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Meus eventos
          </h1>
          <p className="mt-1 text-sm text-texto-suave">
            {events.length === 0
              ? "Crie o primeiro site de evento dos seus clientes."
              : `${events.length} ${events.length === 1 ? "evento" : "eventos"} · ${noAr} no ar`}
          </p>
        </div>
        <Link
          href="/painel/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
        >
          <i className="bi bi-plus-lg" aria-hidden /> Criar evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lilas text-2xl text-violeta">
            <i className="bi bi-calendar2-heart" aria-hidden />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            Nenhum evento ainda
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-texto-suave">
            Escolha o nicho, personalize e publique o site em minutos — incluído
            no seu plano.
          </p>
          <Link
            href="/painel/novo"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            <i className="bi bi-plus-lg" aria-hidden /> Criar primeiro evento
          </Link>
        </div>
      ) : (
        <ul className="mt-7 grid gap-4 sm:grid-cols-2">
          {events.map((ev) => {
            const url = eventPublicUrl(ev.subdomain, ROOT_DOMAIN);
            const status = STATUS[ev.status];
            const publicado = ev.status === "PUBLISHED";
            return (
              <li
                key={ev.id}
                className="flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-xl text-white"
                    style={{ background: "var(--grad-faisca)" }}
                    aria-hidden
                  >
                    <i className={`bi ${TIPO_ICON[ev.type]}`} />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold ${status.className}`}
                  >
                    <i className={`bi ${status.icon}`} aria-hidden />
                    {status.label}
                  </span>
                </div>

                <h2 className="mt-4 truncate font-display text-lg font-semibold text-ink">
                  {ev.title}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-texto-suave">
                  <i className={`bi ${TIPO_ICON[ev.type]}`} aria-hidden />
                  {TIPO_LABEL[ev.type]} · {formatadorData.format(ev.eventDate)}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-texto-suave">
                  <i className="bi bi-people" aria-hidden />
                  {ev._count.guests}{" "}
                  {ev._count.guests === 1 ? "convidado" : "convidados"} ·{" "}
                  {rotuloPlano(ev.plan)}
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-violeta hover:underline"
                  >
                    <i className="bi bi-box-arrow-up-right" aria-hidden /> Ver site
                  </a>
                  <Link
                    href={`/painel/${ev.id}/editar`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-texto-suave hover:text-ink hover:underline"
                  >
                    <i className="bi bi-pencil" aria-hidden /> Editar
                  </Link>
                </div>

                <div className="mt-4 border-t border-black/5 pt-4">
                  <form action={publicado ? despublicarEvento : publicarEvento}>
                    <input type="hidden" name="eventId" value={ev.id} />
                    <button
                      type="submit"
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        publicado
                          ? "border border-black/10 text-texto-suave hover:text-ink"
                          : "bg-violeta text-white hover:bg-violeta/90"
                      }`}
                    >
                      <i
                        className={`bi ${publicado ? "bi-eye-slash" : "bi-rocket-takeoff"}`}
                        aria-hidden
                      />
                      {publicado ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
