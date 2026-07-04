// GALERIA — Aniversário · Tropical Festa. Corpo PRÓPRIO: grade VIBRANTE (molduras
// de gradiente + lightbox) num arquivo client; vazio → mensagem animada. Server
// component; gate do recurso é feito na rota (/galeria). Data-driven por `EventoFesta`.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { AtfGaleriaGrid } from "@/components/templates/aniversario/tropical-festa/GaleriaGrid";
import {
  ATF_PAD,
  ATF_WRAP,
  AtfStyle,
  AtfHeading,
  Leaf,
  IconCamera,
} from "@/components/templates/aniversario/tropical-festa/shared";

export function GaleriaAniversarioTropical({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];
  return (
    <main className="bg-evt-ivory">
      <AtfStyle />
      <section className={`relative overflow-hidden bg-evt-ivory ${ATF_PAD} pb-[clamp(5rem,10vw,8rem)] pt-32`}>
        <Leaf className="atf-sway pointer-events-none absolute -left-6 top-24 h-24 w-auto text-evt-rose/40" />
        <Leaf className="atf-sway pointer-events-none absolute -right-4 top-36 h-20 w-auto rotate-[150deg] text-evt-rose/30" style={{ animationDelay: "0.7s" }} />

        <div className={ATF_WRAP}>
          <Reveal className="flex flex-col items-center text-center">
            <AtfHeading eyebrow="Galeria" title="Momentos da festa" />
          </Reveal>
          <Reveal delay={140}>
            <p className="mx-auto mt-6 max-w-[520px] text-center font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
              Um pedacinho dessa história em fotos. Toque em qualquer uma para ver de pertinho.
            </p>
          </Reveal>

          {fotos.length > 0 ? (
            <Reveal delay={220} className="mt-12">
              <AtfGaleriaGrid fotos={fotos} nome={evento.primeiroNome} />
            </Reveal>
          ) : (
            <Reveal delay={220} className="mt-16 flex flex-col items-center gap-5 text-center">
              <span
                className="atf-bob flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_20px_44px_-24px_rgba(0,0,0,0.5)]"
                style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa) 60%, var(--ev-framboesa-deep))" }}
              >
                <IconCamera className="h-9 w-9" />
              </span>
              <p className="max-w-[480px] font-evt-script text-[clamp(2rem,6.5vw,3rem)] leading-tight text-evt-framboesa">
                As fotos da festa chegam em breve!
              </p>
              <p className="max-w-[420px] font-evt-body text-[1.1rem] leading-relaxed text-evt-ink-soft">
                Volte depois para reviver cada momento por aqui.
              </p>
            </Reveal>
          )}
        </div>
      </section>
    </main>
  );
}
