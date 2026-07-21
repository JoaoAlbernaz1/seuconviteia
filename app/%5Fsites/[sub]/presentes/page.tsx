// Pagina /presentes do site publico (servida por subdominio). Porte fiel do
// festa-15-maria-clara (`app/presentes/page.tsx`): UM painel unico (foto +
// lista de presentes + Pix). Data-driven via `lerEventoFesta` (gifts do evento +
// Pix do customization). Pix DIRETO (copiar chave) — sem checkout/taxa.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFesta";
import { comFotosDemo } from "@/lib/demoFotos";
import { recursosDoSite } from "@/lib/recursos";

import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { PaginaPresentes } from "@/components/evt/paginas/PaginaPresentes";

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

  // Recurso "presentes" desligado no evento -> pagina indisponivel (o link ja
  // some da nav; isto cobre o acesso direto pela URL).
  if (!recursosDoSite(event.plan, event.customization).presentes) {
    return (
      <RecursoIndisponivel
        titulo="Lista de presentes"
        texto="Este convite não tem lista de presentes."
      />
    );
  }

  return (
    <PaginaPresentes
      evento={comFotosDemo(event)}
      nicho={event.type}
      recursos={recursosDoSite(event.plan, event.customization)}
    />
  );
}
