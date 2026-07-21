// Pagina /evento do site publico (servida por subdominio). O corpo vive em
// `components/evt/paginas/PaginaEvento` — COMPARTILHADO com o preview do editor
// (preview = site de verdade). Aqui fica so o carregar/gate do tenant.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFesta";
import { comFotosDemo } from "@/lib/demoFotos";
import { recursosDoSite } from "@/lib/recursos";
import { PaginaEvento } from "@/components/evt/paginas/PaginaEvento";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function EventoPage({
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

  return (
    <PaginaEvento
      evento={comFotosDemo(event)}
      nicho={event.type}
      recursos={recursosDoSite(event.plan, event.customization)}
    />
  );
}
