// EVENTO — Casamento · Clássico Elegante. Convite completo + Quando/Onde em cartas
// concêntricas + mapa (iframe ou carta-link) + "Adicionar à agenda" + contador +
// traje + programação em timeline delicada + CTA confirmar. Corpo PRÓPRIO.
// Data-driven + gate por recursos ativos. Server component.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { Countdown } from "@/components/templates/casamento/classico-elegante/Countdown";
import {
  CceEstilo,
  Medalhao,
  Divisor,
  TituloSecao,
  Moldura,
  LinkElegante,
  CCE_PAD,
  CCE_RITMO,
  CCE_WRAP,
} from "@/components/templates/casamento/classico-elegante/sections";

export function EventoCasamentoClassico({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const inicial = nome.trim().charAt(0).toUpperCase() || "❦";
  const local = evento.local ?? "Local a confirmar";
  const mensagem = evento.mensagemBoasVindas ?? t.mensagemPadrao;
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);
  const temProgramacao = recursos.programacao && evento.programacao.length > 0;

  return (
    <main className="bg-transparent">
      <CceEstilo />

      {/* ── O CONVITE — completo, em moldura delicada ── */}
      <section className={`${CCE_PAD} pb-[clamp(3.5rem,8vw,6rem)] pt-32`}>
        <div className="mx-auto max-w-[720px]">
          <Reveal className="flex flex-col items-center text-center">
            <Medalhao inicial={inicial} />
            <p className="mt-7 eyebrow text-evt-rosa-ink">O convite</p>
            <Flourish className="mt-5 h-4 w-28 text-evt-rosa" />
            <h1 className="mt-5 font-evt-script text-[clamp(2.8rem,9vw,4.2rem)] leading-[1.02] text-evt-ink">
              {t.conviteTitulo}
            </h1>
          </Reveal>

          <Reveal delay={140} className="mt-11">
            <Moldura className="p-[clamp(1.75rem,5vw,3rem)]">
              <p className="drop-cap font-evt-body text-[1.22rem] leading-relaxed text-evt-ink">
                {mensagem}
              </p>
              <p className="mt-8 text-center font-evt-script text-[clamp(2rem,6vw,2.7rem)] leading-tight text-evt-rosa-ink">
                {t.assinaturaPrefixo} {nome}
              </p>
            </Moldura>
          </Reveal>
        </div>
      </section>

      {/* ── QUANDO & ONDE + AGENDA + MAPA ── */}
      <section className={`bg-evt-blush-soft/40 ${CCE_PAD} ${CCE_RITMO}`}>
        <div className={CCE_WRAP}>
          <Reveal>
            <TituloSecao eyebrow="Os detalhes" titulo="Quando & Onde" />
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal className="h-full">
              <Moldura className="flex h-full flex-col items-center p-[clamp(1.75rem,5vw,2.75rem)] text-center">
                <p className="eyebrow text-evt-rosa-ink">Quando</p>
                <p className="mt-5 font-evt-body text-[1.35rem] leading-snug text-evt-ink">
                  {evento.data}
                </p>
                <p className="mt-1 font-evt-display text-[clamp(2.2rem,7vw,3rem)] tracking-[0.05em] text-evt-rosa-ink">
                  {evento.horario}
                </p>
                <div className="mt-7">
                  <LinkElegante href="/agenda">Adicionar à agenda</LinkElegante>
                </div>
              </Moldura>
            </Reveal>

            <Reveal delay={120} className="h-full">
              <Moldura className="flex h-full flex-col items-center p-[clamp(1.75rem,5vw,2.75rem)] text-center">
                <p className="eyebrow text-evt-rosa-ink">Onde</p>
                <p className="mt-5 font-evt-body text-[1.35rem] leading-snug text-evt-ink">
                  {local}
                </p>
                {evento.endereco && (
                  <p className="mt-2 font-evt-body text-[1.05rem] leading-relaxed text-evt-ink-soft">
                    {evento.endereco}
                  </p>
                )}
                {evento.mapsLinkUrl && (
                  <div className="mt-7">
                    <LinkElegante href={evento.mapsLinkUrl} target="_blank" rel="noreferrer">
                      Abrir no Maps
                    </LinkElegante>
                  </div>
                )}
              </Moldura>
            </Reveal>
          </div>

          {/* Mapa: iframe (se embed https) ou carta-link com filigrana. */}
          {temEmbed ? (
            <Reveal delay={160} className="mt-6">
              <div className="rounded-[calc(var(--radius-card)+0.55rem)] border border-[var(--line-rosa)] bg-white/40 p-1.5 shadow-[0_34px_82px_-58px_rgba(46,26,32,0.55)]">
                <iframe
                  src={evento.mapsEmbedUrl}
                  title={`Mapa — ${local}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block h-[320px] w-full rounded-[var(--radius-card)] border border-[var(--line)] sm:h-[420px]"
                />
              </div>
            </Reveal>
          ) : (
            evento.mapsLinkUrl && (
              <Reveal delay={160} className="mt-6">
                <a
                  href={evento.mapsLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${local} no Google Maps`}
                  className="group relative block overflow-hidden rounded-[calc(var(--radius-card)+0.55rem)] border border-[var(--line-rosa)] bg-white/40 p-1.5 shadow-[0_34px_82px_-58px_rgba(46,26,32,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <div className="relative flex h-[280px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))] transition-transform duration-500 group-hover:scale-[1.02] sm:h-[360px]">
                    <Flourish className="h-5 w-28 text-evt-rosa" />
                    <span className="font-evt-util text-[0.6rem] uppercase tracking-[0.26em] text-evt-ink-soft">
                      Ver a localização
                    </span>
                    <span className="mt-1 whitespace-nowrap rounded-full bg-white/90 px-5 py-2 font-evt-util text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink shadow-[0_10px_28px_-12px_rgba(46,26,32,0.4)]">
                      Abrir no Google Maps →
                    </span>
                  </div>
                </a>
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* ── CONTADOR — refinado (só se recurso ligado) ── */}
      {recursos.contador && (
        <section className={`${CCE_PAD} ${CCE_RITMO}`}>
          <div className={`${CCE_WRAP} flex flex-col items-center gap-10 text-center`}>
            <Reveal className="flex flex-col items-center gap-4">
              <p className="eyebrow text-evt-rosa-ink">A contagem já começou</p>
              <Flourish className="h-4 w-28 text-evt-rosa" />
            </Reveal>
            <Reveal delay={120}>
              <Countdown alvoISO={evento.dataAlvoISO} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── TRAJE — linha dedicada (só se preenchido) ── */}
      {evento.traje && (
        <section className={`bg-evt-blush-soft/40 ${CCE_PAD} py-[clamp(3.5rem,8vw,6rem)]`}>
          <Reveal className="mx-auto flex max-w-[640px] flex-col items-center gap-5 text-center">
            <p className="eyebrow text-evt-rosa-ink">Traje</p>
            <Divisor />
            <p className="font-evt-script text-[clamp(2.4rem,8vw,3.6rem)] leading-[1.06] text-evt-ink">
              {evento.traje}
            </p>
          </Reveal>
        </section>
      )}

      {/* ── PROGRAMAÇÃO — timeline delicada (só se recurso + itens) ── */}
      {temProgramacao && (
        <section className={`${CCE_PAD} ${CCE_RITMO}`}>
          <div className={CCE_WRAP}>
            <Reveal>
              <TituloSecao eyebrow="O roteiro" titulo="Programação" />
            </Reveal>
            <div className="relative mx-auto mt-12 max-w-[600px]">
              <span
                className="pointer-events-none absolute bottom-2 left-[7px] top-2 w-px bg-[var(--line-rosa)]"
                aria-hidden
              />
              <ol className="space-y-8">
                {evento.programacao.map((item, i) => (
                  <Reveal
                    as="li"
                    key={`${item.hora}-${item.titulo}-${i}`}
                    delay={i * 80}
                    className="relative flex items-baseline gap-5 pl-9"
                  >
                    <span
                      className="absolute left-0 top-[0.35rem] flex h-4 w-4 items-center justify-center rounded-full border border-[var(--line-rosa)] bg-evt-ivory"
                      aria-hidden
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-evt-rosa" />
                    </span>
                    {item.hora && (
                      <span className="w-[4.5rem] shrink-0 font-evt-display text-[1.4rem] leading-none tracking-[0.03em] text-evt-rosa-ink">
                        {item.hora}
                      </span>
                    )}
                    <span className="font-evt-body text-[1.2rem] leading-snug text-evt-ink">
                      {item.titulo}
                    </span>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA confirmar — romântico (só se recurso ligado) ── */}
      {recursos.rsvp && (
        <section className={`bg-evt-blush-soft/40 ${CCE_PAD} py-[clamp(4.5rem,9vw,7rem)]`}>
          <Reveal className={`${CCE_WRAP} flex flex-col items-center gap-6 text-center`}>
            <Divisor />
            <h2 className="max-w-[620px] font-evt-script text-[clamp(2.2rem,7vw,3.2rem)] leading-[1.16] text-evt-rosa-ink">
              Você vem celebrar com a gente?
            </h2>
            <div className="mt-2">
              <ConfirmCTA />
            </div>
          </Reveal>
        </section>
      )}
    </main>
  );
}
