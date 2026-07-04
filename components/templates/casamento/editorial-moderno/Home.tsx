// HOME — Casamento · Editorial Moderno. Corpo 100% PROPRIO deste template (nao
// usa `_base/secoes`): capa de revista + materia com drop-cap + detalhes em grade
// minimalista + contador editorial + programacao em timeline horizontal + previa
// da galeria em spread + indice "Explore" + RSVP limpo/moderno + fecho. Todas as
// secoes respeitam os recursos ativos (plano ∩ toggle) e ocultam campos vazios.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import type { EventoFesta } from "@/lib/eventoFesta";
import { Reveal } from "@/components/evt/Reveal";

import { CapaEditorialModerno } from "./Capa";
import { CemCountdown } from "./Countdown";
import { CemProgramacao } from "./Programacao";
import {
  CEM_SHELL,
  CEM_BLOCK,
  CemKicker,
  CemHeading,
  CemIndex,
  CemLink,
  CemCta,
  CemPhoto,
  CemStyles,
} from "./_ui";

/** Um "fato" da grade minimalista (rotulo caixa-alta + valor + detalhe opcional). */
type Fato = { rotulo: string; valor: string; detalhe?: string };

/** ── Materia de abertura: editorial texto|texto assimetrico com drop-cap ── */
function SecaoMateria({ evento, nicho }: { evento: EventoFesta; nicho: string }) {
  const t = textosDoNicho(nicho);
  const mensagem = evento.mensagemBoasVindas || t.conviteTeaser;
  return (
    <section className={CEM_BLOCK}>
      <div className={CEM_SHELL}>
        <div className="grid items-start gap-[clamp(2rem,6vw,5rem)] md:grid-cols-[0.92fr_1.08fr]">
          <Reveal className="relative">
            <CemIndex>01</CemIndex>
            <div className="-mt-[clamp(1.5rem,5vw,3.5rem)]">
              <CemKicker>Capítulo um</CemKicker>
              <CemHeading className="mt-6 max-w-[12ch]">{t.conviteTitulo}</CemHeading>
            </div>
          </Reveal>

          <Reveal delay={140} className="md:pt-[clamp(3rem,8vw,6rem)]">
            <p className="drop-cap font-evt-body text-[clamp(1.16rem,1.7vw,1.42rem)] leading-relaxed text-evt-ink">
              {mensagem}
            </p>
            <p className="mt-9 font-evt-script text-[clamp(2rem,6vw,3rem)] leading-[1.1] text-evt-rosa-ink">
              {t.assinaturaPrefixo} {evento.primeiroNome}
            </p>
            <div className="mt-10">
              <CemLink href="/evento">Ler o convite completo</CemLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** ── Detalhes em GRADE MINIMALISTA (filetes finos, sem cartoes) ── */
function SecaoDetalhes({ evento }: { evento: EventoFesta }) {
  const fatos: Fato[] = [
    { rotulo: "Data", valor: evento.data },
    { rotulo: "Horário", valor: evento.horario },
    ...(evento.local
      ? [{ rotulo: "Local", valor: evento.local, detalhe: evento.endereco }]
      : []),
    ...(evento.traje ? [{ rotulo: "Traje", valor: evento.traje }] : []),
  ];

  return (
    <section className={CEM_BLOCK}>
      <div className={CEM_SHELL}>
        <Reveal>
          <CemKicker>Os detalhes</CemKicker>
          <CemHeading className="mt-6 max-w-[13ch]">Quando e onde</CemHeading>
        </Reveal>

        <Reveal delay={120} className="mt-[clamp(2.5rem,6vw,4rem)]">
          <dl className="grid grid-cols-1 gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {fatos.map((f) => (
              <div key={f.rotulo} className="bg-evt-ivory px-[clamp(1.25rem,3vw,1.75rem)] py-[clamp(1.75rem,4vw,2.5rem)]">
                <dt className="font-evt-util text-[0.6rem] font-medium uppercase tracking-[0.3em] text-evt-rosa-ink">
                  {f.rotulo}
                </dt>
                <dd className="mt-3 font-evt-body text-[clamp(1.2rem,1.8vw,1.42rem)] leading-snug text-evt-ink">
                  {f.valor}
                </dd>
                {f.detalhe && (
                  <dd className="mt-1 font-evt-body text-[0.98rem] leading-snug text-evt-ink-soft">
                    {f.detalhe}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <div className="mt-10">
            <CemLink href="/evento">Ver mapa e programação</CemLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** ── Contador editorial (numeros display gigantes) ── */
function SecaoContador({ evento }: { evento: EventoFesta }) {
  return (
    <section className={CEM_BLOCK}>
      <div className={CEM_SHELL}>
        <Reveal className="grid items-end gap-[clamp(2rem,5vw,3.5rem)] md:grid-cols-[0.72fr_1.28fr]">
          <div>
            <CemKicker>A contagem</CemKicker>
            <CemHeading className="mt-6 max-w-[10ch]">Salve a data</CemHeading>
          </div>
          <CemCountdown alvoISO={evento.dataAlvoISO} />
        </Reveal>
      </div>
    </section>
  );
}

/** ── Programacao em timeline horizontal ── */
function SecaoProgramacao({ evento }: { evento: EventoFesta }) {
  return (
    <section className={CEM_BLOCK}>
      <div className={CEM_SHELL}>
        <Reveal>
          <CemKicker>A noite</CemKicker>
          <CemHeading className="mt-6">Programação</CemHeading>
        </Reveal>
        <Reveal delay={120} className="mt-[clamp(2.5rem,6vw,4rem)]">
          <CemProgramacao itens={evento.programacao} />
        </Reveal>
      </div>
    </section>
  );
}

/** ── Previa da galeria: spread editorial texto|mosaico assimetrico ── */
function SecaoGaleria({ evento, nicho }: { evento: EventoFesta; nicho: string }) {
  const t = textosDoNicho(nicho);
  const preview = evento.fotos.slice(0, 3);
  const nome = evento.primeiroNome;

  return (
    <section className={CEM_BLOCK}>
      <div className={CEM_SHELL}>
        <div className="grid items-center gap-[clamp(2.5rem,6vw,4.5rem)] md:grid-cols-[0.82fr_1.18fr]">
          <Reveal>
            <CemKicker>Galeria</CemKicker>
            <CemHeading className="mt-6 max-w-[9ch]">Momentos</CemHeading>
            <p className="mt-7 max-w-[34ch] font-evt-body text-[1.08rem] leading-relaxed text-evt-ink-soft">
              {t.teaserGaleria}
            </p>
            <div className="mt-9">
              <CemLink href="/galeria">Ver a galeria completa</CemLink>
            </div>
          </Reveal>

          <Reveal delay={140}>
            {preview.length >= 3 ? (
              <div className="grid grid-cols-2 gap-[clamp(0.6rem,1.6vw,1rem)]">
                <CemPhoto
                  src={preview[0]}
                  alt={`Foto de ${nome}`}
                  ratio="aspect-[3/4]"
                  sizes="(max-width: 768px) 50vw, 30vw"
                  className="row-span-2"
                />
                <CemPhoto src={preview[1]} alt={`Foto de ${nome}`} ratio="aspect-[4/5]" sizes="(max-width: 768px) 50vw, 30vw" />
                <CemPhoto src={preview[2]} alt={`Foto de ${nome}`} ratio="aspect-[5/6]" sizes="(max-width: 768px) 50vw, 30vw" />
              </div>
            ) : preview.length === 2 ? (
              <div className="grid grid-cols-2 gap-[clamp(0.6rem,1.6vw,1rem)]">
                <CemPhoto src={preview[0]} alt={`Foto de ${nome}`} ratio="aspect-[3/4]" sizes="(max-width: 768px) 50vw, 40vw" />
                <CemPhoto src={preview[1]} alt={`Foto de ${nome}`} ratio="aspect-[3/4]" sizes="(max-width: 768px) 50vw, 40vw" className="mt-[clamp(1.5rem,5vw,3rem)]" />
              </div>
            ) : (
              <CemPhoto src={preview[0]} alt={`Foto de ${nome}`} ratio="aspect-[16/10]" sizes="(max-width: 768px) 100vw, 60vw" />
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** ── Indice "Explore": entradas minimalistas p/ presentes e recados ── */
function SecaoExplore({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  void evento;
  const entradas = [
    recursos.presentes && {
      href: "/presentes",
      titulo: "Sua presença é o presente",
      texto: t.teaserPresentes,
    },
    recursos.recados && {
      href: "/recados",
      titulo: "Deixe seu carinho",
      texto: t.teaserRecados,
    },
  ].filter(Boolean) as { href: string; titulo: string; texto: string }[];

  if (entradas.length === 0) return null;

  return (
    <section className={CEM_BLOCK}>
      <div className={CEM_SHELL}>
        <Reveal>
          <CemKicker>Explore</CemKicker>
          <CemHeading className="mt-6">O que mais te espera</CemHeading>
        </Reveal>

        <div className={`mt-[clamp(2.5rem,6vw,4rem)] grid gap-px bg-[var(--line)] ${entradas.length > 1 ? "md:grid-cols-2" : ""}`}>
          {entradas.map((e, i) => (
            <Reveal key={e.href} delay={i * 110} className="bg-evt-ivory">
              <a
                href={e.href}
                className="group flex h-full flex-col p-[clamp(1.75rem,4vw,2.75rem)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-evt-rosa-ink"
              >
                <span className="font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.3em] text-evt-rosa-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 font-evt-display uppercase leading-[0.98] text-evt-ink text-[clamp(1.6rem,4vw,2.4rem)]">
                  {e.titulo}
                </h3>
                <p className="mt-4 grow font-evt-body text-[1.06rem] leading-relaxed text-evt-ink-soft">
                  {e.texto}
                </p>
                <span className="mt-8 inline-flex items-center gap-2 font-evt-util text-[0.64rem] font-medium uppercase tracking-[0.26em] text-evt-ink transition-colors group-hover:text-evt-rosa-ink">
                  Abrir
                  <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** ── RSVP limpo/moderno: declaracao forte + CTA retangular ── */
function SecaoRSVP({ nicho }: { nicho: string }) {
  const t = textosDoNicho(nicho);
  return (
    <section className={CEM_BLOCK}>
      <div className={CEM_SHELL}>
        <Reveal className="grid items-center gap-[clamp(2rem,5vw,3.5rem)] md:grid-cols-[1.12fr_0.88fr]">
          <div>
            <CemKicker>Confirmação de presença</CemKicker>
            <p className="mt-7 font-evt-display uppercase leading-[0.98] tracking-[0.005em] text-evt-ink text-[clamp(2rem,6vw,3.6rem)]">
              {t.ctaConvite}
            </p>
          </div>
          <div className="md:justify-self-end md:text-right">
            <CemCta href="/confirmar">Confirmar presença</CemCta>
            <p className="mt-5 font-evt-body text-[0.98rem] text-evt-ink-soft">
              Leva menos de um minuto.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** ── Fecho editorial (acima do rodape global) ── */
function SecaoFecho({ nicho }: { nicho: string }) {
  const t = textosDoNicho(nicho);
  return (
    <section className="px-[clamp(1.25rem,5vw,3.5rem)] pb-[clamp(3.5rem,8vw,6rem)] pt-[clamp(1rem,3vw,2rem)]">
      <div className="mx-auto max-w-[720px] text-center">
        <Reveal>
          <span aria-hidden className="mx-auto mb-8 block h-px w-16 bg-evt-rosa/60" />
          <p className="font-evt-script text-[clamp(2.2rem,7vw,3.6rem)] leading-[1.2] text-evt-rosa-ink">
            {t.fecho}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeCasamentoEditorial({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const temGaleria = recursos.galeria && evento.fotos.length > 0;
  const temProgramacao = recursos.programacao && evento.programacao.length > 0;

  return (
    <main className="bg-transparent">
      <CemStyles />

      <CapaEditorialModerno
        nome={evento.primeiroNome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        nichoLabel={evento.nichoLabel}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      <SecaoMateria evento={evento} nicho={nicho} />
      <SecaoDetalhes evento={evento} />
      {recursos.contador && <SecaoContador evento={evento} />}
      {temProgramacao && <SecaoProgramacao evento={evento} />}
      {temGaleria && <SecaoGaleria evento={evento} nicho={nicho} />}
      <SecaoExplore evento={evento} nicho={nicho} recursos={recursos} />
      {recursos.rsvp && <SecaoRSVP nicho={nicho} />}
      <SecaoFecho nicho={nicho} />
    </main>
  );
}
