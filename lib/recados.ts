"use server";
/**
 * Mural de recados do site publico do evento (port do festa-15-maria-clara).
 *
 * Seguranca / isolamento por tenant:
 *  - `deixarRecado` RE-RESOLVE e RE-VALIDA o evento no servidor (`eventoPublico`):
 *    so aceita recado para evento PUBLICADO e nao expirado. O `Recado` e sempre
 *    gravado sob o `eventId` validado (sem vazar entre eventos).
 *  - `listarRecadosAprovados` filtra SEMPRE por `eventId` + `approved`.
 *
 * Moderacao: o recado nasce APROVADO (`approved` default `true` no schema) —
 * mural de festa que so aparece depois de o dono aprovar chega vazio na noite
 * do evento. Quem tira do ar e a tela `/painel/[id]/recados`, que alterna
 * `approved`. E por isso que o filtro `approved: true` abaixo NAO e decorativo:
 * ele e o unico ponto que faz "esconder no painel" virar "sumiu do site".
 *
 * LGPD: coleta o minimo (nome + recado) e exige consentimento explicito.
 */
import { z } from "zod";
import { prisma } from "@/lib/db";
import { eventoPublico } from "@/lib/event";

/** Recado pronto para o mural (campos em pt-BR, como o festa renderiza). */
export type RecadoView = { id: string; nome: string; mensagem: string };

const recadoSchema = z.object({
  eventId: z.string().min(1),
  nome: z.string().trim().min(2, "Diga seu nome.").max(60),
  mensagem: z.string().trim().min(2, "Escreva um recado.").max(500),
  consentimento: z.literal(true, {
    message: "É preciso aceitar o compartilhamento dos dados.",
  }),
});

export async function deixarRecado(input: {
  eventId: string;
  nome: string;
  mensagem: string;
  consentimento: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = recadoSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Confira os dados e tente de novo.";
    return { ok: false, error: msg };
  }

  const { eventId, nome, mensagem } = parsed.data;

  // Re-resolve e re-valida o evento no servidor (nao confia no cliente).
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  const visivel = eventoPublico(event, new Date());
  if (!event || !visivel.ok) {
    return { ok: false, error: "Este mural não está disponível agora." };
  }

  try {
    await prisma.recado.create({
      data: { eventId: event.id, name: nome, message: mensagem },
    });
  } catch {
    return { ok: false, error: "Não foi possível enviar agora. Tente de novo." };
  }
  return { ok: true };
}

/** Recados aprovados de um evento, mais recentes primeiro. */
export async function listarRecadosAprovados(
  eventId: string,
): Promise<RecadoView[]> {
  const rows = await prisma.recado.findMany({
    where: { eventId, approved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, message: true },
  });
  return rows.map((r) => ({ id: r.id, nome: r.name, mensagem: r.message }));
}
