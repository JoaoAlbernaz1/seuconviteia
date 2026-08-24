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
import { limiteEventos, planoEfetivo, podeCriarEvento, rotuloPlano, SELECT_ASSINATURA, type Plan } from "@/lib/plans";
import { ID_CONTRIBUICAO_LIVRE, presentesDoDocumento } from "@/lib/event-editor/render";
import { imagemPermitida, imagensDoDocumento } from "@/lib/imagemPermitida";
import { protocoloDe, rootDomain } from "@/lib/tenant";
import { EventEditorDocumentSchema } from "@/lib/event-editor/schema";
import type { EventEditorDocument } from "@/lib/event-editor/document";
import { documentToLegacyCustomization } from "@/lib/event-editor/legacy";
import { planGiftSync } from "@/lib/event-editor/gift-sync";
import { conviteEncerrado } from "@/lib/event";
import { RECUSA_FESTA_PASSOU, edicaoAberta, enderecoTravado, fimDaCortesia } from "@/lib/edicao";

export type SalvarDocumentoResult =
  | { ok: true; id: string; version: number; savedAt: string; host: string; url: string }
  | { ok: false; kind: "conflict"; currentVersion: number; error: string }
  | { ok: false; kind: "validation" | "auth" | "not_found" | "limit" | "fechado" | "server"; error: string };

export type PublicarDocumentoResult =
  | { ok: true; id: string; publishedVersion: number; publishedAt: string; host: string; url: string }
  | { ok: false; kind: "conflict"; currentVersion: number; error: string }
  | { ok: false; kind: "validation" | "auth" | "not_found" | "limit" | "fechado" | "server"; error: string };

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

/**
 * Ha vaga no plano para ESTE convite ficar ATIVO (no ar, ocupando lugar)?
 *
 * Conta so os OUTROS convites validos: o proprio nao disputa vaga consigo mesmo
 * — senao republicar o unico convite da conta se recusaria sozinho.
 */
async function vagaParaAtivar(professionalId: string, plano: Plan, exceto: string): Promise<boolean> {
  const outrosAtivos = await prisma.event.count({
    where: { professionalId, expiresAt: { gt: new Date() }, id: { not: exceto } },
  });
  return podeCriarEvento(plano, outrosAtivos);
}

/** A mesma frase nas tres portas da cota (criar, reativar, publicar). */
function mensagemLimite(plano: Plan): string {
  return `O plano ${rotuloPlano(plano)} inclui ${limiteEventos(plano)} convite(s) no ar ao mesmo tempo.`;
}

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
      if (count >= limit) return { ok: false, kind: "limit", error: mensagemLimite(planoDaConta) };
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
  // A SEGUNDA porta da cota: REATIVAR custa vaga igual criar.
  //
  // Convite vencido nao ocupa lugar (festa que passou libera a vaga). So que a
  // cota era cobrada UMA vez, na criacao — e o campo de data aceita dia no
  // passado. Dava para o Basico nascer um convite ja morto (data velha), a vaga
  // continuar livre, criar o segundo de verdade e so entao voltar no primeiro e
  // arrumar a data: dois convites no ar no plano de um.
  //
  // So vale para RASCUNHO porque so nele a data da linha muda aqui embaixo; no
  // convite publicado quem mexe em `expiresAt` e o publicar, que tem a porta
  // dele. E salvar rascunho com data VENCIDA continua podendo — e o conserto do
  // ano digitado errado, e nao poe convite nenhum no ar.
  if (owned.status === "DRAFT" && owned.expiresAt <= savedAt && expiresAt > savedAt && !(await vagaParaAtivar(professionalId, planoDaConta, id))) {
    return { ok: false, kind: "limit", error: mensagemLimite(planoDaConta) };
  }

  const updated = await prisma.event.updateMany({
    where: { id, professionalId, draftVersion: expectedVersion },
    data: {
      title: document.basic.name || "Convite sem título",
      // A DATA da linha e do SITE PUBLICADO, nao do rascunho.
      //
      // `expiresAt` e o que `eventoPublico` usa para decidir se o site responde,
      // e `eventDate` e o que o .ics do convidado marca na agenda. Nenhuma das
      // duas passa pelo snapshot, entao grava-las aqui com o convite ja no ar
      // fazia o AUTOSAVE derrubar o site: o dono abria o editor dentro da janela
      // que pagou, errava o ano da data, e em 800ms o convite sumia para os
      // convidados — e, a partir dali, salvar, publicar e ate comprar outro
      // passe recusavam por "festa passou". Pagou e perdeu o convite.
      //
      // Quem passa as duas para a linha e `publicarDocumentoConvite`, junto com
      // o resto do snapshot: e o unico momento em que o dono pediu para trocar o
      // que os convidados veem. O rascunho continua guardando a data no
      // documento (e a previa le de la), entao nada se perde no caminho.
      ...(owned.status === "DRAFT" ? { eventDate, expiresAt } : {}),
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
  if (event.draftVersion !== expectedDraftVersion) {
    return { ok: false, kind: "conflict", currentVersion: event.draftVersion, error: "Existem alterações mais novas. Salve antes de publicar." };
  }
  const document = EventEditorDocumentSchema.safeParse(event.draftData);
  if (!document.success) return { ok: false, kind: "validation", error: "O rascunho precisa ser revisado antes de publicar." };

  // A data que vai VALER: a do rascunho que esta subindo, nao a da linha — que
  // desde o conserto do autosave continua sendo a do site atualmente no ar.
  const eventDate = dataDoDocumento(document.data);
  const expiresAt = calcularExpiracao(eventDate);
  // Salvar o rascunho com a data vencida PODE (é o conserto); publicar, não —
  // subiria um site que já nasce fora do ar. As duas portas respondem coisas
  // diferentes de propósito.
  if (expiresAt.getTime() <= agora.getTime()) {
    return { ok: false, kind: "validation", error: "Com essa data o convite já estaria encerrado. Escolha uma data futura." };
  }
  // A TERCEIRA porta da cota. Publicar e o que POE no ar: se esta linha ainda
  // nao ocupava vaga (rascunho vencido, ou convite cuja festa ja passou), ela
  // passa a ocupar agora — e ai a conta precisa ter lugar. Sem isto, o mesmo
  // convite morto que abriu espaco para o segundo voltava a viver ao publicar.
  //
  // Quem JA ocupava vaga nao paga de novo: republicar o unico convite da conta
  // nao pode se recusar sozinho.
  if (event.expiresAt.getTime() <= agora.getTime()) {
    const prof = await prisma.professional.findUnique({ where: { id: professionalId }, select: SELECT_ASSINATURA });
    if (!prof) return { ok: false, kind: "auth", error: "Conta não encontrada." };
    const plano = planoEfetivo(prof, agora);
    if (!(await vagaParaAtivar(professionalId, plano, id))) {
      return { ok: false, kind: "limit", error: mensagemLimite(plano) };
    }
  }

  // O endereço só é calculado na PRIMEIRA publicação. Depois dela o link já foi
  // mandado no WhatsApp: mudar o nome da debutante não pode mudar o subdomínio
  // e derrubar quem guardou o convite. A regra mora em `lib/edicao` porque a
  // TELA precisa da mesma resposta para travar o campo (`criar/page.tsx`).
  const primeiraPublicacao = !enderecoTravado(event);
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
      // A data entra na linha AQUI, junto com o snapshot: publicar é o único
      // momento em que o dono pediu para trocar o que os convidados veem, e
      // `expiresAt`/`eventDate` são a metade do site que não cabe no snapshot
      // (o ar do convite e o .ics da agenda).
      eventDate,
      expiresAt,
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
