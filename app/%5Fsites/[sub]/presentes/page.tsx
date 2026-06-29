// Pagina /presentes do site publico (servida por subdominio). Porte fiel do
// festa-15-maria-clara (`app/presentes/page.tsx`): UM painel unico (foto +
// lista de presentes + Pix). Data-driven via `lerEventoFesta` (gifts do evento +
// Pix do customization). Pix DIRETO (copiar chave) — sem checkout/taxa.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta, lerEventoFesta } from "@/lib/eventoFesta";

import { SectionHeading } from "@/components/evt/SectionHeading";
import { Reveal } from "@/components/evt/Reveal";
import { PainelPresentes } from "@/components/evt/PainelPresentes";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function PresentesPage({
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

  const evento = lerEventoFesta(event);

  return (
    <main className="bg-transparent px-[clamp(1.25rem,5vw,2rem)] pb-[clamp(5rem,10vw,8rem)] pt-32">
      <div className="mx-auto max-w-[860px]">
        <Reveal>
          <SectionHeading eyebrow="Presentes" title="Sua presença é o presente" />
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-md text-center font-evt-body text-lg leading-relaxed text-evt-ink-soft">
            O maior presente é ter você comemorando comigo. Mas, se quiser deixar um
            carinho a mais, separei algumas ideias — e a minha chave Pix também está aqui.
          </p>
        </Reveal>

        <Reveal delay={200} className="mt-12">
          <PainelPresentes
            fotoUrl={evento.fotoUrl ?? evento.fotos[0]}
            nome={evento.primeiroNome}
            itens={evento.presentes}
            pixChave={evento.pixChave}
            pixNome={evento.pixNome}
            pixQrUrl={evento.pixQrUrl}
          />
        </Reveal>
      </div>
    </main>
  );
}
