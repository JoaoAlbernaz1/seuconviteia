"use server";

// Server actions do "cofre" do convite (painel do dono): cadastrar a chave Pix
// de recebimento e resgatar (sacar) o saldo. Modelo "conta única + carteira
// interna": o resgate cria um Payout e chama o provider de transferência (hoje
// FakePaymentProvider → PAID na hora; o payout real via Mercado Pago é a próxima
// etapa — `transferir` ainda não implementado no MercadoPagoPaymentProvider).
//
// Segurança: toda ação valida OWNERSHIP (o evento tem de ser do usuário logado).
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/pagamentos";
import { saldoDoEvento } from "@/lib/pagamentos/contribuicao";

/** Retorna o evento SE for do dono logado; senão null. */
async function eventoDoDono(eventId: string) {
  const session = await auth();
  if (!session?.user) return null;
  return prisma.event.findFirst({
    where: { id: eventId, professionalId: session.user.id },
  });
}

const chaveSchema = z.object({
  eventId: z.string().min(1),
  pixKey: z.string().trim().min(3, "Informe a chave Pix.").max(140),
  pixName: z.string().trim().max(120).optional(),
});

/** Salva a chave Pix de recebimento do dono (usada só no resgate; nunca no site). */
export async function salvarChavePix(formData: FormData): Promise<void> {
  const parsed = chaveSchema.safeParse({
    eventId: formData.get("eventId"),
    pixKey: formData.get("pixKey"),
    pixName: formData.get("pixName") || undefined,
  });
  if (!parsed.success) return;

  const event = await eventoDoDono(parsed.data.eventId);
  if (!event) return;

  await prisma.event.update({
    where: { id: event.id },
    data: { payoutPixKey: parsed.data.pixKey, payoutPixName: parsed.data.pixName || null },
  });
  revalidatePath(`/painel/${event.id}/cofre`);
}

/** Resgata TODO o saldo disponível do cofre para a chave Pix cadastrada. */
export async function resgatar(formData: FormData): Promise<void> {
  const eventId = z.string().min(1).safeParse(formData.get("eventId"));
  if (!eventId.success) return;

  const event = await eventoDoDono(eventId.data);
  if (!event || !event.payoutPixKey) return; // precisa da chave cadastrada

  const [contribs, payouts] = await Promise.all([
    prisma.giftContribution.findMany({
      where: { eventId: event.id },
      select: { netCents: true, status: true },
    }),
    prisma.payout.findMany({
      where: { eventId: event.id },
      select: { amountCents: true, status: true },
    }),
  ]);
  const saldo = saldoDoEvento(contribs, payouts);
  if (saldo <= 0) return;

  const provider = getPaymentProvider();
  const payout = await prisma.payout.create({
    data: {
      eventId: event.id,
      amountCents: saldo,
      pixKey: event.payoutPixKey,
      pixName: event.payoutPixName,
      status: "PENDING",
      provider: provider.nome,
    },
  });

  try {
    const t = await provider.transferir({
      valorCents: saldo,
      pixKey: event.payoutPixKey,
      referencia: payout.id,
    });
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: t.status,
        providerTransferId: t.transferId,
        paidAt: t.status === "PAID" ? new Date() : null,
      },
    });
  } catch (err) {
    console.error("[cofre] falha ao transferir o resgate:", err);
    await prisma.payout.update({ where: { id: payout.id }, data: { status: "FAILED" } });
  }
  revalidatePath(`/painel/${event.id}/cofre`);
}
