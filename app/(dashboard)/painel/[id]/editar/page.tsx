// Editar evento — protegido e isolado por tenant. Carrega o evento pelo `id` E
// `professionalId` da sessao (ownership; 404 se nao for dono), mapeia para o shape
// `EventoFormInitial` e reusa o MESMO `EventoForm` (mode="edit"), passando a action
// `editarEvento`. O `id` viaja num hidden field e e revalidado no servidor.
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { paletasSeletor, TEMAS, TEMA_PADRAO } from "@/lib/temas";
import { lerConteudo } from "@/lib/convite";
import { dividirDataHoraSP } from "@/lib/dates";
import { editarEvento } from "../../../actions";
import EventoForm, {
  type EventoFormInitial,
  type PaletaOpt,
} from "../../novo/EventoForm";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const PALETAS: PaletaOpt[] = paletasSeletor();

/** Le o preset de cor do `customization` (cai para o padrao se ausente/invalido). */
function lerTema(customization: unknown): string {
  if (customization && typeof customization === "object" && "tema" in customization) {
    const t = (customization as { tema: unknown }).tema;
    if (typeof t === "string" && TEMAS[t]) return t;
  }
  return TEMA_PADRAO;
}

/** Centavos -> string do input do form ("15000" -> "150,00"; 0/ausente -> ""). */
function centsParaInput(cents?: number | null): string {
  if (typeof cents !== "number" || cents <= 0) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
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
    },
  });
  if (!event) notFound();

  const conteudo = lerConteudo(event);
  const { date, time } = dividirDataHoraSP(event.eventDate);

  const initial: EventoFormInitial = {
    eventId: event.id,
    type: event.type,
    tema: lerTema(event.customization),
    title: event.title,
    date,
    time,
    mensagem: conteudo.mensagem,
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
    fotos: event.photos.map((p) => p.url),
  };

  return (
    <EventoForm
      paletas={PALETAS}
      rootDomain={ROOT_DOMAIN}
      action={editarEvento}
      mode="edit"
      initial={initial}
    />
  );
}
