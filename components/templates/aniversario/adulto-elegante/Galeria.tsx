// GALERIA — Aniversário Adulto Elegante. Corpo PRÓPRIO: intro editorial + mosaico
// próprio (GaleriaAdulto) com lightbox. Vazio → estado elegante (sem grade quebrada).
// Server component; a grade/lightbox (client) é isolada em GaleriaAdulto.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { GaleriaAdulto } from "@/components/templates/aniversario/adulto-elegante/GaleriaAdulto";
import {
  AaeStyle,
  aaeDelay,
  Kicker,
} from "@/components/templates/aniversario/adulto-elegante/partes";

export function GaleriaAniversarioAdulto({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];
  const temFotos = fotos.length > 0;

  return (
    <main className="relative bg-transparent px-[clamp(1.25rem,5vw,2.25rem)] pb-[clamp(5rem,10vw,8rem)] pt-[clamp(7rem,14vw,9rem)]">
      <AaeStyle />

      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mx-auto max-w-[620px] text-center">
          <p className="aae-rise" style={aaeDelay(40)}>
            <Kicker center>Momentos</Kicker>
          </p>
          <h1
            className="aae-rise mt-6 font-evt-display uppercase leading-[1.04] tracking-[0.02em] text-evt-ink text-[clamp(2rem,5.4vw,3rem)]"
            style={aaeDelay(120)}
          >
            A galeria
          </h1>
          <p
            className="aae-rise mt-6 font-evt-body text-[clamp(1.2rem,3vw,1.45rem)] leading-relaxed text-evt-ink-soft"
            style={aaeDelay(220)}
          >
            Um pedacinho dessa história em fotos. Toque para ver de pertinho.
          </p>
        </div>

        {temFotos ? (
          <Reveal delay={140} className="mt-14">
            <GaleriaAdulto fotos={fotos} nome={evento.primeiroNome} />
          </Reveal>
        ) : (
          <Reveal className="mx-auto mt-16 flex max-w-[560px] flex-col items-center gap-6 text-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-full border border-[var(--line)] [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-evt-rosa" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="1.6" />
                <path d="m4 17 5-4 4 3 3-2 4 3" />
              </svg>
            </div>
            <p className="font-evt-body text-[1.25rem] italic leading-relaxed text-evt-ink-soft">
              As fotos chegam em breve.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
