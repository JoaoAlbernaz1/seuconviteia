// Rota do editor guiado "Criar convite". A proteção de sessão vem do layout do
// painel (DashShell). Server component: busca o PLANO do dono e passa ao editor
// (para travar o modelo VITRINE fora dos planos pagos).
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { planoEfetivo, podeCriarEvento, rotuloPlano, limiteEventos, SELECT_ASSINATURA, type Plan } from "@/lib/plans";
import Link from "next/link";
import { legacyEventToDocument } from "@/lib/event-editor/legacy";
import { EventEditorDocumentSchema } from "@/lib/event-editor/schema";
import type { EventEditorDocument } from "@/lib/event-editor/document";
import { edicaoAberta } from "@/lib/edicao";
import { redirect } from "next/navigation";
import { CriarConvite } from "./CriarConvite";

export const dynamic = "force-dynamic";

export default async function CriarConvitePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const session = await auth();
  const { id } = await searchParams;
  let plano: Plan = "BASICO";
  let initialDocument: EventEditorDocument | undefined;
  let initialEventId: string | undefined;
  let initialDraftVersion = 0;
  if (session?.user?.id) {
    const prof = await prisma.professional.findUnique({
      where: { id: session.user.id },
      select: SELECT_ASSINATURA,
    });
    if (prof) plano = planoEfetivo(prof, new Date());

    // A PORTA do limite de convites. Sem ela, a pessoa do Basico montava o
    // convite inteiro e so descobria o teto na hora de salvar — trabalho
    // perdido. `id` presente = esta EDITANDO um convite que ja existe, e isso
    // nunca pode ser bloqueado.
    if (!id) {
      const ativos = await prisma.event.count({
        where: { professionalId: session.user.id, expiresAt: { gt: new Date() } },
      });
      if (!podeCriarEvento(plano, ativos)) return <LimiteDeConvites plano={plano} />;
    }

    if (id) {
      const event = await prisma.event.findFirst({
        where: { id, professionalId: session.user.id },
        include: { gifts: { orderBy: { id: "asc" } }, photos: { orderBy: { order: "asc" } } },
      });

      // A PORTA de ABRIR o editor. Publicou, fecha: sem uma janela aberta o
      // convite nao volta para a tela de edicao, vai para a tela que explica e
      // libera. Botao escondido nao seria bloqueio — o link direto passaria.
      if (event && !edicaoAberta(event, new Date())) {
        redirect(`/painel/${event.id}/liberar`);
      }

      if (event) {
        const legacyDocument = legacyEventToDocument(event);
        const draft = EventEditorDocumentSchema.safeParse(event.draftData);
        initialDocument = draft.success ? draft.data : legacyDocument;
        initialEventId = event.id;
        initialDraftVersion = event.draftVersion;

        // Schema-first garante que as colunas existem. O compare-and-set torna o
        // bootstrap idempotente: só o primeiro carregamento do legado publicado
        // congela A em draft/published antes que o editor possa produzir B.
        if (event.status === "PUBLISHED" && event.draftData === null && event.publishedData === null) {
          const documentJson = legacyDocument as unknown as Prisma.InputJsonValue;
          await prisma.event.updateMany({
            where: {
              id: event.id,
              professionalId: session.user.id,
              status: "PUBLISHED",
              draftData: { equals: Prisma.DbNull },
              publishedData: { equals: Prisma.DbNull },
            },
            data: { draftData: documentJson, publishedData: documentJson, schemaVersion: legacyDocument.schemaVersion },
          });
        }
      }
    }
  }
  return (
    <CriarConvite
      plano={plano}
      initialDocument={initialDocument}
      initialEventId={initialEventId}
      initialDraftVersion={initialDraftVersion}
      storageScope={session?.user?.id ?? "anonymous"}
    />
  );
}

/** Tela de porta fechada: diz o teto, o que ele custa e o caminho de saida. */
function LimiteDeConvites({ plano }: { plano: Plan }) {
  const limite = limiteEventos(plano) ?? 1;
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-16 text-center sm:px-7">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-scv-lilac text-scv-violet">
        <i className="bi bi-lock-fill text-[22px]" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-[26px] font-semibold tracking-tight text-scv-ink">
        Seu plano inclui {limite} convite{limite === 1 ? "" : "s"}
      </h1>
      <p className="mx-auto mt-2.5 max-w-[420px] text-[14px] leading-relaxed text-scv-muted">
        O plano {rotuloPlano(plano)} permite {limite} convite{limite === 1 ? "" : "s"} no ar por vez.
        Para criar outro, mude de plano — ou apague um convite que não vai mais acontecer.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
        <Link
          href="/painel/plano"
          className="w-full cursor-pointer rounded-[11px] bg-violeta px-6 py-3 text-[14px] font-semibold !text-white transition-colors duration-200 hover:brightness-110 sm:w-auto"
        >
          Ver planos
        </Link>
        <Link
          href="/painel/convites"
          className="w-full cursor-pointer rounded-[11px] border border-scv-line bg-scv-card px-6 py-3 text-[14px] font-semibold text-scv-ink transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field sm:w-auto"
        >
          Meus convites
        </Link>
      </div>
    </div>
  );
}
