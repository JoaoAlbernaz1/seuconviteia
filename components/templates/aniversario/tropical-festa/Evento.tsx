// EVENTO — Aniversário · Tropical Festa. Corpo PRÓPRIO da /evento: convite animado
// + Quando/Onde em cartões vivos + mapa + contador + programação em FAIXA COLORIDA
// + CTA confirmar FORTE. Server component; interativo (mapa/contador) em client.
// Data-driven por `EventoFesta` + gate por recursos. Clima tropical/vibrante.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { MapEmbed } from "@/components/evt/MapEmbed";
import { AtfCountdown } from "@/components/templates/aniversario/tropical-festa/Countdown";
import {
  ATF_PAD,
  ATF_RHYTHM,
  ATF_WRAP,
  ATF_GRAD_HOT,
  ATF_GRAD_LAGOON,
  AtfStyle,
  AtfHeading,
  AtfChip,
  AtfButton,
  AtfProgramaFaixa,
  WaveDivider,
  ConfettiLayer,
  LeafCorners,
  Leaf,
  SunRays,
  IconCalendar,
  IconPin,
} from "@/components/templates/aniversario/tropical-festa/shared";

// ── Convite animado (abertura clara, sob a nav) ───────────────────────────────
function Convite({ evento, nicho }: { evento: EventoFesta; nicho: string }) {
  const t = textosDoNicho(nicho);
  return (
    <section className={`relative overflow-hidden bg-evt-ivory ${ATF_PAD} pb-[clamp(3.5rem,8vw,6rem)] pt-32`}>
      <Leaf className="atf-sway pointer-events-none absolute -left-6 top-24 h-24 w-auto text-evt-rose/40" />
      <Leaf className="atf-sway pointer-events-none absolute -right-4 top-40 h-20 w-auto rotate-[150deg] text-evt-rose/30" style={{ animationDelay: "0.7s" }} />
      <div className="mx-auto max-w-[720px] text-center">
        <Reveal className="flex flex-col items-center gap-5">
          <AtfChip>{t.conviteTitulo}</AtfChip>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-8 font-evt-body text-[clamp(1.3rem,3.8vw,1.7rem)] leading-relaxed text-evt-ink">
            {evento.mensagemBoasVindas ?? t.mensagemPadrao}
          </p>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-9 font-evt-script text-[clamp(2.2rem,7vw,3.2rem)] leading-[1.1] text-evt-framboesa">
            {t.assinaturaPrefixo} {evento.primeiroNome}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ── Quando & Onde — cartões vivos com ações (agenda / maps) ───────────────────
function QuandoOnde({ evento }: { evento: EventoFesta }) {
  const local = evento.local ?? "Local a combinar";
  const cards: {
    Icon: typeof IconCalendar;
    eyebrow: string;
    titulo: string;
    sub?: string;
    extra?: string;
    grad: string;
    botao?: { href: string; label: string; blank?: boolean };
  }[] = [
    {
      Icon: IconCalendar,
      eyebrow: "Quando",
      titulo: evento.data,
      sub: evento.horario,
      grad: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))",
      botao: { href: "/agenda", label: "Adicionar à agenda" },
    },
    {
      Icon: IconPin,
      eyebrow: "Onde",
      titulo: local,
      extra: evento.endereco,
      grad: "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa-deep))",
      botao: evento.mapsLinkUrl ? { href: evento.mapsLinkUrl, label: "Abrir no Maps", blank: true } : undefined,
    },
  ];
  return (
    <section className={`bg-evt-ivory ${ATF_PAD} pb-[clamp(2.5rem,6vw,4rem)] pt-[clamp(2rem,5vw,3.5rem)]`}>
      <div className={`grid gap-6 md:grid-cols-2 ${ATF_WRAP}`}>
        {cards.map((c, i) => (
          <Reveal key={c.eyebrow} delay={i * 120} className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/85 shadow-[0_26px_60px_-46px_rgba(46,26,32,0.5)] backdrop-blur-sm">
              <div className="relative flex items-center gap-4 px-7 py-6 text-white" style={{ background: c.grad }}>
                <ConfettiLayer className="opacity-60" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-evt-framboesa">
                  <c.Icon className="h-6 w-6" />
                </span>
                <span className="relative font-evt-util text-[0.64rem] font-semibold uppercase tracking-[0.26em]">{c.eyebrow}</span>
              </div>
              <div className="flex grow flex-col p-[clamp(1.5rem,5vw,2.25rem)] text-center md:text-left">
                <p className="font-evt-script text-[clamp(2rem,5.5vw,2.6rem)] leading-tight text-evt-ink">{c.titulo}</p>
                {c.sub && (
                  <p className="mt-1 font-evt-display text-[clamp(1.7rem,5vw,2.2rem)] tracking-[0.04em] text-evt-framboesa">{c.sub}</p>
                )}
                {c.extra && <p className="mt-2 font-evt-body text-base text-evt-ink-soft">{c.extra}</p>}
                {c.botao && (
                  <div className="mt-7 flex justify-center md:justify-start">
                    {c.botao.blank ? (
                      <a
                        href={c.botao.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[var(--line-rosa)] px-7 py-3 font-evt-util text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-evt-rosa-ink transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-evt-rosa hover:bg-evt-rosa/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        {c.botao.label}
                      </a>
                    ) : (
                      <AtfButton href={c.botao.href} tone="ghost">
                        {c.botao.label}
                      </AtfButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── Mapa — iframe (se embed) ou card-link vibrante ────────────────────────────
function Mapa({ evento }: { evento: EventoFesta }) {
  const local = evento.local ?? "O local";
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);
  if (!temEmbed && !evento.mapsLinkUrl) return null;
  return (
    <section className={`bg-evt-ivory ${ATF_PAD} pb-[clamp(3.5rem,8vw,6rem)] pt-[clamp(1.5rem,4vw,2.5rem)]`}>
      <Reveal className={ATF_WRAP}>
        {temEmbed ? (
          <MapEmbed src={evento.mapsEmbedUrl!} local={local} linkUrl={evento.mapsLinkUrl} />
        ) : (
          <a
            href={evento.mapsLinkUrl!}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir ${local} no Google Maps`}
            className="group relative block overflow-hidden rounded-[1.5rem] border border-[var(--line)] shadow-[0_22px_50px_-40px_rgba(46,26,32,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <div className="relative flex h-[300px] w-full flex-col items-center justify-center gap-4 overflow-hidden text-white transition-transform duration-500 group-hover:scale-[1.03] sm:h-[380px]" style={{ background: ATF_GRAD_LAGOON }}>
              <ConfettiLayer />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-evt-framboesa">
                <IconPin className="h-8 w-8" />
              </span>
              <p className="relative px-6 text-center font-evt-script text-[clamp(1.8rem,5vw,2.4rem)] leading-tight text-white">{local}</p>
            </div>
            <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-5 py-2 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink shadow-[0_8px_24px_-8px_rgba(46,26,32,0.4)]">
              Abrir no Google Maps →
            </span>
          </a>
        )}
      </Reveal>
    </section>
  );
}

// ── Contador (gate) ───────────────────────────────────────────────────────────
function Contador({ evento, recursos }: { evento: EventoFesta; recursos: TogglesSite }) {
  if (!recursos.contador) return null;
  return (
    <section className={`bg-evt-ivory ${ATF_PAD} pb-[clamp(3.5rem,8vw,6rem)] pt-[clamp(1rem,3vw,2rem)]`}>
      <div className={`${ATF_WRAP} flex flex-col items-center gap-9 text-center`}>
        <Reveal>
          <AtfChip>A contagem já começou</AtfChip>
        </Reveal>
        <Reveal delay={120}>
          <AtfCountdown alvoISO={evento.dataAlvoISO} />
        </Reveal>
      </div>
    </section>
  );
}

// ── Programação — FAIXA COLORIDA ──────────────────────────────────────────────
function Programacao({ evento, recursos }: { evento: EventoFesta; recursos: TogglesSite }) {
  if (!recursos.programacao || evento.programacao.length === 0) return null;
  return (
    <section className="relative overflow-hidden text-white" style={{ background: ATF_GRAD_LAGOON }}>
      <WaveDivider fill="var(--ev-ivory)" />
      <span aria-hidden className="pointer-events-none absolute -left-[6%] bottom-[6%] h-[26vw] max-h-[260px] w-[26vw] max-w-[260px]">
        <SunRays className="h-full w-full opacity-30" />
      </span>
      <ConfettiLayer />
      <div className={`relative ${ATF_PAD} ${ATF_RHYTHM}`}>
        <div className={`${ATF_WRAP} flex flex-col items-center`}>
          <Reveal>
            <AtfHeading eyebrow="A noite" title="Programação" onColor />
          </Reveal>
          <Reveal delay={140} className="mt-12 w-full">
            <AtfProgramaFaixa itens={evento.programacao} />
          </Reveal>
        </div>
      </div>
      <WaveDivider fill="var(--ev-ivory)" flip />
    </section>
  );
}

// ── CTA confirmar FORTE (gate) ────────────────────────────────────────────────
function RsvpForte({ recursos }: { recursos: TogglesSite }) {
  if (!recursos.rsvp) return null;
  return (
    <section className="relative overflow-hidden text-white" style={{ background: ATF_GRAD_HOT }}>
      <WaveDivider fill="var(--ev-ivory)" />
      <LeafCorners />
      <ConfettiLayer />
      <div className={`relative ${ATF_PAD} ${ATF_RHYTHM}`}>
        <div className={`${ATF_WRAP} flex flex-col items-center gap-7 text-center`}>
          <AtfChip onColor>Você vem?</AtfChip>
          <p className="max-w-[620px] font-evt-script text-[clamp(2.4rem,8vw,3.6rem)] leading-[1.12] text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.25)]">
            Bora garantir seu lugar na festa?
          </p>
          <span className="rounded-full bg-white/95 p-1 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)]">
            <ConfirmCTA />
          </span>
        </div>
      </div>
      <WaveDivider fill="var(--ev-ivory)" flip />
    </section>
  );
}

export function EventoAniversarioTropical({ evento, nicho, recursos }: PaginaTemplateProps) {
  return (
    <main className="bg-evt-ivory">
      <AtfStyle />
      <Convite evento={evento} nicho={nicho} />
      <QuandoOnde evento={evento} />
      <Mapa evento={evento} />
      <Contador evento={evento} recursos={recursos} />
      <Programacao evento={evento} recursos={recursos} />
      <RsvpForte recursos={recursos} />
    </main>
  );
}
