// Webhook do Mercado Pago: recebe a notificação, VALIDA a assinatura e
// RE-CONSULTA o estado real no MP (nunca confia só no payload) antes de conceder
// qualquer coisa. Idempotente. Sem auth de sessão — a segurança é a assinatura.
//
// Dois negócios chegam AQUI, no mesmo endpoint:
//  - `payment` .................. Pix do convidado presenteando (contribuição)
//                                 OU o passe de edição que o dono comprou;
//  - `subscription_preapproval` . assinatura do SaaS que o profissional paga;
//  - `subscription_authorized_payment` .. a cobrança mensal dessa assinatura.
//
// Configuração no painel do MP: URL = https://<seu-dominio>/api/webhooks/mercadopago,
// eventos "Pagamentos" + "Assinaturas". Segredo -> MERCADO_PAGO_WEBHOOK_SECRET.
import { aplicarStatusAssinatura, registrarCobrancaAssinatura } from "@/lib/assinaturaCore";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/pagamentos";
import { consultarAssinaturaMp, consultarCobrancaAssinaturaMp } from "@/lib/pagamentos/assinatura";
import {
  tipoDeNotificacao,
  verificarAssinaturaMp,
  webhookDesprotegido,
} from "@/lib/pagamentos/mercadopago";
import { acharPasseEdicao, confirmarPasseEdicao } from "@/lib/passeEdicao";
import { confirmarContribuicaoPaga } from "@/lib/presentearCore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const raw = await req.text();

  let body: Record<string, unknown> = {};
  try {
    body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    body = {};
  }

  const dataObj = body.data as { id?: string | number } | undefined;
  const dataId =
    (dataObj?.id != null ? String(dataObj.id) : null) ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");
  const type =
    (typeof body.type === "string" ? body.type : undefined) ??
    (typeof body.topic === "string" ? body.topic : undefined) ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic");

  // 0) Com Mercado Pago ATIVO (dinheiro real), webhook sem segredo nao pode rodar:
  //    a validacao de assinatura passaria direto. Falha fechado, e alto.
  const segredo = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (webhookDesprotegido(getPaymentProvider().nome, segredo)) {
    console.error(
      "[webhook mercadopago] RECUSADO: MERCADO_PAGO_ACCESS_TOKEN esta setado (Pix real) " +
        "mas MERCADO_PAGO_WEBHOOK_SECRET nao. Configure o segredo do webhook no painel do MP.",
    );
    return new Response("webhook sem segredo configurado", { status: 503 });
  }

  // 1) Assinatura (HMAC do header x-signature). Sem segredo configurado, passa (dev).
  const assinaturaOk = verificarAssinaturaMp({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
    secret: segredo,
  });
  if (!assinaturaOk) {
    return new Response("assinatura inválida", { status: 401 });
  }

  // 2) Que negócio é este? (`type` já traz `topic` e query string normalizados).
  const tipo = tipoDeNotificacao({ type });
  if (tipo === "desconhecido" || !dataId) {
    return new Response("ignorado", { status: 200 });
  }

  // 3) Provider precisa estar ativo (token setado) — sem token não há como
  //    re-consultar, e conceder sem consultar é justamente o que não fazemos.
  const provider = getPaymentProvider();
  if (provider.nome !== "mercadopago") {
    return new Response("provider inativo", { status: 200 });
  }

  try {
    // 4) Re-consulta o estado REAL no MP (fonte da verdade) e aplica.
    if (tipo === "pagamento") {
      const { status, referencia } = await provider.consultarCobranca(dataId);
      if (status === "PAID") {
        const contrib = await prisma.giftContribution.findFirst({
          where: { providerChargeId: dataId },
        });
        if (contrib) {
          await confirmarContribuicaoPaga(contrib.id);
        } else {
          // Nao e presente de convidado: pode ser o passe de edicao do dono. E
          // AQUI, e so aqui, que a janela de edicao de um convite publicado
          // abre — a compra no painel deixa a cobranca PENDING de proposito.
          const passe = await acharPasseEdicao(dataId, referencia);
          // `dataId` vai junto: quando a linha foi achada pela referencia (o
          // vinculo nao gravou na compra), e agora que ele se conserta.
          if (passe) await confirmarPasseEdicao(passe, new Date(), dataId);
        }
      }
    } else if (tipo === "assinatura") {
      // Mudou o estado da assinatura (autorizou, pausou, cancelou).
      const assinatura = await consultarAssinaturaMp(dataId);
      await aplicarStatusAssinatura(
        assinatura.preapprovalId,
        assinatura.status,
        // Durante o teste grátis é esta data que libera o plano: o MP diz quando
        // vai cobrar (fim dos 7 dias), e o direito vale até lá.
        assinatura.proximoPagamento,
      );
    } else {
      // Cobrança mensal. Só o pagamento aprovado empurra o vencimento; tentativa
      // recusada não vira mês pago.
      const cobranca = await consultarCobrancaAssinaturaMp(dataId);
      if (cobranca.pago) {
        await registrarCobrancaAssinatura({
          preapprovalId: cobranca.preapprovalId,
          providerId: cobranca.providerId,
          amountCents: cobranca.amountCents,
          pagoEm: cobranca.pagoEm,
        });
      }
    }
  } catch (err) {
    console.error("[webhook mercadopago] erro:", err);
    // 5xx faz o MP reenviar depois.
    return new Response("erro ao processar", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
