/**
 * Config do formulário de CONFIRMAÇÃO (RSVP) — parte do `Event.customization`.
 *
 * O editor (passo "Confirmação") controla o que o convidado vê no /confirmar:
 * se pode levar acompanhantes, quais campos extras aparecem (telefone/e-mail/
 * restrição/recado), a cor do botão e a data limite. Estes valores só mudam a
 * APARÊNCIA/coleta do form — a gravação segura continua em `lib/rsvp.ts`.
 *
 * PURO e tolerante (Zod `.safeParse` -> defaults). Sem DOM/Date/banco.
 */
import { z } from "zod";

export type RsvpConfig = {
  /** Pode adicionar acompanhantes (mostra os botões "Adicionar convidado"). */
  permitirAcompanhantes: boolean;
  /** Pedir o NOME de cada acompanhante (senão, só um contador de quantos vão). */
  pedirNomeAcompanhantes: boolean;
  /** Máximo de acompanhantes sugerido (exibido como dica / limite do contador). */
  maxAcompanhantes: number;
  /** Campo de telefone. */
  pedirTelefone: boolean;
  /** Campo de e-mail. */
  pedirEmail: boolean;
  /** Campo "alguma restrição alimentar?". */
  pedirRestricao: boolean;
  /** Campo de recado para a debutante. */
  permitirRecado: boolean;
  /** Cor do botão (hex). Ausente = usa a cor do tema do convite. */
  corBotao?: string;
  /** Data limite para confirmar (exibição "dd/mm/aaaa"). */
  dataLimite?: string;
  /** Mensagem mostrada na /obrigada para quem CONFIRMA presença. */
  msgConfirma?: string;
  /** Mensagem mostrada na /obrigada para quem NÃO vai. */
  msgRecusa?: string;
};

/** Textos padrão da tela de agradecimento (quando o profissional não muda). */
export const MSG_CONFIRMA_PADRAO =
  "Que alegria! Mal podemos esperar para ter você nesse dia tão especial.";
export const MSG_RECUSA_PADRAO =
  "Tudo bem! Agradecemos por avisar — você vai fazer falta.";

const schema = z
  .object({
    permitirAcompanhantes: z.boolean(),
    pedirNomeAcompanhantes: z.boolean(),
    maxAcompanhantes: z.coerce.number().int().min(0).max(20),
    pedirTelefone: z.boolean(),
    pedirEmail: z.boolean(),
    pedirRestricao: z.boolean(),
    permitirRecado: z.boolean(),
    corBotao: z.string(),
    dataLimite: z.string(),
    msgConfirma: z.string(),
    msgRecusa: z.string(),
  })
  .partial();

export const RSVP_CONFIG_PADRAO: RsvpConfig = {
  permitirAcompanhantes: true,
  pedirNomeAcompanhantes: true,
  maxAcompanhantes: 2,
  pedirTelefone: false,
  pedirEmail: false,
  pedirRestricao: false,
  permitirRecado: true,
};

const hexOk = (s: string | undefined): string | undefined =>
  typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s.trim()) ? s.trim() : undefined;

const texto = (v: string | undefined): string | undefined => {
  const s = v?.trim();
  return s ? s : undefined;
};

/** Lê a config do RSVP de dentro de um `customization` cru (tolerante). */
export function lerRsvpConfig(customization: unknown): RsvpConfig {
  let raw: unknown;
  if (customization && typeof customization === "object" && !Array.isArray(customization)) {
    raw = (customization as Record<string, unknown>).rsvpConfig;
  }
  const parsed = schema.safeParse(raw);
  const c = parsed.success ? parsed.data : {};
  return {
    permitirAcompanhantes: c.permitirAcompanhantes ?? RSVP_CONFIG_PADRAO.permitirAcompanhantes,
    pedirNomeAcompanhantes: c.pedirNomeAcompanhantes ?? RSVP_CONFIG_PADRAO.pedirNomeAcompanhantes,
    maxAcompanhantes: c.maxAcompanhantes ?? RSVP_CONFIG_PADRAO.maxAcompanhantes,
    pedirTelefone: c.pedirTelefone ?? RSVP_CONFIG_PADRAO.pedirTelefone,
    pedirEmail: c.pedirEmail ?? RSVP_CONFIG_PADRAO.pedirEmail,
    pedirRestricao: c.pedirRestricao ?? RSVP_CONFIG_PADRAO.pedirRestricao,
    permitirRecado: c.permitirRecado ?? RSVP_CONFIG_PADRAO.permitirRecado,
    corBotao: hexOk(c.corBotao),
    dataLimite: texto(c.dataLimite),
    msgConfirma: texto(c.msgConfirma),
    msgRecusa: texto(c.msgRecusa),
  };
}
