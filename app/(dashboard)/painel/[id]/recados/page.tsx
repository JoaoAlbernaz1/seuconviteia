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
//
// LOTE e FILTRO existem por um motivo concreto: `deixarRecado` nao tem limite de
// taxa (divida conhecida, fora desta tarefa), entao o dia em que esta tela mais
// importa e justamente o dia em que o mural esta cheio. Carregar 3.000 recados
// de uma vez, com um botao por linha, seria uma tela de moderacao inutilizavel
// bem na hora da moderacao.
import Link from "next/link";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { prisma } from "@/lib/db";
import { estadoDoConvite, type EstadoConvite } from "@/lib/estadoConvite";
import { carregarEventoDono } from "../_carregar";
import { TopoCartao } from "../../_ui/TopoCartao";
import { BTN_VOLTAR, CARD, COLUNA_ESTREITA, PILL_NEUTRO } from "../../_ui/estilos";
import { ListaRecados, type FiltroRecados } from "./ListaRecados";

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

/** Quantos recados a pagina serve por vez (o "carregar mais" soma outro lote). */
const LOTE = 200;

export default async function RecadosPainelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filtro?: string | string[]; ate?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await carregarEventoDono(id);
  const estado = estadoDoConvite(event, new Date());

  const so = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const filtro: FiltroRecados =
    so(sp.filtro) === "ocultos" ? "ocultos" : so(sp.filtro) === "visiveis" ? "visiveis" : "todos";
  const pedido = Number.parseInt(so(sp.ate) ?? "", 10);
  const ate = Math.min(Number.isFinite(pedido) && pedido > LOTE ? pedido : LOTE, 2000);

  const [total, noSite] = await Promise.all([
    prisma.recado.count({ where: { eventId: event.id } }),
    prisma.recado.count({ where: { eventId: event.id, approved: true } }),
  ]);
  const ocultos = total - noSite;

  const linhas = await prisma.recado.findMany({
    where: {
      eventId: event.id,
      ...(filtro === "todos" ? {} : { approved: filtro === "visiveis" }),
    },
    orderBy: { createdAt: "desc" },
    take: ate,
    select: { id: true, name: true, message: true, approved: true, createdAt: true },
  });

  const recados = linhas.map((r) => ({
    id: r.id,
    nome: r.name,
    mensagem: r.message,
    visivel: r.approved,
    quando: DATA_HORA.format(r.createdAt),
  }));

  const noFiltro = filtro === "todos" ? total : filtro === "visiveis" ? noSite : ocultos;
  const restam = Math.max(noFiltro - recados.length, 0);

  // "No site" so e verdade enquanto o site responde — a mesma licao da tela de
  // Recursos. Com o convite fora do ar (ou a festa encerrada), um selo verde
  // dizendo "No site" seria uma promessa que a URL nao cumpre.
  const noAr = estado === "no-ar";

  // Uma frase, no tempo certo. A promessa da feature ("nao precisa liberar a
  // edicao") so faz sentido para quem esta com o convite publicado; para os
  // outros estados a frase vira ruido, entao ela troca. `rascunho` fica de fora
  // do mapa porque e impossivel: o servidor recusa recado de convite nao
  // publicado (`deixarRecado` -> `eventoPublico`), entao rascunho com recado
  // nao existe — e esta linha so aparece quando ha recado.
  const APOIO: Record<Exclude<EstadoConvite, "rascunho">, string> = {
    "no-ar": "Esconder tira do site na hora. Não precisa liberar a edição.",
    "fora-do-ar":
      "O convite está fora do ar. Quando voltar, o mural mostra só os visíveis.",
    encerrada: "A festa passou. Os recados continuam guardados aqui.",
  };

  const base = `/painel/${event.id}/recados`;
  // O filtro so aparece quando ha o que filtrar. Com o mural inteiro no site,
  // uma aba "Ocultos (0)" seria controle sem funcao — e a regra desta tela e
  // menos controle, mais lista.
  const mostrarFiltro = ocultos > 0 || filtro !== "todos";
  const ABAS: { chave: FiltroRecados; texto: string; n: number }[] = [
    { chave: "todos", texto: "Todos", n: total },
    { chave: "visiveis", texto: noAr ? "No site" : "Visíveis", n: noSite },
    { chave: "ocultos", texto: "Ocultos", n: ocultos },
  ];

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
        {/* `as="h1"`: o titulo deste cartao E o titulo da pagina. A pilula conta
            o que esta NO SITE, nao o total: depois de esconder um recado, um
            contador que nao se mexe faz a pessoa achar que o esconder falhou.
            Ela some quando as abas aparecem — dois lugares com o mesmo numero
            e um deles vai divergir. */}
        <TopoCartao
          icone="bi-chat-heart"
          chapeu={event.title}
          titulo="Recados dos convidados"
          as="h1"
          acao={
            total > 0 && !mostrarFiltro ? (
              <span className={`${PILL_NEUTRO} shrink-0`}>
                {noSite} no site
              </span>
            ) : undefined
          }
        />

        {/* Sem recado nenhum, "esconder tira do site na hora" nao explica nada —
            nao ha o que esconder. A tela vazia ja diz a unica coisa util. */}
        {total > 0 && estado !== "rascunho" ? (
          <p className="px-4 py-3.5 text-[12.5px] leading-relaxed text-scv-muted sm:px-5">
            {APOIO[estado]}
          </p>
        ) : null}

        {mostrarFiltro ? (
          <div className="flex flex-wrap gap-2 border-t border-scv-line px-4 py-3 sm:px-5">
            {ABAS.map((a) => {
              const ativa = a.chave === filtro;
              return (
                /* `!text-...`: `.dash :where(a…)` declara `color` fora das
                   @layer e vence as utilities — sem o `!`, toda aba sairia
                   violeta e o estado ativo desapareceria. */
                <Link
                  key={a.chave}
                  href={a.chave === "todos" ? base : `${base}?filtro=${a.chave}`}
                  aria-current={ativa ? "page" : undefined}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors duration-200 ${
                    ativa
                      ? "bg-scv-lilac !text-scv-violet"
                      : "bg-scv-soft !text-scv-text2 hover:bg-scv-field"
                  }`}
                >
                  {a.texto}
                  <span className={ativa ? "opacity-80" : "opacity-70"}>{a.n}</span>
                </Link>
              );
            })}
          </div>
        ) : null}

        <ListaRecados
          eventId={event.id}
          recados={recados}
          noAr={noAr}
          estado={estado}
          filtro={filtro}
        />

        {restam > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-scv-line px-4 py-3.5 sm:px-5">
            <span className="text-[12.5px] text-scv-muted">
              Mostrando {recados.length} de {noFiltro}
            </span>
            <Link
              href={`${base}?${filtro === "todos" ? "" : `filtro=${filtro}&`}ate=${ate + LOTE}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-scv-line bg-scv-card px-4 text-[13px] font-semibold !text-scv-ink transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field"
            >
              Carregar mais {Math.min(restam, LOTE)}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
