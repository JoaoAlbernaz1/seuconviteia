// EVENTO — Aniversário Infantil Lúdico (página /evento). Convite divertido +
// Quando/Onde em cartões arredondados grandes + mapa + salvar na agenda + contador
// lúdico + programação + recado pros responsáveis + CTA confirmar. Seções próprias
// (nada de _base/secoes). Server component; interativos (mapa/contador) isolados.
import Link from "next/link";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { MapEmbed } from "@/components/evt/MapEmbed";
import { Timeline } from "@/components/evt/Timeline";
import { ContadorLudico } from "@/components/templates/aniversario/infantil-ludico/ContadorLudico";
import {
  AIL_PAD,
  AIL_WRAP,
  AIL_RHYTHM,
  AilStyle,
  ConfettiBg,
  BolhasCanto,
  CalIcon,
  ClockIcon,
  PinIcon,
  HeartIcon,
  BalloonIcon,
  CakeIcon,
} from "@/components/templates/aniversario/infantil-ludico/ludico";

const AVISO_PADRAO =
  "Queremos que a criançada aproveite cada minuto com segurança e alegria. Qualquer restrição alimentar ou cuidado especial, é só avisar na confirmação de presença. Combinado?";

// ── Quando / Onde em cartões arredondados grandes ────────────────────────────
function CartaoInfo({
  Icon,
  label,
  children,
  grad,
}: {
  Icon: (p: { className?: string }) => React.ReactElement;
  label: string;
  children: React.ReactNode;
  grad: string;
}) {
  return (
    <div className="relative flex h-full flex-col items-center gap-4 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/80 p-[clamp(1.75rem,5vw,2.75rem)] text-center shadow-[0_26px_60px_-48px_rgba(46,26,32,0.5)]">
      <span className="ail-wiggle flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: grad }}>
        <Icon className="h-7 w-7" />
      </span>
      <p className="eyebrow text-evt-rosa-ink">{label}</p>
      {children}
    </div>
  );
}

export function EventoAniversarioInfantil({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const mensagem = evento.mensagemBoasVindas?.trim() || t.mensagemPadrao;
  const temMapaEmbed = !!evento.mapsEmbedUrl && !!evento.local;
  const temMapaLink = !temMapaEmbed && !!evento.mapsLinkUrl;

  return (
    <main className="ail-root bg-transparent">
      <AilStyle />

      {/* ── Cabeçalho divertido ── */}
      <section className={`relative overflow-hidden ${AIL_PAD} pt-[clamp(4.5rem,11vw,7rem)] pb-[clamp(2.5rem,6vw,4rem)]`}>
        <ConfettiBg opacidade={0.45} />
        <Reveal className={`relative ${AIL_WRAP} flex flex-col items-center gap-4 text-center`}>
          <span className="ail-pulse flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}>
            <BalloonIcon className="h-6 w-6" />
          </span>
          <p className="eyebrow text-evt-rosa-ink">{t.conviteTitulo}</p>
          <h1 className="font-evt-script text-[clamp(2.6rem,10vw,5rem)] leading-[0.95] text-evt-ink">{evento.primeiroNome}</h1>
          {evento.idade != null && (
            <span className="rounded-full px-5 py-2 font-evt-util text-[0.66rem] uppercase tracking-[0.22em] text-white" style={{ background: "var(--ev-rose)" }}>
              {evento.idade} anos
            </span>
          )}
        </Reveal>
      </section>

      {/* ── Convite (mensagem) ── */}
      <section className={`relative ${AIL_PAD} pb-[clamp(3rem,7vw,5rem)]`}>
        <Reveal className={`${AIL_WRAP} flex justify-center`}>
          <div className="relative w-full max-w-[720px] overflow-hidden rounded-[2.25rem] p-[clamp(1.75rem,5vw,3rem)] text-center" style={{ background: "color-mix(in srgb, var(--ev-blush) 38%, white)", border: "1px solid var(--line)" }}>
            <BolhasCanto />
            <p className="relative font-evt-body text-[1.22rem] leading-relaxed text-evt-ink">{mensagem}</p>
            <p className="relative mt-6 font-evt-script text-[clamp(1.8rem,5.5vw,2.5rem)] text-evt-rosa-ink">
              {t.assinaturaPrefixo} {evento.primeiroNome}
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Quando & Onde ── */}
      <section className={`relative bg-evt-blush-soft/50 ${AIL_PAD} ${AIL_RHYTHM}`}>
        <ConfettiBg opacidade={0.3} />
        <div className={`relative ${AIL_WRAP}`}>
          <Reveal className="flex flex-col items-center gap-2 text-center">
            <p className="eyebrow text-evt-rosa-ink">A festa</p>
            <h2 className="font-evt-script text-[clamp(2rem,6.5vw,3.1rem)] leading-[1.05] text-evt-ink">Quando & Onde</h2>
          </Reveal>
          <div className="mt-11 grid gap-6 sm:grid-cols-2">
            <Reveal delay={0} className="h-full">
              <CartaoInfo Icon={CalIcon} label="Quando" grad="linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))">
                <p className="font-evt-body text-[1.4rem] leading-snug text-evt-ink">{evento.data}</p>
                <p className="flex items-center gap-2 font-evt-display text-[clamp(1.8rem,6vw,2.4rem)] text-evt-rosa-ink">
                  <ClockIcon className="h-5 w-5" /> {evento.horario}
                </p>
              </CartaoInfo>
            </Reveal>
            <Reveal delay={100} className="h-full">
              <CartaoInfo Icon={PinIcon} label="Onde" grad="linear-gradient(135deg, var(--ev-rosa), var(--ev-rose))">
                <p className="font-evt-body text-[1.4rem] leading-snug text-evt-ink">{evento.local ?? "A combinar"}</p>
                {evento.endereco && <p className="font-evt-body text-[1.05rem] leading-snug text-evt-ink-soft">{evento.endereco}</p>}
                {evento.traje && (
                  <span className="rounded-full px-3.5 py-1 font-evt-util text-[0.6rem] uppercase tracking-[0.22em] text-evt-rosa-ink" style={{ background: "color-mix(in srgb, var(--ev-blush) 55%, transparent)" }}>
                    Traje · {evento.traje}
                  </span>
                )}
              </CartaoInfo>
            </Reveal>
          </div>

          {/* Mapa. */}
          {temMapaEmbed && (
            <Reveal delay={120} className="mt-8">
              <div className="mx-auto max-w-[820px]">
                <MapEmbed src={evento.mapsEmbedUrl!} local={evento.local!} linkUrl={evento.mapsLinkUrl} />
              </div>
            </Reveal>
          )}
          {temMapaLink && (
            <Reveal delay={120} className="mt-8 flex justify-center">
              <a href={evento.mapsLinkUrl!} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-7 py-3 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink transition-colors hover:text-evt-framboesa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                <PinIcon className="h-4 w-4" /> Abrir no Google Maps →
              </a>
            </Reveal>
          )}

          {/* Salvar na agenda (/agenda gera o .ics). */}
          <Reveal delay={160} className="mt-8 flex justify-center">
            <a href="/agenda" className="inline-flex min-h-[48px] items-center gap-2 rounded-full px-7 py-3 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_16px_36px_-22px_rgba(46,26,32,0.6)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white" style={{ background: "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa))" }}>
              <CalIcon className="h-4 w-4" /> Salvar no meu calendário
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── Contador lúdico ── */}
      {recursos.contador && (
        <section className={`relative ${AIL_PAD} ${AIL_RHYTHM}`}>
          <ConfettiBg opacidade={0.3} />
          <div className={`relative ${AIL_WRAP} flex flex-col items-center gap-9 text-center`}>
            <Reveal className="flex flex-col items-center gap-2">
              <p className="eyebrow text-evt-rosa-ink">Já falta pouquinho</p>
              <h2 className="font-evt-script text-[clamp(2rem,6.5vw,3.1rem)] leading-[1.05] text-evt-ink">Contagem regressiva</h2>
            </Reveal>
            <Reveal delay={120}><ContadorLudico alvoISO={evento.dataAlvoISO} /></Reveal>
          </div>
        </section>
      )}

      {/* ── Programação ── */}
      {recursos.programacao && evento.programacao.length > 0 && (
        <section className={`relative bg-evt-blush-soft/50 ${AIL_PAD} ${AIL_RHYTHM}`}>
          <div className={`relative ${AIL_WRAP}`}>
            <Reveal className="flex flex-col items-center gap-2 text-center">
              <p className="eyebrow text-evt-rosa-ink">A programação</p>
              <h2 className="font-evt-script text-[clamp(2rem,6.5vw,3.1rem)] leading-[1.05] text-evt-ink">Como vai ser a festa</h2>
            </Reveal>
            <Reveal delay={120} className="mt-10"><Timeline itens={evento.programacao} /></Reveal>
          </div>
        </section>
      )}

      {/* ── Recado para os responsáveis ── */}
      <section className={`relative ${AIL_PAD} ${AIL_RHYTHM}`}>
        <Reveal className={`${AIL_WRAP} flex justify-center`}>
          <div className="relative w-full max-w-[720px] overflow-hidden rounded-[2.25rem] p-[clamp(1.75rem,5vw,3rem)] text-center shadow-[0_30px_70px_-50px_rgba(46,26,32,0.5)]" style={{ background: "color-mix(in srgb, var(--ev-blush) 40%, white)", border: "1px solid color-mix(in srgb, var(--ev-rosa) 26%, transparent)" }}>
            <BolhasCanto />
            <div className="relative flex flex-col items-center gap-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}>
                <HeartIcon className="h-6 w-6" />
              </span>
              <p className="eyebrow text-evt-rosa-ink">Para os pais e responsáveis</p>
              <p className="max-w-[560px] font-evt-body text-[1.2rem] leading-relaxed text-evt-ink">{AVISO_PADRAO}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── CTA confirmar ── */}
      {recursos.rsvp && (
        <section className={`relative bg-evt-blush-soft/50 ${AIL_PAD} ${AIL_RHYTHM}`}>
          <ConfettiBg opacidade={0.4} />
          <Reveal className={`relative ${AIL_WRAP} flex flex-col items-center gap-6 text-center`}>
            <p className="max-w-[620px] font-evt-script text-[clamp(2rem,6vw,2.9rem)] leading-[1.18] text-evt-rosa-ink">{t.ctaConvite}</p>
            <ConfirmCTA />
          </Reveal>
        </section>
      )}

      {/* ── Rodapé ── */}
      <footer className={`relative ${AIL_PAD} pb-[clamp(3rem,7vw,5rem)] pt-[clamp(2rem,5vw,3rem)] text-center`}>
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="ail-wiggle text-evt-rosa" aria-label="Voltar ao início"><CakeIcon className="h-7 w-7" /></Link>
          <p className="font-evt-util text-[0.62rem] uppercase tracking-[0.24em] text-evt-ink-soft">{evento.footerInfo}</p>
        </div>
      </footer>
    </main>
  );
}
