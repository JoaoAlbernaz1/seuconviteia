"use client";

// Recursos do site (cliente): cada recurso liberado pelo plano vira um card com
// toggle; ligar/desligar reflete NA HORA no preview. Os recursos que o plano
// ainda trava aparecem como cards tracejados que levam para "Ver planos".
// Salvar chama a server action `salvarRecursos`.
import { useState } from "react";
import Link from "next/link";
import { RECURSOS_SITE, type RecursoSite, type TogglesSite } from "@/lib/recursos";
import { PLAN_ORDER, planoPermite, rotuloPlano, type Plan } from "@/lib/plans";
import type { RascunhoPreview } from "@/lib/previewEvento";
import { salvarRecursos } from "../../acoes";
import { PreviewSite } from "../../_ui/PreviewSite";
import { BTN_PRIMARIO, CARD } from "../../_ui/estilos";

export function RecursosCliente({
  eventId,
  plan,
  voltar,
  host,
  rascunhoBase,
  inicial,
}: {
  eventId: string;
  plan: Plan;
  voltar: string;
  host: string;
  rascunhoBase: RascunhoPreview;
  inicial: TogglesSite;
}) {
  const [toggles, setToggles] = useState<TogglesSite>(inicial);

  const permitidos = RECURSOS_SITE.filter(
    (d) => d.gate === null || planoPermite(plan, d.gate),
  );
  const bloqueados = RECURSOS_SITE.filter(
    (d) => d.gate !== null && !planoPermite(plan, d.gate),
  );
  // Menor plano que libera tudo que está travado hoje (para o rótulo do upsell).
  const planoLibera = bloqueados.length
    ? PLAN_ORDER.find((p) =>
        bloqueados.every((d) => d.gate === null || planoPermite(p, d.gate)),
      )
    : undefined;

  // O preview espelha o site publicado: fica OFF o que o plano trava OU o que o
  // profissional desligou aqui.
  const recursosOff = RECURSOS_SITE.filter(
    (d) =>
      (d.gate !== null && !planoPermite(plan, d.gate)) || !toggles[d.key],
  ).map((d) => d.key);

  const rascunhoJson = JSON.stringify({ ...rascunhoBase, recursosOff });

  function alternar(key: RecursoSite) {
    setToggles((t) => ({ ...t, [key]: !t[key] }));
  }

  return (
    <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_0.82fr] lg:gap-7">
      <form action={salvarRecursos} className={`${CARD} flex flex-col overflow-hidden`}>
        <div className="relative p-4">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg,#6D28D9 0%,#9B4DCA 46%,#E27D96 100%)" }}
          />
          <i className="bi bi-toggles absolute right-4 top-3.5 text-[20px] text-white/35" aria-hidden />
          <div className="relative">
            <div className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/70">
              Recursos do site
            </div>
            <div className="mt-1 font-display text-[19px] font-semibold leading-tight text-white">
              O que o site vai ter
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-4 sm:p-5">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="voltar" value={voltar} />
        {RECURSOS_SITE.map((d) => (
          <input
            key={d.key}
            type="hidden"
            name={`rec_${d.key}`}
            value={toggles[d.key] ? "on" : "off"}
          />
        ))}

        {permitidos.map((d) => {
          const on = toggles[d.key];
          return (
            <button
              key={d.key}
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={d.titulo}
              onClick={() => alternar(d.key)}
              className={`flex cursor-pointer items-center gap-3.5 rounded-[13px] border border-scv-line p-3.5 text-left transition ${
                on ? "bg-scv-card" : "bg-scv-soft"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[14.5px] font-semibold ${
                    on ? "text-scv-ink" : "text-scv-faint"
                  }`}
                >
                  {d.titulo}
                </span>
                <span className="mt-0.5 block text-[12px] text-scv-faint">
                  {d.descricao}
                </span>
              </span>
              <span
                className={`relative h-[25px] w-[44px] shrink-0 rounded-full transition ${
                  on ? "bg-teal" : "bg-scv-dash"
                }`}
                aria-hidden
              >
                <span
                  className={`absolute top-[3px] size-[19px] rounded-full bg-white shadow-sm transition-all ${
                    on ? "left-[22px]" : "left-[3px]"
                  }`}
                />
              </span>
            </button>
          );
        })}

        {bloqueados.length && planoLibera ? (
          <>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-scv-faint">
                Com o plano {rotuloPlano(planoLibera)}
              </span>
              <Link
                href="/painel/plano"
                className="shrink-0 text-[12.5px] font-semibold text-scv-violet transition hover:brightness-110"
              >
                Ver planos →
              </Link>
            </div>

            {bloqueados.map((d) => (
              <Link
                key={d.key}
                href="/painel/plano"
                className="flex items-center gap-3.5 rounded-2xl border border-dashed border-scv-dash bg-scv-field p-4 transition hover:border-violeta"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-scv-soft text-scv-muted">
                  <i className="bi bi-lock" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-scv-muted">
                    {d.titulo}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-scv-faint">
                    {d.descricao}
                  </span>
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold text-scv-violet">
                  Desbloquear
                </span>
              </Link>
            ))}
          </>
        ) : null}

        <button type="submit" className={`${BTN_PRIMARIO} mt-3 w-full`}>
          Salvar
        </button>
        </div>
      </form>

      <div className="lg:sticky lg:top-[86px]">
        <PreviewSite
          rascunhoJson={rascunhoJson}
          pagina="inicio"
          host={host}
          rotulo="O site muda na hora"
        />
      </div>
    </div>
  );
}
