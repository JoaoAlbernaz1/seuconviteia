// Abstracao de e-mail transacional. Implementacao real (Resend via RESEND_API_KEY,
// remetente EMAIL_FROM) chega em fase posterior.

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}

/** Provider falso para dev/teste: apenas loga no console. */
export class StubEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<void> {
    console.log(`[email:stub] -> ${input.to} :: ${input.subject}`);
  }
}

export const emailProvider: EmailProvider = new StubEmailProvider();
