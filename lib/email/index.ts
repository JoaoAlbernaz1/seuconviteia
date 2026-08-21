// Abstracao de e-mail transacional (Fase 7). O seam continua o mesmo (interface
// `EmailProvider` + `SendEmailInput`); o que muda e que agora existe uma
// implementacao REAL (Resend via fetch) e a escolha do provider e LAZY: acontece
// na HORA do envio, lendo o env de entao — nunca no import do modulo. Assim o dev
// roda sem `RESEND_API_KEY` (cai no stub) e prod usa Resend so por ter a chave.
//
// Regra critica: falha de e-mail NUNCA pode quebrar o fluxo que a disparou
// (cadastro/RSVP). Por isso `enviarEmail` captura e loga qualquer erro em vez de
// propagar. Quem precisar do erro cru pode usar o provider direto.

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  // Nome de exibicao do remetente (white-label). O ENDERECO sai sempre de
  // EMAIL_FROM; aqui so vai o rotulo antes do <email>. Ausente -> so o endereco.
  fromName?: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}

/** Endereco padrao caso EMAIL_FROM nao esteja no env (fallback defensivo). */
const EMAIL_FROM_FALLBACK = "no-reply@seuconviteia.com";

/** Monta o header From: "Nome <email>" quando ha nome, senao so o endereco. */
export function formatarEndereco(email: string, fromName?: string): string {
  const nome = fromName?.trim();
  return nome ? `${nome} <${email}>` : email;
}

/** Provider falso para dev/teste: apenas loga no console (nao envia nada). */
export class StubEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<void> {
    console.log(`[email:stub] -> ${input.to} :: ${input.subject}`);
  }
}

/**
 * Provider real via API do Resend. Usa `fetch` direto (sem SDK) para nao
 * adicionar dependencia — o endpoint e um POST simples em /emails com
 * Authorization: Bearer. Um status nao-2xx vira `throw` (o `enviarEmail` de cima
 * e quem decide engolir; o provider so reporta a verdade).
 */
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly emailFrom: string,
  ) {}

  async send(input: SendEmailInput): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: formatarEndereco(this.emailFrom, input.fromName),
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!res.ok) {
      // Le o corpo do erro so pra logar/propagar um motivo util (ignora falha
      // na leitura do proprio corpo).
      const detalhe = await res.text().catch(() => "");
      throw new Error(`Resend respondeu ${res.status}: ${detalhe}`);
    }
  }
}

/** Subconjunto do env que a selecao de provider consulta (facilita o teste). */
export type EmailEnv = {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
};

/**
 * Escolhe o provider a partir do env: com `RESEND_API_KEY` -> Resend real; sem a
 * chave -> stub (dev continua funcionando). Puro/testavel — recebe o env por
 * parametro (default `process.env`) para nao acoplar a leitura global.
 */
export function escolherProvider(env?: EmailEnv): EmailProvider {
  // Sem `env` explicito, le o ambiente do processo (o caso de producao/dev). O
  // parametro so existe para os testes injetarem um env controlado.
  const source = env ?? process.env;
  const apiKey = source.RESEND_API_KEY?.trim();
  if (apiKey) {
    return new ResendEmailProvider(
      apiKey,
      source.EMAIL_FROM?.trim() || EMAIL_FROM_FALLBACK,
    );
  }
  return new StubEmailProvider();
}

/**
 * O envio de e-mail esta CONFIGURADO neste ambiente?
 *
 * Existe porque `enviarEmail` engole erro de proposito — nenhum fluxo pode
 * quebrar por causa de e-mail — e sem `RESEND_API_KEY` o provider e um stub que
 * so loga. Na maioria dos casos isso e bom (o cadastro nao pode falhar porque o
 * e-mail de boas-vindas nao saiu). Ha UM caso em que e cruel: a redefinicao de
 * senha, onde a pessoa esta trancada fora da conta e a tela diria "enviamos" para
 * sempre. La a tela precisa poder dizer que o problema e NOSSO.
 */
export function emailConfigurado(env?: EmailEnv): boolean {
  return !!(env ?? process.env).RESEND_API_KEY?.trim();
}

/**
 * Ponto de entrada seguro para disparar um e-mail transacional. Seleciona o
 * provider LAZY (na hora do envio) e ENGOLE qualquer erro (log, sem throw): o
 * cadastro/RSVP que chamou nunca pode quebrar por causa de e-mail.
 */
export async function enviarEmail(input: SendEmailInput): Promise<void> {
  try {
    await escolherProvider().send(input);
  } catch (err) {
    console.error(`[email] falha ao enviar para ${input.to}:`, err);
  }
}
