"use client";
// PainelPresentes — UM cartão único (foto + lista de presentes + Pix), clone
// fiel do festa-15-maria-clara, data-driven. Quando recebe `presentear`, os itens
// ficam CLICÁVEIS e abrem o fluxo de Pix via plataforma (taxa + cofre); sem ele,
// mantém o comportamento antigo (Pix direto: copiar chave). Tokens `--ev-*`.
import { useState } from "react";
import Image from "next/image";
import type { PresentearData, PresenteInterativo } from "@/lib/presentesTipos";
import { PresentearModal } from "@/components/evt/PresentearModal";

export function PainelPresentes({
  fotoUrl,
  fotoPos = "50% 50%",
  itens,
  pixChave,
  pixNome,
  pixQrUrl,
  presentear,
}: {
  fotoUrl?: string;
  fotoPos?: string;
  itens: { nome: string; detalhe?: string; valor?: string }[];
  pixChave?: string;
  pixNome?: string;
  pixQrUrl?: string;
  presentear?: PresentearData;
}) {
  const [copied, setCopied] = useState(false);
  const [aberto, setAberto] = useState<PresenteInterativo | null>(null);
  const temChave = !!pixChave && pixChave.trim().length > 0;
  const temQr = !!pixQrUrl && pixQrUrl.trim().length > 0;
  // Com fluxo via plataforma ligado, o Pix "direto" (copiar chave) some.
  const interativo = !!presentear && presentear.itens.length > 0;
  const mostrarPixDireto = !interativo && (temChave || temQr);

  async function copy() {
    if (!temChave) return;
    try {
      await navigator.clipboard.writeText(pixChave!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponível */
    }
  }

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
          <h3 className="mt-2 font-evt-script text-[clamp(2.9rem,7.5vw,3.4rem)] leading-[1.1] text-evt-ink">
            Se quiser me presentear
          </h3>

          <ul className="mt-6 flex flex-col">
            {itens.map((it, i) => {
              const pi = presentear?.itens[i];
              const ehLink = pi?.tipo === "LINK";
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
                  {ehLink && pi?.imageUrl && (
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
                    {ehLink ? (
                      <a
                        href={pi?.storeUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] flex-none items-center justify-center rounded-full bg-evt-framboesa px-5 font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white transition-[transform,background-color] duration-200 hover:bg-evt-framboesa-deep hover:-translate-y-0.5"
                      >
                        Comprar na loja
                      </a>
                    ) : interativo ? (
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
                    ) : (
                      (temChave || temQr) && (
                        <a
                          href="#presentear-pix"
                          className="inline-flex min-h-[40px] flex-none items-center justify-center rounded-full bg-evt-framboesa px-5 font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white transition-[transform,background-color] duration-200 hover:bg-evt-framboesa-deep hover:-translate-y-0.5"
                        >
                          Presentear
                        </a>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ── Pix DIRETO (fallback do modelo antigo) — só sem fluxo via plataforma ── */}
          {mostrarPixDireto && (
            <div id="presentear-pix" className="mt-8 scroll-mt-24 border-t border-[var(--line)] pt-8 text-center">
              <p className="eyebrow text-evt-rosa-ink">Ou, se preferir</p>
              <p className="mt-2 font-evt-body text-[clamp(1.2rem,4.5vw,1.4rem)] italic text-evt-ink-soft">
                um Pix, com todo o meu obrigada
              </p>

              {temQr && (
                <div className="relative mx-auto mt-5 aspect-square w-[min(196px,64%)] overflow-hidden rounded-[12px] border border-[var(--line)] shadow-[0_16px_36px_-28px_rgba(46,26,32,0.5)]">
                  <Image src={pixQrUrl!} alt="QR Code do Pix" fill sizes="196px" className="object-cover" />
                </div>
              )}

              {temChave && (
                <button
                  type="button"
                  onClick={copy}
                  className="mt-6 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-evt-framboesa px-7 py-3 font-evt-util text-[0.7rem] font-medium uppercase tracking-[0.24em] text-white transition-[transform,background-color] duration-200 hover:bg-evt-framboesa-deep hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2"
                  aria-live="polite"
                >
                  {copied ? (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    "Copiar chave"
                  )}
                </button>
              )}

              {temQr && (
                <p className="mt-4 font-evt-util text-[0.7rem] uppercase tracking-[0.2em] text-evt-ink-soft">
                  Aponte a câmera do app do seu banco
                </p>
              )}

              {pixNome && (
                <p className="mt-3 font-evt-body text-[1.08rem] text-evt-ink-soft">
                  Recebedor: <span data-live="pix-nome" className="text-evt-ink">{pixNome}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {aberto && presentear && (
        <PresentearModal item={aberto} eventId={presentear.eventId} onClose={() => setAberto(null)} />
      )}
    </div>
  );
}
