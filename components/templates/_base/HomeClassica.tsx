// HOME BASE (Cinematográfica) — o design original da festa, agora um template
// entre outros. E o FALLBACK de render: qualquer template sem Home propria cai
// aqui. Data-driven por `EventoFesta` + recursos ativos (plano ∩ toggle).
import { textosDoNicho } from "@/lib/textos";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";

import { Button } from "@/components/evt/Button";
import { Reveal } from "@/components/evt/Reveal";
import { Card } from "@/components/evt/Card";
import { SectionHeading } from "@/components/evt/SectionHeading";
import { PhotoFrame } from "@/components/evt/PhotoFrame";
import { HeroCinematic } from "@/components/evt/HeroCinematic";
import { PhotoCarousel } from "@/components/evt/PhotoCarousel";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";

const PAD = "px-[clamp(1.25rem,5vw,2rem)]";
const RHYTHM = "py-[clamp(5rem,10vw,8rem)]";
const WRAP = "mx-auto max-w-[1100px]";

export function HomeClassica({
  evento,
  nicho,
  recursos,
}: {
  evento: EventoFesta;
  nicho: string;
  recursos: TogglesSite;
}) {
  const nome = evento.primeiroNome;
  const t = textosDoNicho(nicho);

  const TEASERS = [
    {
      href: "/presentes",
      eyebrow: "Presentes",
      titulo: "Sua presença é o presente",
      texto: t.teaserPresentes,
      visivel: recursos.presentes,
    },
    {
      href: "/galeria",
      eyebrow: "Galeria",
      titulo: "Momentos",
      texto: t.teaserGaleria,
      visivel: recursos.galeria,
    },
    {
      href: "/recados",
      eyebrow: "Recados",
      titulo: "Deixe seu carinho",
      texto: t.teaserRecados,
      visivel: recursos.recados,
    },
  ].filter((teaser) => teaser.visivel);

  // Momentos (carrossel do album) segue o recurso "galeria" — desligou a
  // galeria, o carrossel da home some junto (o toggle e honesto no site todo).
  const mostrarMomentos = recursos.galeria && evento.fotos.length > 0;

  return (
    <main className="bg-transparent">
      {/* ═══ HERO cinematografico — capa do convite ═══ */}
      <HeroCinematic
        nome={nome}
        idade={evento.idade}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ═══ CONVITE (teaser) — primeiras linhas + link p/ /evento ═══ */}
      <section className={`bg-evt-blush-soft/55 ${PAD} ${RHYTHM}`}>
        <div className="mx-auto max-w-[680px]">
          <Reveal>
            <SectionHeading eyebrow="O convite" title={t.conviteTitulo} />
          </Reveal>
          <Reveal delay={120}>
            <p className="drop-cap mt-10 font-evt-body text-[1.2rem] leading-relaxed text-evt-ink">
              {t.conviteTeaser}
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-9 flex flex-col items-center gap-6 text-center">
            <p className="font-evt-script text-[clamp(2rem,6vw,2.8rem)] text-evt-rosa-ink">
              {t.assinaturaPrefixo} {nome}
            </p>
            <Button href="/evento" variant="ghost">
              Ler o convite e ver os detalhes
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ═══ EVENTO NUM RELANCE — card de data/local + Confirmar presenca ═══ */}
      <section className={`bg-transparent ${PAD} ${RHYTHM}`}>
        <div className={WRAP}>
          <Reveal>
            <Card className="mx-auto max-w-[760px] p-[clamp(1.75rem,5vw,2.75rem)]">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="text-center sm:text-left">
                  <p className="eyebrow text-evt-rosa-ink" style={{ fontSize: "0.85rem" }}>Quando</p>
                  <p className="mt-3 font-evt-body text-2xl text-evt-ink">{evento.data}</p>
                  <p className="font-evt-display text-[clamp(2rem,6vw,2.7rem)] tracking-[0.04em] text-evt-rosa-ink">
                    {evento.horario}
                  </p>
                </div>
                <div className="text-center sm:border-l sm:border-[var(--line)] sm:pl-8 sm:text-left">
                  <p className="eyebrow text-evt-rosa-ink" style={{ fontSize: "0.85rem" }}>Onde</p>
                  <p className="mt-3 font-evt-body text-2xl text-evt-ink">{evento.local}</p>
                  {evento.endereco && (
                    <p className="mt-1 font-evt-body text-lg text-evt-ink-soft">{evento.endereco}</p>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-center sm:justify-start">
                <Button href="/evento" variant="ghost">
                  Ver mapa e programação
                </Button>
              </div>
            </Card>
          </Reveal>
          {/* "Faça parte dessa noite" + Confirmar presença — só quando o upsell
              de RSVP está ligado (senão o texto vira um CTA sem ação = vão). */}
          {recursos.rsvp && (
            <Reveal delay={140} className="mt-12 flex flex-col items-center gap-5 text-center">
              <span className="flex items-center gap-3 text-evt-rosa" aria-hidden>
                <span className="h-px w-12 bg-evt-rosa/50" />
                <span className="rotate-45 text-[0.5rem]">◆</span>
                <span className="h-px w-12 bg-evt-rosa/50" />
              </span>
              <p className="font-evt-script text-[clamp(1.8rem,5.5vw,2.4rem)] text-evt-rosa-ink">
                {t.ctaConvite}
              </p>
              <ConfirmCTA />
            </Reveal>
          )}
        </div>
      </section>

      {/* ═══ TEASERS — cards pras seções; só os recursos ativos aparecem ═══ */}
      {TEASERS.length > 0 && (
      <section className={`bg-evt-blush-soft/55 ${PAD} ${RHYTHM}`}>
        <div className={WRAP}>
          <Reveal>
            <SectionHeading eyebrow="Explore" title="O que mais te espera" />
          </Reveal>
          <div
            className={`mt-12 grid gap-6 ${
              TEASERS.length === 1
                ? "mx-auto max-w-md"
                : TEASERS.length === 2
                  ? "mx-auto max-w-3xl sm:grid-cols-2"
                  : "md:grid-cols-3"
            }`}
          >
            {TEASERS.map((teaser, i) => (
              <Reveal key={teaser.href} delay={i * 100} className="h-full">
                <Card interactive className="group h-full p-8">
                  <a
                    href={teaser.href}
                    className="flex h-full flex-col rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    {teaser.href === "/galeria" ? (
                      <PhotoFrame
                        src={evento.fotos[6] ?? evento.fotos[0]}
                        alt={`Retrato de ${nome}`}
                        ratio="aspect-[16/10]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="mb-6"
                      />
                    ) : (
                      <span className="mb-6 h-px w-12 bg-evt-rosa/60" aria-hidden />
                    )}
                    <p className="eyebrow text-evt-rosa-ink">{teaser.eyebrow}</p>
                    <h3 className="mt-3 font-evt-script text-[clamp(2.1rem,6vw,2.6rem)] leading-[1.08] text-evt-ink">{teaser.titulo}</h3>
                    <p className="mt-4 grow font-evt-body text-[1.08rem] leading-relaxed text-evt-ink-soft">{teaser.texto}</p>
                    <span className="mt-6 font-evt-util text-[0.62rem] uppercase tracking-[0.24em] text-evt-rosa-ink transition-colors group-hover:text-evt-framboesa">
                      Abrir →
                    </span>
                  </a>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ═══ MOMENTOS — carrossel das fotos (recurso "galeria" ativo) ═══ */}
      {mostrarMomentos && (
      <section className={`bg-transparent ${PAD} ${RHYTHM}`}>
        <div className={WRAP}>
          <Reveal>
            <SectionHeading eyebrow="O ensaio" title="Momentos" />
          </Reveal>
        </div>
        <Reveal delay={120} className="mt-10">
          <PhotoCarousel fotos={evento.fotos} />
        </Reveal>
      </section>
      )}

      {/* ═══ FECHO — parte da prévia bonita (base): sempre fecha o convite. ═══ */}
      <section className={`bg-transparent ${PAD} pb-[clamp(3.5rem,8vw,5.5rem)] pt-[clamp(1rem,3vw,2rem)]`}>
        <Reveal className={`${WRAP} flex flex-col items-center gap-6 text-center`}>
          <span className="flex items-center gap-3 text-evt-rosa" aria-hidden>
            <span className="h-px w-12 bg-evt-rosa/50" />
            <span className="rotate-45 text-[0.5rem]">◆</span>
            <span className="h-px w-12 bg-evt-rosa/50" />
          </span>
          <p className="max-w-[640px] font-evt-script text-[clamp(2rem,6.5vw,3.2rem)] leading-[1.25] text-evt-rosa-ink">
            {t.fecho}
          </p>
        </Reveal>
      </section>
    </main>
  );
}
