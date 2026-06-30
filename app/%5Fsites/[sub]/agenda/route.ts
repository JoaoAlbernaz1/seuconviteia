// Gera o arquivo .ics ("Adicionar à agenda") do evento, servido por subdominio
// em `/agenda` (sem `/api` nem extensao no path — o matcher do middleware exclui
// ambos do rewrite de tenant; o nome `.ics` vem do Content-Disposition).
// O middleware reescreve `<sub>.seuconviteia.com/agenda` -> `/_sites/<sub>/agenda`.
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta, lerEventoFesta } from "@/lib/eventoFesta";

export const dynamic = "force-dynamic";

/** Date -> "YYYYMMDDTHHMMSSZ" (UTC), formato do iCalendar. */
function icsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapa texto para um valor de campo do iCalendar (RFC 5545). */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sub: string }> },
) {
  const { sub } = await params;
  const event = await carregarEventoFesta(sub);
  if (!eventoPublico(event, new Date()).ok || !event) {
    return new Response("Evento indisponível.", { status: 404 });
  }

  const evento = lerEventoFesta(event);
  const inicio = event.eventDate;
  const fim = new Date(inicio.getTime() + 5 * 60 * 60 * 1000); // ~5h de festa
  const local = [evento.local, evento.endereco].filter(Boolean).join(" — ");
  const titulo =
    evento.idade != null
      ? `${evento.primeiroNome} — ${evento.nichoLabel}`
      : evento.primeiroNome;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//seuconviteia//evento//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@seuconviteia`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsUtc(inicio)}`,
    `DTEND:${icsUtc(fim)}`,
    `SUMMARY:${esc(titulo)}`,
    local ? `LOCATION:${esc(local)}` : "",
    evento.mensagemBoasVindas ? `DESCRIPTION:${esc(evento.mensagemBoasVindas)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sub}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
