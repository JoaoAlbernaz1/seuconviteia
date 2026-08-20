// Tela "Recados dos convidados" — a MODERACAO do mural.
//
// Ela nasce por uma promessa que a Task 10 fez e ninguem cumpria: com o convite
// publicado, o SITE trava, mas o que chega depois (confirmacoes, recados,
// presentes) continua livre. O menu do convite ja apontava para
// `/painel/[id]/recados` — e a rota dava 404. Enquanto isso, um recado ofensivo
// no mural nao tinha NENHUM caminho para sair do ar.
//
// O que faz um recado aparecer no site e `approved: true`
// (`lib/recados.ts` -> `listarRecadosAprovados`, ja filtrado desde sempre).
// Aqui a pessoa alterna esse campo. Nada nesta tela passa por `edicaoAberta`:
// tirar ofensa do ar nao pode custar uma liberacao de edicao.
import Link from "next/link";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { prisma } from "@/lib/db";
import { estadoDoConvite } from "@/lib/estadoConvite";
import { carregarEventoDono } from "../_carregar";
import { TopoCartao } from "../../_ui/TopoCartao";
import { BTN_VOLTAR, CARD, COLUNA_ESTREITA, PILL_NEUTRO } from "../../_ui/estilos";
import { ListaRecados } from "./ListaRecados";

export const dynamic = "force-dynamic";

/** "12/08/2026, 20:14" no fuso de Brasilia (o mesmo fuso do resto do painel). */
const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function RecadosPainelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await carregarEventoDono(id);
  const estado = estadoDoConvite(event, new Date());

  const linhas = await prisma.recado.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, message: true, approved: true, createdAt: true },
  });

  const recados = linhas.map((r) => ({
    id: r.id,
    nome: r.name,
    mensagem: r.message,
    visivel: r.approved,
    quando: DATA_HORA.format(r.createdAt),
  }));

  // "No site" so e verdade enquanto o site responde — a mesma licao da tela de
  // Recursos. Com o convite fora do ar (ou a festa encerrada), um selo verde
  // dizendo "No site" seria uma promessa que a URL nao cumpre.
  const noAr = estado === "no-ar";

  // Uma frase, no tempo certo. A promessa da feature ("nao precisa liberar a
  // edicao") so faz sentido para quem esta com o convite publicado; para os
  // outros estados a frase vira ruido, entao ela troca.
  const APOIO: Record<typeof estado, string> = {
    "no-ar": "Esconder tira do site na hora. Não precisa liberar a edição.",
    "fora-do-ar":
      "O convite está fora do ar. Quando voltar, o mural mostra só os visíveis.",
    encerrada: "A festa passou. Os recados continuam guardados aqui.",
    rascunho: "O convite ainda não foi publicado.",
  };

  return (
    <div className={`${COLUNA_ESTREITA} scv-fade py-9 pb-20 ${EVT_FONTS_CLASS}`}>
      {/* `after:-inset-1` estica a area de toque de 36px para 44px sem mudar o
          desenho que as outras telas do painel usam. */}
      <Link
        href={`/painel/${event.id}`}
        aria-label="Voltar ao convite"
        className={`${BTN_VOLTAR} relative after:absolute after:-inset-1 after:content-[""]`}
      >
        <i className="bi bi-chevron-left" aria-hidden />
      </Link>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {/* `as="h1"`: o titulo deste cartao E o titulo da pagina. */}
        <TopoCartao
          icone="bi-chat-heart"
          chapeu={event.title}
          titulo="Recados dos convidados"
          as="h1"
          acao={
            recados.length > 0 ? (
              <span className={`${PILL_NEUTRO} shrink-0`}>
                {recados.length} {recados.length === 1 ? "recado" : "recados"}
              </span>
            ) : undefined
          }
        />

        {/* Sem recado nenhum, "esconder tira do site na hora" nao explica nada —
            nao ha o que esconder. A tela vazia ja diz a unica coisa util
            (de onde vem recado), entao a linha some em vez de virar enfeite. */}
        {recados.length > 0 ? (
          <p className="px-4 py-3.5 text-[12.5px] leading-relaxed text-scv-muted sm:px-5">
            {APOIO[estado]}
          </p>
        ) : null}

        <ListaRecados eventId={event.id} recados={recados} noAr={noAr} estado={estado} />
      </div>
    </div>
  );
}
