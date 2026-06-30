// Grade de eventos (referência: mockup do João) — cards com banner gradiente
// (paleta do evento), pílula de status, nicho, link do site e ações. Filtros por
// status + busca rodam no cliente (EventosGrid). Isolado por tenant.
import { redirect } from "next/navigation";
import type { EventStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventPublicUrl } from "@/lib/tenant";
import { gradienteDoTema, lerTemaKey } from "@/lib/temas";
import { TIPO_LABEL, TIPO_ICON, inicialEvento } from "@/lib/painelUi";
import { EventosGrid, type EventoCard } from "./EventosGrid";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  const { q } = await searchParams;

  const [eventos, confirmadosPorEvento] = await Promise.all([
    prisma.event.findMany({
      where: { professionalId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { guests: true } } },
    }),
    prisma.guest.groupBy({
      by: ["eventId"],
      where: { event: { professionalId }, status: "CONFIRMED" },
      _count: { _all: true },
    }),
  ]);

  const confirmados = new Map(
    confirmadosPorEvento.map((c) => [c.eventId, c._count._all]),
  );

  const cards: EventoCard[] = eventos.map((ev) => ({
    id: ev.id,
    title: ev.title,
    inicial: inicialEvento(ev.title),
    tipoLabel: TIPO_LABEL[ev.type],
    tipoIcon: TIPO_ICON[ev.type],
    status: ev.status as EventStatus,
    dateLabel: formatadorData.format(ev.eventDate),
    url: eventPublicUrl(ev.subdomain, ROOT_DOMAIN),
    host: `${ev.subdomain}.${ROOT_DOMAIN.replace(/:\d+$/, "")}`,
    gradient: gradienteDoTema(lerTemaKey(ev.customization)),
    confirmados: confirmados.get(ev.id) ?? 0,
    convidados: ev._count.guests,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-9">
      <EventosGrid cards={cards} buscaInicial={q ?? ""} />
    </main>
  );
}
