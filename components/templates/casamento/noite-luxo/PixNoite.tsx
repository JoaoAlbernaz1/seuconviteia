"use client";
// Widget de Pix DARK do template Noite Luxo. Mesma lógica do PixCard claro
// (copiar chave + feedback), estilizado escuro: card grafite, filete dourado,
// QR opcional emoldurado, botão dourado premium.
import { useState } from "react";
import Image from "next/image";
import { Check } from "@/components/evt/icons";

const INK = "#F5EBD2";

export function PixNoite({
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
      /* clipboard indisponível — o convidado ainda lê/seleciona a chave */
    }
  }

  if (!chave && !qrUrl && !nome) return null;

  return (
    <div
      className="relative mx-auto max-w-[480px] overflow-hidden rounded-[18px] px-[clamp(1.75rem,6vw,2.75rem)] py-[clamp(2rem,7vw,3rem)] text-center"
      style={{
        background: "linear-gradient(180deg, #1F1810 0%, #14100A 100%)",
        border: "1px solid color-mix(in srgb, var(--ev-rosa) 30%, transparent)",
        boxShadow:
          "0 40px 90px -60px rgba(0,0,0,0.95), inset 0 1px 0 rgba(245,235,210,0.05)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--ev-rosa) 16%, transparent), transparent 72%)",
        }}
      />

      <div className="relative">
        {qrUrl && (
          <div className="mb-7">
            <div
              className="relative mx-auto aspect-square w-[min(230px,72%)] overflow-hidden rounded-[14px]"
              style={{
                border: "1px solid color-mix(in srgb, var(--ev-rosa) 40%, transparent)",
                background: "#0B0906",
              }}
            >
              <Image
                src={qrUrl}
                alt={`QR Code do Pix${nome ? ` de ${nome}` : ""}`}
                fill
                sizes="230px"
                className="object-cover"
              />
            </div>
            <p
              className="mt-4 font-evt-util text-[0.56rem] uppercase tracking-[0.28em]"
              style={{ color: "rgba(245,235,210,0.55)" }}
            >
              Aponte a câmera do app do seu banco
            </p>
          </div>
        )}

        {chave && (
          <>
            <p
              className="font-evt-util text-[0.72rem] font-medium uppercase tracking-[0.4em]"
              style={{ color: "var(--ev-rose)" }}
            >
              Chave Pix
            </p>
            <p
              className="mt-3 break-all font-evt-body text-[clamp(1.2rem,5vw,1.4rem)] leading-snug"
              style={{ color: INK }}
            >
              {chave}
            </p>

            <button
              type="button"
              onClick={copy}
              aria-live="polite"
              className="cnl-pixbtn mt-7 inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-3.5 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.24em] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ev-rose)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110C] sm:w-auto"
              style={{
                background:
                  "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa) 55%, var(--ev-framboesa-deep))",
                color: "#1A130A",
                boxShadow:
                  "0 18px 44px -22px color-mix(in srgb, var(--ev-rosa) 75%, transparent)",
              }}
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
          <p className="mt-6 font-evt-body text-base" style={{ color: "rgba(245,235,210,0.72)" }}>
            Recebedor: <span style={{ color: INK }}>{nome}</span>
          </p>
        )}
      </div>
    </div>
  );
}
