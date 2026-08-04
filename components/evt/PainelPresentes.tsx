"use client";
// PainelPresentes — UM cartão único (foto + lista de presentes), data-driven.
// Presentes em DINHEIRO passam SEMPRE pela plataforma: com `presentear`, os
// itens ficam clicáveis e abrem o Pix da plataforma (o valor cai na CARTEIRA do
// dono, que resgata no painel). A chave Pix do dono NUNCA aparece no site.
import { useState } from "react";
import Image from "next/image";
import type { PresentearData, PresenteInterativo } from "@/lib/presentesTipos";
import { PresentearModal } from "@/components/evt/PresentearModal";

export function PainelPresentes({
  fotoUrl,
  fotoPos = "50% 50%",
  itens,
  presentear,
}: {
  fotoUrl?: string;
  fotoPos?: string;
  itens: { nome: string; detalhe?: string; valor?: string }[];
  presentear?: PresentearData;
}) {
  const [aberto, setAberto] = useState<PresenteInterativo | null>(null);
  const interativo = !!presentear && presentear.itens.length > 0;

  return (
    <div className="mx-auto max-w-[460px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-white shadow-[0_28px_60px_-44px_rgba(46,26,32,0.4)] md:max-w-[860px]">
      <div className="md:grid md:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
        {/* ── Foto ── */}
        {fotoUrl && (
          <div className="relative aspect-[4/5] w-full md:aspect-auto md:h-full md:min-h-[600px]">
            <Image
              src={fotoUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
              style={{ objectPosition: fotoPos }}
            />
          </div>
        )}

        {/* ── Conteúdo: lista + Pix ── */}
        <div className="flex flex-col p-[clamp(1.75rem,6vw,2.75rem)]">
          <p className="eyebrow text-evt-rosa-ink">Lista de presentes</p>
          <h3 className="mt-2 font-evt-script text-[calc(clamp(2.9rem,7.5vw,3.4rem)*var(--ev-fonte-fator,1))] leading-[1.1] text-evt-ink">
            Se quiser me presentear
          </h3>

          <ul className="mt-6 flex flex-col">
            {itens.map((it, i) => {
              const pi = presentear?.itens[i];
              const esgotado = pi?.esgotado ?? false;
              const cotasInfo =
                pi?.pricingMode === "COTAS" && pi.quotaCount
                  ? `${pi.cotasVendidas} de ${pi.quotaCount} cotas`
                  : undefined;
              return (
                <li
                  key={`${it.nome}-${i}`}
                  className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                    i > 0 ? "border-t border-[var(--line)]" : ""
                  }`}
                >
                  {pi?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pi.imageUrl}
                      alt=""
                      className="h-16 w-16 flex-none rounded-[12px] border border-[var(--line)] object-cover"
                    />
                  )}
                  <div className="min-w-0 sm:flex-1">
                    <span className="font-evt-body text-[clamp(1.35rem,5vw,1.6rem)] text-evt-ink">{it.nome}</span>
                    {it.detalhe && (
                      <span className="mt-0.5 block font-evt-body text-[clamp(1rem,3.6vw,1.1rem)] italic text-evt-rosa-ink">
                        {it.detalhe}
                      </span>
                    )}
                    {cotasInfo && (
                      <span className="mt-1 block font-evt-util text-[0.66rem] uppercase tracking-[0.16em] text-evt-ink-soft">
                        {cotasInfo}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-none items-center justify-between gap-4 sm:justify-end">
                    {it.valor && (
                      <span className="whitespace-nowrap font-evt-display text-[clamp(1.25rem,4.4vw,1.5rem)] tracking-[0.02em] text-evt-ink">
                        {it.valor}
                      </span>
                    )}
                    {interativo ? (
                      esgotado ? (
                        <span className="inline-flex min-h-[40px] flex-none items-center justify-center rounded-full bg-black/5 px-5 font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.16em] text-evt-ink-soft">
                          Realizado 🎉
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => pi && setAberto(pi)}
                          className="inline-flex min-h-[40px] flex-none items-center justify-center rounded-full bg-evt-framboesa px-5 font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white transition-[transform,background-color] duration-200 hover:bg-evt-framboesa-deep hover:-translate-y-0.5"
                        >
                          Presentear
                        </button>
                      )
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

        </div>
      </div>

      {aberto && presentear && (
        <PresentearModal
          item={aberto}
          eventId={presentear.eventId}
          simulado={presentear.simulado}
          onClose={() => setAberto(null)}
        />
      )}
    </div>
  );
}
