"use client";
import { useState } from "react";
import Image from "next/image";
import { Check } from "@/components/evt/icons";

/**
 * PixCard — cartao claro com a chave Pix: QR opcional, chave copiavel (feedback
 * "copiado!"), nome do recebedor. Porte fiel do festa-15-maria-clara (rename
 * `evt-`). Data-driven: tudo vem das props (`chave`/`nome`/`qrUrl`).
 */
export function PixCard({
  chave,
  nome,
  qrUrl,
}: {
  chave?: string;
  nome?: string;
  qrUrl?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!chave) return;
    try {
      await navigator.clipboard.writeText(chave);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponivel — o usuario ainda le/seleciona a chave */
    }
  }

  return (
    <div className="mx-auto max-w-[460px] rounded-[var(--radius-card)] border border-[var(--line)] bg-white p-[clamp(1.75rem,6vw,2.5rem)] text-center shadow-[0_22px_50px_-40px_rgba(46,26,32,0.35)]">
      {qrUrl && (
        <div className="mb-7">
          <div className="relative mx-auto aspect-square w-[min(230px,72%)] overflow-hidden rounded-[16px] border border-[var(--line)] shadow-[0_20px_44px_-30px_rgba(46,26,32,0.5)]">
            <Image
              src={qrUrl}
              alt={`QR Code do Pix${nome ? ` de ${nome}` : ""}`}
              fill
              sizes="230px"
              className="object-cover"
            />
          </div>
          <p className="mt-4 font-evt-util text-[0.58rem] uppercase tracking-[0.28em] text-evt-ink-soft">
            Aponte a câmera do app do seu banco
          </p>
        </div>
      )}

      {chave && (
        <>
          <p className="eyebrow text-evt-rosa-ink">Chave Pix</p>
          <p className="mt-3 break-all font-evt-body text-[1.35rem] leading-snug text-evt-ink">{chave}</p>

          <button
            type="button"
            onClick={copy}
            className="mt-6 inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-evt-framboesa px-7 py-3 font-evt-util text-[0.7rem] font-medium uppercase tracking-[0.24em] text-white shadow-[0_14px_34px_-20px_rgba(206,87,139,0.55)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-evt-framboesa-deep hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
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
  );
}
