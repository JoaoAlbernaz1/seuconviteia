// /presentes — Casamento · Noite Luxo (ESCURO NO SITE INTEIRO). Texto + lista de
// presentes em cards escuros com filete dourado + widget de Pix escuro (PixNoite).
// Seções PRÓPRIAS deste template (nada de _base / PainelPresentes claro).
import Image from "next/image";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { PixNoite } from "@/components/templates/casamento/noite-luxo/PixNoite";
import {
  CNL,
  CNL_PAD,
  CnlStyles,
  CnlHeading,
  CnlCard,
  CnlEyebrow,
  CnlDivider,
} from "@/components/templates/casamento/noite-luxo/ui";

export function PresentesCasamentoNoite({ evento }: PaginaTemplateProps) {
  const itens = evento.presentes ?? [];
  const temPix = !!(evento.pixChave || evento.pixQrUrl || evento.pixNome);
  const foto = evento.presentesFotoUrl;

  return (
    <main
      className={`relative ${CNL_PAD} pb-[clamp(5rem,11vw,8rem)] pt-32`}
      style={{ background: CNL.bg, color: CNL.ink }}
    >
      <CnlStyles />

      <div className="mx-auto max-w-[900px]">
        <Reveal>
          <CnlHeading eyebrow="Presentes" title="Sua presença é o presente" />
        </Reveal>
        <Reveal delay={120}>
          <p
            className="mx-auto mt-8 max-w-[560px] text-center font-evt-body text-[clamp(1.1rem,3.4vw,1.24rem)] leading-relaxed"
            style={{ color: CNL.soft }}
          >
            {evento.presentesTexto ??
              "O maior presente é ter você celebrando conosco. Mas, se quiser deixar um carinho a mais, reunimos algumas ideias — e a nossa chave Pix também está aqui."}
          </p>
        </Reveal>

        {/* Foto emoldurada (opcional) */}
        {foto && (
          <Reveal delay={160} className="mx-auto mt-12 max-w-[560px]">
            <div
              className="relative overflow-hidden rounded-[16px]"
              style={{
                border: "1px solid color-mix(in srgb, var(--ev-rosa) 30%, transparent)",
                boxShadow: "0 40px 90px -60px rgba(0,0,0,0.95)",
              }}
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={foto}
                  alt={`Foto de ${evento.primeiroNome}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover opacity-95"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(180deg, transparent 55%, rgba(11,9,6,0.55))" }}
                />
              </div>
            </div>
          </Reveal>
        )}

        {/* Lista de presentes em cards escuros dourados */}
        {itens.length > 0 && (
          <section className="mt-16">
            <Reveal className="flex flex-col items-center gap-4 text-center">
              <CnlEyebrow>Lista de presentes</CnlEyebrow>
              <CnlDivider w="3.5rem" />
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {itens.map((item, i) => (
                <Reveal key={`${item.titulo}-${i}`} delay={(i % 2) * 90} className="h-full">
                  <CnlCard className="flex h-full flex-col p-[clamp(1.5rem,4.5vw,2rem)]">
                    <div className="flex items-start justify-between gap-4">
                      <h3
                        className="font-evt-body text-[clamp(1.3rem,4.5vw,1.55rem)] leading-snug"
                        style={{ color: CNL.ink }}
                      >
                        {item.titulo}
                      </h3>
                      {item.valorLabel && (
                        <span
                          className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-evt-util text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
                          style={{
                            color: "var(--ev-rose)",
                            border: "1px solid color-mix(in srgb, var(--ev-rosa) 45%, transparent)",
                            background: "color-mix(in srgb, var(--ev-rosa) 8%, transparent)",
                          }}
                        >
                          {item.valorLabel}
                        </span>
                      )}
                    </div>
                    {item.descricao && (
                      <p
                        className="mt-3 font-evt-body text-[1.02rem] leading-relaxed"
                        style={{ color: CNL.soft }}
                      >
                        {item.descricao}
                      </p>
                    )}
                  </CnlCard>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Pix — widget escuro */}
        {temPix && (
          <section className="mt-16">
            <Reveal className="flex flex-col items-center gap-4 text-center">
              <CnlEyebrow>Presentear com Pix</CnlEyebrow>
              <CnlDivider w="3.5rem" />
              <p
                className="mt-1 max-w-[440px] font-evt-body text-[1.05rem] leading-relaxed"
                style={{ color: CNL.soft }}
              >
                Se preferir, envie seu carinho pela chave Pix abaixo.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-10">
              <PixNoite chave={evento.pixChave} nome={evento.pixNome} qrUrl={evento.pixQrUrl} />
            </Reveal>
          </section>
        )}

        {/* Vazio elegante */}
        {itens.length === 0 && !temPix && (
          <Reveal delay={160}>
            <p className="mt-16 text-center font-evt-body text-[1.1rem]" style={{ color: CNL.mute }}>
              Em breve, compartilharemos aqui as formas de presentear.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
