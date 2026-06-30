// Visão geral do painel (referência: mockup do João) — saudação + 4 KPIs +
// "Próximos eventos" (com barras de confirmação) + "Atividade recente". Tudo
// calculado dos dados reais do profissional logado, isolado por tenant.
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { gradienteDoTema, lerTemaKey } from "@/lib/temas";
import {
  TIPO_LABEL,
  STATUS_INFO,
  moedaCompacta,
  inicialEvento,
  tempoRelativo,
} from "@/lib/painelUi";

export const dynamic = "force-dynamic";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

function KpiCard({
  icon,
  iconClass,
  value,
  label,
  hint,
}: {
  icon: string;
  iconClass: string;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={`grid size-10 place-items-center rounded-xl text-lg ${iconClass}`}
          aria-hidden
        >
          <i className={`bi ${icon}`} />
        </span>
        {hint ? (
          <span className="text-xs font-medium text-texto-suave">{hint}</span>
        ) : null}
      </div>
      <p className="mt-3.5 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-sm text-texto-suave">{label}</p>
    </div>
  );
}

export default async function PainelVisaoGeral() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const prof = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { name: true },
  });
  const primeiroNome = (prof?.name ?? "").trim().split(/\s+/)[0] || "";

  const [eventos, statusGuests, confirmadosPorEvento, pixAgg, recentes, recados] =
    await Promise.all([
      prisma.event.findMany({
        where: { professionalId },
        orderBy: { eventDate: "asc" },
        include: { _count: { select: { guests: true, gifts: true } } },
      }),
      prisma.guest.groupBy({
        by: ["status"],
        where: { event: { professionalId } },
        _count: { _all: true },
        _sum: { companions: true },
      }),
      prisma.guest.groupBy({
        by: ["eventId"],
        where: { event: { professionalId }, status: "CONFIRMED" },
        _count: { _all: true },
      }),
      prisma.transaction.aggregate({
        where: { event: { professionalId }, kind: "GIFT_PIX", status: "APPROVED" },
        _sum: { amountCents: true },
      }),
      prisma.guest.findMany({
        where: {
          event: { professionalId },
          status: { in: ["CONFIRMED", "DECLINED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          name: true,
          status: true,
          createdAt: true,
          event: { select: { title: true } },
        },
      }),
      prisma.recado.findMany({
        where: { event: { professionalId } },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { name: true, createdAt: true, event: { select: { title: true } } },
      }),
    ]);

  // ── KPIs ──
  const totalEventos = eventos.length;
  const ativos = eventos.filter((e) => e.status === "PUBLISHED").length;
  const novosNoMes = eventos.filter((e) => e.createdAt >= inicioMes).length;

  const confirmados = statusGuests.find((s) => s.status === "CONFIRMED");
  const declinados = statusGuests.find((s) => s.status === "DECLINED");
  const totalConvidados = statusGuests.reduce((acc, s) => acc + s._count._all, 0);
  const respostas =
    (confirmados?._count._all ?? 0) + (declinados?._count._all ?? 0);
  const cabecasConfirmadas =
    (confirmados?._count._all ?? 0) + (confirmados?._sum.companions ?? 0);
  const taxaResposta =
    totalConvidados > 0 ? Math.round((respostas / totalConvidados) * 100) : 0;

  const pixCents = pixAgg._sum.amountCents ?? 0;
  const totalItensPresente = eventos.reduce((acc, e) => acc + e._count.gifts, 0);

  const confirmadosMap = new Map(
    confirmadosPorEvento.map((c) => [c.eventId, c._count._all]),
  );

  // ── Próximos eventos (futuros e não encerrados) ──
  const proximos = eventos
    .filter((e) => e.status !== "EXPIRED" && e.eventDate >= agora)
    .slice(0, 5);

  // ── Atividade recente (confirmações/declínios + recados, mais novos primeiro) ──
  type Atividade = {
    icon: string;
    iconClass: string;
    nome: string;
    sufixo: string;
    quando: Date;
  };
  const feed: Atividade[] = [
    ...recentes.map((g) => ({
      icon: g.status === "CONFIRMED" ? "bi-check2-circle" : "bi-x-circle",
      iconClass:
        g.status === "CONFIRMED"
          ? "bg-teal/10 text-teal"
          : "bg-slate-100 text-slate-500",
      nome: g.name,
      sufixo:
        g.status === "CONFIRMED"
          ? `confirmou presença em ${g.event.title}`
          : `não poderá ir em ${g.event.title}`,
      quando: g.createdAt,
    })),
    ...recados.map((r) => ({
      icon: "bi-chat-heart",
      iconClass: "bg-violeta/10 text-violeta",
      nome: r.name,
      sufixo: `deixou um recado em ${r.event.title}`,
      quando: r.createdAt,
    })),
  ]
    .sort((a, b) => b.quando.getTime() - a.quando.getTime())
    .slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-9">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Olá{primeiroNome ? `, ${primeiroNome}` : ""} <span aria-hidden>👋</span>
      </h1>
      <p className="mt-1.5 text-sm text-texto-suave">
        {totalEventos === 0
          ? "Bem-vindo! Crie o primeiro site de evento dos seus clientes."
          : "Aqui está o resumo dos seus eventos."}
      </p>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="bi-calendar2-event"
          iconClass="bg-violeta/10 text-violeta"
          value={String(ativos)}
          label="Eventos ativos"
          hint={novosNoMes > 0 ? `+${novosNoMes} este mês` : `de ${totalEventos}`}
        />
        <KpiCard
          icon="bi-check2-circle"
          iconClass="bg-teal/10 text-teal"
          value={cabecasConfirmadas.toLocaleString("pt-BR")}
          label="Confirmações (RSVP)"
          hint={`${totalConvidados} convidados`}
        />
        <KpiCard
          icon="bi-cash-coin"
          iconClass="bg-turquesa/15 text-teal"
          value={moedaCompacta(pixCents)}
          label="Presentes via Pix"
          hint={`${totalItensPresente} ${totalItensPresente === 1 ? "item" : "itens"}`}
        />
        <KpiCard
          icon="bi-graph-up-arrow"
          iconClass="bg-lilas text-violeta"
          value={`${taxaResposta}%`}
          label="Taxa de resposta"
          hint={`${respostas}/${totalConvidados}`}
        />
      </div>

      {totalEventos === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lilas text-2xl text-violeta">
            <i className="bi bi-calendar2-heart" aria-hidden />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            Comece criando um evento
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-texto-suave">
            Escolha o nicho, personalize com preview ao vivo e publique o site em
            minutos — incluído no seu plano.
          </p>
          <Link
            href="/painel/novo"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violeta to-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            <i className="bi bi-plus-lg" aria-hidden /> Criar primeiro evento
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Próximos eventos */}
          <section className="rounded-2xl border border-black/5 bg-white shadow-sm">
            <header className="flex items-center justify-between px-5 pb-3 pt-5">
              <h2 className="font-sans text-base font-semibold text-ink">
                Próximos eventos
              </h2>
              <Link
                href="/painel/eventos"
                className="text-sm font-semibold text-violeta hover:underline"
              >
                Ver todos
              </Link>
            </header>
            {proximos.length === 0 ? (
              <p className="border-t border-black/5 px-5 py-8 text-center text-sm text-texto-suave">
                Nenhum evento futuro. Que tal criar um?
              </p>
            ) : (
              <ul>
                {proximos.map((ev) => {
                  const conf = confirmadosMap.get(ev.id) ?? 0;
                  const total = ev._count.guests;
                  const pct = total > 0 ? Math.round((conf / total) * 100) : 0;
                  const status = STATUS_INFO[ev.status];
                  return (
                    <li key={ev.id}>
                      <Link
                        href={`/painel/${ev.id}/editar`}
                        className="flex items-center gap-3.5 border-t border-black/5 px-5 py-3.5 transition hover:bg-nevoa/60"
                      >
                        <span
                          className="grid size-11 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold italic text-white"
                          style={{ backgroundImage: gradienteDoTema(lerTemaKey(ev.customization)) }}
                          aria-hidden
                        >
                          {inicialEvento(ev.title)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {ev.title}
                          </span>
                          <span className="block text-xs text-texto-suave">
                            {TIPO_LABEL[ev.type]} · {formatadorData.format(ev.eventDate)}
                          </span>
                        </span>
                        <span className="hidden w-28 shrink-0 sm:block">
                          <span className="mb-1 block text-[0.7rem] text-texto-suave">
                            {conf} confirmado{conf === 1 ? "" : "s"}
                          </span>
                          <span className="block h-1.5 overflow-hidden rounded-full bg-nevoa">
                            <span
                              className="block h-full rounded-full bg-gradient-to-r from-teal to-turquesa"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                        </span>
                        <span
                          className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold sm:inline ${status.pill}`}
                        >
                          {status.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Atividade recente */}
          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-sans text-base font-semibold text-ink">
              Atividade recente
            </h2>
            {feed.length === 0 ? (
              <p className="py-8 text-center text-sm text-texto-suave">
                As confirmações e recados aparecem aqui.
              </p>
            ) : (
              <ul>
                {feed.map((a, i) => (
                  <li
                    key={i}
                    className="flex gap-3 border-b border-black/5 py-3 last:border-0"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm ${a.iconClass}`}
                      aria-hidden
                    >
                      <i className={`bi ${a.icon}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug text-ink">
                        <strong className="font-semibold">{a.nome}</strong> {a.sufixo}
                      </span>
                      <span className="mt-0.5 block text-xs text-texto-suave">
                        {tempoRelativo(a.quando, agora)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
