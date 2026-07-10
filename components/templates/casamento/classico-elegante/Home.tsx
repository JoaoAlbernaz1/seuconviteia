// HOME — Casamento · Clássico Elegante. Corpo PRÓPRIO (nada de _base/secoes):
// hero em arco + convite emocional em moldura, "Cerimônia & Recepção" em cartas
// concêntricas, contador refinado, programação em timeline delicada, presentes em
// cartas sofisticadas, galeria em molduras suaves, recados e RSVP romântico.
// Clima: off-white/champagne, ouro suave, serifas, ornamentos discretos.
// Data-driven por `EventoFesta` + recursos ativos (plano ∩ toggle). Server component.
import Image from "next/image";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { CapaClassica } from "@/components/templates/casamento/classico-elegante/Capa";
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

export function HomeCasamentoClassico({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const inicial = nome.trim().charAt(0).toUpperCase() || "❦";
  const mensagem = evento.mensagemBoasVindas || t.conviteTeaser;

  const temProgramacao = recursos.programacao && evento.programacao.length > 0;
  const temGaleria = recursos.galeria && evento.fotos.length > 0;
  const presentesPreview = evento.presentes.slice(0, 3);

  return (
    <main className="bg-transparent">
      <CceEstilo />

      {/* ── HERO — retrato em arco + nomes do casal (Capa própria) ── */}
      <CapaClassica
        nome={nome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ── O CONVITE — mensagem emocional em moldura delicada ── */}
      <section className={`${CCE_PAD} ${CCE_RITMO}`}>
        <div className="mx-auto max-w-[720px]">
          <Reveal className="flex flex-col items-center text-center">
            <Medalhao inicial={inicial} />
            <p className="mt-7 eyebrow text-evt-rosa-ink">O convite</p>
            <Flourish className="mt-5 h-4 w-28 text-evt-rosa" />
            <h2 className="mt-5 font-evt-script text-[clamp(2.6rem,8vw,3.8rem)] leading-[1.04] text-evt-ink">
              {t.conviteTitulo}
            </h2>
          </Reveal>

          <Reveal delay={140} className="mt-11">
            <Moldura className="p-[clamp(1.75rem,5vw,3rem)]">
              <p className="drop-cap font-evt-body text-[1.2rem] leading-relaxed text-evt-ink">
                {mensagem}
              </p>
              <p className="mt-8 text-center font-evt-script text-[clamp(2rem,6vw,2.7rem)] leading-tight text-evt-rosa-ink">
                {t.assinaturaPrefixo} {nome}
              </p>
            </Moldura>
          </Reveal>

          <Reveal delay={220} className="mt-9 flex justify-center">
            <LinkElegante href="/evento">Ler o convite completo</LinkElegante>
          </Reveal>
        </div>
      </section>

      {/* ── CERIMÔNIA & RECEPÇÃO — cartas concêntricas (Quando · Onde) ── */}
      <section className={`bg-evt-blush-soft/40 ${CCE_PAD} ${CCE_RITMO}`}>
        <div className={CCE_WRAP}>
          <Reveal>
            <TituloSecao eyebrow="A celebração" titulo="Cerimônia & Recepção" />
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
                <span className="mt-6 h-px w-16 bg-[var(--line-rosa)]" aria-hidden />
                {evento.traje && (
                  <p className="mt-6 font-evt-util text-[0.6rem] uppercase tracking-[0.24em] text-evt-ink-soft">
                    Traje · {evento.traje}
                  </p>
                )}
              </Moldura>
            </Reveal>

            <Reveal delay={120} className="h-full">
              <Moldura className="flex h-full flex-col items-center p-[clamp(1.75rem,5vw,2.75rem)] text-center">
                <p className="eyebrow text-evt-rosa-ink">Onde</p>
                <p className="mt-5 font-evt-body text-[1.35rem] leading-snug text-evt-ink">
                  {evento.local ?? "Local a confirmar"}
                </p>
                {evento.endereco && (
                  <p className="mt-2 font-evt-body text-[1.05rem] leading-relaxed text-evt-ink-soft">
                    {evento.endereco}
                  </p>
                )}
                <span className="mt-6 h-px w-16 bg-[var(--line-rosa)]" aria-hidden />
                <Flourish className="mt-6 h-3.5 w-20 text-evt-rosa" />
              </Moldura>
            </Reveal>
          </div>

          <Reveal delay={200} className="mt-9 flex justify-center">
            <LinkElegante href="/evento">Ver mapa e detalhes</LinkElegante>
          </Reveal>
        </div>
      </section>

      {/* ── CONTADOR — refinado (só se recurso ligado) ── */}
      {recursos.contador && (
        <section className={`${CCE_PAD} ${CCE_RITMO}`}>
          <div className={`${CCE_WRAP} flex flex-col items-center gap-10 text-center`}>
            <Reveal className="flex flex-col items-center gap-4">
              <p className="eyebrow text-evt-rosa-ink">Contamos os dias</p>
              <Flourish className="h-4 w-28 text-evt-rosa" />
            </Reveal>
            <Reveal delay={120}>
              <Countdown alvoISO={evento.dataAlvoISO} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── PROGRAMAÇÃO — timeline delicada (só se recurso + itens) ── */}
      {temProgramacao && (
        <section className={`bg-evt-blush-soft/40 ${CCE_PAD} ${CCE_RITMO}`}>
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

      {/* ── PRESENTES — cartas sofisticadas (só se recurso ligado) ── */}
      {recursos.presentes && (
        <section className={`${CCE_PAD} ${CCE_RITMO}`}>
          <div className={CCE_WRAP}>
            <Reveal>
              <TituloSecao eyebrow="Com carinho" titulo="Lista de presentes" />
            </Reveal>
            <Reveal delay={120}>
              <p className="mx-auto mt-7 max-w-[560px] text-center font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
                {t.teaserPresentes}
              </p>
            </Reveal>

            {presentesPreview.length > 0 && (
              <div
                className={`mt-12 grid gap-6 ${
                  presentesPreview.length === 1
                    ? "mx-auto max-w-md"
                    : presentesPreview.length === 2
                      ? "mx-auto max-w-3xl sm:grid-cols-2"
                      : "md:grid-cols-3"
                }`}
              >
                {presentesPreview.map((g, i) => (
                  <Reveal key={`${g.titulo}-${i}`} delay={i * 100} className="h-full">
                    <Moldura className="flex h-full flex-col p-7">
                      <span className="h-px w-10 bg-[var(--line-rosa)]" aria-hidden />
                      <h3 className="mt-5 font-evt-display text-[1.5rem] leading-snug tracking-[0.02em] text-evt-ink">
                        {g.titulo}
                      </h3>
                      {g.descricao && (
                        <p className="mt-3 grow font-evt-body text-[1.05rem] leading-relaxed text-evt-ink-soft">
                          {g.descricao}
                        </p>
                      )}
                      {g.valorLabel && (
                        <p className="mt-6 font-evt-util text-[0.7rem] uppercase tracking-[0.2em] text-evt-rosa-ink">
                          {g.valorLabel}
                        </p>
                      )}
                    </Moldura>
                  </Reveal>
                ))}
              </div>
            )}

            <Reveal delay={200} className="mt-10 flex justify-center">
              <LinkElegante href="/presentes">Ver a lista e o Pix</LinkElegante>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── GALERIA — prévia em molduras suaves (só se recurso + fotos) ── */}
      {temGaleria && (
        <section className={`bg-evt-blush-soft/40 ${CCE_PAD} ${CCE_RITMO}`}>
          <div className={CCE_WRAP}>
            <Reveal>
              <TituloSecao eyebrow="Recordações" titulo="Nossa galeria" />
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-[clamp(0.75rem,2.5vw,1.4rem)] sm:grid-cols-3">
              {evento.fotos.slice(0, 6).map((src, i) => (
                <Reveal key={src} delay={i * 70}>
                  <div className="rounded-[calc(var(--radius-card)+0.4rem)] border border-[var(--line-rosa)] bg-white/45 p-1.5 shadow-[0_26px_60px_-52px_rgba(46,26,32,0.5)]">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)]">
                      <Image
                        src={src}
                        alt={`Foto de ${nome} ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={200} className="mt-10 flex justify-center">
              <LinkElegante href="/galeria">Ver todas as fotos</LinkElegante>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── RECADOS — teaser delicado (só se recurso ligado) ── */}
      {recursos.recados && (
        <section className={`${CCE_PAD} ${CCE_RITMO}`}>
          <div className="mx-auto max-w-[680px]">
            <Reveal>
              <Moldura className="flex flex-col items-center p-[clamp(2rem,6vw,3.25rem)] text-center">
                <Flourish className="h-4 w-28 text-evt-rosa" />
                <p className="mt-5 eyebrow text-evt-rosa-ink">Recados</p>
                <h3 className="mt-4 font-evt-script text-[clamp(2.2rem,7vw,3rem)] leading-tight text-evt-ink">
                  Deixe uma mensagem
                </h3>
                <p className="mt-4 max-w-[440px] font-evt-body text-[1.12rem] leading-relaxed text-evt-ink-soft">
                  {t.teaserRecados}
                </p>
                <div className="mt-8">
                  <LinkElegante href="/recados">Escrever um recado</LinkElegante>
                </div>
              </Moldura>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── RSVP — chamada romântica (só se recurso ligado) ── */}
      {recursos.rsvp && (
        <section className={`bg-evt-blush-soft/40 ${CCE_PAD} ${CCE_RITMO}`}>
          <Reveal className={`${CCE_WRAP} flex flex-col items-center gap-6 text-center`}>
            <Medalhao inicial={inicial} />
            <Divisor className="mt-1" />
            <p className="max-w-[640px] font-evt-script text-[clamp(2.2rem,7vw,3.2rem)] leading-[1.18] text-evt-rosa-ink">
              {t.ctaConvite}
            </p>
            <p className="max-w-[480px] font-evt-body text-[1.12rem] leading-relaxed text-evt-ink-soft">
              Sua presença é o que vai tornar esse dia inesquecível. Conte pra gente que você vem.
            </p>
            <div className="mt-2">
              <ConfirmCTA />
            </div>
          </Reveal>
        </section>
      )}

      {/* ── FECHO — frase final em cursiva ── */}
      <section className={`${CCE_PAD} pb-[clamp(3.5rem,8vw,5.5rem)] pt-[clamp(1rem,3vw,2rem)]`}>
        <Reveal className={`${CCE_WRAP} flex flex-col items-center gap-6 text-center`}>
          <Divisor />
          <p className="max-w-[640px] font-evt-script text-[clamp(2rem,6.5vw,3.1rem)] leading-[1.25] text-evt-rosa-ink">
            {t.fecho}
          </p>
        </Reveal>
      </section>
    </main>
  );
}
