// Webhook do Mercado Pago: recebe a notificação de pagamento, VALIDA a assinatura
// e RE-CONSULTA o status real no MP (nunca confia só no payload) antes de confirmar
// a contribuição. Idempotente. Sem auth de sessão — a segurança é a assinatura.
//
// Configuração no painel do MP: URL = https://<seu-dominio>/api/webhooks/mercadopago
// (evento "Pagamentos"). Segredo -> MERCADO_PAGO_WEBHOOK_SECRET.
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/pagamentos";
import { verificarAssinaturaMp } from "@/lib/pagamentos/mercadopago";
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

  // 1) Assinatura (HMAC do header x-signature). Sem segredo configurado, passa (dev).
  const assinaturaOk = verificarAssinaturaMp({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
    secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
  });
  if (!assinaturaOk) {
    return new Response("assinatura inválida", { status: 401 });
  }

  // 2) Só notificações de pagamento importam.
  if (type !== "payment" || !dataId) {
    return new Response("ignorado", { status: 200 });
  }

  // 3) Provider precisa estar ativo (token setado).
  const provider = getPaymentProvider();
  if (provider.nome !== "mercadopago") {
    return new Response("provider inativo", { status: 200 });
  }

  try {
    // 4) Re-consulta o status REAL no MP (fonte da verdade).
    const { status } = await provider.consultarCobranca(dataId);
    if (status === "PAID") {
      const contrib = await prisma.giftContribution.findFirst({
        where: { providerChargeId: dataId },
      });
      if (contrib) await confirmarContribuicaoPaga(contrib.id);
    }
  } catch (err) {
    console.error("[webhook mercadopago] erro:", err);
    // 5xx faz o MP reenviar depois.
    return new Response("erro ao processar", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
