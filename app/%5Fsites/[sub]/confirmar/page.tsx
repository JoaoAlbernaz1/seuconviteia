// Pagina /confirmar do site publico (servida por subdominio). Porte FIEL do
// festa-15-maria-clara (`app/confirmar/page.tsx` -> `RsvpConvite`): formulario
// multi-convidado "Quem vai?" full-screen, que grava UMA linha `Guest` e navega
// para /obrigada. Data-driven: resolve o evento pelo subdominio e re-valida a
// visibilidade no servidor. O chrome (nav/atmosfera/rodape) e o tema ficam no
// layout aninhado; o RsvpConvite traz seu proprio fundo (foto clara) + particulas.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFestaDb";
import { comFotosDemo } from "@/lib/demoFotos";
import { RsvpConvite } from "@/components/evt/RsvpConvite";
import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { recursosDoSite } from "@/lib/recursos";
import { lerRsvpConfig } from "@/lib/rsvpConfig";
import { planoDoSite } from "@/lib/plans";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function ConfirmarPage({
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

  // Gate por plano: o RSVP so existe no CLASSICO/PREMIUM.
  if (!recursosDoSite(planoDoSite(event, new Date()), event.customization).rsvp) {
    return (
      <RecursoIndisponivel
        titulo="Confirmação indisponível"
        texto="A confirmação de presença não está disponível neste convite."
      />
    );
  }

  const evento = comFotosDemo(event);

  return (
    <RsvpConvite
      eventId={event.id}
      nome={evento.primeiroNome}
      fotoUrl={evento.fotoUrl}
      config={lerRsvpConfig(event.customization)}
    />
  );
}
