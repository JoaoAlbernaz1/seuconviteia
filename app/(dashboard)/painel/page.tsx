// Painel do profissional — protegido. Visão geral (boas-vindas + métricas) e a
// lista de eventos com miniatura da capa. Monetização por evento: cada site nasce
// como PRÉVIA (marca d'água); "Publicar" tira a marca; cada upsell destrava
// avulso. (Os botões são STUB — alternam as flags; o pagamento real entra depois.)
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { EventType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventPublicUrl } from "@/lib/tenant";
import { recursosDoEvento, UPSELLS, UPSELL_LABEL } from "@/lib/upsells";
import { sair, alternarCompra, alternarUpsell } from "../actions";
import { PublicarControle } from "./PublicarControle";

// Depende da sessao (cookies) e do banco -> sempre dinamico.
export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

const TIPO_LABEL: Record<EventType, string> = {
  CASAMENTO: "Casamento",
  QUINZE_ANOS: "15 anos",
  SESSENTA_ANOS: "60 anos",
  BODAS: "Bodas",
  ANIVERSARIO: "Aniversário",
};

// Ícone (Bootstrap) por nicho — usado no placeholder da capa sem foto.
const TIPO_ICON: Record<EventType, string> = {
  CASAMENTO: "bi-suit-heart",
  QUINZE_ANOS: "bi-stars",
  SESSENTA_ANOS: "bi-balloon",
  BODAS: "bi-gem",
  ANIVERSARIO: "bi-balloon-heart",
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "America/Sao_Paulo",
});

/** Lê a foto de capa do `customization` (sem fallback). */
function capaDoEvento(customization: unknown): string | undefined {
  if (customization && typeof customization === "object" && "fotoUrl" in customization) {
    const v = (customization as { fotoUrl?: unknown }).fotoUrl;
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

function Metrica({
  icon,
  valor,
  label,
  tone,
}: {
  icon: string;
  valor: number;
  label: string;
  tone: "violeta" | "teal" | "amber" | "ink";
}) {
  const chip = {
    violeta: "bg-violeta/10 text-violeta",
    teal: "bg-teal/10 text-teal",
    amber: "bg-amber-100 text-amber-700",
    ink: "bg-ink/5 text-ink",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-lg ${chip}`}>
        <i className={`bi ${icon}`} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-semibold leading-none text-ink">
          {valor}
        </p>
        <p className="mt-1 truncate text-xs text-texto-suave">{label}</p>
      </div>
    </div>
  );
}

export default async function PainelPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const events = await prisma.event.findMany({
    where: { professionalId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { guests: true } } },
  });

  const total = events.length;
  const publicados = events.filter((e) => e.purchased).length;
  const previas = total - publicados;
  const convidados = events.reduce((s, e) => s + e._count.guests, 0);

  const primeiroNome = (session.user.name ?? "").trim().split(/\s+/)[0] ?? "";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-6 sm:py-10">
      {/* ── Boas-vindas ── */}
      <section className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        {/* glow da marca */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--grad-faisca)" }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              Painel
            </p>
            <h1 className="mt-2 font-display text-[2rem] font-semibold leading-tight text-ink">
              Olá{primeiroNome ? `, ${primeiroNome}` : ""} 👋
            </h1>
            <p className="mt-1 text-sm text-texto-suave">
              Crie, personalize e publique os sites dos seus clientes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/painel/novo"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              <i className="bi bi-plus-lg" aria-hidden /> Criar evento
            </Link>
            <form action={sair}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm font-medium text-texto-suave transition hover:text-ink"
              >
                <i className="bi bi-box-arrow-right" aria-hidden />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>

        {/* métricas */}
        <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica icon="bi-collection" valor={total} label="Eventos" tone="ink" />
          <Metrica icon="bi-globe2" valor={publicados} label="Publicados" tone="teal" />
          <Metrica icon="bi-eye" valor={previas} label="Em prévia" tone="amber" />
          <Metrica icon="bi-people" valor={convidados} label="Convidados" tone="violeta" />
        </div>
      </section>

      {/* ── Eventos ── */}
      <div className="mt-9 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-ink">
          Seus eventos
        </h2>
        {total > 0 ? (
          <span className="text-sm text-texto-suave">
            {total} {total === 1 ? "evento" : "eventos"}
          </span>
        ) : null}
      </div>

      {events.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lilas text-2xl text-violeta">
            <i className="bi bi-calendar2-heart" aria-hidden />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            Nenhum evento ainda
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-texto-suave">
            Crie o seu primeiro site de evento — escolha o nicho, personalize e
            tenha a prévia no ar em minutos.
          </p>
          <Link
            href="/painel/novo"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            <i className="bi bi-plus-lg" aria-hidden /> Criar primeiro evento
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {events.map((ev) => {
            const url = eventPublicUrl(ev.subdomain, ROOT_DOMAIN);
            const recursos = recursosDoEvento(ev);
            const capa = capaDoEvento(ev.customization);
            return (
              <li
                key={ev.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex gap-4 p-4">
                  {/* miniatura da capa */}
                  <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 sm:w-20">
                    {capa ? (
                      <Image
                        src={capa}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span
                        className="grid h-full w-full place-items-center text-xl text-white"
                        style={{ background: "var(--grad-faisca)" }}
                      >
                        <i className={`bi ${TIPO_ICON[ev.type]}`} aria-hidden />
                      </span>
                    )}
                  </div>

                  {/* info */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-display text-lg font-semibold text-ink">
                        {ev.title}
                      </h3>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-xl font-semibold leading-none text-ink">
                          {ev._count.guests}
                        </span>
                        <span className="text-[0.65rem] text-texto-suave">
                          {ev._count.guests === 1 ? "convidado" : "convidados"}
                        </span>
                      </span>
                    </div>

                    <span
                      className={`mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${
                        ev.purchased
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <i
                        className={`bi ${ev.purchased ? "bi-globe2" : "bi-droplet"}`}
                        aria-hidden
                      />
                      {ev.purchased ? "Publicado" : "Prévia"}
                    </span>

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-texto-suave">
                      <i className={`bi ${TIPO_ICON[ev.type]}`} aria-hidden />
                      {TIPO_LABEL[ev.type]} · {formatadorData.format(ev.eventDate)}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 break-all text-xs font-medium text-violeta hover:underline"
                      >
                        <i className="bi bi-box-arrow-up-right" aria-hidden /> Ver site
                      </a>
                      <Link
                        href={`/painel/${ev.id}/editar`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-texto-suave hover:text-ink hover:underline"
                      >
                        <i className="bi bi-pencil" aria-hidden /> Editar
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Monetização (STUB): publicar (valor único) + destravar upsells. */}
                <div className="mt-auto border-t border-black/5 bg-nevoa/50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <PublicarControle
                      eventId={ev.id}
                      purchased={ev.purchased}
                      action={alternarCompra}
                    />
                    {UPSELLS.map((u) => {
                      const ativo = recursos[u];
                      return (
                        <form key={u} action={alternarUpsell}>
                          <input type="hidden" name="eventId" value={ev.id} />
                          <input type="hidden" name="upsell" value={u} />
                          <button
                            type="submit"
                            aria-pressed={ativo}
                            title={UPSELL_LABEL[u]}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                              ativo
                                ? "bg-teal/10 text-teal ring-1 ring-teal/30"
                                : "border border-black/10 text-texto-suave hover:text-ink"
                            }`}
                          >
                            <i
                              className={`bi ${ativo ? "bi-check-lg" : "bi-plus-lg"}`}
                              aria-hidden
                            />
                            {UPSELL_LABEL[u]}
                          </button>
                        </form>
                      );
                    })}
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
