// Editar evento — protegido e isolado por tenant. Carrega o evento pelo `id` E
// `professionalId` da sessao (ownership; 404 se nao for dono), mapeia para o shape
// `EventoFormInitial` e reusa o MESMO `EventoForm` (mode="edit"), passando a action
// `editarEvento`. O `id` viaja num hidden field e e revalidado no servidor.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { paletasSeletor, TEMAS, TEMA_PADRAO } from "@/lib/temas";
import { lerConteudo } from "@/lib/convite";
import { dividirDataHoraSP } from "@/lib/dates";
import { editarEvento, liberarEdicao } from "../../../actions";
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
    },
  });
  if (!event) notFound();

  // Regra do modelo: site PUBLICADO (pago) nao se edita direto — e preciso
  // LIBERAR a edicao (volta para previa). Mostra um aviso com o botao de liberar.
  if (event.purchased) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold text-ink">
            Editar evento
          </h1>
          <Link
            href="/painel"
            className="text-sm font-medium text-texto-suave hover:text-ink"
          >
            ← Voltar
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <i className="bi bi-lock-fill text-amber-600" aria-hidden /> Este site está publicado
          </p>
          <p className="mt-2 text-sm text-texto-suave">
            <span className="font-medium text-ink">{event.title}</span> já foi
            publicado. Para alterar, é preciso liberar a edição — o site volta a
            ser <strong>prévia</strong> (com marca d&apos;água) até você publicar
            de novo.
          </p>

          <form action={liberarEdicao} className="mt-5">
            <input type="hidden" name="eventId" value={event.id} />
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              Liberar edição
            </button>
          </form>
          <p className="mt-3 text-xs text-texto-suave">
            Simulação — quando o pagamento estiver ligado, liberar a edição será
            um passo de cobrança.
          </p>
        </div>
      </main>
    );
  }

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
    presentesFotoUrl: lerCustomString(event.customization, "presentesFotoUrl"),
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
