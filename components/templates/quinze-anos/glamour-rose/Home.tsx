// ─────────────────────────────────────────────────────────────────────────────
// HOME — 15 anos "Glamour Rosé". CORPO PRÓPRIO (nada de _base/secoes).
// ─────────────────────────────────────────────────────────────────────────────
// O template mais GLAM da família: foil rosé com brilho perolado, faíscas e
// superfícies glossy. Server Component; partes vivas (contador, confirmar) são
// client isolados. Cada seção respeita os recursos ativos (plano ∩ toggle):
// recurso desligado → seção oculta.
import Image from "next/image";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { ArrowRight } from "@/components/evt/icons";
import { CapaGlamour } from "./Capa";
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
const RHYTHM = "py-[clamp(4.5rem,10vw,8rem)]";
const WRAP = "mx-auto max-w-[1080px]";

const CHAMPAGNE_BG: React.CSSProperties = {
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--ev-blush-soft) 62%, #fffaf2) 0%, color-mix(in srgb, var(--ev-blush) 34%, #fffaf2) 100%)",
};

export function HomeQuinzeGlamour({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const mensagem = evento.mensagemBoasVindas || t.conviteTeaser;
  const fotos = evento.fotos ?? [];
  const temGaleria = recursos.galeria && fotos.length > 0;
  const temProgramacao = recursos.programacao && evento.programacao.length > 0;

  return (
    <main className="bg-transparent">
      <QgrStyle />

      <CapaGlamour
        nome={nome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ── O convite ─────────────────────────────────────────────────────── */}
      <section className={`relative overflow-hidden ${PAD} ${RHYTHM}`} style={CHAMPAGNE_BG}>
        {evento.idade != null && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-[6%] top-1/2 -translate-y-1/2 select-none opacity-[0.09]"
          >
            <QgrNumeral n={evento.idade} className="text-[42vw] sm:text-[26vw]" />
          </span>
        )}
        <div className="relative mx-auto max-w-[720px]">
          <Reveal className="flex flex-col items-center text-center">
            <QgrEyebrow>O convite</QgrEyebrow>
            <h2 className="mt-4 font-evt-script text-[clamp(2.9rem,9vw,4.4rem)] leading-[1.02] text-evt-ink">
              {t.conviteTitulo}
            </h2>
            <QgrSparkleTrio className="mt-5" />
          </Reveal>
          <Reveal delay={120} className="mt-10">
            <QgrPanel autoSheen className="p-[clamp(1.9rem,6vw,3.25rem)]">
              {evento.pais && (
                <p className="mb-6 text-center font-evt-body text-[1.15rem] font-medium leading-relaxed text-evt-rosa-ink">
                  Os pais de {nome} convidam você para celebrar os {evento.idade} anos
                  de sua filha.
                </p>
              )}
              <p className="drop-cap font-evt-body text-[1.22rem] leading-relaxed text-evt-ink">
                {mensagem}
              </p>
              <p className="mt-9 text-center font-evt-script text-[clamp(1.6rem,4.5vw,2.2rem)] leading-tight text-evt-ink-soft">
                {t.assinaturaPrefixo}
              </p>
              <p className="mt-1 text-center font-evt-script text-[clamp(2rem,6vw,2.9rem)] leading-tight text-evt-rosa-ink">
                {evento.pais ? `${evento.pais} e ${nome}` : nome}
              </p>
            </QgrPanel>
          </Reveal>
          <Reveal delay={200} className="mt-10 flex justify-center">
            <QgrLink href="/evento">
              Ler o convite e ver os detalhes <ArrowRight className="h-4 w-4" />
            </QgrLink>
          </Reveal>
        </div>
      </section>

      {/* ── Quando & Onde (card único, duas colunas — fiel à festa) ────────── */}
      <section className={`bg-transparent ${PAD} ${RHYTHM}`}>
        <div className="mx-auto max-w-[820px]">
          <Reveal>
            <QgrCard className="grid gap-8 p-[clamp(1.9rem,5vw,3rem)] sm:grid-cols-2 sm:gap-0">
              <div className="flex flex-col sm:pr-8">
                <p className="font-evt-util text-[0.62rem] uppercase tracking-[0.34em] text-evt-rosa-ink">
                  Quando
                </p>
                <p className="mt-4 font-evt-body text-[1.3rem] text-evt-ink">{evento.data}</p>
                {evento.horario && (
                  <p className="qgr-foil mt-1 font-evt-display text-[clamp(2.2rem,7vw,3rem)] tracking-[0.03em]">
                    {evento.horario}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:border-l sm:border-[var(--line-rosa)] sm:pl-8">
                <p className="font-evt-util text-[0.62rem] uppercase tracking-[0.34em] text-evt-rosa-ink">
                  Onde
                </p>
                <p className="mt-4 font-evt-script text-[clamp(1.9rem,5.5vw,2.4rem)] leading-tight text-evt-ink">
                  {evento.local ?? "O local"}
                </p>
                {evento.endereco && (
                  <p className="mt-2 font-evt-body text-[1rem] leading-relaxed text-evt-ink-soft">
                    {evento.endereco}
                  </p>
                )}
              </div>
            </QgrCard>
          </Reveal>
          <Reveal delay={140} className="mt-10 flex justify-center">
            <QgrLink href="/evento">
              Ver mapa e programação <ArrowRight className="h-4 w-4" />
            </QgrLink>
          </Reveal>
        </div>
      </section>

      {/* ── Traje (seção própria — fiel à festa) ──────────────────────────── */}
      {evento.traje && (
        <section className={`bg-transparent ${PAD}`}>
          <Reveal className="flex flex-col items-center text-center">
            <QgrEyebrow>Traje</QgrEyebrow>
            <p className="mt-4 font-evt-script text-[clamp(2.2rem,7vw,3.2rem)] leading-tight text-evt-ink">
              {evento.traje}
            </p>
          </Reveal>
        </section>
      )}

      {/* ── Contador (recurso) ────────────────────────────────────────────── */}
      {recursos.contador && (
        <section className={`relative overflow-hidden ${PAD} ${RHYTHM}`} style={CHAMPAGNE_BG}>
          <QgrSparkleField />
          <div className={`relative ${WRAP} flex flex-col items-center gap-10 text-center`}>
            <Reveal className="flex flex-col items-center">
              <QgrEyebrow>A contagem</QgrEyebrow>
              <h2 className="mt-4 font-evt-script text-[clamp(2.7rem,8vw,4rem)] leading-tight text-evt-ink">
                O grande dia se aproxima
              </h2>
              <QgrDivider className="mt-5" />
            </Reveal>
            <Reveal delay={120}>
              <QgrCountdown alvoISO={evento.dataAlvoISO} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Programação em cards elegantes (recurso) ──────────────────────── */}
      {temProgramacao && (
        <section className={`bg-transparent ${PAD} ${RHYTHM}`}>
          <div className={WRAP}>
            <Reveal>
              <QgrHeading eyebrow="A noite" titulo="Como vai ser a festa" />
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

      {/* ── Presentes (teaser · recurso) ──────────────────────────────────── */}
      {recursos.presentes && (
        <section className={`relative overflow-hidden ${PAD} ${RHYTHM}`} style={CHAMPAGNE_BG}>
          <div className={WRAP}>
            <Reveal>
              <QgrPanel autoSheen className="grid items-center gap-8 p-[clamp(1.75rem,5vw,3rem)] md:grid-cols-[1fr_1.1fr]">
                {evento.presentesFotoUrl ? (
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.4rem] border border-[var(--line-rosa)]">
                    <Image
                      src={evento.presentesFotoUrl}
                      alt={`Foto de ${nome}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[1.4rem] [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]">
                    <QgrSparkleTrio />
                  </div>
                )}
                <div className="text-center md:text-left">
                  <QgrEyebrow>Presentes</QgrEyebrow>
                  <h3 className="mt-3 font-evt-script text-[clamp(2.2rem,6vw,3rem)] leading-[1.05] text-evt-ink">
                    Sua presença é o presente
                  </h3>
                  <p className="mt-5 font-evt-body text-[1.1rem] leading-relaxed text-evt-ink-soft">
                    {t.teaserPresentes}
                  </p>
                  <div className="mt-8 flex justify-center md:justify-start">
                    <QgrLink href="/presentes" variant="primary">
                      Ver a lista e o Pix <ArrowRight className="h-4 w-4" />
                    </QgrLink>
                  </div>
                </div>
              </QgrPanel>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Galeria em DESTAQUE (prévia · recurso) ────────────────────────── */}
      {temGaleria && (
        <section className={`bg-transparent ${PAD} ${RHYTHM}`}>
          <div className={WRAP}>
            <Reveal>
              <QgrHeading eyebrow="Galeria" titulo="Momentos em destaque" />
            </Reveal>
            <Reveal delay={120} className="mt-12">
              <GaleriaPreview fotos={fotos} nome={nome} />
            </Reveal>
            <Reveal delay={200} className="mt-10 flex justify-center">
              <QgrLink href="/galeria">
                Ver a galeria completa <ArrowRight className="h-4 w-4" />
              </QgrLink>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Recados (teaser emocional · recurso) ──────────────────────────── */}
      {recursos.recados && (
        <section className={`relative overflow-hidden ${PAD} ${RHYTHM}`} style={CHAMPAGNE_BG}>
          <QgrSparkleField />
          <div className={`relative ${WRAP} flex flex-col items-center gap-7 text-center`}>
            <Reveal className="flex flex-col items-center gap-6">
              <QgrSparkle className="qgr-twinkle h-7 w-7 text-evt-rosa" />
              <QgrEyebrow>Recados</QgrEyebrow>
              <p className="max-w-[640px] font-evt-script text-[clamp(2.2rem,7vw,3.2rem)] leading-[1.15] text-evt-rosa-ink">
                {t.teaserRecados}
              </p>
              <QgrLink href="/recados">
                Deixar um recado <ArrowRight className="h-4 w-4" />
              </QgrLink>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── RSVP alegre e direto (recurso) ────────────────────────────────── */}
      {recursos.rsvp && (
        <section className={`relative overflow-hidden bg-transparent ${PAD} ${RHYTHM}`}>
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
            <p className="max-w-[640px] font-evt-script text-[clamp(2.4rem,8vw,3.6rem)] leading-[1.12] text-evt-ink">
              {t.ctaConvite}
            </p>
            <p className="max-w-[440px] font-evt-body text-[1.08rem] text-evt-ink-soft">
              Confirme sua presença e venha brilhar comigo.
            </p>
            <ConfirmCTA />
          </Reveal>
        </section>
      )}

      {/* ── Fecho ─────────────────────────────────────────────────────────── */}
      <section className={`${PAD} pb-[clamp(3.5rem,8vw,5.5rem)] pt-[clamp(1rem,3vw,2rem)]`}>
        <Reveal className={`${WRAP} flex flex-col items-center gap-6 text-center`}>
          <QgrSparkleTrio />
          <p className="max-w-[640px] font-evt-script text-[clamp(2rem,6.5vw,3rem)] leading-[1.25] text-evt-rosa-ink">
            {t.fecho}
          </p>
        </Reveal>
      </section>
    </main>
  );
}

// Prévia da galeria em destaque: foto-feature + mosaico glossy (até 5 fotos).
function GaleriaPreview({ fotos, nome }: { fotos: string[]; nome: string }) {
  const feature = fotos[0];
  const resto = fotos.slice(1, 5);
  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:grid-rows-2">
      <a
        href="/galeria"
        aria-label="Abrir a galeria"
        className="qgr-hover-sheen group relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-[var(--line-rosa)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:col-span-1 sm:row-span-2 sm:aspect-auto"
      >
        <Image
          src={feature}
          alt={`Foto de ${nome}`}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <span className="qgr-sheen" aria-hidden />
      </a>
      {resto.map((src, i) => (
        <a
          key={src}
          href="/galeria"
          aria-label={`Abrir a galeria — foto ${i + 2}`}
          className="qgr-hover-sheen group relative aspect-square overflow-hidden rounded-[1.4rem] border border-[var(--line-rosa)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <Image
            src={src}
            alt={`Foto de ${nome}`}
            fill
            sizes="(max-width: 640px) 50vw, 22vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
          <span className="qgr-sheen" aria-hidden />
        </a>
      ))}
    </div>
  );
}
