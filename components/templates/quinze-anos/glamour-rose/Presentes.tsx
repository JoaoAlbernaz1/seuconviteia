// ─────────────────────────────────────────────────────────────────────────────
// /presentes — 15 anos "Glamour Rosé" = CLONE FIEL do /presentes real da Maria
// Clara (festa-15-maria-clara/app/presentes/page.tsx): cabeçalho + texto + UM card
// único (foto + lista + Pix), via PainelPresentes. Data-driven.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { PainelPresentes } from "@/components/evt/PainelPresentes";

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="eyebrow text-evt-rosa-ink">{eyebrow}</p>
      <h2 className="mt-3 font-evt-script leading-[1.04] text-[clamp(4.01rem,11.2vw,5.66rem)] text-evt-ink">
        {title}
      </h2>
      <div className="mt-5 flex items-center justify-center" aria-hidden>
        <Flourish className="h-4 w-24 text-evt-rosa" />
      </div>
    </div>
  );
}

export function PresentesQuinzeGlamour({ evento }: PaginaTemplateProps) {
  const itens = (evento.presentes ?? []).map((p) => ({ nome: p.titulo, detalhe: p.descricao }));
  const texto =
    evento.presentesTexto ??
    "O maior presente é ter você comemorando comigo. Mas, se quiser deixar um carinho a mais, separei algumas ideias — e a minha chave Pix também está aqui.";

  return (
    <main className="bg-transparent px-[clamp(1.25rem,5vw,2rem)] pb-[clamp(5rem,10vw,8rem)] pt-32">
      <div className="mx-auto max-w-[860px]">
        <Reveal>
          <Heading eyebrow="Presentes" title="Sua presença é o presente" />
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-lg text-center font-evt-body text-[clamp(1.25rem,4.8vw,1.45rem)] leading-relaxed text-evt-ink-soft">
            {texto}
          </p>
        </Reveal>

        <Reveal delay={200} className="mt-12">
          <PainelPresentes
            fotoUrl={evento.presentesFotoUrl}
            fotoPos="50% 40%"
            itens={itens}
            pixChave={evento.pixChave}
            pixNome={evento.pixNome}
            pixQrUrl={evento.pixQrUrl}
          />
        </Reveal>
      </div>
    </main>
  );
}
