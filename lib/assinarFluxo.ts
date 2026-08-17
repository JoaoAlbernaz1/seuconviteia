// Entrada do checkout da assinatura (server-only, SEM "use server").
//
// O MESMO caminho serve a dois lugares: o botao do painel (`assinarPlano`) e a
// rota `/assinar/[plano]`, que e para onde a landing manda quem clica num
// plano. Duplicar isso era garantir que um dos dois esquecesse de cancelar a
// assinatura anterior ou de gravar o id antes do redirect.
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cancelarAssinaturaMp, criarAssinaturaMp } from "@/lib/pagamentos/assinatura";
import { PLANOS_INFO, SELECT_ASSINATURA, type Plan } from "@/lib/plans";
import { protocoloDe } from "@/lib/tenant";

export type InicioAssinatura =
  | { ok: true; initPoint: string }
  | { ok: false; motivo: "sem-sessao" | "plano-invalido" | "conta-sumiu" | "gateway" };

/** Plano pago valido (o Basico e gratis: nao se assina). */
export function planoPago(valor: unknown): Plan | null {
  const info = PLANOS_INFO.find((p) => p.key === valor && p.mensalidadeCents > 0);
  return info ? info.key : null;
}

/**
 * Cria a assinatura no Mercado Pago e devolve o link do checkout hospedado.
 *
 * NADA e concedido aqui: a conta so recebe o id da assinatura (`pending`) e o
 * plano CONTRATADO. Quem libera o uso e o webhook, com a data que o MP informar
 * — inclusive no teste gratis, cujo prazo quem segura e o proprio MP.
 *
 * O teste gratis vale UMA VEZ por conta: quem ja teve assinatura (mesmo
 * cancelada) assina pagando desde o primeiro dia. Sem isso, cancelar e assinar
 * de novo daria teste infinito.
 */
export async function iniciarAssinatura(plano: Plan): Promise<InicioAssinatura> {
  const session = await auth();
  if (!session?.user) return { ok: false, motivo: "sem-sessao" };
  if (!planoPago(plano)) return { ok: false, motivo: "plano-invalido" };

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { ...SELECT_ASSINATURA, email: true, mpPreapprovalId: true },
  });
  if (!prof) return { ok: false, motivo: "conta-sumiu" };

  // Trocando de assinatura: para a antiga antes de criar a nova, senao o MP
  // cobraria as duas. O mes ja pago continua valendo (`assinaturaAte` intacto).
  if (prof.mpPreapprovalId && prof.assinaturaStatus !== "cancelled") {
    await cancelarAssinaturaMp(prof.mpPreapprovalId).catch((err: unknown) => {
      console.error("[assinatura] nao consegui cancelar a anterior:", err);
      return false;
    });
  }

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const criada = await criarAssinaturaMp({
    plano,
    email: prof.email,
    professionalId: session.user.id,
    // SEM query string: o Mercado Pago recusa o `back_url` com `?` ("Invalid
    // value for back_url"). A tela nao precisa da marca na URL — ela ja avisa
    // "aguardando confirmacao" olhando o status `pending` da propria conta.
    backUrl: `${protocoloDe(root)}://${root}/painel/plano`,
    comTesteGratis: !prof.mpPreapprovalId,
  }).catch((err: unknown) => {
    console.error("[assinatura] Mercado Pago recusou:", err);
    return null;
  });
  if (!criada) return { ok: false, motivo: "gateway" };

  // O id vai para o banco ANTES do redirect: e por ele que o webhook acha o
  // dono. Sem isso, uma assinatura autorizada chegaria sem dono.
  await prisma.professional.update({
    where: { id: session.user.id },
    data: {
      plan: plano,
      mpPreapprovalId: criada.preapprovalId,
      assinaturaStatus: "pending",
    },
  });

  return { ok: true, initPoint: criada.initPoint };
}
