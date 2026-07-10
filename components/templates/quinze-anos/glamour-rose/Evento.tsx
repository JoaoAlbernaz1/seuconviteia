// ─────────────────────────────────────────────────────────────────────────────
// /evento — 15 anos "Glamour Rosé". CORPO PRÓPRIO (nada de _base/secoes).
// ─────────────────────────────────────────────────────────────────────────────
// Convite completo + Quando/Onde delicado + mapa + agenda + contador + traje +
// programação + CTA confirmar. Server Component; mapa e contador são client
// isolados. Gate por recursos (plano ∩ toggle).
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { MapEmbed } from "@/components/evt/MapEmbed";
import { ArrowRight } from "@/components/evt/icons";
import { QgrCountdown } from "./QgrCountdown";
import {
  QgrStyle,
  QgrHeading,
  QgrEyebrow,
  QgrDivider,
  QgrPanel,
  QgrCard,
  QgrLink,
  QgrNumeral,
  QgrSparkle,
  QgrSparkleTrio,
  QgrSparkleField,
} from "./glam";

const PAD = "px-[clamp(1.25rem,5vw,2rem)]";
const RHYTHM = "py-[clamp(4rem,9vw,7rem)]";
const WRAP = "mx-auto max-w-[1080px]";

const CHAMPAGNE_BG: React.CSSProperties = {
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--ev-blush-soft) 62%, #fffaf2) 0%, color-mix(in srgb, var(--ev-blush) 34%, #fffaf2) 100%)",
};

export function EventoQuinzeGlamour({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const local = evento.local ?? "O local";
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);
  const temProgramacao = recursos.programacao && evento.programacao.length > 0;

  return (
    <main className="bg-transparent">
      <QgrStyle />

      {/* ── O convite ─────────────────────────────────────────────────────── */}
      <section className={`relative overflow-hidden ${PAD} pb-[clamp(4rem,9vw,7rem)] pt-32`} style={CHAMPAGNE_BG}>
        <QgrSparkleField />
        <div className="relative mx-auto max-w-[720px] text-center">
          <Reveal className="flex flex-col items-center">
            <QgrEyebrow>O convite</QgrEyebrow>
            <h1 className="mt-4 font-evt-script text-[clamp(3rem,10vw,4.8rem)] leading-[1.0] text-evt-ink">
              {t.conviteTitulo}
            </h1>
            <QgrSparkleTrio className="mt-5" />
          </Reveal>
          <Reveal delay={120} className="mt-10">
            <QgrPanel autoSheen className="p-[clamp(1.9rem,6vw,3.25rem)]">
              <p className="drop-cap text-left font-evt-body text-[1.22rem] leading-relaxed text-evt-ink">
                {evento.mensagemBoasVindas ?? t.mensagemPadrao}
              </p>
              <p className="mt-9 font-evt-script text-[clamp(2rem,6vw,2.9rem)] leading-tight text-evt-rosa-ink">
                {t.assinaturaPrefixo} {nome}
              </p>
            </QgrPanel>
          </Reveal>
        </div>
      </section>

      {/* ── Quando & Onde + mapa ──────────────────────────────────────────── */}
      <section className={`bg-transparent ${PAD} ${RHYTHM}`}>
        <div className={WRAP}>
          <Reveal>
            <QgrHeading eyebrow="A celebração" titulo="Quando & Onde" />
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal className="h-full">
              <QgrCard className="flex h-full flex-col items-center p-[clamp(1.75rem,5vw,2.75rem)] text-center">
                <QgrSparkle className="qgr-twinkle h-5 w-5 text-evt-rosa" />
                <p className="mt-4 font-evt-util text-[0.62rem] uppercase tracking-[0.32em] text-evt-rosa-ink">
                  Quando
                </p>
                <p className="mt-4 font-evt-script text-[clamp(1.9rem,5vw,2.4rem)] leading-tight text-evt-ink">
                  {evento.data}
                </p>
                <p className="qgr-foil mt-1 font-evt-display text-[clamp(2.2rem,7vw,3rem)] tracking-[0.03em]">
                  {evento.horario}
                </p>
                <div className="mt-7">
                  <QgrLink href="/agenda" prefetch={false}>
                    Adicionar à agenda <ArrowRight className="h-4 w-4" />
                  </QgrLink>
                </div>
              </QgrCard>
            </Reveal>

            <Reveal delay={100} className="h-full">
              <QgrCard className="flex h-full flex-col items-center p-[clamp(1.75rem,5vw,2.75rem)] text-center">
                <QgrSparkle className="qgr-twinkle h-5 w-5 text-evt-rosa" />
                <p className="mt-4 font-evt-util text-[0.62rem] uppercase tracking-[0.32em] text-evt-rosa-ink">
                  Onde
                </p>
                <p className="mt-4 font-evt-script text-[clamp(1.9rem,5vw,2.4rem)] leading-tight text-evt-ink">
                  {local}
                </p>
                {evento.endereco && (
                  <p className="mt-2 font-evt-body text-[1.02rem] text-evt-ink-soft">{evento.endereco}</p>
                )}
                {evento.mapsLinkUrl && (
                  <div className="mt-7">
                    <QgrLink href={evento.mapsLinkUrl} target="_blank" rel="noreferrer">
                      Abrir no Maps <ArrowRight className="h-4 w-4" />
                    </QgrLink>
                  </div>
                )}
              </QgrCard>
            </Reveal>
          </div>

          {temEmbed ? (
            <Reveal delay={140} className="mt-6">
              <div className="qgr-frame rounded-[calc(var(--radius-card)+3px)] p-[3px]">
                <MapEmbed src={evento.mapsEmbedUrl!} local={local} linkUrl={evento.mapsLinkUrl} />
              </div>
            </Reveal>
          ) : (
            evento.mapsLinkUrl && (
              <Reveal delay={140} className="mt-6">
                <a
                  href={evento.mapsLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${local} no Google Maps`}
                  className="qgr-hover-sheen group relative block overflow-hidden rounded-[1.5rem] border border-[var(--line-rosa)] shadow-[0_28px_60px_-46px_rgba(184,61,107,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <div className="relative flex h-[300px] w-full flex-col items-center justify-center gap-3 [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))] sm:h-[380px]">
                    <svg viewBox="0 0 24 24" className="h-9 w-9 text-evt-rosa" fill="currentColor" aria-hidden>
                      <path d="M12 2a7 7 0 0 0-7 7c0 4.6 6.1 12.2 6.4 12.5a.8.8 0 0 0 1.2 0C13 21.2 19 13.6 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                    </svg>
                    <p className="px-6 text-center font-evt-script text-[clamp(1.6rem,4vw,2.1rem)] leading-tight text-evt-ink">
                      {local}
                    </p>
                  </div>
                  <span
                    className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-5 py-2 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink shadow-[0_8px_24px_-8px_rgba(46,26,32,0.4)]"
                    aria-hidden
                  >
                    Abrir no Google Maps →
                  </span>
                  <span className="qgr-sheen" aria-hidden />
                </a>
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* ── Contador (recurso) ────────────────────────────────────────────── */}
      {recursos.contador && (
        <section className={`relative overflow-hidden ${PAD} ${RHYTHM}`} style={CHAMPAGNE_BG}>
          <QgrSparkleField />
          <div className={`relative ${WRAP} flex flex-col items-center gap-9 text-center`}>
            <Reveal className="flex flex-col items-center">
              <QgrEyebrow>A contagem já começou</QgrEyebrow>
              <QgrDivider className="mt-5" />
            </Reveal>
            <Reveal delay={120}>
              <QgrCountdown alvoISO={evento.dataAlvoISO} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Traje (recurso implícito: campo preenchido) ───────────────────── */}
      {evento.traje && (
        <section className={`bg-transparent ${PAD} py-[clamp(3.5rem,7vw,5rem)]`}>
          <Reveal className={`${WRAP} flex flex-col items-center gap-4 text-center`}>
            <QgrEyebrow>Traje</QgrEyebrow>
            <p className="font-evt-script text-[clamp(2.2rem,7vw,3.2rem)] leading-tight text-evt-ink">
              {evento.traje}
            </p>
            <QgrSparkleTrio />
          </Reveal>
        </section>
      )}

      {/* ── Programação em cards elegantes (recurso) ──────────────────────── */}
      {temProgramacao && (
        <section className={`relative overflow-hidden ${PAD} ${RHYTHM}`} style={CHAMPAGNE_BG}>
          <div className={WRAP}>
            <Reveal>
              <QgrHeading eyebrow="A noite" titulo="Programação da festa" />
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {evento.programacao.map((item, i) => (
                <Reveal key={`${item.hora}-${item.titulo}`} delay={i * 80} className="h-full">
                  <QgrCard interactive className="flex h-full items-center gap-5 p-[clamp(1.4rem,4vw,1.9rem)]">
                    <span className="qgr-foil shrink-0 font-evt-display text-[clamp(1.9rem,7vw,2.5rem)] leading-none tabular-nums">
                      {item.hora}
                    </span>
                    <span className="h-10 w-px shrink-0 bg-evt-rosa/40" aria-hidden />
                    <span className="font-evt-body text-[1.1rem] leading-snug text-evt-ink">{item.titulo}</span>
                  </QgrCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA confirmar (recurso) ───────────────────────────────────────── */}
      {recursos.rsvp && (
        <section className={`relative overflow-hidden bg-transparent ${PAD} py-[clamp(4.5rem,9vw,7rem)]`}>
          {evento.idade != null && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.07]"
            >
              <QgrNumeral n={evento.idade} className="text-[46vw] sm:text-[30vw]" />
            </span>
          )}
          <Reveal className={`relative ${WRAP} flex flex-col items-center gap-7 text-center`}>
            <QgrDivider label={evento.idade != null ? `${evento.idade} anos` : undefined} />
            <h2 className="font-evt-script text-[clamp(2.4rem,8vw,3.6rem)] leading-[1.12] text-evt-ink">
              Você vem brilhar comigo?
            </h2>
            <ConfirmCTA />
          </Reveal>
        </section>
      )}
    </main>
  );
}
