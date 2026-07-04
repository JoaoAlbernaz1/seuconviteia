"use client";
// Cartão Pix VIBRANTE próprio do Tropical Festa (copiar chave com feedback). Usado
// na /presentes. QR opcional, chave copiável, recebedor. Estilo festivo (moldura de
// gradiente + medalhão), tinge por qualquer paleta via tokens --ev-*.
import { useState } from "react";
import Image from "next/image";
import { Check } from "@/components/evt/icons";
import { IconGift } from "@/components/templates/aniversario/tropical-festa/shared";

export function AtfPix({
  chave,
  nome,
  qrUrl,
}: {
  chave?: string;
  nome?: string;
  qrUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const temChave = !!chave && chave.trim().length > 0;
  const temQr = !!qrUrl && qrUrl.trim().length > 0;

  async function copy() {
    if (!temChave) return;
    try {
      await navigator.clipboard.writeText(chave!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponível — o usuário ainda lê/seleciona a chave */
    }
  }

  return (
    <div
      className="relative mx-auto max-w-[460px] overflow-hidden rounded-[1.6rem] p-1.5 shadow-[0_30px_66px_-40px_rgba(46,26,32,0.5)]"
      style={{ background: "linear-gradient(150deg, var(--ev-rose), var(--ev-framboesa) 60%, var(--ev-framboesa-deep))" }}
    >
      <div className="rounded-[1.25rem] bg-white p-[clamp(1.75rem,6vw,2.5rem)] text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa-deep))" }}>
          <IconGift className="h-7 w-7" />
        </span>

        {temQr && (
          <div className="mb-7">
            <div className="relative mx-auto aspect-square w-[min(224px,72%)] overflow-hidden rounded-[16px] border border-[var(--line)] shadow-[0_18px_40px_-28px_rgba(46,26,32,0.5)]">
              <Image src={qrUrl!} alt={`QR Code do Pix${nome ? ` de ${nome}` : ""}`} fill sizes="224px" className="object-cover" />
            </div>
            <p className="mt-4 font-evt-util text-[0.56rem] uppercase tracking-[0.28em] text-evt-ink-soft">
              Aponte a câmera do app do seu banco
            </p>
          </div>
        )}

        {temChave && (
          <>
            <p className="font-evt-util text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-evt-rosa-ink">Chave Pix</p>
            <p className="mt-3 break-all font-evt-body text-[1.35rem] leading-snug text-evt-ink">{chave}</p>
            <button
              type="button"
              onClick={copy}
              className="mt-6 inline-flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-evt-framboesa px-7 py-3 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_16px_38px_-20px_rgba(0,0,0,0.5)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-evt-framboesa-deep active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
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
          </>
        )}

        {nome && (
          <p className="mt-6 font-evt-body text-base text-evt-ink-soft">
            Recebedor: <span className="text-evt-ink">{nome}</span>
          </p>
        )}
      </div>
    </div>
  );
}
