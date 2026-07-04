// GALERIA — 15 anos Fashion Editorial. Grade EDITORIAL (mosaico assimetrico) +
// lightbox (GaleriaFashion, client). Vazio -> estado elegante. Server component.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { GaleriaFashion } from "@/components/templates/quinze-anos/fashion-editorial/GaleriaFashion";
import {
  QFE_PAD,
  QFE_WRAP,
  Kicker,
  MagTitle,
} from "@/components/templates/quinze-anos/fashion-editorial/ui";

export function GaleriaQuinzeFashion({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];

  return (
    <main className={`bg-transparent ${QFE_PAD} pb-[clamp(4.5rem,10vw,8rem)] pt-32`}>
      <div className={QFE_WRAP}>
        {/* ── MASTHEAD editorial. ── */}
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[24ch]">
            <Kicker>Editorial</Kicker>
            <MagTitle size="xl" className="mt-6">
              O ensaio
            </MagTitle>
          </div>
          <p className="max-w-[34ch] font-evt-body text-[1.1rem] leading-relaxed text-evt-ink-soft">
            Um pedacinho dessa história em imagens. Toque para ver de pertinho.
          </p>
        </Reveal>

        <div className="mt-6 h-px w-full bg-[var(--line)]" aria-hidden />

        {/* ── GRADE + LIGHTBOX, ou vazio elegante. ── */}
        {fotos.length > 0 ? (
          <Reveal delay={120} className="mt-10">
            <GaleriaFashion fotos={fotos} nome={evento.primeiroNome} />
          </Reveal>
        ) : (
          <Reveal className="mt-16 flex flex-col items-center gap-6 py-[clamp(3rem,8vw,6rem)] text-center">
            <Flourish className="h-6 w-32 text-evt-rosa" />
            <MagTitle size="md" className="max-w-[16ch]">
              O editorial chega em breve
            </MagTitle>
            <p className="max-w-[40ch] font-evt-body text-[1.1rem] leading-relaxed text-evt-ink-soft">
              As fotos do ensaio estão a caminho. Volte logo para ver tudo.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
