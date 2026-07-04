// HOME do template EDITORIAL / REVISTA — layout próprio (capa dividida + seções
// numeradas de revista: muito respiro, serifa de display, filetes finos, rótulos
// em versal). Mesmo CONTEÚDO/dados da home clássica (data-driven por EventoFesta
// + recursos), mas outra ESTRUTURA. Themeável pelas vars --ev-* e reduced-motion
// safe (via Reveal). Renderizado quando `evento.template === "editorial"`.
import { textosDoNicho } from "@/lib/textos";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";

import { Reveal } from "@/components/evt/Reveal";
import { Button } from "@/components/evt/Button";
import { HeroEditorial } from "@/components/evt/HeroEditorial";
import { PhotoCarousel } from "@/components/evt/PhotoCarousel";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";

const PAD = "px-[clamp(1.5rem,6vw,4.5rem)]";
const RHYTHM = "py-[clamp(4.5rem,9vw,7.5rem)]";
const WRAP = "mx-auto max-w-[1080px]";

/** Rótulo de seção numerado (ex.: "01 — O convite"). */
function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-evt-util text-[0.7rem] uppercase tracking-[0.34em] text-evt-rosa-ink">
      <span className="tabular-nums">{n}</span>
      <span className="h-px w-8 bg-evt-rosa-ink/40" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function PaginaInicioEditorial({
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

  const INDEX = [
    { href: "/presentes", titulo: "Presentes", texto: t.teaserPresentes, visivel: recursos.presentes },
    { href: "/galeria", titulo: "Galeria", texto: t.teaserGaleria, visivel: recursos.galeria },
    { href: "/recados", titulo: "Recados", texto: t.teaserRecados, visivel: recursos.recados },
    { href: "/evento", titulo: "O convite", texto: "Programação, local e todos os detalhes da festa.", visivel: true },
  ].filter((i) => i.visivel);

  const mostrarMomentos = recursos.galeria && evento.fotos.length > 0;

  return (
    <main className="bg-evt-ivory text-evt-ink">
      {/* ═══ CAPA editorial ═══ */}
      <HeroEditorial
        nome={nome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
      />

      {/* ═══ 01 — O convite (editorial: serifa grande + fio + assinatura) ═══ */}
      <section className={`bg-evt-ivory ${PAD} ${RHYTHM}`}>
        <div className={`${WRAP} grid gap-x-16 gap-y-8 md:grid-cols-[0.85fr_1.15fr]`}>
          <Reveal>
            <Eyebrow n="01">O convite</Eyebrow>
            <h2 className="mt-6 font-evt-display text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.15] text-evt-ink">
              {t.conviteTitulo}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="drop-cap font-evt-body text-[1.18rem] leading-[1.85] text-evt-ink">
              {t.conviteTeaser}
            </p>
            <div className="mt-9 flex items-center gap-4">
              <span className="h-px w-14 bg-evt-rosa-ink/40" aria-hidden />
              <span className="font-evt-display text-[1.4rem] italic text-evt-rosa-ink">
                {t.assinaturaPrefixo} {nome}
              </span>
            </div>
            <div className="mt-8">
              <Button href="/evento" variant="ghost">
                Ler o convite e ver os detalhes
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 02 — Quando & Onde (bloco de dados de revista) ═══ */}
      <section className={`border-y border-[var(--line)] bg-white ${PAD} ${RHYTHM}`}>
        <div className={WRAP}>
          <Reveal>
            <Eyebrow n="02">Quando &amp; Onde</Eyebrow>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-10 grid gap-y-10 md:grid-cols-2 md:divide-x md:divide-[var(--line)]">
              <div className="md:pr-12">
                <p className="font-evt-util text-[0.68rem] uppercase tracking-[0.32em] text-evt-ink-soft">
                  Quando
                </p>
                <p className="mt-4 font-evt-display text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] text-evt-ink">
                  {evento.data}
                </p>
                <p className="mt-1 font-evt-body text-xl text-evt-rosa-ink">{evento.horario}</p>
              </div>
              <div className="md:pl-12">
                <p className="font-evt-util text-[0.68rem] uppercase tracking-[0.32em] text-evt-ink-soft">
                  Onde
                </p>
                <p className="mt-4 font-evt-display text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] text-evt-ink">
                  {evento.local}
                </p>
                {evento.endereco && (
                  <p className="mt-1 font-evt-body text-lg text-evt-ink-soft">{evento.endereco}</p>
                )}
              </div>
            </div>
          </Reveal>

          {recursos.rsvp && (
            <Reveal delay={160} className="mt-14 flex flex-col items-start gap-5">
              <p className="max-w-[560px] font-evt-display text-[clamp(1.5rem,3vw,2.1rem)] italic leading-snug text-evt-ink">
                {t.ctaConvite}
              </p>
              <ConfirmCTA />
            </Reveal>
          )}
        </div>
      </section>

      {/* ═══ 03 — No site (índice numerado das seções) ═══ */}
      {INDEX.length > 0 && (
        <section className={`bg-evt-ivory ${PAD} ${RHYTHM}`}>
          <div className={WRAP}>
            <Reveal>
              <Eyebrow n="03">No site</Eyebrow>
            </Reveal>
            <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {INDEX.map((item, i) => (
                <Reveal key={item.href} delay={i * 80}>
                  <a
                    href={item.href}
                    className="group flex items-baseline gap-6 py-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink md:gap-10"
                  >
                    <span className="font-evt-util text-[0.72rem] tabular-nums text-evt-rosa-ink">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="block font-evt-display text-[clamp(1.6rem,3.4vw,2.5rem)] leading-tight text-evt-ink transition-colors group-hover:text-evt-rosa-ink">
                        {item.titulo}
                      </span>
                      <span className="mt-1.5 block max-w-[46ch] font-evt-body text-[1.02rem] text-evt-ink-soft">
                        {item.texto}
                      </span>
                    </span>
                    <span className="font-evt-util text-lg text-evt-rosa-ink transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ 04 — Momentos (faixa de fotos) ═══ */}
      {mostrarMomentos && (
        <section className={`border-t border-[var(--line)] bg-white pt-[clamp(4rem,8vw,6.5rem)]`}>
          <div className={`${WRAP} ${PAD}`}>
            <Reveal>
              <Eyebrow n="04">Momentos</Eyebrow>
            </Reveal>
          </div>
          <Reveal delay={100} className="mt-10 pb-[clamp(3.5rem,7vw,5.5rem)]">
            <PhotoCarousel fotos={evento.fotos} />
          </Reveal>
        </section>
      )}

      {/* ═══ Fecho editorial ═══ */}
      <section className={`bg-evt-ivory ${PAD} pb-[clamp(4rem,9vw,6.5rem)] pt-[clamp(4rem,9vw,6.5rem)]`}>
        <Reveal className={`${WRAP} flex flex-col items-center gap-7 text-center`}>
          <span className="h-px w-16 bg-evt-rosa-ink/40" aria-hidden />
          <p className="max-w-[680px] font-evt-display text-[clamp(1.8rem,4vw,2.8rem)] italic leading-[1.3] text-evt-ink">
            {t.fecho}
          </p>
          <p className="font-evt-util text-[0.68rem] uppercase tracking-[0.34em] text-evt-rosa-ink">
            {nome}
          </p>
        </Reveal>
      </section>
    </main>
  );
}
