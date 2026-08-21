"use server";

// Liquidação de REPASSE — a fila do operador da plataforma.
//
// O Mercado Pago não tem API de saída para a chave Pix de um terceiro (o caminho
// deles é o split de pagamentos). Enquanto o split não existir aqui, o dinheiro
// dos presentes entra na conta da plataforma e sai daqui: o dono do convite pede
// o resgate (`lib/cofre.ts` → Payout PENDING, já deduzido do saldo dele), o
// operador paga pelo app do banco e marca aqui o que fez.
//
// Duas guardas, as duas obrigatórias:
//  1. `ehAdminDeRepasse` — esta é a ÚNICA tela do sistema que enxerga dinheiro de
//     todos os convites; sem a lista `ADMIN_EMAILS`, ninguém entra.
//  2. compare-and-set no `status` — o operador clica duas vezes, a aba fica
//     aberta, a fila é recarregada: só a primeira transição vale.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ehAdminDeRepasse } from "@/lib/repasse";

const schema = z.object({ payoutId: z.string().trim().min(1).max(40) });

async function operador(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return ehAdminDeRepasse(email) ? (email ?? null) : null;
}

/**
 * O operador PAGOU pelo banco: a linha vira PAID.
 *
 * `updateMany` com `status: "PENDING"` no `where` é o compare-and-set: o segundo
 * clique não acha mais nada para atualizar e sai quieto, em vez de reescrever a
 * data de pagamento.
 */
export async function marcarRepassePago(formData: FormData): Promise<void> {
  const quem = await operador();
  if (!quem) return;
  const parsed = schema.safeParse({ payoutId: formData.get("payoutId") });
  if (!parsed.success) return;

  const marcada = await prisma.payout.updateMany({
    where: { id: parsed.data.payoutId, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (marcada.count === 1) {
    // Dinheiro que sai da plataforma para a mão de alguém merece rastro no log,
    // e não só uma linha no banco.
    console.info(`[repasse] PAGO — payout=${parsed.data.payoutId} por=${quem}`);
  }
  revalidatePath("/painel/repasses");
}

/**
 * O repasse NÃO saiu (chave errada, conta recusada, pedido duplicado).
 *
 * FAILED devolve o valor ao saldo do dono sozinho: `saldoDoEvento` só desconta
 * payout PAID ou PENDING. Por isso recusar é seguro — e é o caminho certo
 * quando a chave está errada, porque o dono precisa poder corrigir e pedir de
 * novo (com um pedido em aberto, `resgatar` recusa um segundo).
 */
export async function recusarRepasse(formData: FormData): Promise<void> {
  const quem = await operador();
  if (!quem) return;
  const parsed = schema.safeParse({ payoutId: formData.get("payoutId") });
  if (!parsed.success) return;

  const marcada = await prisma.payout.updateMany({
    where: { id: parsed.data.payoutId, status: "PENDING" },
    data: { status: "FAILED" },
  });
  if (marcada.count === 1) {
    console.info(`[repasse] RECUSADO — payout=${parsed.data.payoutId} por=${quem}`);
  }
  revalidatePath("/painel/repasses");
}
