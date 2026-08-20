"use server";

/**
 * Acoes do painel que mexem no que e VIVO num convite: a lista de convidados e
 * o proprio convite (excluir). Nao ha aqui NENHUMA acao que edite o site.
 *
 * Ate a Task 11 este arquivo tinha seis acoes de edicao (Detalhes, Estilo,
 * Recursos, Fotos, Presentes, Programacao), uma por tela do painel antigo, mais
 * o `criarRascunho` do assistente aposentado. As seis gravavam em
 * `Event.customization` — e o convite PUBLICADO nao le mais dali:
 * `publishedEventProjection` troca o `customization` inteiro pelo derivado do
 * snapshot. Editar por ali era escrever numa gaveta que ninguem abre. Quem cria
 * e edita convite agora e o editor de 6 passos (`painel/criar/acoes.ts`), atras
 * da janela de edicao (`lib/edicao.ts`).
 *
 * Regras herdadas de `actions.ts`:
 *  - tenant SEMPRE da sessao; ownership revalidado por acao.
 *  - Erros voltam como estado (sem throw); redirects sobem.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** Le string do FormData ("" -> undefined). */
function str(formData: FormData, k: string): string | undefined {
  const v = formData.get(k);
  return typeof v === "string" && v.trim() ? v : undefined;
}

/** Ownership: o evento precisa ser do profissional logado. */
async function eventoDoDono(eventId: unknown) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  if (typeof eventId !== "string" || !eventId) return null;
  return prisma.event.findFirst({
    where: { id: eventId, professionalId: session.user.id },
  });
}

// ----------------------------------------------------------------------------
// Excluir evento (site) — remove tudo do evento, de vez
// ----------------------------------------------------------------------------

export async function excluirEvento(formData: FormData): Promise<void> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) redirect("/painel");
  // Filhos primeiro (nem todas as relacoes tem onDelete: Cascade).
  await prisma.guest.deleteMany({ where: { eventId: event.id } });
  await prisma.giftItem.deleteMany({ where: { eventId: event.id } });
  await prisma.photo.deleteMany({ where: { eventId: event.id } });
  await prisma.recado.deleteMany({ where: { eventId: event.id } });
  await prisma.event.delete({ where: { id: event.id } });
  revalidatePath("/painel");
  redirect("/painel");
}

// Exclusao EM LOTE (selecao multipla em "Meus convites"). Recebe os ids,
// mantem so os que sao MESMO do dono (nunca apaga de outro tenant) e remove
// tudo de cada evento. Nao redireciona: quem chama e um client component que
// revalida a lista no lugar.
export async function excluirEventos(ids: string[]): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const uid = session.user.id;

  const alvos = Array.from(new Set(ids)).filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  if (alvos.length === 0) return;

  // Ownership: so os ids que pertencem ao profissional logado.
  const meus = await prisma.event.findMany({
    where: { id: { in: alvos }, professionalId: uid },
    select: { id: true },
  });
  const idsOk = meus.map((e) => e.id);
  if (idsOk.length === 0) return;

  const emEventos = { where: { eventId: { in: idsOk } } };
  // Filhos primeiro, depois os eventos.
  await prisma.guest.deleteMany(emEventos);
  await prisma.giftItem.deleteMany(emEventos);
  await prisma.photo.deleteMany(emEventos);
  await prisma.recado.deleteMany(emEventos);
  await prisma.giftContribution.deleteMany(emEventos);
  await prisma.transaction.deleteMany(emEventos);
  await prisma.payout.deleteMany(emEventos);
  await prisma.event.deleteMany({ where: { id: { in: idsOk } } });

  revalidatePath("/painel/convites");
  revalidatePath("/painel");
}

// ----------------------------------------------------------------------------
// Convidados (lista manual para acompanhar confirmações)
// ----------------------------------------------------------------------------

export async function adicionarConvidado(formData: FormData): Promise<void> {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) redirect("/painel");
  const nome = str(formData, "name");
  if (!nome || nome.length > 140) return;
  await prisma.guest.create({
    data: { eventId: event.id, name: nome, status: "PENDING" },
  });
  revalidatePath(`/painel/${event.id}/convidados`);
}

export async function removerConvidado(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const guestId = formData.get("guestId");
  if (typeof guestId !== "string" || !guestId) return;
  // Ownership via join: o convidado precisa ser de um evento do profissional.
  await prisma.guest.deleteMany({
    where: { id: guestId, event: { professionalId: session.user.id } },
  });
  const eventId = formData.get("eventId");
  if (typeof eventId === "string" && eventId) {
    revalidatePath(`/painel/${eventId}/convidados`);
  }
}

// ----------------------------------------------------------------------------
// Recados (moderacao do mural) — LADO VIVO
// ----------------------------------------------------------------------------
//
// Estas tres acoes NAO passam por `edicaoAberta`, e isso e a regra, nao um
// esquecimento: o convite fechado tranca o SITE (texto, cores, fotos), nao o
// que os convidados escrevem depois de publicado. Exigir "liberar edicao" para
// tirar um recado ofensivo do ar deixaria o dono do convite refem de uma
// compra para apagar uma ofensa.
//
// Ownership em DOIS niveis: o evento precisa ser do profissional logado
// (`eventoDoDono`) E o recado precisa ser daquele evento (`eventId` no where).
// So o segundo ja bastaria, mas o primeiro mantem o padrao das outras acoes e
// evita que um id de recado adivinhado toque em evento alheio.

/** Esconde o recado do site publico (`approved: false`). Reversivel. */
export async function esconderRecado(recadoId: string, eventId: string): Promise<void> {
  await definirVisibilidade(recadoId, eventId, false);
}

/** Devolve o recado ao site publico (`approved: true`). */
export async function mostrarRecado(recadoId: string, eventId: string): Promise<void> {
  await definirVisibilidade(recadoId, eventId, true);
}

async function definirVisibilidade(
  recadoId: string,
  eventId: string,
  visivel: boolean,
): Promise<void> {
  const event = await eventoDoDono(eventId);
  if (!event) redirect("/painel");
  if (typeof recadoId !== "string" || !recadoId) return;
  await prisma.recado.updateMany({
    where: { id: recadoId, eventId: event.id },
    data: { approved: visivel },
  });
  revalidatePath(`/painel/${event.id}/recados`);
}

/** Apaga o recado de vez (confirmacao em dois toques vive na tela). */
export async function excluirRecado(recadoId: string, eventId: string): Promise<void> {
  const event = await eventoDoDono(eventId);
  if (!event) redirect("/painel");
  if (typeof recadoId !== "string" || !recadoId) return;
  await prisma.recado.deleteMany({ where: { id: recadoId, eventId: event.id } });
  revalidatePath(`/painel/${event.id}/recados`);
  revalidatePath(`/painel/${event.id}`);
}
