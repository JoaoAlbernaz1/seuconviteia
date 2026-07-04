// PRESENTES — Aniversário Infantil Lúdico (página /presentes). Texto carinhoso +
// lista divertida de presentes (cartões coloridos arredondados) + Pix (PixCard).
// Seções próprias (nada de _base/secoes). Server component; o Pix (copiar chave) é
// interativo e vive no PixCard (client). Pix DIRETO — sem checkout/taxa.
import Image from "next/image";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { PixCard } from "@/components/evt/PixCard";
import {
  AIL_PAD,
  AIL_WRAP,
  AIL_RHYTHM,
  AilStyle,
  ConfettiBg,
  GiftIcon,
  StarIcon,
  HeartIcon,
} from "@/components/templates/aniversario/infantil-ludico/ludico";

export function PresentesAniversarioInfantil({ evento, nicho }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const intro = evento.presentesTexto?.trim() || t.teaserPresentes;
  const itens = evento.presentes;
  const temPix = !!(evento.pixChave?.trim() || evento.pixQrUrl?.trim());
  const temFoto = !!evento.presentesFotoUrl?.trim();

  return (
    <main className="ail-root bg-transparent">
      <AilStyle />

      {/* ── Cabeçalho ── */}
      <section className={`relative overflow-hidden ${AIL_PAD} pt-[clamp(4.5rem,11vw,7rem)] pb-[clamp(2rem,5vw,3.5rem)]`}>
        <ConfettiBg opacidade={0.45} />
        <Reveal className={`relative ${AIL_WRAP} flex flex-col items-center gap-4 text-center`}>
          <span className="ail-pulse flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}>
            <GiftIcon className="h-7 w-7" />
          </span>
          <p className="eyebrow text-evt-rosa-ink">Lista de presentes</p>
          <h1 className="font-evt-script text-[clamp(2.4rem,8vw,4rem)] leading-[1] text-evt-ink">Sua presença é o presente</h1>
          <p className="max-w-[600px] font-evt-body text-[1.2rem] leading-relaxed text-evt-ink-soft">{intro}</p>
        </Reveal>
      </section>

      {/* ── Foto opcional ── */}
      {temFoto && (
        <section className={`relative ${AIL_PAD} pb-[clamp(2rem,5vw,3rem)]`}>
          <Reveal className={`${AIL_WRAP} flex justify-center`}>
            <span className="relative block aspect-[16/10] w-full max-w-[720px] rounded-[2rem] bg-white p-[7px] shadow-[0_28px_60px_-44px_rgba(46,26,32,0.5)]" style={{ rotate: "-1deg" }}>
              <span className="relative block h-full w-full overflow-hidden rounded-[1.6rem]">
                <Image src={evento.presentesFotoUrl!} alt={evento.primeiroNome} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
              </span>
            </span>
          </Reveal>
        </section>
      )}

      {/* ── Lista divertida ── */}
      {itens.length > 0 && (
        <section className={`relative bg-evt-blush-soft/50 ${AIL_PAD} ${AIL_RHYTHM}`}>
          <ConfettiBg opacidade={0.28} />
          <div className={`relative ${AIL_WRAP}`}>
            <Reveal className="flex flex-col items-center gap-2 text-center">
              <p className="eyebrow text-evt-rosa-ink">Se quiser presentear</p>
              <h2 className="font-evt-script text-[clamp(2rem,6.5vw,3rem)] leading-[1.05] text-evt-ink">Algumas ideias</h2>
            </Reveal>
            <div className="mx-auto mt-11 grid max-w-[860px] gap-5 sm:grid-cols-2">
              {itens.map((it, i) => (
                <Reveal key={`${it.titulo}-${i}`} delay={(i % 2) * 90} className="h-full">
                  <div className="flex h-full items-start gap-4 rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-6 shadow-[0_22px_50px_-42px_rgba(46,26,32,0.5)]">
                    <span className="ail-wiggle mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] text-white" style={{ background: i % 2 === 0 ? "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" : "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa))" }}>
                      <StarIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="font-evt-body text-[1.25rem] text-evt-ink">{it.titulo}</p>
                        {it.valorLabel && <p className="font-evt-body text-[0.98rem] italic text-evt-rosa-ink">{it.valorLabel}</p>}
                      </div>
                      {it.descricao && <p className="mt-1 font-evt-body text-[0.98rem] leading-snug text-evt-ink-soft">{it.descricao}</p>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Pix ── */}
      {temPix && (
        <section className={`relative ${AIL_PAD} ${AIL_RHYTHM}`}>
          <div className={`relative ${AIL_WRAP} flex flex-col items-center gap-8`}>
            <Reveal className="flex flex-col items-center gap-2 text-center">
              <p className="eyebrow text-evt-rosa-ink">Ou, se preferir</p>
              <h2 className="font-evt-script text-[clamp(2rem,6.5vw,3rem)] leading-[1.05] text-evt-ink">Um Pix de carinho</h2>
            </Reveal>
            <Reveal delay={120} className="w-full">
              <PixCard chave={evento.pixChave} nome={evento.pixNome} qrUrl={evento.pixQrUrl} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Sem itens nem Pix → mensagem fofa ── */}
      {itens.length === 0 && !temPix && (
        <section className={`relative ${AIL_PAD} ${AIL_RHYTHM}`}>
          <Reveal className={`${AIL_WRAP} flex flex-col items-center gap-5 text-center`}>
            <span className="ail-pulse flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}>
              <HeartIcon className="h-7 w-7" />
            </span>
            <p className="max-w-[560px] font-evt-script text-[clamp(1.9rem,6vw,2.7rem)] leading-[1.15] text-evt-rosa-ink">
              A sua presença já é o maior presente!
            </p>
          </Reveal>
        </section>
      )}
    </main>
  );
}
