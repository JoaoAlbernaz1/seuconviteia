// EVENTO — Aniversário Adulto Elegante. Corpo PRÓPRIO: convite curto + Quando/Onde
// em cartões modernos + mapa (embed ou card-link) + agenda + contador discreto +
// traje + programação (timeline própria) + CTA confirmar. Tudo gated por recurso.
// Server component; mapa/contador (client) isolados. pt largo para limpar a nav fixa.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { MapEmbed } from "@/components/evt/MapEmbed";
import { ContadorAdulto } from "@/components/templates/aniversario/adulto-elegante/ContadorAdulto";
import {
  AAE_PAD,
  AAE_RHYTHM,
  AAE_WRAP,
  AaeStyle,
  aaeDelay,
  BotaoConfirmar,
  Carta,
  Filete,
  Kicker,
  LinkGhost,
  TituloSecao,
} from "@/components/templates/aniversario/adulto-elegante/partes";

export function EventoAniversarioAdulto({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const local = evento.local ?? "A definir";
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);
  const temProgramacao = recursos.programacao && evento.programacao.length > 0;

  return (
    <main className="relative bg-transparent">
      <AaeStyle />

      {/* ── Convite ── */}
      <section className={`bg-evt-ivory/70 ${AAE_PAD} pb-[clamp(4rem,9vw,7rem)] pt-[clamp(7rem,14vw,9rem)]`}>
        <div className="mx-auto max-w-[660px] text-center">
          <p className="aae-rise" style={aaeDelay(40)}>
            <Kicker center>{t.conviteTitulo}</Kicker>
          </p>
          <p
            className="aae-rise mt-8 font-evt-body text-[clamp(1.35rem,3.6vw,1.75rem)] leading-[1.6] text-evt-ink"
            style={aaeDelay(140)}
          >
            {evento.mensagemBoasVindas ?? t.mensagemPadrao}
          </p>
          <p
            className="aae-rise mt-9 font-evt-util text-[0.72rem] uppercase tracking-[0.28em] text-evt-ink-soft"
            style={aaeDelay(240)}
          >
            {t.assinaturaPrefixo} <span className="text-evt-rosa-ink">{nome}</span>
          </p>
        </div>
      </section>

      {/* ── Quando & Onde + mapa ── */}
      <section className={`bg-transparent ${AAE_PAD} ${AAE_RHYTHM}`}>
        <div className={AAE_WRAP}>
          <Reveal>
            <TituloSecao kicker="A celebração" titulo="Quando & Onde" indice="01" center />
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Reveal className="h-full">
              <Carta className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.75rem)] text-center md:text-left">
                <Kicker className="justify-center md:justify-start">Quando</Kicker>
                <p className="mt-7 font-evt-body text-[clamp(1.5rem,4vw,1.9rem)] leading-tight text-evt-ink">
                  {evento.data}
                </p>
                <p className="mt-2 font-evt-display text-[clamp(2.4rem,7vw,3.4rem)] leading-none tracking-[0.03em] text-evt-rosa-ink">
                  {evento.horario}
                </p>
                <div className="mt-auto flex justify-center pt-8 md:justify-start">
                  <LinkGhost href="/agenda">Adicionar à agenda</LinkGhost>
                </div>
              </Carta>
            </Reveal>

            <Reveal delay={100} className="h-full">
              <Carta className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.75rem)] text-center md:text-left">
                <Kicker className="justify-center md:justify-start">Onde</Kicker>
                <p className="mt-7 font-evt-body text-[clamp(1.5rem,4vw,1.9rem)] leading-tight text-evt-ink">
                  {local}
                </p>
                {evento.endereco && (
                  <p className="mt-2 font-evt-body text-[1.1rem] leading-relaxed text-evt-ink-soft">
                    {evento.endereco}
                  </p>
                )}
                {evento.mapsLinkUrl && (
                  <div className="mt-auto flex justify-center pt-8 md:justify-start">
                    <LinkGhost href={evento.mapsLinkUrl} external>
                      Abrir no Maps
                    </LinkGhost>
                  </div>
                )}
              </Carta>
            </Reveal>
          </div>

          {temEmbed ? (
            <Reveal delay={140} className="mt-5">
              <MapEmbed src={evento.mapsEmbedUrl!} local={local} linkUrl={evento.mapsLinkUrl} />
            </Reveal>
          ) : (
            evento.mapsLinkUrl && (
              <Reveal delay={140} className="mt-5">
                <a
                  href={evento.mapsLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${local} no Google Maps`}
                  className="group relative block overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] shadow-[0_28px_70px_-52px_rgba(15,23,42,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <div className="relative flex h-[280px] flex-col items-center justify-center gap-3 [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))] transition-transform duration-500 group-hover:scale-[1.02] sm:h-[360px]">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-evt-rosa" fill="currentColor" aria-hidden>
                      <path d="M12 2a7 7 0 0 0-7 7c0 4.6 6.1 12.2 6.4 12.5a.8.8 0 0 0 1.2 0C13 21.2 19 13.6 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                    </svg>
                    <span className="font-evt-util text-[0.58rem] uppercase tracking-[0.28em] text-evt-ink-soft/80">
                      Ver localização
                    </span>
                  </div>
                  <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-5 py-2 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink shadow-[0_8px_24px_-8px_rgba(15,23,42,0.35)]">
                    Abrir no Google Maps →
                  </span>
                </a>
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* ── Contador discreto ── */}
      {recursos.contador && (
        <section className={`bg-evt-blush-soft/40 ${AAE_PAD} py-[clamp(3.5rem,8vw,5.5rem)]`}>
          <Reveal className={`${AAE_WRAP} flex flex-col items-center gap-9 text-center`}>
            <Kicker center>Falta pouco</Kicker>
            <ContadorAdulto alvoISO={evento.dataAlvoISO} />
          </Reveal>
        </section>
      )}

      {/* ── Traje ── */}
      {evento.traje && (
        <section className={`bg-transparent ${AAE_PAD} py-[clamp(3.5rem,8vw,5.5rem)]`}>
          <Reveal className={`${AAE_WRAP} flex flex-col items-center gap-4 text-center`}>
            <Kicker center>Traje</Kicker>
            <p className="font-evt-display uppercase leading-tight tracking-[0.04em] text-evt-ink text-[clamp(1.8rem,5vw,2.6rem)]">
              {evento.traje}
            </p>
          </Reveal>
        </section>
      )}

      {/* ── Programação — timeline própria ── */}
      {temProgramacao && (
        <section className={`bg-evt-ivory/70 ${AAE_PAD} ${AAE_RHYTHM}`}>
          <div className="mx-auto w-full max-w-[720px]">
            <Reveal>
              <TituloSecao kicker="A noite" titulo="Programação" indice="02" center />
            </Reveal>
            <Reveal delay={120} className="mt-12">
              <ol className="relative">
                {/* rail vertical */}
                <span className="absolute left-[4.75rem] top-2 bottom-2 w-px bg-[var(--line)] sm:left-[5.5rem]" aria-hidden />
                {evento.programacao.map((item, i) => (
                  <li key={`${item.hora}-${i}`} className="relative">
                    {i > 0 && <Filete className="ml-[6.5rem] sm:ml-[7.25rem]" />}
                    <div className="flex items-center gap-5 py-5">
                      <span className="w-[4rem] shrink-0 text-right font-evt-display text-[1.45rem] leading-none tabular-nums text-evt-rosa-ink sm:w-[4.75rem]">
                        {item.hora}
                      </span>
                      <span className="relative z-10 flex h-3 w-3 shrink-0 items-center justify-center">
                        <span className="h-2.5 w-2.5 rounded-full border border-evt-rosa bg-evt-ivory" aria-hidden />
                      </span>
                      <span className="font-evt-body text-[1.2rem] leading-snug text-evt-ink">
                        {item.titulo}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── CTA confirmar ── */}
      {recursos.rsvp && (
        <section className={`bg-transparent ${AAE_PAD} py-[clamp(4.5rem,10vw,7rem)]`}>
          <Reveal className={`${AAE_WRAP} flex flex-col items-center gap-8 text-center`}>
            <p className="max-w-[600px] font-evt-display uppercase leading-[1.08] tracking-[0.02em] text-evt-ink text-[clamp(1.9rem,5vw,2.8rem)]">
              Você vem?
            </p>
            <BotaoConfirmar />
          </Reveal>
        </section>
      )}
    </main>
  );
}
