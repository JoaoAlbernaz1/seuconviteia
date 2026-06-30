// Convidados — visão agregada de todos os RSVPs dos eventos do profissional
// (isolado por tenant). Lista enxuta com nome, evento, status e data.
import Link from "next/link";
import { redirect } from "next/navigation";
import type { GuestStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS: Record<GuestStatus, { label: string; pill: string }> = {
  CONFIRMED: { label: "Confirmado", pill: "bg-teal/10 text-teal" },
  DECLINED: { label: "Não vai", pill: "bg-slate-100 text-slate-500" },
  PENDING: { label: "Pendente", pill: "bg-amber-100 text-amber-700" },
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function ConvidadosPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  const convidados = await prisma.guest.findMany({
    where: { event: { professionalId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      companions: true,
      message: true,
      createdAt: true,
      event: { select: { title: true } },
    },
  });

  const confirmados = convidados.filter((g) => g.status === "CONFIRMED");
  const cabecas =
    confirmados.length + confirmados.reduce((a, g) => a + g.companions, 0);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Convidados
      </h1>
      <p className="mt-1.5 text-sm text-texto-suave">
        {convidados.length === 0
          ? "As confirmações dos seus eventos aparecem aqui."
          : `${confirmados.length} confirmados · ${cabecas} pessoas (com acompanhantes)`}
      </p>

      {convidados.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lilas text-2xl text-violeta">
            <i className="bi bi-people" aria-hidden />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            Nenhum convidado ainda
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-texto-suave">
            Quando os convidados confirmarem presença nos sites, eles aparecem
            aqui.
          </p>
          <Link
            href="/painel/eventos"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violeta hover:underline"
          >
            Ver eventos <i className="bi bi-arrow-right" aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          {convidados.map((g) => {
            const s = STATUS[g.status];
            return (
              <li key={g.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lilas text-sm font-semibold text-violeta">
                  {g.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {g.name}
                    {g.companions > 0 ? (
                      <span className="font-normal text-texto-suave">
                        {" "}
                        +{g.companions}
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-texto-suave">
                    {g.event.title}
                    {g.message ? ` · “${g.message}”` : ""}
                  </span>
                </span>
                <span className="hidden text-xs text-texto-suave sm:block">
                  {formatadorData.format(g.createdAt)}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold ${s.pill}`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
