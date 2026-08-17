// Nucleo (server-only, SEM "use server") dos eventos da assinatura do SaaS.
// Chamado pelo webhook do Mercado Pago. Idempotente: a mesma notificacao
// entregue duas vezes nao credita mes duas vezes.
//
// Quem concede plano pago e SO este arquivo, a partir do que o gateway
// confirmou — nunca o clique no painel (ver `ehDowngrade` em lib/plans.ts).
import { prisma } from "@/lib/db";
import { DIAS_TESTE_GRATIS } from "@/lib/pagamentos/assinatura";

/** Um mes a frente da data dada (a assinatura do MP e mensal). */
function umMesDepois(de: Date): Date {
  const d = new Date(de);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function diasDepois(de: Date, dias: number): Date {
  return new Date(de.getTime() + dias * 24 * 60 * 60 * 1000);
}

/** Violacao de indice unico do Prisma — o unico erro que aqui NAO e erro. */
function ehDuplicata(err: unknown): boolean {
  return (err as { code?: unknown } | null)?.code === "P2002";
}

/**
 * Espelha na conta o status da assinatura no MP.
 *
 * `cancelled`/`paused` NAO mexem em `assinaturaAte`: quem cancelou ja pagou o
 * mes corrente e continua com o plano ate o vencimento — quem corta o direito
 * e `planoEfetivo()`, na leitura.
 *
 * Devolve false quando nenhuma conta aponta para essa assinatura (notificacao
 * de outra aplicacao, ou assinatura criada e abandonada antes de gravarmos o
 * id): o webhook responde 200 e o MP para de reenviar.
 */
export async function aplicarStatusAssinatura(
  preapprovalId: string,
  status: string,
  proximoPagamento?: Date | null,
): Promise<boolean> {
  const conta = await prisma.professional.findUnique({
    where: { mpPreapprovalId: preapprovalId },
  });
  if (!conta) return false;

  const data: { assinaturaStatus: string; assinaturaAte?: Date } = { assinaturaStatus: status };
  if (status === "authorized") {
    // O direito vale ate a PROXIMA COBRANCA informada pelo MP — e e isso que faz
    // o teste gratis funcionar sem estado nosso: durante o teste, a proxima
    // cobranca e o fim dos 7 dias; depois, a renovacao mensal.
    //
    // Sem a data (o MP omitiu), liberamos no maximo o teste gratis: errar para
    // menos custa um pedido de suporte; errar para mais e um mes de graca.
    const ate = proximoPagamento ?? diasDepois(new Date(), DIAS_TESTE_GRATIS);
    // Nunca ENCURTA um prazo ja pago.
    if (!conta.assinaturaAte || ate > conta.assinaturaAte) data.assinaturaAte = ate;
  }

  await prisma.professional.update({ where: { id: conta.id }, data });
  return true;
}

/**
 * Registra a cobranca mensal no ledger da conta e empurra o vencimento.
 *
 * O `providerId` e UNICO no banco: se duas entregas da mesma notificacao
 * correrem juntas, a segunda morre no `create` e nada e contado em dobro. Como
 * as duas escritas estao na MESMA transacao, nao existe estado em que a
 * cobranca foi registrada e o vencimento nao andou.
 *
 * Devolve false quando a cobranca ja estava registrada (ou a assinatura e
 * desconhecida). Qualquer outra falha SOBE: nao pode virar 200 silencioso, ou o
 * MP nunca reenviaria uma cobranca que a gente perdeu.
 */
export async function registrarCobrancaAssinatura(input: {
  preapprovalId: string;
  providerId: string;
  amountCents: number;
  pagoEm: Date;
}): Promise<boolean> {
  const conta = await prisma.professional.findUnique({
    where: { mpPreapprovalId: input.preapprovalId },
  });
  if (!conta) return false;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.cobrancaAssinatura.create({
        data: {
          professionalId: conta.id,
          amountCents: input.amountCents,
          status: "PAID",
          providerId: input.providerId,
          paidAt: input.pagoEm,
        },
      });
      // Renovacao antecipada nao encurta o prazo: parte do vencimento vigente
      // quando ele ainda esta no futuro, e da data do pagamento quando ja venceu.
      const base =
        conta.assinaturaAte && conta.assinaturaAte > input.pagoEm ? conta.assinaturaAte : input.pagoEm;
      await tx.professional.update({
        where: { id: conta.id },
        data: { assinaturaAte: umMesDepois(base), assinaturaStatus: "authorized" },
      });
    });
    return true;
  } catch (err) {
    if (ehDuplicata(err)) return false; // ja registrada — idempotente, nao e erro
    throw err;
  }
}
