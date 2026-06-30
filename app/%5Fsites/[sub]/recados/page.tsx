// Pagina /recados do site publico (servida por subdominio). Porte FIEL do
// festa-15-maria-clara (`app/recados/page.tsx`): formulario + mural (masonry CSS)
// dos recados. Data-driven: lista os recados APROVADOS do evento (mais recentes
// primeiro). O chrome/tema ficam no layout aninhado.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta, lerEventoFesta } from "@/lib/eventoFesta";

import { SectionHeading } from "@/components/evt/SectionHeading";
import { Reveal } from "@/components/evt/Reveal";
import { RecadoForm } from "@/components/evt/RecadoForm";
import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { listarRecadosAprovados } from "@/lib/recados";
import { recursosDoPlano } from "@/lib/plans";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function RecadosPage({
  params,
}: {
  params: Promise<{ sub: string }>;
}) {
  const { sub } = await params;
  const event = await carregarEventoFesta(sub);

  const visivel = eventoPublico(event, new Date());
  if (!visivel.ok || !event) {
    return <SiteIndisponivel motivo={visivel.motivo ?? "inexistente"} />;
  }

  // Gate por plano: o mural de recados so existe no CLASSICO/PREMIUM.
  if (!recursosDoPlano(event.plan).recados) {
    return (
      <RecursoIndisponivel
        titulo="Recados indisponíveis"
        texto="O mural de recados não está disponível neste convite."
      />
    );
  }

  const evento = lerEventoFesta(event);
  const nome = evento.primeiroNome;
  const recados = await listarRecadosAprovados(event.id);

  return (
    <main className="bg-transparent px-[clamp(1.25rem,5vw,2rem)] pb-[clamp(6rem,12vw,9rem)] pt-24">
      <div className="mx-auto max-w-[680px]">
        <Reveal>
          <SectionHeading eyebrow="Mural de recados" title="Deixe seu carinho" />
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-md text-center font-evt-body text-lg text-evt-ink-soft">
            Escreva um recado de carinho para {nome}. Ela vai amar ler cada palavra.
          </p>
        </Reveal>

        <Reveal delay={200} className="mt-12">
          <RecadoForm eventId={event.id} nome={nome} />
        </Reveal>
      </div>

      {/* ── Mural ── */}
      <div className="mx-auto mt-[clamp(4rem,9vw,6rem)] max-w-[1080px]">
        {recados.length > 0 ? (
          <>
            <Reveal>
              <p className="text-center font-evt-script text-[clamp(2rem,6vw,2.8rem)] text-evt-ink">
                Recados de quem ama
              </p>
              <div className="mt-6 flex justify-center" aria-hidden>
                <span className="hairline-rosa w-20" />
              </div>
            </Reveal>
            <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
              {recados.map((r, i) => (
                <Reveal key={r.id} delay={Math.min(i, 6) * 70}>
                  <figure className="rounded-[var(--radius-card)] border border-[var(--line)] bg-evt-blush-soft/50 p-6">
                    <blockquote className="font-evt-body text-lg italic leading-relaxed text-evt-ink">
                      “{r.mensagem}”
                    </blockquote>
                    <figcaption className="mt-4 font-evt-util text-[0.66rem] uppercase tracking-[0.24em] text-evt-rosa-ink">
                      — {r.nome}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center font-evt-body text-lg italic text-evt-ink-soft">
            Seja o primeiro a deixar um recado. 💗
          </p>
        )}
      </div>
    </main>
  );
}
