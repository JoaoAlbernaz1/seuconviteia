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

export interface PaymentProvider {
  readonly nome: string;
  criarCobrancaPix(input: CobrancaPixInput): Promise<CobrancaPix>;
  consultarCobranca(chargeId: string): Promise<{ status: PayStatus }>;
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
  async consultarCobranca(): Promise<{ status: PayStatus }> {
    return { status: "PENDING" }; // no fake, quem confirma e a action confirmarPresente
  }
  async transferir(input: TransferirInput): Promise<Transferencia> {
    return { transferId: `faketransfer_${input.referencia}`, status: "PAID" };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.MERCADO_PAGO_ACCESS_TOKEN) return new MercadoPagoPaymentProvider();
  return new FakePaymentProvider();
}
