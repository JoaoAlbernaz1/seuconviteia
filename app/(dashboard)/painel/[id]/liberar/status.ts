"use server";

/**
 * A pergunta que a tela do Pix repete enquanto o QR esta na tela: "a janela ja
 * abriu?".
 *
 * Ela existe porque a tela PROMETE que "assim que o Pix cair, a edicao abre
 * sozinha" — e quem abre a janela e o webhook, do outro lado. Sem alguem
 * perguntando, a promessa seria mentira: a pessoa pagaria e ficaria olhando um
 * QR morto ate desconfiar e recarregar.
 *
 * Deliberadamente BURRA e SO LEITURA: nao consulta o gateway e nao escreve nada
 * — em especial, nao toca `Event.edicaoAte`. Quem concede continua sendo o
 * webhook (`lib/passeEdicao.ts`), a cota (`liberar/acoes.ts`) e a cortesia da
 * primeira publicacao. Um quarto escritor precisaria de justificativa propria;
 * este arquivo nao e um.
 */
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { edicaoAberta } from "@/lib/edicao";

const eventIdSchema = z.string().trim().min(1).max(40);

/** A edicao deste convite ja esta liberada agora? (so para o dono). */
export async function edicaoJaLiberada(eventId: string): Promise<boolean> {
  const session = await auth();
  // Mesma guarda das duas actions vizinhas: sem `id` na sessao, o `undefined`
  // some do `where` do Prisma e a consulta viraria "qualquer convite com esse
  // id" — aqui isso vazaria o estado da edicao de convite alheio.
  if (!session?.user?.id) return false;

  const id = eventIdSchema.safeParse(eventId);
  if (!id.success) return false;

  const event = await prisma.event.findFirst({
    where: { id: id.data, professionalId: session.user.id },
    select: { status: true, expiresAt: true, edicaoAte: true },
  });
  if (!event) return false;

  return edicaoAberta(event, new Date());
}
