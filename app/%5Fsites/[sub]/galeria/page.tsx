// Pagina /galeria do site publico (servida por subdominio). Porte fiel do
// festa-15-maria-clara (`app/galeria/page.tsx`): grade + lightbox das fotos do
// evento. Data-driven via `lerEventoFesta` (album do evento); vazio mostra o
// aviso "as fotos chegam em breve". O chrome/tema ficam no layout aninhado.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta, lerEventoFesta } from "@/lib/eventoFesta";

import { SectionHeading } from "@/components/evt/SectionHeading";
import { Reveal } from "@/components/evt/Reveal";
import { Galeria } from "@/components/evt/Galeria";
import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { recursosDoSite } from "@/lib/recursos";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function GaleriaPage({
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

  // Gate por plano: a galeria so existe no CLASSICO/PREMIUM.
  if (!recursosDoSite(event.plan, event.customization).galeria) {
    return (
      <RecursoIndisponivel
        titulo="Galeria indisponível"
        texto="A galeria de fotos não está disponível neste convite."
      />
    );
  }

  const evento = lerEventoFesta(event);
  const fotos = evento.fotos ?? [];

  return (
    <main className="bg-transparent px-[clamp(1.25rem,5vw,2rem)] pb-[clamp(5rem,10vw,8rem)] pt-32">
      <div className="mx-auto max-w-[1080px]">
        <Reveal>
          <SectionHeading eyebrow="Galeria" title="Momentos" />
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-md text-center font-evt-body text-lg text-evt-ink-soft">
            Um pedacinho dessa história em fotos. Toque para ver de pertinho.
          </p>
        </Reveal>

        {fotos.length > 0 ? (
          <Reveal delay={200} className="mt-12">
            <Galeria fotos={fotos} nome={evento.primeiroNome} />
          </Reveal>
        ) : (
          <p className="mt-12 text-center font-evt-body text-evt-ink-soft">As fotos chegam em breve.</p>
        )}
      </div>
    </main>
  );
}
