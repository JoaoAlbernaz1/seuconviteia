// Pagina /obrigada do site publico (servida por subdominio). Renderiza o
// componente compartilhado `PaginaObrigada` (mesmo do preview do editor). A
// mensagem muda conforme a pessoa CONFIRMOU (?vai=1) ou nao (?vai=0) — os textos
// vem do editor (customization.rsvpConfig). Data-driven: resolve o evento pelo
// subdominio e re-valida a visibilidade no servidor.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFestaDb";
import { comFotosDemo } from "@/lib/demoFotos";
import { lerRsvpConfig } from "@/lib/rsvpConfig";
import { PaginaObrigada } from "@/components/evt/paginas/PaginaObrigada";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function ObrigadaPage({
  params,
  searchParams,
}: {
  params: Promise<{ sub: string }>;
  searchParams: Promise<{ vai?: string }>;
}) {
  const { sub } = await params;
  const { vai } = await searchParams;
  const event = await carregarEventoFesta(sub);

  const visivel = eventoPublico(event, new Date());
  if (!visivel.ok || !event) {
    return <SiteIndisponivel motivo={visivel.motivo ?? "inexistente"} />;
  }

  const evento = comFotosDemo(event);

  return (
    <PaginaObrigada
      evento={evento}
      config={lerRsvpConfig(event.customization)}
      vai={vai !== "0"}
    />
  );
}
