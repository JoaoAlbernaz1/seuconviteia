"use client";

// Grade de eventos (cliente) — cabeçalho com contagem, filtros por status e busca
// local, e os cards em grade. Os dados já vêm formatados do servidor (EventoCard).
import { useMemo, useState } from "react";
import Link from "next/link";
import type { EventStatus } from "@prisma/client";
import { STATUS_INFO, FILTROS_STATUS } from "@/lib/painelUi";
import { publicarEvento, despublicarEvento } from "../../actions";

export type EventoCard = {
  id: string;
  title: string;
  inicial: string;
  tipoLabel: string;
  tipoIcon: string;
  status: EventStatus;
  dateLabel: string;
  url: string;
  host: string;
  gradient: string;
  confirmados: number;
  convidados: number;
};

export function EventosGrid({
  cards,
  buscaInicial,
}: {
  cards: EventoCard[];
  buscaInicial: string;
}) {
  const [filtro, setFiltro] = useState<EventStatus | null>(null);
  const [busca, setBusca] = useState(buscaInicial);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cards.filter((c) => {
      if (filtro && c.status !== filtro) return false;
      if (termo && !`${c.title} ${c.tipoLabel}`.toLowerCase().includes(termo)) {
        return false;
      }
      return true;
    });
  }, [cards, filtro, busca]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Eventos
          </h1>
          <p className="mt-1.5 text-sm text-texto-suave">
            {cards.length} {cards.length === 1 ? "evento no total" : "eventos no total"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTROS_STATUS.map((f) => {
            const ativo = f.status === filtro;
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => setFiltro(f.status)}
                className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                  ativo
                    ? "border-ink bg-ink text-white"
                    : "border-black/10 bg-white text-texto-suave hover:border-violeta/40 hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {busca.trim() ? (
        <p className="mt-4 text-sm text-texto-suave">
          Resultados para <strong className="text-ink">“{busca.trim()}”</strong> ·{" "}
          <button
            type="button"
            onClick={() => setBusca("")}
            className="font-semibold text-violeta hover:underline"
          >
            limpar
          </button>
        </p>
      ) : null}

      {visiveis.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lilas text-2xl text-violeta">
            <i className="bi bi-calendar2-x" aria-hidden />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            {cards.length === 0 ? "Nenhum evento ainda" : "Nada por aqui"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-texto-suave">
            {cards.length === 0
              ? "Crie o primeiro site de evento dos seus clientes."
              : "Nenhum evento corresponde a esse filtro ou busca."}
          </p>
          {cards.length === 0 ? (
            <Link
              href="/painel/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violeta to-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              <i className="bi bi-plus-lg" aria-hidden /> Criar evento
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((c) => {
            const status = STATUS_INFO[c.status];
            const publicado = c.status === "PUBLISHED";
            return (
              <li
                key={c.id}
                className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md"
              >
                <div
                  className="relative flex h-24 items-center justify-center"
                  style={{ backgroundImage: c.gradient }}
                >
                  <span className="px-6 text-center font-display text-2xl font-semibold italic text-white drop-shadow-sm">
                    {c.title}
                  </span>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ver site"
                    title="Ver site"
                    className="absolute left-2.5 top-2.5 grid size-7 place-items-center rounded-lg bg-white/90 text-xs text-ink transition hover:bg-white"
                  >
                    <i className="bi bi-box-arrow-up-right" aria-hidden />
                  </a>
                  <span
                    className={`absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[0.68rem] font-semibold ${status.text}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-lilas px-2.5 py-0.5 text-[0.72rem] font-semibold text-violeta">
                      <i className={`bi ${c.tipoIcon}`} aria-hidden /> {c.tipoLabel}
                    </span>
                    <span className="text-xs text-texto-suave">{c.dateLabel}</span>
                  </div>

                  <p className="mt-3 truncate text-xs text-texto-suave">{c.host}</p>

                  <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-black/5 pt-3.5">
                    <span className="text-sm text-ink">
                      <strong className="font-semibold">{c.confirmados}</strong>
                      {c.convidados > 0 ? (
                        <span className="text-texto-suave"> / {c.convidados}</span>
                      ) : null}{" "}
                      <span className="text-texto-suave">confirmados</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <form action={publicado ? despublicarEvento : publicarEvento}>
                        <input type="hidden" name="eventId" value={c.id} />
                        <button
                          type="submit"
                          title={publicado ? "Despublicar" : "Publicar"}
                          aria-label={publicado ? "Despublicar" : "Publicar"}
                          className="grid size-8 place-items-center rounded-lg border border-black/10 text-texto-suave transition hover:text-ink"
                        >
                          <i
                            className={`bi ${publicado ? "bi-eye-slash" : "bi-rocket-takeoff"}`}
                            aria-hidden
                          />
                        </button>
                      </form>
                      <Link
                        href={`/painel/${c.id}/editar`}
                        className="rounded-lg bg-ink px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink/90"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
