"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { eventoPublico } from "@/lib/event";
import { enviarEmail } from "@/lib/email";
import { montarRemetente } from "@/lib/email/remetente";
import { planoEfetivo, SELECT_ASSINATURA } from "@/lib/plans";
import { emailNotificacaoRsvp } from "@/lib/email/templates";
import { validateGuests, montarGuestRow, type GuestInput } from "@/lib/rsvpFesta";

/**
 * Notifica o profissional dono do evento sobre uma resposta de RSVP. TUDO aqui
 * (busca do dono + envio) roda em try/catch: a notificacao e efeito colateral e
 * jamais pode quebrar a confirmacao do convidado. A busca do dono e isolada pelo
 * evento (o `professionalId` vem do proprio Event ja validado). O remetente
 * respeita o white-label: plano Premium usa o nome do estudio; os demais, a marca.
 */
async function notificarDonoRsvp(
  event: { professionalId: string; title: string },
  dados: { nomeConvidado: string; compareceu: boolean; acompanhantes: number },
): Promise<void> {
  try {
    const dono = await prisma.professional.findUnique({
      where: { id: event.professionalId },
      select: { ...SELECT_ASSINATURA, email: true, name: true },
    });
    if (!dono?.email) return;

    const { subject, html } = emailNotificacaoRsvp({
      nomeProfissional: dono.name,
      nomeConvidado: dados.nomeConvidado,
      tituloEvento: event.title,
      compareceu: dados.compareceu,
      acompanhantes: dados.acompanhantes,
    });
    await enviarEmail({
      to: dono.email,
      subject,
      html,
      // White-label do remetente é direito do plano EFETIVO: assinatura vencida
      // volta a mandar como a marca da plataforma.
      fromName: montarRemetente(planoEfetivo(dono, new Date()), dono.name),
    });
  } catch (err) {
    console.error("[rsvp] falha ao notificar o dono do evento:", err);
  }
}

/**
 * Server action de RSVP do site publico do evento (Fase 6).
 *
 * Seguranca / isolamento por tenant:
 *  - O `eventId` chega do form, mas e RE-RESOLVIDO e RE-VALIDADO no servidor
 *    (`eventoPublico`): so aceita confirmacao para evento PUBLICADO e nao
 *    expirado. Nunca confiamos so no input do cliente.
 *  - O Guest e sempre criado sob o `eventId` validado (sem vazar entre eventos).
 *
 * LGPD: coleta o minimo (nome + recado opcional) e exige consentimento explicito.
 */
export type RsvpState = {
  status: "idle" | "ok" | "error";
  message?: string;
  nome?: string;
  presenca?: "sim" | "nao";
};

const rsvpSchema = z.object({
  eventId: z.string().min(1),
  nome: z.string().trim().min(2, "Informe seu nome.").max(80),
  presenca: z.enum(["sim", "nao"]),
  acompanhantes: z.coerce.number().int().min(0).max(20).catch(0),
  recado: z.string().trim().max(400).optional(),
  consentimento: z.literal("on", {
    message: "É preciso aceitar o compartilhamento dos dados.",
  }),
});

export async function confirmarPresenca(
  _prev: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  const parsed = rsvpSchema.safeParse({
    eventId: formData.get("eventId"),
    nome: formData.get("nome"),
    presenca: formData.get("presenca"),
    acompanhantes: formData.get("acompanhantes"),
    recado: formData.get("recado") || undefined,
    consentimento: formData.get("consentimento"),
  });

  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ?? "Confira os dados e tente de novo.";
    return { status: "error", message: msg };
  }

  const { eventId, nome, presenca, acompanhantes, recado } = parsed.data;

  // Re-resolve e re-valida o evento no servidor (nao confia no cliente).
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  const visivel = eventoPublico(event, new Date());
  if (!event || !visivel.ok) {
    return {
      status: "error",
      message: "Este convite não está disponível para confirmação.",
    };
  }

  const confirmado = presenca === "sim";
  try {
    await prisma.guest.create({
      data: {
        eventId: event.id,
        name: nome,
        status: confirmado ? "CONFIRMED" : "DECLINED",
        companions: confirmado ? acompanhantes : 0,
        message: recado || null,
        party: [{ nome, tipo: "adulto", vai: confirmado }],
      },
    });
  } catch {
    return {
      status: "error",
      message: "Não conseguimos registrar agora. Tente novamente.",
    };
  }

  // Avisa o dono do evento (efeito colateral seguro; nunca quebra o RSVP).
  await notificarDonoRsvp(
    { professionalId: event.professionalId, title: event.title },
    {
      nomeConvidado: nome,
      compareceu: confirmado,
      acompanhantes: confirmado ? acompanhantes : 0,
    },
  );

  return { status: "ok", nome, presenca };
}

/**
 * Server action do RSVP "festa" (formulario multi-convidado `RsvpConvite`,
 * portado do festa-15-maria-clara). Recebe a lista de convidados do cliente +
 * o `eventId` + o consentimento, e grava UMA linha `Guest` (achatada por
 * `montarGuestRow`). Mesmas garantias de seguranca/LGPD do `confirmarPresenca`:
 *
 *  - o `eventId` e RE-RESOLVIDO e RE-VALIDADO no servidor (`eventoPublico`);
 *    nunca confiamos so no input do cliente.
 *  - consentimento explicito obrigatorio (LGPD).
 *  - a lista do cliente e validada por Zod (shape) e por `validateGuests`
 *    (nomes nao-vazios) antes de gravar.
 */
const festaGuestSchema = z.object({
  nome: z.string(),
  tipo: z.enum(["adulto", "crianca"]),
  vai_comparecer: z.boolean(),
});

const festaRsvpSchema = z.object({
  eventId: z.string().min(1),
  consentimento: z.literal(true, {
    message: "É preciso aceitar o compartilhamento dos dados.",
  }),
  guests: z.array(festaGuestSchema).min(1, "Informe ao menos um convidado."),
});

/** Campos extras opcionais do form (config do editor) — anexados ao recado. */
export type RsvpExtras = {
  telefone?: string;
  email?: string;
  restricao?: string;
  recado?: string;
};

const extrasSchema = z
  .object({
    telefone: z.string().trim().max(40),
    email: z.string().trim().max(120),
    restricao: z.string().trim().max(240),
    recado: z.string().trim().max(400),
  })
  .partial();

export async function confirmarPresencaFesta(
  eventId: string,
  guests: GuestInput[],
  consentimento: boolean,
  extrasInput?: RsvpExtras,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const parsed = festaRsvpSchema.safeParse({ eventId, guests, consentimento });
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ?? "Confira os dados e tente de novo.";
    return { ok: false, error: msg };
  }
  const extras = extrasSchema.safeParse(extrasInput ?? {});

  const v = validateGuests(parsed.data.guests);
  if (!v.ok) return v;

  // Re-resolve e re-valida o evento no servidor (nao confia no cliente).
  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
  });
  const visivel = eventoPublico(event, new Date());
  if (!event || !visivel.ok) {
    return {
      ok: false,
      error: "Este convite não está disponível para confirmação.",
    };
  }

  const row = montarGuestRow(v.guests);
  const dados = extras.success ? extras.data : {};
  try {
    await prisma.guest.create({
      data: {
        eventId: event.id,
        name: row.name,
        status: row.status,
        companions: row.companions,
        // Cada resposta na SUA coluna. Antes tudo virava uma frase só
        // ("Confirmados: … · Tel: … · Restrição: …") e o painel não tinha como
        // mostrar nada organizado — não existia "telefone", existia um pedaço
        // de texto. As linhas antigas seguem legíveis por `lib/rsvpFicha.ts`.
        message: dados.recado?.trim() || null,
        phone: dados.telefone?.trim() || null,
        email: dados.email?.trim() || null,
        dietary: dados.restricao?.trim() || null,
        party: v.guests.map((g) => ({
          nome: g.nome,
          tipo: g.tipo,
          vai: g.vai_comparecer,
        })),
      },
    });
  } catch {
    return { ok: false, error: "Falha ao salvar. Tente de novo." };
  }

  // Avisa o dono do evento (efeito colateral seguro; nunca quebra o RSVP).
  await notificarDonoRsvp(
    { professionalId: event.professionalId, title: event.title },
    {
      nomeConvidado: row.name,
      compareceu: row.status === "CONFIRMED",
      acompanhantes: row.companions,
    },
  );

  return { ok: true, count: v.guests.length };
}
