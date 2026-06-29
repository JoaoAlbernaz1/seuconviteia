// Abstracao de pagamentos. Implementacao real (Mercado Pago: Pix + webhooks)
// chega na Fase 6. Por ora, um provider stub para desenvolvimento.

export interface CreatePixChargeInput {
  /** Valor em centavos. */
  amountInCents: number;
  /** Identificador do pedido/cobranca no nosso dominio. */
  referenceId: string;
  /** E-mail do pagador (para recibo/notificacao). */
  payerEmail: string;
  /** Descricao exibida ao pagador. */
  description?: string;
}

export interface PixCharge {
  /** Conteudo do QR Code (payload Pix "copia e cola" renderizavel em imagem). */
  qrCode: string;
  /** String Pix copia-e-cola. */
  copyPaste: string;
  /** Id da cobranca no provedor. */
  chargeId: string;
}

export interface PaymentProvider {
  createPixCharge(input: CreatePixChargeInput): Promise<PixCharge>;
}

/** Provider falso para dev/teste. NAO usar em producao. */
export class StubPaymentProvider implements PaymentProvider {
  async createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
    const chargeId = `stub_${input.referenceId}_${Date.now()}`;
    const copyPaste = `00020126STUBPIX-${input.referenceId}-${input.amountInCents}5204000053039865802BR6009SEUCONVITE6304STUB`;
    return {
      chargeId,
      copyPaste,
      qrCode: copyPaste,
    };
  }
}

export const paymentProvider: PaymentProvider = new StubPaymentProvider();
