"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { eventoPublico } from "@/lib/event";

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
      },
    });
  } catch {
    return {
      status: "error",
      message: "Não conseguimos registrar agora. Tente novamente.",
    };
  }

  return { status: "ok", nome, presenca };
}
