// Lista de presentes — visão agregada das listas (Pix) de todos os eventos do
// profissional. Mostra, por evento, a chave Pix e os itens configurados com
// valor. "Recebido" virá das transações quando o Mercado Pago entrar (hoje 0).
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { moedaBRL } from "@/lib/painelUi";

export const dynamic = "force-dynamic";

/** Lê a chave/nome Pix do customization do evento (sem depender do schema completo). */
function lerPix(customization: unknown): { nome?: string; chave?: string } {
  if (!customization || typeof customization !== "object") return {};
  const c = customization as Record<string, unknown>;
  const nome = typeof c.pixNome === "string" && c.pixNome.trim() ? c.pixNome : undefined;
  const chave = typeof c.pixChave === "string" && c.pixChave.trim() ? c.pixChave : undefined;
  return { nome, chave };
}

export default async function PresentesPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const professionalId = session.user.id;

  const eventos = await prisma.event.findMany({
    where: { professionalId },
    orderBy: { eventDate: "asc" },
    select: {
      id: true,
      title: true,
      customization: true,
      gifts: {
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, description: true, priceCents: true },
      },
    },
  });

  const comPresentes = eventos.filter((e) => e.gifts.length > 0);
  const totalItens = comPresentes.reduce((a, e) => a + e.gifts.length, 0);
  const totalValor = comPresentes.reduce(
    (a, e) => a + e.gifts.reduce((s, g) => s + g.priceCents, 0),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Lista de presentes
      </h1>
      <p className="mt-1.5 text-sm text-texto-suave">
        {comPresentes.length === 0
          ? "Configure listas de presentes com Pix nos seus eventos."
          : `${totalItens} ${totalItens === 1 ? "item" : "itens"} em ${comPresentes.length} ${comPresentes.length === 1 ? "evento" : "eventos"} · ${moedaBRL(totalValor)} configurados`}
      </p>

      {comPresentes.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lilas text-2xl text-violeta">
            <i className="bi bi-gift" aria-hidden />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            Nenhuma lista de presentes
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-texto-suave">
            Abra um evento e adicione presentes com chave Pix na seção “Lista de
            presentes”.
          </p>
          <Link
            href="/painel/eventos"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violeta hover:underline"
          >
            Ver eventos <i className="bi bi-arrow-right" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {comPresentes.map((ev) => {
            const pix = lerPix(ev.customization);
            const total = ev.gifts.reduce((s, g) => s + g.priceCents, 0);
            return (
              <section
                key={ev.id}
                className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-sans text-base font-semibold text-ink">
                      {ev.title}
                    </h2>
                    {pix.chave ? (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-texto-suave">
                        <i className="bi bi-qr-code" aria-hidden />
                        Pix: {pix.chave}
                        {pix.nome ? ` · ${pix.nome}` : ""}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-amber-700">
                        Sem chave Pix configurada
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/painel/${ev.id}/editar`}
                    className="text-sm font-semibold text-violeta hover:underline"
                  >
                    Editar lista
                  </Link>
                </header>

                <ul className="divide-y divide-black/5">
                  {ev.gifts.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {g.title}
                        </span>
                        {g.description ? (
                          <span className="block truncate text-xs text-texto-suave">
                            {g.description}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-ink">
                        {g.priceCents > 0 ? moedaBRL(g.priceCents) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-black/5 bg-nevoa/40 px-5 py-3 text-sm">
                  <span className="text-texto-suave">Total configurado</span>
                  <span className="font-semibold text-ink">{moedaBRL(total)}</span>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
