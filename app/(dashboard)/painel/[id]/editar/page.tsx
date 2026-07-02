// Editar evento — protegido e isolado por tenant. Carrega o evento pelo `id` E
// `professionalId` da sessao (ownership; 404 se nao for dono), mapeia para o shape
// `EventoFormInitial` e renderiza o `EditorEvento` (3 painéis + preview ao vivo)
// em modo "edit". O `id` viaja num hidden field e e revalidado no servidor.
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { paletasSeletor, lerTemaKey } from "@/lib/temas";
import { lerFonteKey } from "@/lib/fontes";
import { lerToggles } from "@/lib/recursos";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { eventPublicUrl } from "@/lib/tenant";
import { lerConteudo } from "@/lib/convite";
import { dividirDataHoraSP } from "@/lib/dates";
import EditorEvento, {
  type EventoFormInitial,
  type PaletaOpt,
} from "../../_editor/EditorEvento";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const PALETAS: PaletaOpt[] = paletasSeletor();

/** Centavos -> string do input do form ("15000" -> "150,00"; 0/ausente -> ""). */
function centsParaInput(cents?: number | null): string {
  if (typeof cents !== "number" || cents <= 0) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Le uma string crua do `customization` (sem fallback) — vazio vira `undefined`. */
function lerCustomString(customization: unknown, key: string): string | undefined {
  if (customization && typeof customization === "object" && key in customization) {
    const v = (customization as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const { id } = await params;

  // Ownership: SO carrega se o evento for do profissional logado.
  const event = await prisma.event.findFirst({
    where: { id, professionalId: session.user.id },
    include: {
      gifts: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { order: "asc" } },
      professional: { select: { plan: true } },
    },
  });
  if (!event) notFound();

  const conteudo = lerConteudo(event);
  const { date, time } = dividirDataHoraSP(event.eventDate);

  const initial: EventoFormInitial = {
    eventId: event.id,
    type: event.type,
    tema: lerTemaKey(event.customization),
    fontes: lerFonteKey(event.customization),
    recursos: lerToggles(event.customization),
    title: event.title,
    date,
    time,
    mensagem: conteudo.mensagem,
    presentesTexto: lerCustomString(event.customization, "presentesTexto"),
    local: conteudo.local,
    endereco: conteudo.endereco,
    traje: conteudo.traje,
    programacao: conteudo.programacao,
    presentes: event.gifts.map((g) => ({
      titulo: g.title,
      descricao: g.description ?? undefined,
      valor: centsParaInput(g.priceCents),
    })),
    pixNome: conteudo.pixNome,
    pixChave: conteudo.pixChave,
    fotoUrl: conteudo.fotoUrl,
    presentesFotoUrl: lerCustomString(event.customization, "presentesFotoUrl"),
    fotos: event.photos.map((p) => p.url),
  };

  // O wrapper carrega TODAS as fontes das duplas (next/font) para os cards de
  // "Estilo das letras" e o preview renderizarem com as fontes reais.
  return (
    <div className={EVT_FONTS_CLASS}>
      <EditorEvento
        paletas={PALETAS}
        rootDomain={ROOT_DOMAIN}
        mode="edit"
        plan={event.professional?.plan ?? event.plan}
        initial={initial}
        status={event.status}
        publicUrl={eventPublicUrl(event.subdomain, ROOT_DOMAIN)}
        subdomain={event.subdomain}
      />
    </div>
  );
}
