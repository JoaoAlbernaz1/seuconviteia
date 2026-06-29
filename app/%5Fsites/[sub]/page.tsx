// Site publico do evento, servido por subdominio.
// O middleware reescreve `<sub>.seuconviteia.com` -> `/_sites/<sub>`.
// (A pasta no disco usa `%5F` — forma URL-safe do "_" — para que o segmento
// publico seja `/_sites` sem virar uma "private folder" do App Router.)
//
// Carrega o Event (+ relacoes), decide a visibilidade, normaliza o conteudo e
// renderiza a suite de convite editorial (`<Convite>`). O tema deriva do evento.
import { Convite } from "@/components/Convite";
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { lerConteudo } from "@/lib/convite";
import { prisma } from "@/lib/db";
import { eventoPublico } from "@/lib/event";
import { secoesDoPlano } from "@/lib/plans";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function EventSitePage({
  params,
}: {
  params: Promise<{ sub: string }>;
}) {
  const { sub } = await params;

  const event = await prisma.event.findUnique({
    where: { subdomain: sub },
    include: { professional: true, template: true, gifts: true, photos: true },
  });

  const visivel = eventoPublico(event, new Date());
  if (!visivel.ok || !event) {
    return <SiteIndisponivel motivo={visivel.motivo ?? "inexistente"} />;
  }

  const conteudo = lerConteudo(event);
  const gating = secoesDoPlano(event.plan);
  const marca = {
    brandName: event.professional.brandName ?? undefined,
    name: event.professional.name,
  };

  return (
    <Convite
      conteudo={conteudo}
      gating={gating}
      whiteLabel={event.whiteLabel}
      marca={marca}
      eventId={event.id}
    />
  );
}
