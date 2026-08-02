"use client";
// Vitrine de presentes (estilo Wedy/iCasei): GRADE de cards, cada um com capa
// (foto do produto p/ LINK, ou capa temática p/ PIX), nome, preço e botão.
// Mantém a cara rosé do template (tokens --ev-*/font-evt-*). Cards com sombra
// difusa, hover com leve elevação (cubic-bezier), reveal escalonado.
import { useState } from "react";
import Image from "next/image";
import type { PresentearData, PresenteInterativo } from "@/lib/presentesTipos";
import { PresentearModal } from "@/components/evt/PresentearModal";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";

type ItemVisual = { nome: string; detalhe?: string; valor?: string };

const BTN =
  "inline-flex min-h-[42px] flex-none items-center justify-center rounded-full bg-evt-framboesa px-6 font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-evt-framboesa-deep hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";

const COVER_PIX =
  "linear-gradient(140deg, color-mix(in srgb, var(--ev-rosa) 26%, white), color-mix(in srgb, var(--ev-framboesa) 18%, white))";

export function VitrinePresentes({
  itens,
  presentear,
}: {
  itens: ItemVisual[];
  presentear: PresentearData;
}) {
  const [aberto, setAberto] = useState<PresenteInterativo | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((it, i) => {
          const pi = presentear.itens[i];
          if (!pi) return null;
          const esgotado = pi.esgotado;
          const pct =
            pi.pricingMode === "COTAS" && pi.quotaCount
              ? Math.min(100, Math.round((pi.cotasVendidas / pi.quotaCount) * 100))
              : null;

          return (
            <Reveal key={`${it.nome}-${i}`} delay={Math.min(i * 60, 360)}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-white shadow-[0_20px_50px_-40px_rgba(46,26,32,0.45)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_36px_74px_-42px_rgba(46,26,32,0.5)]">
                {/* ── Capa ── */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {pi.imageUrl ? (
                    <Image
                      src={pi.imageUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ background: COVER_PIX }}>
                      <Flourish className="h-5 w-24 text-evt-rosa" />
                    </div>
                  )}
                  {esgotado && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 font-evt-util text-[0.56rem] font-medium uppercase tracking-[0.14em] text-white">
                      Realizado 🎉
                    </span>
                  )}
                </div>

                {/* ── Corpo ── */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-evt-body text-[clamp(1.25rem,4vw,1.4rem)] leading-tight text-evt-ink">{it.nome}</h3>
                  {it.detalhe && (
                    <p className="mt-1 font-evt-body text-[0.98rem] italic text-evt-rosa-ink">{it.detalhe}</p>
                  )}

                  {pct !== null && pi.quotaCount && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-evt-framboesa/15">
                        <div className="h-full rounded-full bg-evt-framboesa transition-[width] duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mt-1 block font-evt-util text-[0.62rem] uppercase tracking-[0.14em] text-evt-ink-soft">
                        {pi.cotasVendidas} de {pi.quotaCount} cotas
                      </span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    {it.valor ? (
                      <span className="whitespace-nowrap font-evt-display text-[clamp(1.2rem,4vw,1.4rem)] tracking-[0.02em] text-evt-ink">
                        {it.valor}
                      </span>
                    ) : (
                      <span aria-hidden />
                    )}

                    {esgotado ? (
                      <span className="font-evt-util text-[0.62rem] uppercase tracking-[0.16em] text-evt-ink-soft">
                        Realizado
                      </span>
                    ) : (
                      <button type="button" onClick={() => setAberto(pi)} className={BTN}>
                        Presentear
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {aberto && (
        <PresentearModal
          item={aberto}
          eventId={presentear.eventId}
          simulado={presentear.simulado}
          onClose={() => setAberto(null)}
        />
      )}
    </>
  );
}
