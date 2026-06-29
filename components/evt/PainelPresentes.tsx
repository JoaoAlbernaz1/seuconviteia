"use client";
import { useState } from "react";
import Image from "next/image";
import { Check } from "@/components/evt/icons";
import type { PresenteItem } from "@/lib/convite";

/**
 * PainelPresentes — UM cartao unico com foto + lista de presentes + Pix/QR. No
 * desktop: foto a esquerda, conteudo a direita; no mobile: foto no topo. Porte
 * fiel do festa-15-maria-clara (rename `evt-`), data-driven: a lista vem de
 * `itens` (gifts do evento) em vez de hardcoded, e a foto/Pix vem das props.
 * Pix DIRETO (copiar chave) — sem checkout/taxa (feature futura, fora de escopo).
 */
export function PainelPresentes({
  fotoUrl,
  fotoPos = "50% 50%",
  nome,
  itens,
  pixChave,
  pixNome,
  pixQrUrl,
}: {
  fotoUrl?: string;
  fotoPos?: string;
  nome?: string;
  itens: PresenteItem[];
  pixChave?: string;
  pixNome?: string;
  pixQrUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const temChave = !!pixChave && pixChave.trim().length > 0;
  const temQr = !!pixQrUrl && pixQrUrl.trim().length > 0;
  const temFoto = !!fotoUrl && fotoUrl.trim().length > 0;

  async function copy() {
    if (!temChave) return;
    try {
      await navigator.clipboard.writeText(pixChave!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponivel */
    }
  }

  return (
    <div className="mx-auto max-w-[460px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-white shadow-[0_28px_60px_-44px_rgba(46,26,32,0.4)] md:max-w-[860px]">
      <div className={temFoto ? "md:grid md:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]" : ""}>
        {/* ── Foto ── */}
        {temFoto && (
          <div className="relative aspect-[4/5] w-full md:aspect-auto md:h-full md:min-h-[600px]">
            <Image
              src={fotoUrl!}
              alt={nome ?? ""}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
              style={{ objectPosition: fotoPos }}
            />
          </div>
        )}

        {/* ── Conteudo: lista + Pix ── */}
        <div className="flex flex-col p-[clamp(1.75rem,6vw,2.75rem)]">
          <p className="eyebrow text-evt-rosa-ink">Lista de presentes</p>
          <h3 className="mt-2 font-evt-script text-[clamp(2rem,6vw,2.4rem)] leading-[1.1] text-evt-ink">
            Se quiser me presentear
          </h3>

          {itens.length > 0 && (
            <ul className="mt-6 flex flex-col">
              {itens.map((it, i) => (
                <li
                  key={`${it.titulo}-${i}`}
                  className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-3 ${
                    i > 0 ? "border-t border-[var(--line)]" : ""
                  }`}
                >
                  <span className="font-evt-body text-[1.2rem] text-evt-ink">{it.titulo}</span>
                  {it.valorLabel && (
                    <span className="font-evt-body text-[0.98rem] italic text-evt-rosa-ink">{it.valorLabel}</span>
                  )}
                  {it.descricao && (
                    <span className="basis-full font-evt-body text-[0.95rem] leading-snug text-evt-ink-soft">
                      {it.descricao}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {(temQr || temChave) && (
            <div className="mt-8 border-t border-[var(--line)] pt-8 text-center">
              <p className="eyebrow text-evt-rosa-ink">Ou, se preferir</p>
              <p className="mt-2 font-evt-body text-lg italic text-evt-ink-soft">
                um Pix, com todo o meu obrigada
              </p>

              {temQr && (
                <div className="relative mx-auto mt-5 aspect-square w-[min(196px,64%)] overflow-hidden rounded-[12px] border border-[var(--line)] shadow-[0_16px_36px_-28px_rgba(46,26,32,0.5)]">
                  <Image src={pixQrUrl!} alt={`QR Code do Pix${nome ? ` de ${nome}` : ""}`} fill sizes="196px" className="object-cover" />
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
                      <Check className="h-4 w-4" /> Copiado!
                    </>
                  ) : (
                    "Copiar chave"
                  )}
                </button>
              )}

              {temQr && (
                <p className="mt-4 font-evt-util text-[0.56rem] uppercase tracking-[0.26em] text-evt-ink-soft">
                  Aponte a câmera do app do seu banco
                </p>
              )}

              {pixNome && (
                <p className="mt-3 font-evt-body text-[0.98rem] text-evt-ink-soft">
                  Recebedor: <span className="text-evt-ink">{pixNome}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
