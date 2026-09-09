// Rota do editor guiado "Criar convite". A proteção de sessão vem do layout do
// painel (DashShell). Server component: busca o PLANO do dono e passa ao editor
// (para travar o modelo VITRINE fora dos planos pagos).
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { Plan } from "@/lib/plans";
import { legacyEventToDocument } from "@/lib/event-editor/legacy";
import { EventEditorDocumentSchema } from "@/lib/event-editor/schema";
import type { EventEditorDocument } from "@/lib/event-editor/document";
import { CriarConvite } from "./CriarConvite";

export const dynamic = "force-dynamic";

export default async function CriarConvitePage({ searchParams }: { searchParams: Promise<{ id?: string; step?: string | string[] }> }) {
  const session = await auth();
  const { id, step: rawStep } = await searchParams;
  const stepParam = Array.isArray(rawStep) ? rawStep[0] : rawStep;
  const parsedStep = Number(stepParam);
  const initialStep = Number.isInteger(parsedStep) && parsedStep >= 1 && parsedStep <= 6 ? parsedStep : undefined;
  let plano: Plan = "BASICO";
  let initialDocument: EventEditorDocument | undefined;
  let initialEventId: string | undefined;
  let initialDraftVersion = 0;
  if (session?.user?.id) {
    const prof = await prisma.professional.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    if (prof) plano = prof.plan;

    if (id) {
      const event = await prisma.event.findFirst({
        where: { id, professionalId: session.user.id },
        include: { gifts: { orderBy: { id: "asc" } }, photos: { orderBy: { order: "asc" } } },
      });
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
      initialStep={initialStep}
      storageScope={session?.user?.id ?? "anonymous"}
    />
  );
}
