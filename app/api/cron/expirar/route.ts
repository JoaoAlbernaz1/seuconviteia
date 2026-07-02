// Cron de expiracao de eventos (Fase 7). Marca como EXPIRED todo evento que ja
// passou do prazo (`expiresAt < agora`) e ainda estava PUBLISHED. O site publico
// ja esconde eventos vencidos em tempo real via `eventoPublico` (checa expiresAt),
// entao esta rota nao muda o que o visitante ve — ela apenas mantem o `status`
// coerente no banco (relatorios/painel/consultas por status), evitando arrastar
// PUBLISHED vencidos para sempre.
//
// Seguranca: crons rodam sem sessao, entao protegemos com `CRON_SECRET` (padrao
// do repo). Sem o header correto -> 401; sem o secret configurado -> 500 (fail
// fast, para nao rodar "aberto" por engano).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Sempre dinamica: nunca cachear/pre-renderizar um endpoint que escreve no banco.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET nao configurado." },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  // Vencidos = PUBLISHED cujo prazo ja passou. `updateMany` roda em uma tacada.
  const { count } = await prisma.event.updateMany({
    where: { status: "PUBLISHED", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ ok: true, expirados: count });
}
