// HOME — Aniversário · Tropical Festa. Scroll com SEÇÕES PRÓPRIAS (nada de
// `_base/secoes`): capa impactante + info logo no início + mensagem animada +
// contador + programação em FAIXA COLORIDA + prévia de galeria vibrante + teasers
// (presentes/recados) + RSVP com CTA FORTE + fecho. Clima tropical/festivo/vibrante,
// derivado dos tokens --ev-* (re-tinge com qualquer paleta). Server component;
// interativo (contador/lightbox) mora em arquivos client próprios.
import Image from "next/image";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { CapaTropical } from "@/components/templates/aniversario/tropical-festa/Capa";
import { AtfCountdown } from "@/components/templates/aniversario/tropical-festa/Countdown";
import {
  ATF_PAD,
  ATF_RHYTHM,
  ATF_WRAP,
  ATF_GRAD_HOT,
  ATF_GRAD_LAGOON,
  ATF_MEDALHOES,
  AtfStyle,
  AtfHeading,
  AtfChip,
  AtfButton,
  AtfInfoCard,
  AtfProgramaFaixa,
  WaveDivider,
  ConfettiLayer,
  LeafCorners,
  Leaf,
  SunRays,
  IconCalendar,
  IconClock,
  IconPin,
  IconGift,
  IconChat,
} from "@/components/templates/aniversario/tropical-festa/shared";

// ── 1. Info logo no início — Quando / Onde / Traje em cartões-postais vivos ────
function InfoStrip({ evento }: { evento: EventoFesta }) {
  const cards = [
    { Icon: IconCalendar, label: "Quando", value: `${evento.data}${evento.horario ? ` · ${evento.horario}` : ""}`, extra: undefined as string | undefined },
    { Icon: IconPin, label: "Onde", value: evento.local ?? "Local a combinar", extra: evento.endereco },
    ...(evento.traje
      ? [{ Icon: IconClock, label: "Traje", value: evento.traje, extra: undefined as string | undefined }]
      : []),
  ];
  return (
    <section className={`relative bg-evt-ivory ${ATF_PAD} pb-[clamp(3rem,7vw,5rem)] pt-[clamp(3rem,7vw,5rem)]`}>
      <div className={ATF_WRAP}>
        <div className={`grid gap-5 sm:gap-6 ${cards.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2"}`}>
          {cards.map((c, i) => (
            <Reveal key={c.label} delay={i * 100} className="h-full">
              <AtfInfoCard
                Icon={c.Icon}
                label={c.label}
                value={c.value}
                extra={c.extra}
                grad={ATF_MEDALHOES[i % ATF_MEDALHOES.length]}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 2. Mensagem ANIMADA — banda full-bleed vibrante ────────────────────────────
function Mensagem({ evento, nicho }: { evento: EventoFesta; nicho: string }) {
  const t = textosDoNicho(nicho);
  const mensagem = evento.mensagemBoasVindas || t.conviteTeaser;
  return (
    <section className="relative overflow-hidden text-white" style={{ background: ATF_GRAD_HOT }}>
      <WaveDivider fill="var(--ev-ivory)" />
      <LeafCorners />
      <ConfettiLayer />
      <div className={`relative ${ATF_PAD} ${ATF_RHYTHM}`}>
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-7 text-center">
          <Reveal>
            <AtfChip onColor>{t.conviteTitulo}</AtfChip>
          </Reveal>
          <Reveal delay={120}>
            <p className="font-evt-body text-[clamp(1.35rem,4vw,1.85rem)] leading-relaxed text-white/95">
              {mensagem}
            </p>
          </Reveal>
          <Reveal delay={220} className="flex flex-col items-center gap-7">
            <p className="font-evt-script text-[clamp(2.3rem,7.5vw,3.4rem)] leading-[1.08] text-white [text-shadow:0_8px_28px_rgba(0,0,0,0.25)]">
              {t.assinaturaPrefixo} {evento.primeiroNome}
            </p>
            <AtfButton href="/evento" tone="onColor">
              Ver todos os detalhes
            </AtfButton>
          </Reveal>
        </div>
      </div>
      <WaveDivider fill="var(--ev-ivory)" flip />
    </section>
  );
}

// ── 3. Contador — azulejos vibrantes sobre claro ──────────────────────────────
function Contador({ evento, recursos }: { evento: EventoFesta; recursos: TogglesSite }) {
  if (!recursos.contador) return null;
  return (
    <section className={`relative bg-evt-ivory ${ATF_PAD} ${ATF_RHYTHM}`}>
      <div className={`${ATF_WRAP} flex flex-col items-center gap-10 text-center`}>
        <Reveal>
          <AtfHeading eyebrow="A contagem" title="Falta pouco pra festa" />
        </Reveal>
        <Reveal delay={140}>
          <AtfCountdown alvoISO={evento.dataAlvoISO} />
        </Reveal>
      </div>
    </section>
  );
}

// ── 4. Programação — FAIXA COLORIDA full-bleed ────────────────────────────────
function Programacao({ evento, recursos }: { evento: EventoFesta; recursos: TogglesSite }) {
  if (!recursos.programacao || evento.programacao.length === 0) return null;
  return (
    <section className="relative overflow-hidden text-white" style={{ background: ATF_GRAD_LAGOON }}>
      <WaveDivider fill="var(--ev-ivory)" />
      <span aria-hidden className="pointer-events-none absolute -right-[6%] top-[8%] h-[30vw] max-h-[300px] w-[30vw] max-w-[300px]">
        <SunRays className="h-full w-full opacity-30" />
      </span>
      <ConfettiLayer />
      <div className={`relative ${ATF_PAD} ${ATF_RHYTHM}`}>
        <div className={`${ATF_WRAP} flex flex-col items-center`}>
          <Reveal>
            <AtfHeading eyebrow="O roteiro" title="Como vai ser a festa" onColor />
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

// ── 5. Prévia de galeria VIBRANTE (server; abre em /galeria) ──────────────────
function GaleriaPreview({ evento, recursos }: { evento: EventoFesta; recursos: TogglesSite }) {
  if (!recursos.galeria || evento.fotos.length === 0) return null;
  const fotos = evento.fotos.slice(0, 4);
  return (
    <section className={`relative bg-evt-ivory ${ATF_PAD} ${ATF_RHYTHM}`}>
      <div className={ATF_WRAP}>
        <Reveal className="flex flex-col items-center">
          <AtfHeading eyebrow="Momentos" title="Um gostinho da festa" />
        </Reveal>
        <Reveal delay={140} className="mt-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {fotos.map((src, i) => (
              <div
                key={src}
                className="relative rounded-[1.25rem] p-[3px] shadow-[0_18px_40px_-32px_rgba(46,26,32,0.6)]"
                style={{
                  background: ATF_MEDALHOES[i % ATF_MEDALHOES.length],
                  transform: `rotate(${i % 2 === 0 ? "-1deg" : "1deg"})`,
                }}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.05rem]">
                  <Image
                    src={src}
                    alt={`Foto de ${evento.primeiroNome}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 24vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={220} className="mt-11 flex justify-center">
          <AtfButton href="/galeria" tone="ghost">
            Ver a galeria inteira
          </AtfButton>
        </Reveal>
      </div>
    </section>
  );
}

// ── 6. Teasers (presentes / recados) — cartões vivos que só aparecem se ativos ─
function Teasers({ nicho, recursos }: { nicho: string; recursos: TogglesSite }) {
  const t = textosDoNicho(nicho);
  const cards = [
    { href: "/presentes", Icon: IconGift, eyebrow: "Presentes", titulo: "Sua presença é o presente", texto: t.teaserPresentes, visivel: recursos.presentes },
    { href: "/recados", Icon: IconChat, eyebrow: "Recados", titulo: "Deixe seu carinho", texto: t.teaserRecados, visivel: recursos.recados },
  ].filter((c) => c.visivel);
  if (cards.length === 0) return null;
  return (
    <section className={`relative bg-evt-ivory ${ATF_PAD} ${ATF_RHYTHM}`}>
      <div className={ATF_WRAP}>
        <Reveal className="flex flex-col items-center">
          <AtfHeading eyebrow="Explore" title="O que mais te espera" />
        </Reveal>
        <div className={`mt-12 grid gap-6 ${cards.length === 1 ? "mx-auto max-w-md" : "sm:grid-cols-2"}`}>
          {cards.map((c, i) => (
            <Reveal key={c.href} delay={i * 120} className="h-full">
              <a
                href={c.href}
                className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-8 shadow-[0_26px_60px_-46px_rgba(46,26,32,0.5)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"
                  style={{ background: ATF_MEDALHOES[i % ATF_MEDALHOES.length] }}
                />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: ATF_MEDALHOES[i % ATF_MEDALHOES.length] }}>
                  <c.Icon className="h-7 w-7" />
                </span>
                <AtfChip>{c.eyebrow}</AtfChip>
                <h3 className="font-evt-script text-[clamp(2rem,6vw,2.5rem)] leading-[1.06] text-evt-ink">{c.titulo}</h3>
                <p className="grow font-evt-body text-[1.08rem] leading-relaxed text-evt-ink-soft">{c.texto}</p>
                <span className="mt-2 font-evt-util text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-evt-rosa-ink transition-colors group-hover:text-evt-framboesa">
                  Abrir →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 7. RSVP — CTA FORTE em banda vibrante estilo "convite/ingresso" ───────────
function RsvpForte({ nicho, recursos }: { nicho: string; recursos: TogglesSite }) {
  if (!recursos.rsvp) return null;
  const t = textosDoNicho(nicho);
  return (
    <section className="relative overflow-hidden text-white" style={{ background: ATF_GRAD_HOT }}>
      <WaveDivider fill="var(--ev-ivory)" />
      <LeafCorners />
      <ConfettiLayer />
      <div className={`relative ${ATF_PAD} ${ATF_RHYTHM}`}>
        <div className={`${ATF_WRAP} flex flex-col items-center gap-7 text-center`}>
          <AtfChip onColor>Você vem?</AtfChip>
          <p className="max-w-[660px] font-evt-script text-[clamp(2.5rem,8vw,3.8rem)] leading-[1.1] text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.25)]">
            {t.ctaConvite}
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

// ── 8. Fecho — frase final em cursiva sobre claro (ivory) ─────────────────────
function Fecho({ nicho }: { nicho: string }) {
  const t = textosDoNicho(nicho);
  return (
    <section className={`bg-evt-ivory ${ATF_PAD} pb-[clamp(3.5rem,8vw,5.5rem)] pt-[clamp(1rem,3vw,2rem)]`}>
      <Reveal className={`${ATF_WRAP} flex flex-col items-center gap-5 text-center`}>
        <span className="flex items-center gap-3 text-evt-rosa" aria-hidden>
          <Leaf className="h-7 w-auto rotate-[-20deg]" />
          <span className="h-1.5 w-1.5 rounded-full bg-evt-framboesa" />
          <Leaf className="h-7 w-auto rotate-[20deg]" />
        </span>
        <p className="max-w-[640px] font-evt-script text-[clamp(2rem,6.5vw,3.2rem)] leading-[1.22] text-evt-framboesa">
          {t.fecho}
        </p>
      </Reveal>
    </section>
  );
}

export function HomeAniversarioTropical({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  return (
    <main className="bg-evt-ivory">
      <AtfStyle />
      <CapaTropical
        nome={evento.primeiroNome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />
      <InfoStrip evento={evento} />
      <Mensagem evento={evento} nicho={nicho} />
      <Contador evento={evento} recursos={recursos} />
      <Programacao evento={evento} recursos={recursos} />
      <GaleriaPreview evento={evento} recursos={recursos} />
      <Teasers nicho={nicho} recursos={recursos} />
      <RsvpForte nicho={nicho} recursos={recursos} />
      <Fecho nicho={nicho} />
    </main>
  );
}
