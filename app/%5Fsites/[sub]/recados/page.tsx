// Pagina /recados do site publico (servida por subdominio). Porte FIEL do
// festa-15-maria-clara (`app/recados/page.tsx`): formulario + mural (masonry CSS)
// dos recados. Data-driven: lista os recados APROVADOS do evento (mais recentes
// primeiro). O chrome/tema ficam no layout aninhado.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFesta";
import { comFotosDemo } from "@/lib/demoFotos";

import { PaginaRecados } from "@/components/evt/paginas/PaginaRecados";
import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { listarRecadosAprovados } from "@/lib/recados";
import { recursosDoSite } from "@/lib/recursos";

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
  if (!recursosDoSite(event.plan, event.customization).recados) {
    return (
      <RecursoIndisponivel
        titulo="Recados indisponíveis"
        texto="O mural de recados não está disponível neste convite."
      />
    );
  }

  const evento = comFotosDemo(event);
  const recados = await listarRecadosAprovados(event.id);

  return (
    <PaginaRecados
      evento={evento}
      eventId={event.id}
      recados={recados.map((r) => ({ id: r.id, nome: r.nome, mensagem: r.mensagem }))}
    />
  );
}
