// /galeria — Casamento · Noite Luxo (ESCURO NO SITE INTEIRO). Grade escura +
// lightbox próprio (LightboxNoite). Vazio → mensagem elegante sobre fundo grafite
// com brilho dourado. Seções PRÓPRIAS deste template (nada de _base / Galeria clara).
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { LightboxNoite } from "@/components/templates/casamento/noite-luxo/LightboxNoite";
import {
  CNL,
  CNL_PAD,
  CnlStyles,
  CnlHeading,
} from "@/components/templates/casamento/noite-luxo/ui";

export function GaleriaCasamentoNoite({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];

  return (
    <main
      className={`relative ${CNL_PAD} pb-[clamp(5rem,11vw,8rem)] pt-32`}
      style={{ background: CNL.bg, color: CNL.ink }}
    >
      <CnlStyles />

      <div className="mx-auto max-w-[1120px]">
        <Reveal>
          <CnlHeading eyebrow="Galeria" title="Momentos" />
        </Reveal>
        <Reveal delay={120}>
          <p
            className="mx-auto mt-8 max-w-[500px] text-center font-evt-body text-[clamp(1.1rem,3.4vw,1.24rem)] leading-relaxed"
            style={{ color: CNL.soft }}
          >
            Um pedacinho dessa história sob a luz das velas. Toque para ver de
            pertinho.
          </p>
        </Reveal>

        {fotos.length > 0 ? (
          <Reveal delay={200} className="mt-14">
            <LightboxNoite fotos={fotos} nome={evento.primeiroNome} />
          </Reveal>
        ) : (
          <Reveal delay={160} className="mt-14">
            <div
              className="mx-auto flex min-h-[320px] max-w-[720px] flex-col items-center justify-center gap-5 rounded-[18px] px-8 text-center"
              style={{
                border: "1px solid color-mix(in srgb, var(--ev-rosa) 24%, transparent)",
                background:
                  "radial-gradient(120% 90% at 50% 22%, color-mix(in srgb, var(--ev-rosa) 14%, transparent), transparent 62%), #14110C",
              }}
            >
              <span className="rotate-45 text-[0.7rem]" style={{ color: "var(--ev-rosa)" }} aria-hidden>
                ◆
              </span>
              <p className="cnl-gold font-evt-script text-[clamp(2rem,7vw,3rem)] leading-tight">
                As fotos chegam em breve
              </p>
              <p className="max-w-[420px] font-evt-body text-[1.05rem] leading-relaxed" style={{ color: CNL.mute }}>
                Estamos preparando um álbum à altura da noite. Volte logo para
                reviver cada momento.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </main>
  );
}
