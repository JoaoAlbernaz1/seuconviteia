"use server";

/**
 * Server actions do editor guiado "Criar convite" (`CriarConvite.tsx`): SALVAR
 * o rascunho e PUBLICAR um snapshot dele.
 *
 * As duas trabalham sobre o documento canonico (`draftData`/`publishedData`) e
 * derivam dali o `Event` + `customization` legado que o site consome.
 *
 * Regras herdadas de `acoes.ts`:
 *  - Zod na borda; tenant SEMPRE da sessao; ownership revalidado.
 *  - Data em -03:00 (Brasilia). Slug unico. Limite de eventos por plano.
 *  - Convite publicado so se mexe dentro da janela de edicao (`lib/edicao.ts`).
 */
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { gerarSlugUnico } from "@/lib/slug";
import { calcularExpiracao } from "@/lib/dates";
import { limiteEventos, planoEfetivo, rotuloPlano, SELECT_ASSINATURA } from "@/lib/plans";
import { ID_CONTRIBUICAO_LIVRE, presentesDoDocumento } from "@/lib/event-editor/render";
import { imagemPermitida, imagensDoDocumento } from "@/lib/imagemPermitida";
import { protocoloDe, rootDomain } from "@/lib/tenant";
import { EventEditorDocumentSchema } from "@/lib/event-editor/schema";
import type { EventEditorDocument } from "@/lib/event-editor/document";
import { documentToLegacyCustomization } from "@/lib/event-editor/legacy";
import { planGiftSync } from "@/lib/event-editor/gift-sync";
import { conviteEncerrado } from "@/lib/event";
import { RECUSA_FESTA_PASSOU, edicaoAberta, fimDaCortesia } from "@/lib/edicao";

export type SalvarDocumentoResult =
  | { ok: true; id: string; version: number; savedAt: string; host: string; url: string }
  | { ok: false; kind: "conflict"; currentVersion: number; error: string }
  | { ok: false; kind: "validation" | "auth" | "not_found" | "limit" | "fechado" | "server"; error: string };

export type PublicarDocumentoResult =
  | { ok: true; id: string; publishedVersion: number; publishedAt: string; host: string; url: string }
  | { ok: false; kind: "conflict"; currentVersion: number; error: string }
  | { ok: false; kind: "validation" | "auth" | "not_found" | "fechado" | "server"; error: string };

/** Host + URL publicos do subdominio (mesma regra de `_carregar.ts`). */
function enderecoPublico(subdomain: string): { host: string; url: string } {
  const root = rootDomain();
  const host = `${subdomain}.${root.replace(/:\d+$/, "")}`;
  const proto = protocoloDe(root);
  return { host, url: `${proto}://${subdomain}.${root}` };
}

const salvarDocumentoSchema = z.object({
  id: z.string().max(40).optional(),
  expectedVersion: z.number().int().min(0),
  document: EventEditorDocumentSchema,
});

const publicarDocumentoSchema = z.object({
  id: z.string().max(40),
  expectedDraftVersion: z.number().int().min(0),
});

function dataDoDocumento(document: EventEditorDocument): Date {
  const candidate = new Date(`${document.schedule.date}T${document.schedule.time || "20:00"}:00-03:00`);
  return document.schedule.date && !Number.isNaN(candidate.getTime())
    ? candidate
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function jsonDoDocumento(document: EventEditorDocument): Prisma.InputJsonValue {
  return document as unknown as Prisma.InputJsonValue;
}

async function sincronizarPresentesDoDocumento(eventId: string, document: EventEditorDocument): Promise<void> {
  const contributions = await prisma.giftContribution.count({ where: { eventId } });
  const current = await prisma.giftItem.findMany({ where: { eventId }, select: { id: true } });
  const currentIds = new Set(current.map((gift) => gift.id));
  // A "contribuicao com valor livre" e um item de verdade da lista (id proprio
  // por evento) — antes ela vivia so no editor e nunca chegava ao convidado.
  const presentes = presentesDoDocumento(document, `${eventId}-${ID_CONTRIBUICAO_LIVRE}`);
  const incomingIds = presentes.map((gift) => gift.id).filter(Boolean);
  const syncPlan = planGiftSync({ existingIds: [...currentIds], incomingIds, contributionCount: contributions });
  if (syncPlan.protectedByLedger) return;

  for (const gift of presentes) {
    const data = {
      title: gift.title,
      description: gift.description || null,
      imageUrl: gift.imageUrl || null,
      priceCents: gift.priceCents,
      mode: "PIX" as const,
      pricingMode: gift.pricingMode as "FIXO" | "COTAS" | "LIVRE",
      quotaCount: gift.quotaCount,
    };
    if (gift.id && currentIds.has(gift.id)) {
      await prisma.giftItem.update({ where: { id: gift.id }, data });
    } else {
      await prisma.giftItem.create({ data: { ...(gift.id ? { id: gift.id } : {}), eventId, ...data } });
    }
  }

  const removed = syncPlan.removeIds;
  if (removed.length) await prisma.giftItem.deleteMany({ where: { eventId, id: { in: removed } } });
}

/**
 * Album do convite: as fotos da galeria do documento viram linhas `Photo` (a
 * ordem da UI e a ordem do site). O site publicado le do banco — sem esta
 * sincronizacao a galeria ficava eternamente em "as fotos chegam em breve".
 */
async function sincronizarFotosDoDocumento(eventId: string, document: EventEditorDocument): Promise<void> {
  const urls = document.gallery.imageUrls.map((url) => url.trim()).filter(Boolean);
  const atuais = await prisma.photo.findMany({ where: { eventId }, orderBy: { order: "asc" }, select: { url: true, order: true } });
  const igual = atuais.length === urls.length && atuais.every((foto, i) => foto.url === urls[i] && foto.order === i);
  if (igual) return;
  await prisma.photo.deleteMany({ where: { eventId } });
  if (urls.length) {
    await prisma.photo.createMany({ data: urls.map((url, order) => ({ eventId, url, order })) });
  }
}

/**
 * Salva exclusivamente o documento canônico. A condição `draftVersion =
 * expectedVersion` torna a atualização atômica: duas abas não podem vencer com a
 * mesma versão. O retorno nunca substitui o documento local do cliente.
 */
export async function salvarDocumentoConvite(input: unknown): Promise<SalvarDocumentoResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, kind: "auth", error: "Sua sessão expirou. Entre de novo." };
  const parsed = salvarDocumentoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: "validation", error: parsed.error.issues[0]?.message ?? "Documento inválido." };

  const { id, expectedVersion, document } = parsed.data;

  // Imagem só entra se veio da nossa porta. O upload já recusa foto com QR code
  // (`lib/imagemQr.ts`), mas o documento é gravado direto por esta action: sem
  // esta checagem, bastava salvar um `data:` ou um link de fora com o QR do Pix
  // pessoal e a trava do upload não valeria de nada.
  const imagemDeFora = imagensDoDocumento(document).find((url) => !imagemPermitida(url));
  if (imagemDeFora) {
    return { ok: false, kind: "validation", error: "Use apenas fotos enviadas pelo próprio editor." };
  }

  const professionalId = session.user.id;
  const professional = await prisma.professional.findUnique({ where: { id: professionalId }, select: SELECT_ASSINATURA });
  if (!professional) return { ok: false, kind: "auth", error: "Conta não encontrada." };
  const planoDaConta = planoEfetivo(professional, new Date());

  const eventDate = dataDoDocumento(document);
  const expiresAt = calcularExpiracao(eventDate);
  const customization = documentToLegacyCustomization(document) as Prisma.InputJsonValue;
  const savedAt = new Date();

  if (!id) {
    if (expectedVersion !== 0) return { ok: false, kind: "conflict", currentVersion: 0, error: "O rascunho mudou. Recarregue antes de salvar." };
    const limit = limiteEventos(planoDaConta);
    if (limit !== null) {
      const count = await prisma.event.count({ where: { professionalId, expiresAt: { gt: new Date() } } });
      if (count >= limit) return { ok: false, kind: "limit", error: `O plano ${rotuloPlano(planoDaConta)} inclui até ${limit} convite(s).` };
    }
    const subdomain = await gerarSlugUnico(document.basic.slug || document.basic.name || "convite", async (slug) =>
      Boolean(await prisma.event.findUnique({ where: { subdomain: slug } })),
    );
    const event = await prisma.event.create({
      data: {
        professionalId,
        type: "QUINZE_ANOS",
        templateId: null,
        title: document.basic.name || "Convite sem título",
        subdomain,
        eventDate,
        expiresAt,
        status: "DRAFT",
        plan: planoDaConta,
        customization,
        draftData: jsonDoDocumento(document),
        draftVersion: 1,
        schemaVersion: document.schemaVersion,
      },
    });
    await sincronizarPresentesDoDocumento(event.id, document);
    await sincronizarFotosDoDocumento(event.id, document);
    const address = enderecoPublico(event.subdomain);
    return { ok: true, id: event.id, version: 1, savedAt: savedAt.toISOString(), ...address };
  }

  const owned = await prisma.event.findFirst({ where: { id, professionalId }, select: { id: true, subdomain: true, draftVersion: true, status: true, expiresAt: true, edicaoAte: true } });
  if (!owned) return { ok: false, kind: "not_found", error: "Convite não encontrado." };
  // Convite ENCERRADO nao se edita: senao a mesma linha vira a festa do ano que
  // vem, e nenhuma festa nova gera presente novo. O RASCUNHO fica de fora da
  // pergunta — e a mesma ordem DRAFT-primeiro de `edicaoAberta`: o rascunho e
  // onde se conserta o ano digitado errado, e mandar jogar fora o trabalho por
  // causa do erro que a pessoa veio corrigir seria o pior fim possivel.
  if (owned.status !== "DRAFT" && conviteEncerrado(owned, new Date())) {
    return { ok: false, kind: "not_found", error: RECUSA_FESTA_PASSOU };
  }
  // A PORTA de SALVAR. O editor fechado nem abre (`criar/page.tsx`), mas a
  // action é um endereço público: sem esta linha, uma aba velha ainda gravaria
  // no convite que já está com os convidados.
  if (!edicaoAberta(owned, new Date())) {
    return { ok: false, kind: "fechado", error: "Este convite está publicado. Libere a edição para mexer no site." };
  }
  if (owned.draftVersion !== expectedVersion) {
    return { ok: false, kind: "conflict", currentVersion: owned.draftVersion, error: "Este convite foi alterado em outra aba. Recarregue para continuar." };
  }

  const updated = await prisma.event.updateMany({
    where: { id, professionalId, draftVersion: expectedVersion },
    data: {
      title: document.basic.name || "Convite sem título",
      eventDate,
      expiresAt,
      customization,
      draftData: jsonDoDocumento(document),
      draftVersion: { increment: 1 },
      schemaVersion: document.schemaVersion,
    },
  });
  if (updated.count !== 1) {
    const current = await prisma.event.findFirst({ where: { id, professionalId }, select: { draftVersion: true } });
    return { ok: false, kind: "conflict", currentVersion: current?.draftVersion ?? expectedVersion, error: "Este convite foi alterado em outra aba. Recarregue para continuar." };
  }
  await sincronizarPresentesDoDocumento(id, document);
  await sincronizarFotosDoDocumento(id, document);
  revalidatePath("/painel");
  const address = enderecoPublico(owned.subdomain);
  return { ok: true, id, version: expectedVersion + 1, savedAt: savedAt.toISOString(), ...address };
}

/** Publica um snapshot imutável do rascunho que possui a versão esperada. */
export async function publicarDocumentoConvite(input: unknown): Promise<PublicarDocumentoResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, kind: "auth", error: "Sua sessão expirou. Entre de novo." };
  const parsed = publicarDocumentoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: "validation", error: parsed.error.issues[0]?.message ?? "Publicação inválida." };
  const { id, expectedDraftVersion } = parsed.data;
  const professionalId = session.user.id;
  const event = await prisma.event.findFirst({
    where: { id, professionalId },
    select: { id: true, subdomain: true, draftData: true, draftVersion: true, status: true, expiresAt: true, edicaoAte: true, publishedAt: true },
  });
  if (!event) return { ok: false, kind: "not_found", error: "Convite não encontrado." };
  const agora = new Date();
  // Rascunho de fora da pergunta, como em `salvarDocumentoConvite`.
  if (event.status !== "DRAFT" && conviteEncerrado(event, agora)) {
    return { ok: false, kind: "not_found", error: RECUSA_FESTA_PASSOU };
  }
  // A PORTA de REPUBLICAR. Republicar é o que troca o site que os convidados
  // veem: fora da janela, é exatamente isso que a regra impede.
  if (!edicaoAberta(event, agora)) {
    return { ok: false, kind: "fechado", error: "Este convite está publicado. Libere a edição para mexer no site." };
  }
  // Salvar o rascunho com a data vencida PODE (é o conserto); publicar, não —
  // subiria um site que já nasce fora do ar. As duas portas respondem coisas
  // diferentes de propósito.
  if (event.expiresAt.getTime() <= agora.getTime()) {
    return { ok: false, kind: "validation", error: "Com essa data o convite já estaria encerrado. Escolha uma data futura." };
  }
  if (event.draftVersion !== expectedDraftVersion) {
    return { ok: false, kind: "conflict", currentVersion: event.draftVersion, error: "Existem alterações mais novas. Salve antes de publicar." };
  }
  const document = EventEditorDocumentSchema.safeParse(event.draftData);
  if (!document.success) return { ok: false, kind: "validation", error: "O rascunho precisa ser revisado antes de publicar." };

  // O endereço só é calculado na PRIMEIRA publicação. Depois dela o link já foi
  // mandado no WhatsApp: mudar o nome da debutante não pode mudar o subdomínio
  // e derrubar quem guardou o convite.
  // Primeira publicacao = nunca esteve no ar. `status` sozinho so e seguro
  // porque hoje "tirar do ar" mantem PUBLISHED; `publishedAt` continua honesto
  // se alguem reintroduzir um "despublicar" que volte para DRAFT. Os dois juntos
  // porque convite legado publicado pelo painel antigo tem `publishedAt` nulo —
  // sozinho, ele recalcularia o endereco de um convite que ja esta no ar.
  const primeiraPublicacao = event.status !== "PUBLISHED" && event.publishedAt === null;
  const subdomain = primeiraPublicacao
    ? await gerarSlugUnico(document.data.basic.slug || document.data.basic.name || "convite", async (slug) =>
        slug !== event.subdomain && Boolean(await prisma.event.findUnique({ where: { subdomain: slug } })),
      )
    : event.subdomain;
  const publishedAt = new Date();
  const updated = await prisma.event.updateMany({
    where: { id, professionalId, draftVersion: expectedDraftVersion },
    data: {
      subdomain,
      status: "PUBLISHED",
      publishedData: jsonDoDocumento(document.data),
      publishedVersion: expectedDraftVersion,
      publishedAt,
      schemaVersion: document.data.schemaVersion,
      // Cortesia de 1h só na PRIMEIRA publicação: é a rede do erro de digitação
      // que só aparece com o convite no ar. Republicar dentro de uma janela paga
      // não pode encurtar nem esticar o prazo — quem manda é a janela vigente.
      ...(primeiraPublicacao ? { edicaoAte: fimDaCortesia(publishedAt) } : {}),
    },
  });
  if (updated.count !== 1) {
    const current = await prisma.event.findFirst({ where: { id, professionalId }, select: { draftVersion: true } });
    return { ok: false, kind: "conflict", currentVersion: current?.draftVersion ?? expectedDraftVersion, error: "Existem alterações mais novas. Salve antes de publicar." };
  }
  revalidatePath("/painel");
  const address = enderecoPublico(subdomain);
  return { ok: true, id, publishedVersion: expectedDraftVersion, publishedAt: publishedAt.toISOString(), ...address };
}
