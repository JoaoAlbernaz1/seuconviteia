// Pagina /recados — COMPARTILHADA entre o site publico e o preview do editor
// (preview = site real). Porte fiel do festa: cabecalho + formulario + mural
// (masonry CSS). No preview mostra recados de exemplo (o convite ainda nao tem
// convidados) e o form fica inerte (a pagina do preview desativa os cliques).
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";
import { SectionHeading } from "@/components/evt/SectionHeading";
import { Reveal } from "@/components/evt/Reveal";
import { RecadoForm } from "@/components/evt/RecadoForm";

export type RecadoMural = { id: string; nome: string; mensagem: string };

/** Recados de exemplo (só no preview do editor). */
const DEMO_RECADOS: RecadoMural[] = [
  { id: "d1", nome: "Tio Marcos", mensagem: "Que noite linda vai ser! Estamos contando os dias, minha querida." },
  { id: "d2", nome: "Maria e Carlos", mensagem: "Amiga, você merece o mundo inteiro. Te amamos demais!" },
  { id: "d3", nome: "Vô Antônio", mensagem: "Minha neta, que Deus abençoe muito os seus 15 anos." },
  { id: "d4", nome: "Prima Maria", mensagem: "Já separei meu vestido! Vai ser uma festa inesquecível." },
  { id: "d5", nome: "Padrinho Marcos", mensagem: "Te vi crescer e olha só, uma mocinha linda. Estou tão orgulhoso!" },
];

export function PaginaRecados({
  evento,
  eventId = "preview",
  recados,
  preview = false,
}: {
  evento: EventoFesta;
  nicho?: string;
  recursos?: TogglesSite;
  /** Id do evento (site real). No preview cai para "preview" (form inerte). */
  eventId?: string;
  /** Recados aprovados (site real). No preview usa exemplos. */
  recados?: RecadoMural[];
  preview?: boolean;
}) {
  const nome = evento.primeiroNome;
  const lista = preview ? DEMO_RECADOS : recados ?? [];

  return (
    <main
      data-sec="recados"
      className="bg-transparent px-[clamp(1.25rem,5vw,2rem)] pb-[clamp(6rem,12vw,9rem)] pt-24"
    >
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
          <RecadoForm eventId={eventId} nome={nome} />
        </Reveal>
      </div>

      {/* ── Mural ── */}
      <div className="mx-auto mt-[clamp(4rem,9vw,6rem)] max-w-[1080px]">
        {lista.length > 0 ? (
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
              {lista.map((r, i) => (
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
