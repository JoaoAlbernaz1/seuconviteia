// Adapter de pagamento (seam de producao, espelha lib/storage/index.ts):
//   - MERCADO_PAGO_ACCESS_TOKEN setado -> MercadoPagoPaymentProvider (Pix real)
//   - sem chave (dev)                  -> FakePaymentProvider (Pix simulado)
import type { PayStatus } from "./contribuicao";
import { MercadoPagoPaymentProvider } from "./mercadopago";

export interface CobrancaPixInput {
  valorCents: number;
  descricao: string;
  referencia: string; // ex.: id da contribuicao
  pagador?: { nome?: string; email?: string };
}
export interface CobrancaPix {
  chargeId: string;
  pixCode: string; // copia-e-cola
  pixQrUrl: string; // data URI ou URL
  status: PayStatus;
}
export interface TransferirInput {
  valorCents: number;
  pixKey: string;
  referencia: string;
}
export interface Transferencia {
  transferId: string;
  status: PayStatus;
}

/**
 * Estado de uma cobranca no gateway. `referencia` e o `external_reference` que
 * mandamos na criacao (o id da nossa linha): e por ele que o webhook reencontra
 * o dono do pagamento quando o id da cobranca nao casa com nada aqui dentro.
 */
export interface EstadoCobranca {
  status: PayStatus;
  referencia: string | null;
}

export interface PaymentProvider {
  readonly nome: string;
  criarCobrancaPix(input: CobrancaPixInput): Promise<CobrancaPix>;
  consultarCobranca(chargeId: string): Promise<EstadoCobranca>;
  transferir(input: TransferirInput): Promise<Transferencia>;
}

/** QR de mentira (SVG) so p/ o fluxo simulado parecer real. */
function fakeQrDataUri(seed: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="196" height="196" viewBox="0 0 196 196">` +
    `<rect width="196" height="196" fill="#fff"/>` +
    `<rect x="16" y="16" width="164" height="164" fill="none" stroke="#2e1a20" stroke-width="6"/>` +
    `<text x="98" y="104" text-anchor="middle" font-family="monospace" font-size="12" fill="#93264a">PIX ${seed.slice(0, 6)}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Pix simulado: cobranca nasce PENDING; a confirmacao vem da nossa action (webhook fake). */
export class FakePaymentProvider implements PaymentProvider {
  readonly nome = "fake";
  async criarCobrancaPix(input: CobrancaPixInput): Promise<CobrancaPix> {
    const chargeId = `fake_${input.referencia}`;
    const pixCode = `00020126FAKE-${input.referencia}-${input.valorCents}5204000053039865802BR6009SEUCONVITE`;
    return { chargeId, pixCode, pixQrUrl: fakeQrDataUri(input.referencia), status: "PENDING" };
  }
  async consultarCobranca(chargeId: string): Promise<EstadoCobranca> {
    // No fake, quem confirma e a action confirmarPresente; o `chargeId` carrega
    // a referencia (ver `criarCobrancaPix`), entao devolve-la mantem o simulado
    // com a mesma forma do Mercado Pago.
    const referencia = chargeId?.startsWith("fake_") ? chargeId.slice("fake_".length) : null;
    return { status: "PENDING", referencia };
  }
  async transferir(input: TransferirInput): Promise<Transferencia> {
    return { transferId: `faketransfer_${input.referencia}`, status: "PAID" };
  }
}

/**
 * Produção sem credencial: recusa ALTA, em vez de Pix de mentira.
 *
 * O simulado não é neutro em produção — ele ABRE uma porta: no modo "fake" quem
 * confirma o presente é um botão na tela do convidado (`confirmarPresente`,
 * liberado justamente quando o provedor é "fake"), então um convite publicado de
 * verdade aceitaria "presente confirmado" com zero real. E o passe de R$ 19,90
 * geraria um QR que nunca confirma, porque quem abre a janela de edição é o
 * webhook — e o webhook exige provedor real.
 *
 * Os dois chamadores de `criarCobrancaPix` (`lib/presentear.ts` e a action do
 * passe) já tratam o throw: marcam a linha FAILED e devolvem "Não foi possível
 * gerar o Pix agora". Ninguém vê stack trace, e ninguém ganha presente de graça.
 */
export class IndisponivelPaymentProvider implements PaymentProvider {
  readonly nome = "indisponivel";
  async criarCobrancaPix(): Promise<CobrancaPix> {
    throw new Error(
      "pagamento indisponível: MERCADO_PAGO_ACCESS_TOKEN ausente na produção " +
        "(sem token o Pix seria simulado, e o simulado confirma presente sem dinheiro)",
    );
  }
  async consultarCobranca(): Promise<EstadoCobranca> {
    return { status: "PENDING", referencia: null };
  }
  async transferir(): Promise<Transferencia> {
    throw new Error("payout indisponível: MERCADO_PAGO_ACCESS_TOKEN ausente na produção");
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.MERCADO_PAGO_ACCESS_TOKEN) return new MercadoPagoPaymentProvider();
  // `VERCEL_ENV` (e não `NODE_ENV`) porque a régua é "onde há dinheiro de
  // verdade", não "é build de produção": `pnpm build && pnpm start` local e o
  // e2e rodam em NODE_ENV=production e PRECISAM do simulado.
  if (process.env.VERCEL_ENV === "production") return new IndisponivelPaymentProvider();
  return new FakePaymentProvider();
}
