// HOME — Aniversário Infantil Lúdico. Rolagem com SEÇÕES PRÓPRIAS (nada de
// _base/secoes): capa alegre → tema da festa → data/local em cartões grandes
// arredondados → "o que vai rolar" (divertido) → contador lúdico → prévia da
// galeria → cartões de presentes/recados → recado pros responsáveis → RSVP →
// rodapé. Server component. Data-driven por `EventoFesta` + recursos (plano ∩ toggle).
import Image from "next/image";
import Link from "next/link";
import { textosDoNicho } from "@/lib/textos";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { CapaInfantil } from "@/components/templates/aniversario/infantil-ludico/Capa";
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
  GiftIcon,
  ChatIcon,
  CakeIcon,
  BalloonIcon,
  MusicIcon,
  SmileIcon,
} from "@/components/templates/aniversario/infantil-ludico/ludico";

const AVISO_PADRAO =
  "Queremos que a criançada aproveite cada minuto com segurança e alegria. Se o pequeno convidado tiver alguma restrição alimentar ou precisar de um cuidado especial, é só avisar na confirmação de presença. Combinado?";

const DIVERTIDO = [
  { Icon: CakeIcon, titulo: "Bolo e doces", texto: "Mesa caprichada pra deixar todo mundo de boca doce." },
  { Icon: BalloonIcon, titulo: "Brincadeiras", texto: "Muita cor, balões e um cantinho só pra bagunça do bem." },
  { Icon: MusicIcon, titulo: "Música e dança", texto: "Pra rir, pular e gastar toda a energia da festa." },
];

// ── Data/Local em cartões grandes arredondados (muito claro pros responsáveis) ─
function SecaoInfo({ evento }: { evento: EventoFesta }) {
  const cards = [
    { Icon: CalIcon, label: "Quando", valor: evento.data, extra: undefined as string | undefined, grad: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" },
    { Icon: ClockIcon, label: "A que horas", valor: evento.horario, extra: undefined as string | undefined, grad: "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa))" },
    { Icon: PinIcon, label: "Onde", valor: evento.local ?? "A combinar", extra: evento.endereco, grad: "linear-gradient(135deg, var(--ev-rosa), var(--ev-rose))" },
  ];
  return (
    <section className={`relative bg-evt-blush-soft/50 ${AIL_PAD} ${AIL_RHYTHM}`}>
      <ConfettiBg opacidade={0.35} />
      <div className={`relative ${AIL_WRAP}`}>
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <p className="eyebrow text-evt-rosa-ink">Anota na agenda</p>
          <h2 className="font-evt-script text-[clamp(2.2rem,7vw,3.4rem)] leading-[1.05] text-evt-ink">
            {evento.idade != null ? (
              <>{evento.primeiroNome} vai fazer <span style={{ color: "var(--ev-framboesa)" }}>{evento.idade}</span> anos!</>
            ) : (
              <>Vem comemorar com a gente!</>
            )}
          </h2>
        </Reveal>
        <div className="mt-11 grid gap-6 sm:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.label} delay={i * 100} className="h-full">
              <div className="relative flex h-full flex-col items-center gap-4 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/75 p-8 text-center shadow-[0_26px_60px_-48px_rgba(46,26,32,0.5)]">
                <span className="ail-wiggle flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: c.grad }}>
                  <c.Icon className="h-7 w-7" />
                </span>
                <p className="eyebrow text-evt-rosa-ink">{c.label}</p>
                <p className="font-evt-body text-[1.35rem] leading-snug text-evt-ink">{c.valor}</p>
                {c.extra && <p className="font-evt-body text-[1rem] leading-snug text-evt-ink-soft">{c.extra}</p>}
                {c.label === "Onde" && evento.traje && (
                  <span className="rounded-full px-3.5 py-1 font-evt-util text-[0.6rem] uppercase tracking-[0.22em] text-evt-rosa-ink" style={{ background: "color-mix(in srgb, var(--ev-blush) 55%, transparent)" }}>
                    Traje · {evento.traje}
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 flex justify-center">
          <Link
            href="/evento"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-7 py-3 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink transition-colors hover:text-evt-framboesa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Ver o convite e os detalhes →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeAniversarioInfantil({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const tema = evento.mensagemBoasVindas?.trim();
  const nome = evento.primeiroNome;
  const temPreviaGaleria = recursos.galeria && evento.fotos.length > 0;
  const previa = evento.fotos.slice(0, 4);

  const teasers = [
    { href: "/presentes", Icon: GiftIcon, eyebrow: "Presentes", titulo: "Sua presença é o presente", texto: t.teaserPresentes, visivel: recursos.presentes, grad: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" },
    { href: "/recados", Icon: ChatIcon, eyebrow: "Recados", titulo: "Deixe um carinho", texto: t.teaserRecados, visivel: recursos.recados, grad: "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa))" },
  ].filter((x) => x.visivel);

  return (
    <main className="ail-root bg-transparent">
      <AilStyle />

      <CapaInfantil
        nome={nome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        tema={tema}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ── Tema da festa em destaque ── */}
      <section className={`relative overflow-hidden ${AIL_PAD} ${AIL_RHYTHM}`}>
        <ConfettiBg opacidade={0.45} />
        <Reveal className={`relative ${AIL_WRAP} flex flex-col items-center gap-5 text-center`}>
          <span className="ail-pulse flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}>
            <BalloonIcon className="h-6 w-6" />
          </span>
          <p className="eyebrow text-evt-rosa-ink">{tema ? "O tema da festa" : "A festa vem aí"}</p>
          <p className="max-w-[760px] font-evt-script text-[clamp(2.1rem,6.5vw,3.6rem)] leading-[1.14] text-evt-ink">
            {tema || `Vem festejar com ${nome}! Vai ter bolo, brincadeira e muita alegria.`}
          </p>
        </Reveal>
      </section>

      {/* ── Data / Local muito claros ── */}
      <SecaoInfo evento={evento} />

      {/* ── Seção divertida sobre a festa ── */}
      <section className={`relative ${AIL_PAD} ${AIL_RHYTHM}`}>
        <div className={AIL_WRAP}>
          <Reveal className="flex flex-col items-center gap-3 text-center">
            <p className="eyebrow text-evt-rosa-ink">O que vai rolar</p>
            <h2 className="font-evt-script text-[clamp(2rem,6.5vw,3.1rem)] leading-[1.06] text-evt-ink">Vai ser uma festança!</h2>
          </Reveal>
          <div className="mt-11 grid gap-6 sm:grid-cols-3">
            {DIVERTIDO.map((d, i) => (
              <Reveal key={d.titulo} delay={i * 100} className="h-full">
                <div className="flex h-full flex-col items-center gap-4 rounded-[2rem] p-8 text-center" style={{ background: "color-mix(in srgb, var(--ev-blush) 35%, white)", border: "1px solid var(--line)" }}>
                  <span className="ail-wiggle flex h-14 w-14 items-center justify-center rounded-[1.2rem] text-white" style={{ background: "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa))" }}>
                    <d.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-evt-body text-[1.3rem] text-evt-ink">{d.titulo}</h3>
                  <p className="font-evt-body text-[1.02rem] leading-relaxed text-evt-ink-soft">{d.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contador lúdico ── */}
      {recursos.contador && (
        <section className={`relative bg-evt-blush-soft/50 ${AIL_PAD} ${AIL_RHYTHM}`}>
          <ConfettiBg opacidade={0.3} />
          <div className={`relative ${AIL_WRAP} flex flex-col items-center gap-9 text-center`}>
            <Reveal className="flex flex-col items-center gap-2">
              <p className="eyebrow text-evt-rosa-ink">Já falta pouquinho</p>
              <h2 className="font-evt-script text-[clamp(2rem,6.5vw,3.1rem)] leading-[1.05] text-evt-ink">Faltam só...</h2>
            </Reveal>
            <Reveal delay={120}>
              <ContadorLudico alvoISO={evento.dataAlvoISO} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Prévia da galeria (leve) ── */}
      {temPreviaGaleria && (
        <section className={`relative ${AIL_PAD} ${AIL_RHYTHM}`}>
          <div className={AIL_WRAP}>
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <p className="eyebrow text-evt-rosa-ink">Momentos</p>
              <h2 className="font-evt-script text-[clamp(2rem,6.5vw,3.1rem)] leading-[1.05] text-evt-ink">Um cantinho de sorrisos</h2>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-[clamp(0.75rem,2.5vw,1.15rem)] sm:grid-cols-4">
              {previa.map((src, i) => (
                <Reveal key={src} delay={i * 90}>
                  <span className="relative block aspect-square w-full rounded-[1.5rem] bg-white p-[6px] shadow-[0_20px_44px_-34px_rgba(46,26,32,0.55)]" style={{ rotate: i % 2 === 0 ? "-1.6deg" : "1.6deg" }}>
                    <span className="relative block h-full w-full overflow-hidden rounded-[1.15rem]">
                      <Image src={src} alt={`Foto de ${nome} ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                    </span>
                  </span>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-9 flex justify-center">
              <Link href="/galeria" className="inline-flex min-h-[48px] items-center gap-2 rounded-full px-7 py-3 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_16px_36px_-22px_rgba(46,26,32,0.6)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white" style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}>
                Ver toda a galeria →
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Cartões: presentes / recados ── */}
      {teasers.length > 0 && (
        <section className={`relative bg-evt-blush-soft/50 ${AIL_PAD} ${AIL_RHYTHM}`}>
          <div className={AIL_WRAP}>
            <div className={`grid gap-6 ${teasers.length === 1 ? "mx-auto max-w-md" : "mx-auto max-w-3xl sm:grid-cols-2"}`}>
              {teasers.map((teaser, i) => (
                <Reveal key={teaser.href} delay={i * 100} className="h-full">
                  <Link href={teaser.href} className="group flex h-full flex-col items-start gap-4 rounded-[2rem] border border-[var(--line)] bg-white/80 p-8 shadow-[0_26px_60px_-48px_rgba(46,26,32,0.5)] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                    <span className="ail-wiggle flex h-14 w-14 items-center justify-center rounded-[1.2rem] text-white" style={{ background: teaser.grad }}>
                      <teaser.Icon className="h-6 w-6" />
                    </span>
                    <p className="eyebrow text-evt-rosa-ink">{teaser.eyebrow}</p>
                    <h3 className="font-evt-script text-[clamp(1.9rem,5.5vw,2.4rem)] leading-[1.08] text-evt-ink">{teaser.titulo}</h3>
                    <p className="grow font-evt-body text-[1.05rem] leading-relaxed text-evt-ink-soft">{teaser.texto}</p>
                    <span className="font-evt-util text-[0.62rem] uppercase tracking-[0.24em] text-evt-rosa-ink transition-colors group-hover:text-evt-framboesa">Abrir →</span>
                  </Link>
                </Reveal>
              ))}
            </div>
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

      {/* ── RSVP simples ── */}
      {recursos.rsvp && (
        <section className={`relative bg-evt-blush-soft/50 ${AIL_PAD} ${AIL_RHYTHM}`}>
          <ConfettiBg opacidade={0.4} />
          <Reveal className={`relative ${AIL_WRAP} flex flex-col items-center gap-6 text-center`}>
            <span className="ail-pulse flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa))" }}>
              <SmileIcon className="h-6 w-6" />
            </span>
            <p className="max-w-[620px] font-evt-script text-[clamp(2rem,6vw,2.9rem)] leading-[1.18] text-evt-rosa-ink">{t.ctaConvite}</p>
            <p className="max-w-[520px] font-evt-body text-[1.1rem] text-evt-ink-soft">Responsáveis, é só um toque pra confirmar quem vem brincar com a gente.</p>
            <ConfirmCTA />
          </Reveal>
        </section>
      )}

      {/* ── Rodapé ── */}
      <footer className={`relative ${AIL_PAD} pb-[clamp(3rem,7vw,5rem)] pt-[clamp(2.5rem,6vw,4rem)] text-center`}>
        <Reveal className="flex flex-col items-center gap-4">
          <span className="ail-wiggle text-evt-rosa" aria-hidden><CakeIcon className="h-7 w-7" /></span>
          <p className="font-evt-script text-[clamp(1.8rem,6vw,2.6rem)] leading-[1.1] text-evt-ink">{t.fecho}</p>
          <p className="font-evt-util text-[0.62rem] uppercase tracking-[0.24em] text-evt-ink-soft">{evento.footerInfo}</p>
        </Reveal>
      </footer>
    </main>
  );
}
