// Site publico do evento, servido por subdominio.
// O middleware reescreve `<sub>.seuconviteia.com` -> `/_sites/<sub>`.
// (A pasta no disco usa `%5F` — forma URL-safe do "_" — para que o segmento
// publico seja `/_sites` sem virar uma "private folder" do App Router.)
//
// Aqui carregamos o Event do banco e decidimos a visibilidade. A renderizacao
// completa por template chega na Fase 5; por ora, uma capa minima com a marca.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { prisma } from "@/lib/db";
import { eventoPublico } from "@/lib/event";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

// Rotulos amigaveis para o nicho (EventType do Prisma).
const TIPO_LABEL: Record<string, string> = {
  CASAMENTO: "Casamento",
  QUINZE_ANOS: "15 anos",
  SESSENTA_ANOS: "60 anos",
  BODAS: "Bodas",
  ANIVERSARIO: "Aniversario",
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "America/Sao_Paulo",
});

export default async function EventSitePage({
  params,
}: {
  params: Promise<{ sub: string }>;
}) {
  const { sub } = await params;

  const event = await prisma.event.findUnique({
    where: { subdomain: sub },
    include: { professional: true, template: true },
  });

  const visivel = eventoPublico(event, new Date());
  if (!visivel.ok || !event) {
    return <SiteIndisponivel motivo={visivel.motivo ?? "inexistente"} />;
  }

  const tipo = TIPO_LABEL[event.type] ?? event.type;
  const dataFormatada = formatadorData.format(event.eventDate);
  const profissional = event.professional.brandName ?? event.professional.name;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-nevoa px-6 py-20 text-center">
      <div className="w-full max-w-xl">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-violeta">
          {tipo}
        </span>

        <h1 className="mt-4 font-display text-4xl font-semibold text-ink sm:text-5xl">
          {event.title}
        </h1>

        <p className="mt-4 text-lg text-texto-suave">{dataFormatada}</p>

        <div
          aria-hidden
          className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-turquesa via-teal to-violeta"
        />

        <p className="mt-8 text-sm text-texto-suave">
          Um convite de{" "}
          <span className="font-medium text-ink">{profissional}</span>
        </p>
        <p className="mt-2 text-xs text-texto-suave">
          Site completo na Fase 5.
        </p>
      </div>
    </main>
  );
}
