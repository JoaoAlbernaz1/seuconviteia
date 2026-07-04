// HOME — 15 anos Fashion Editorial. Scroll de revista de moda com SECOES PROPRIAS
// (nada de _base/secoes). Assinatura: CAPS display + filetes + indices numerados +
// composicao assimetrica. Bem diferente do Glamour Rose (glam/cursiva/brilho).
// Server component; interativos (contador, RSVP) sao client e vem importados.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { CapaFashionEditorial } from "@/components/templates/quinze-anos/fashion-editorial/Capa";
import { ContadorFashion } from "@/components/templates/quinze-anos/fashion-editorial/ContadorFashion";
import {
  QFE_PAD,
  QFE_RHYTHM,
  QFE_WRAP,
  Kicker,
  MagTitle,
  EditorialPhoto,
  EditorialLink,
  ProgramacaoBlocos,
  QfeMotionReset,
} from "@/components/templates/quinze-anos/fashion-editorial/ui";

export function HomeQuinzeFashion({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const numero = evento.idade ?? 15;

  // Indice editorial ("nesta edicao") — so o que tem dado; a data sempre existe.
  const essencial = [
    { label: "A data", valor: `${evento.data}${evento.horario ? ` · ${evento.horario}` : ""}` },
    evento.local ? { label: "A locação", valor: evento.local } : null,
    evento.traje ? { label: "Dress code", valor: evento.traje } : null,
  ].filter((x): x is { label: string; valor: string } => x !== null);

  // Previa editorial da galeria — ate 5 fotos num mosaico assimetrico.
  const previa = recursos.galeria ? evento.fotos.slice(0, 5) : [];

  let n = 0; // numeracao editorial das secoes

  return (
    <main className="bg-transparent">
      <CapaFashionEditorial
        nome={nome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        nichoLabel={evento.nichoLabel}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ── INDICE / O ESSENCIAL — composicao ASSIMETRICA (colunas escalonadas). ── */}
      <section className={`bg-transparent ${QFE_PAD} ${QFE_RHYTHM}`}>
        <div className={QFE_WRAP}>
          <Reveal>
            <Kicker index={++n}>Nesta edição</Kicker>
          </Reveal>
          <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-3">
            {essencial.map((it, i) => (
              <Reveal
                key={it.label}
                delay={i * 90}
                className={i === 1 ? "sm:mt-12" : i === 2 ? "sm:mt-24" : ""}
              >
                <p className="font-evt-util text-[0.6rem] uppercase tracking-[0.3em] text-evt-ink-soft">
                  {String(i + 1).padStart(2, "0")} / {it.label}
                </p>
                <p className="mt-4 font-evt-display uppercase leading-[0.98] tracking-[0.005em] text-evt-ink text-[clamp(1.5rem,4vw,2.5rem)]">
                  {it.valor}
                </p>
                <span className="mt-5 block h-px w-12 bg-evt-rosa/60" aria-hidden />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── O CONVITE — spread editorial (rail + pull quote com capitular). ── */}
      <section className={`bg-evt-blush-soft/40 ${QFE_PAD} ${QFE_RHYTHM}`}>
        <div className={`${QFE_WRAP} grid gap-x-14 gap-y-8 lg:grid-cols-12`}>
          <Reveal className="lg:col-span-4">
            <Kicker index={++n}>{t.conviteTitulo}</Kicker>
            <p className="mt-6 font-evt-util text-[0.62rem] uppercase leading-relaxed tracking-[0.22em] text-evt-ink-soft">
              Uma carta aberta a quem faz parte dessa história.
            </p>
          </Reveal>
          <div className="lg:col-span-8">
            <Reveal>
              <p className="drop-cap font-evt-body text-[clamp(1.25rem,2.6vw,1.6rem)] leading-relaxed text-evt-ink">
                {evento.mensagemBoasVindas || t.conviteTeaser}
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-9 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-evt-util text-[0.6rem] uppercase tracking-[0.3em] text-evt-ink-soft">
                  {t.assinaturaPrefixo}
                </p>
                <p className="mt-2 font-evt-display uppercase leading-none tracking-[0.01em] text-evt-rosa-ink text-[clamp(2rem,6vw,3.2rem)]">
                  {nome}
                </p>
              </div>
              <EditorialLink href="/evento">Ler o convite</EditorialLink>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CONTADOR — faixa editorial com numeros gigantes (se recurso). ── */}
      {recursos.contador && (
        <section className={`bg-transparent ${QFE_PAD} ${QFE_RHYTHM}`}>
          <div className={QFE_WRAP}>
            <Reveal>
              <Kicker index={++n}>A contagem</Kicker>
            </Reveal>
            <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <Reveal>
                <MagTitle size="md" className="max-w-[10ch]">
                  Faltam poucos capítulos
                </MagTitle>
              </Reveal>
              <Reveal delay={120}>
                <ContadorFashion alvoISO={evento.dataAlvoISO} />
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ── PROGRAMACAO — blocos modernos numerados (se recurso + itens). ── */}
      {recursos.programacao && evento.programacao.length > 0 && (
        <section className={`bg-evt-blush-soft/40 ${QFE_PAD} ${QFE_RHYTHM}`}>
          <div className={QFE_WRAP}>
            <Reveal>
              <Kicker index={++n}>O roteiro da noite</Kicker>
            </Reveal>
            <div className="mt-10">
              <ProgramacaoBlocos itens={evento.programacao} />
            </div>
          </div>
        </section>
      )}

      {/* ── PRESENTES — faixa editorial (se recurso). ── */}
      {recursos.presentes && (
        <section className={`bg-transparent ${QFE_PAD} ${QFE_RHYTHM}`}>
          <div className={`${QFE_WRAP} grid items-center gap-x-14 gap-y-8 lg:grid-cols-12`}>
            <Reveal className="lg:col-span-7">
              <Kicker index={++n}>Lista de presentes</Kicker>
              <MagTitle size="lg" className="mt-6">
                Sua presença é o presente
              </MagTitle>
              <p className="mt-5 max-w-[46ch] font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
                {t.teaserPresentes}
              </p>
              <div className="mt-8">
                <EditorialLink href="/presentes">Ver a lista e o Pix</EditorialLink>
              </div>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-5">
              <EditorialPhoto
                src={evento.presentesFotoUrl ?? evento.fotos[3] ?? evento.fotos[0]}
                alt={`Foto de ${nome}`}
                ratio="aspect-[4/5]"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── GALERIA — previa em MOSAICO editorial (se recurso + fotos). ── */}
      {recursos.galeria && previa.length > 0 && (
        <section className={`bg-evt-blush-soft/40 ${QFE_PAD} ${QFE_RHYTHM}`}>
          <div className={QFE_WRAP}>
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-[60%] flex-1">
                <Kicker index={++n}>Editorial</Kicker>
                <MagTitle size="lg" className="mt-6">
                  O ensaio
                </MagTitle>
              </div>
              <EditorialLink href="/galeria">Ver tudo</EditorialLink>
            </Reveal>
            <Reveal delay={120} className="mt-10">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-3">
                {previa.map((src, i) => {
                  const cfg = [
                    { span: "col-span-2 sm:col-span-4", ratio: "aspect-[16/10]" },
                    { span: "col-span-1 sm:col-span-2", ratio: "aspect-[3/4]" },
                    { span: "col-span-1 sm:col-span-2", ratio: "aspect-[3/4]" },
                    { span: "col-span-1 sm:col-span-2", ratio: "aspect-[3/4]" },
                    { span: "col-span-1 sm:col-span-2", ratio: "aspect-[3/4]" },
                  ];
                  const c = cfg[i] ?? cfg[1];
                  return (
                    <a
                      key={`${src}-${i}`}
                      href="/galeria"
                      aria-label="Abrir a galeria"
                      className={`block ${c.span} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                    >
                      <EditorialPhoto
                        src={src}
                        alt={`Foto de ${nome}`}
                        ratio={c.ratio}
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </a>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── RECADOS — cartao moderno (teaser, se recurso). ── */}
      {recursos.recados && (
        <section className={`bg-transparent ${QFE_PAD} ${QFE_RHYTHM}`}>
          <div className={QFE_WRAP}>
            <Reveal>
              <div className="rounded-[3px] border border-[var(--line)] bg-evt-ivory/70 p-[clamp(1.75rem,5vw,3rem)]">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <Kicker index={++n}>Recados</Kicker>
                    <MagTitle size="md" className="mt-6">
                      Deixe seu carinho
                    </MagTitle>
                    <p className="mt-4 max-w-[48ch] font-evt-body text-[1.12rem] leading-relaxed text-evt-ink-soft">
                      {t.teaserRecados}
                    </p>
                  </div>
                  <EditorialLink href="/recados">Escrever um recado</EditorialLink>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── RSVP — chamada fashion (se recurso). ── */}
      {recursos.rsvp && (
        <section className={`bg-evt-blush-soft/40 ${QFE_PAD} py-[clamp(4.5rem,10vw,7.5rem)]`}>
          <Reveal className={`${QFE_WRAP} flex flex-col items-center gap-8 text-center`}>
            <Kicker index={++n} align="center">
              Confirmação de presença
            </Kicker>
            <MagTitle size="xl" className="max-w-[16ch]">
              Você está na lista
            </MagTitle>
            <p className="max-w-[42ch] font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
              {t.ctaConvite}. Responda em segundos.
            </p>
            <ConfirmCTA />
          </Reveal>
        </section>
      )}

      {/* ── FECHO / RODAPE editorial. ── */}
      <section className={`bg-transparent ${QFE_PAD} pb-[clamp(3.5rem,8vw,5.5rem)] pt-[clamp(2.5rem,6vw,4rem)]`}>
        <Reveal className={`${QFE_WRAP} flex flex-col items-center gap-6 text-center`}>
          <span className="font-evt-display uppercase leading-none tracking-[0.02em] text-evt-rosa/50 text-[clamp(3.5rem,14vw,7rem)]">
            {numero}
          </span>
          <p className="max-w-[34ch] font-evt-display uppercase leading-[1.05] tracking-[0.01em] text-evt-ink text-[clamp(1.4rem,4.5vw,2.4rem)]">
            {t.fecho}
          </p>
          <span className="mt-2 font-evt-util text-[0.6rem] uppercase tracking-[0.3em] text-evt-ink-soft">
            {evento.footerInfo}
          </span>
        </Reveal>
      </section>

      <QfeMotionReset />
    </main>
  );
}
