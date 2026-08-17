// Site publico do evento, servido por subdominio.
// O middleware reescreve `<sub>.seuconviteia.com` -> `/_sites/<sub>`.
//
// O corpo da HOME vive em `components/evt/paginas/PaginaInicio` — COMPARTILHADO
// com o preview do editor (preview = site de verdade). Aqui fica so o carregar/
// gate do tenant. O chrome (atmosfera/nav/rodape) e o tema ficam no layout.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFestaDb";
import { comFotosDemo } from "@/lib/demoFotos";
import { recursosDoSite } from "@/lib/recursos";
import { PaginaInicio } from "@/components/evt/paginas/PaginaInicio";
import { planoDoSite } from "@/lib/plans";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function EventSitePage({
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
    <PaginaInicio
      evento={comFotosDemo(event)}
      nicho={event.type}
      recursos={recursosDoSite(planoDoSite(event, new Date()), event.customization)}
    />
  );
}
