// Pagina /galeria do site publico (servida por subdominio). Porte fiel do
// festa-15-maria-clara (`app/galeria/page.tsx`): grade + lightbox das fotos do
// evento. Data-driven via `lerEventoFesta` (album do evento); vazio mostra o
// aviso "as fotos chegam em breve". O chrome/tema ficam no layout aninhado.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFestaDb";
import { comFotosDemo } from "@/lib/demoFotos";

import { PaginaGaleria } from "@/components/evt/paginas/PaginaGaleria";
import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { recursosDoSite } from "@/lib/recursos";
import { planoDoSite } from "@/lib/plans";

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
  if (!recursosDoSite(planoDoSite(event, new Date()), event.customization).galeria) {
    return (
      <RecursoIndisponivel
        titulo="Galeria indisponível"
        texto="A galeria de fotos não está disponível neste convite."
      />
    );
  }

  return (
    <PaginaGaleria
      evento={comFotosDemo(event)}
      nicho={event.type}
      recursos={recursosDoSite(planoDoSite(event, new Date()), event.customization)}
    />
  );
}
