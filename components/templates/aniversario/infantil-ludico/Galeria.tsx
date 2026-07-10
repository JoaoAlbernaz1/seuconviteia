// GALERIA — Aniversário Infantil Lúdico (página /galeria). Grade leve e colorida
// (molduras arredondadas tortinhas) + lightbox próprio (GaleriaLudica). Seção
// própria (nada de _base/secoes). Vazio → mensagem fofa. Server component; a
// grade/lightbox interativa vive no GaleriaLudica (client).
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { GaleriaLudica } from "@/components/templates/aniversario/infantil-ludico/GaleriaLudica";
import {
  AIL_PAD,
  AIL_WRAP,
  AilStyle,
  ConfettiBg,
  CameraIcon,
  SmileIcon,
} from "@/components/templates/aniversario/infantil-ludico/ludico";

export function GaleriaAniversarioInfantil({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos;
  const vazio = fotos.length === 0;

  return (
    <main className="ail-root bg-transparent">
      <AilStyle />

      {/* ── Cabeçalho ── */}
      <section className={`relative overflow-hidden ${AIL_PAD} pt-[clamp(4.5rem,11vw,7rem)] pb-[clamp(2rem,5vw,3rem)]`}>
        <ConfettiBg opacidade={0.45} />
        <Reveal className={`relative ${AIL_WRAP} flex flex-col items-center gap-4 text-center`}>
          <span className="ail-pulse flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}>
            <CameraIcon className="h-7 w-7" />
          </span>
          <p className="eyebrow text-evt-rosa-ink">Galeria</p>
          <h1 className="font-evt-script text-[clamp(2.4rem,8vw,4rem)] leading-[1] text-evt-ink">Um cantinho de sorrisos</h1>
          <p className="max-w-[560px] font-evt-body text-[1.2rem] leading-relaxed text-evt-ink-soft">
            {vazio ? "As fotos da festa chegam em breve." : `Momentos alegres de ${evento.primeiroNome}. Toque numa foto para ver de pertinho.`}
          </p>
        </Reveal>
      </section>

      {/* ── Grade + lightbox / vazio ── */}
      <section className={`relative ${AIL_PAD} pb-[clamp(4rem,9vw,6.5rem)]`}>
        <div className={`relative ${AIL_WRAP}`}>
          {vazio ? (
            <Reveal className="flex flex-col items-center gap-5 rounded-[2.25rem] border border-[var(--line)] bg-white/70 p-[clamp(2.5rem,8vw,4.5rem)] text-center shadow-[0_30px_70px_-52px_rgba(46,26,32,0.5)]">
              <span className="ail-wiggle flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa))" }}>
                <SmileIcon className="h-7 w-7" />
              </span>
              <p className="max-w-[520px] font-evt-script text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.15] text-evt-rosa-ink">
                Ainda não tem fotos por aqui — mas logo, logo, este álbum vai encher de alegria!
              </p>
            </Reveal>
          ) : (
            <Reveal>
              <GaleriaLudica fotos={fotos} nome={evento.primeiroNome} />
            </Reveal>
          )}
        </div>
      </section>
    </main>
  );
}
