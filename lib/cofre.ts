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
import { cpfValido, lerCarteira, soDigitos } from "@/lib/carteira";

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

const UFS = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));

const ativarSchema = z.object({
  eventId: z.string().min(1),
  titular: z
    .string()
    .trim()
    .min(5, "Informe o nome completo.")
    .max(120)
    .refine((n) => n.split(/\s+/).length >= 2, "Informe nome e sobrenome."),
  cpf: z.string().refine(cpfValido, "CPF inválido."),
  nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de nascimento.")
    .refine((d) => {
      const t = new Date(`${d}T12:00:00Z`).getTime();
      return Number.isFinite(t) && t < Date.now() && d >= "1900-01-01";
    }, "Data de nascimento inválida."),
  celular: z
    .string()
    .transform(soDigitos)
    .refine((d) => d.length >= 10 && d.length <= 11, "Celular inválido."),
  ocupacao: z.string().trim().min(2, "Informe a sua ocupação.").max(80),
  cep: z
    .string()
    .transform(soDigitos)
    .refine((d) => d.length === 8, "CEP inválido."),
  logradouro: z.string().trim().min(3, "Informe o endereço.").max(160),
  cidade: z.string().trim().min(2, "Informe a cidade.").max(80),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .refine((u) => UFS.has(u), "Escolha o estado."),
  pixKey: z.string().trim().min(3, "Informe a chave Pix.").max(140),
  pixName: z.string().trim().max(120).optional(),
});

/**
 * Ativa a CARTEIRA do cofre (modelo Wedy): dados do titular + chave Pix num
 * passo só. Grava a chave nas colunas de payout e a carteira no customization.
 * O resgate só libera com a carteira ativa. Retorna mensagem de erro ou null.
 */
export async function ativarCarteira(formData: FormData): Promise<string | null> {
  const parsed = ativarSchema.safeParse({
    eventId: formData.get("eventId"),
    titular: formData.get("titular"),
    cpf: formData.get("cpf"),
    nascimento: formData.get("nascimento"),
    celular: formData.get("celular"),
    ocupacao: formData.get("ocupacao"),
    cep: formData.get("cep"),
    logradouro: formData.get("logradouro"),
    cidade: formData.get("cidade"),
    uf: formData.get("uf"),
    pixKey: formData.get("pixKey"),
    pixName: formData.get("pixName") || undefined,
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Confira os dados e tente de novo.";
  }

  const event = await eventoDoDono(parsed.data.eventId);
  if (!event) return "Convite não encontrado.";

  const base =
    event.customization && typeof event.customization === "object"
      ? (event.customization as Record<string, unknown>)
      : {};

  await prisma.event.update({
    where: { id: event.id },
    data: {
      payoutPixKey: parsed.data.pixKey,
      payoutPixName: parsed.data.pixName || parsed.data.titular,
      customization: {
        ...base,
        carteira: {
          ativa: true,
          titular: parsed.data.titular,
          cpf: soDigitos(parsed.data.cpf),
          nascimento: parsed.data.nascimento,
          celular: parsed.data.celular,
          ocupacao: parsed.data.ocupacao,
          endereco: {
            cep: parsed.data.cep,
            logradouro: parsed.data.logradouro,
            cidade: parsed.data.cidade,
            uf: parsed.data.uf,
          },
          ativadaEm: new Date().toISOString(),
        },
      },
    },
  });
  revalidatePath(`/painel/${event.id}/cofre`);
  return null;
}

/** Resgata TODO o saldo disponível do cofre para a chave Pix cadastrada. */
export async function resgatar(formData: FormData): Promise<void> {
  const eventId = z.string().min(1).safeParse(formData.get("eventId"));
  if (!eventId.success) return;

  const event = await eventoDoDono(eventId.data);
  if (!event || !event.payoutPixKey) return; // precisa da chave cadastrada
  if (!lerCarteira(event.customization).ativa) return; // precisa da carteira ATIVA

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
