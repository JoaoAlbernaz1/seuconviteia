"use client";
// Pix do template Editorial Moderno — bloco MINIMALISTA proprio (nao usa PixCard):
// filete fino em vez de cartao arredondado, QR opcional a esquerda, chave copiavel
// com feedback, nome do recebedor. Tudo data-driven (chave/nome/qr das props).
import { useState } from "react";
import Image from "next/image";
import { Check } from "@/components/evt/icons";

export function CemPix({
  chave,
  nome,
  qrUrl,
}: {
  chave?: string;
  nome?: string;
  qrUrl?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!chave) return;
    try {
      await navigator.clipboard.writeText(chave);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* sem clipboard: a chave continua legivel/selecionavel abaixo */
    }
  }

  if (!chave && !qrUrl) return null;

  return (
    <div className="border-t border-evt-ink/20 pt-[clamp(1.75rem,4vw,2.5rem)]">
      <p className="font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.36em] text-evt-rosa-ink">
        Presente por Pix
      </p>

      <div className="mt-6 flex flex-col gap-[clamp(1.25rem,4vw,2rem)] sm:flex-row sm:items-center">
        {qrUrl && (
          <div className="relative aspect-square w-[clamp(120px,32vw,158px)] shrink-0 overflow-hidden ring-1 ring-inset ring-[var(--line)]">
            <Image
              src={qrUrl}
              alt={`QR Code do Pix${nome ? ` de ${nome}` : ""}`}
              fill
              sizes="158px"
              className="object-cover"
            />
          </div>
        )}

        <div className="min-w-0 grow">
          {chave && (
            <>
              <p className="font-evt-util text-[0.56rem] uppercase tracking-[0.3em] text-evt-ink-soft">
                Chave
              </p>
              <p className="mt-2 break-all font-evt-body text-[1.2rem] leading-snug text-evt-ink">
                {chave}
              </p>
              <button
                type="button"
                onClick={copiar}
                aria-live="polite"
                className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 border border-evt-ink px-7 py-3 font-evt-util text-[0.66rem] font-medium uppercase tracking-[0.26em] text-evt-ink transition-colors duration-200 hover:bg-evt-ink hover:text-evt-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-evt-ivory"
              >
                {copiado ? (
                  <>
                    <Check className="h-4 w-4" /> Copiado
                  </>
                ) : (
                  "Copiar chave"
                )}
              </button>
            </>
          )}
          {nome && (
            <p className="mt-5 font-evt-body text-[1rem] text-evt-ink-soft">
              Recebedor: <span className="text-evt-ink">{nome}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
