// Tela "O que está no ar" — o retrato SOMENTE LEITURA dos recursos do convite.
//
// Ela era um painel de liga/desliga que gravava em `Event.customization`. Só que
// o convite publicado não lê mais dali: `publishedEventProjection`
// (`lib/event-editor/public-document`) TROCA o `customization` inteiro pelo
// derivado do snapshot (`documentToLegacyCustomization`). Ou seja, depois de
// publicado, cada toggle salvo aqui mudava um JSON que ninguém consulta — a
// pessoa desligava a galeria, via "salvo" e o site continuava com a galeria.
//
// Então a tela deixa de escrever e passa a LER do que está no ar, pelas MESMAS
// duas chamadas do site público (`publishedEventProjection` + `recursosDoSite`)
// — não por uma conta própria. Quem quiser mudar tem um caminho só, o que o
// servidor de fato aceita: liberar a edição e mexer no editor de 6 passos.
//
// O bloco de upsell tracejado ("com o plano X você desbloqueia") morreu junto:
// desde 17/08 o Básico libera RSVP, recados e galeria (`lib/plans.ts`) e os
// outros três nunca tiveram trava, então a lista de bloqueados era sempre vazia
// e aquele bloco nunca chegou a renderizar.
import Link from "next/link";
import { redirect } from "next/navigation";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { RECURSOS_SITE, recursosDoSite, type RecursoSite } from "@/lib/recursos";
import { publishedEventProjection } from "@/lib/event-editor/public-document";
import { planoDoSite } from "@/lib/plans";
import { estadoDoConvite, type EstadoConvite } from "@/lib/estadoConvite";
import { edicaoAberta } from "@/lib/edicao";
import { carregarEventoDono, voltarDe } from "../_carregar";
import { TopoCartao } from "../../_ui/TopoCartao";
import {
  BTN_PRIMARIO,
  BTN_VOLTAR,
  CARD,
  COLUNA_ESTREITA,
  SELO_ESTADO,
  SUB,
  TITULO,
} from "../../_ui/estilos";

export const dynamic = "force-dynamic";

/** Ícone de cada recurso (só apresentação — por isso não mora em `lib/recursos`). */
const ICONE: Record<RecursoSite, string> = {
  rsvp: "bi-check2-circle",
  presentes: "bi-gift",
  contador: "bi-hourglass-split",
  programacao: "bi-clock-history",
  recados: "bi-chat-heart",
  galeria: "bi-image",
};

/**
 * A frase de apoio segue o ESTADO do convite: "o que seus convidados veem hoje"
 * é mentira em convite pausado (ninguém vê nada) e em festa que já aconteceu.
 */
const APOIO: Record<EstadoConvite, string> = {
  "no-ar": "Isto é o que seus convidados veem hoje. Para mudar, libere a edição.",
  "fora-do-ar":
    "Isto é o que o convite mostra quando voltar ao ar. Para mudar, libere a edição.",
  // Presente, como o título e as pílulas: a festa passou, mas os recursos do
  // convite continuam sendo os que estão aqui. Misturar "mostrou" (passado) com
  // "Ativo" (presente) na mesma tela deixa o leitor sem saber qual vale.
  encerrada: "A festa já passou e o site saiu do ar. Estes são os recursos do convite.",
  // Rascunho não chega aqui (redireciona para o editor), mas o mapa fica
  // completo para o dia em que um quinto estado nascer.
  rascunho: "Este convite ainda não foi publicado.",
};

export default async function RecursosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await carregarEventoDono(id);
  // Rascunho não está no ar — a tela inteira seria uma mentira. E o lugar de
  // ligar/desligar recurso em rascunho é o editor, que abre sempre.
  if (event.status === "DRAFT") redirect(`/painel/criar?id=${event.id}`);

  const voltar = voltarDe(sp, `/painel/${event.id}`);
  const agora = new Date();
  const estado = estadoDoConvite(event, agora);
  const selo = SELO_ESTADO[estado];

  // A MESMA DUPLA de chamadas das nove rotas públicas (`app/%5Fsites/[sub]/*`):
  // primeiro a projeção do snapshot publicado — que substitui o `customization`
  // inteiro pelo derivado do documento, e cai no evento cru quando não há
  // snapshot (convite legado) —, depois `recursosDoSite`, que resolve
  // **plano ∩ liga/desliga**.
  //
  // Ler só o liga/desliga daria o mesmo resultado hoje (nenhum plano trava
  // recurso desde 17/08), mas seria uma segunda conta para a mesma pergunta: no
  // dia em que um recurso virar degrau de plano, esta tela diria "ativo" sobre
  // algo que o convidado não vê. É exatamente a mentira que a Task 11 veio matar.
  const noAr = publishedEventProjection(event);
  const ativos = recursosDoSite(planoDoSite(noAr, agora), noAr.customization);

  // "no site" só é verdade enquanto o site responde: com o convite fora do ar
  // (ou a festa encerrada), um selo cinza dizendo "Festa encerrada" ao lado de
  // seis dizendo "no site" é contradição. As três pílulas trocam JUNTAS — o
  // contador seguia sozinho em "Sempre ativo" e quebrava o padrão da coluna.
  const ROTULO =
    estado === "no-ar"
      ? { ativo: "Ativo no site", oculto: "Oculto no site", sempre: "Sempre no site" }
      : { ativo: "Ativo", oculto: "Oculto", sempre: "Sempre ativo" };

  // Mesma regra da tela do convite (Task 10): festa encerrada não tem o que
  // liberar (o servidor recusa o passe), e com a janela já aberta o destino é o
  // editor, não a tela de venda.
  const acao =
    estado === "encerrada"
      ? null
      : edicaoAberta(event, agora)
        ? { href: `/painel/criar?id=${event.id}`, label: "Editar o site agora", icone: "bi-unlock" }
        : { href: `/painel/${event.id}/liberar`, label: "Liberar edição", icone: "bi-lock" };

  return (
    <div className={`${COLUNA_ESTREITA} scv-fade py-9 pb-20 ${EVT_FONTS_CLASS}`}>
      <div className="flex items-start gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={TITULO}>O que está no ar</h1>
            {/* O MESMO selo da lista e da tela do convite, com as duas partes
                opcionais que elas renderizam — sem o pontinho, o "No ar" daqui
                era um terceiro desenho do mesmo selo. */}
            <span className={`${selo.cls} inline-flex items-center gap-1.5`}>
              {selo.ponto ? <span className="size-1.5 rounded-full bg-current" /> : null}
              {selo.icone ? <i className={`bi ${selo.icone}`} aria-hidden /> : null}
              {selo.texto}
            </span>
          </div>
          <p className={`${SUB} mt-1`}>{APOIO[estado]}</p>
        </div>
      </div>

      <div className={`${CARD} mt-6 overflow-hidden`}>
        <TopoCartao icone="bi-broadcast" chapeu={event.title} titulo="Recursos do site" />

        <div className="flex flex-col gap-2.5 p-4 sm:p-5">
          {RECURSOS_SITE.map((d) => {
            const on = ativos[d.key];
            const sempre = d.key === "contador";
            return (
              /* `flex-wrap` + `min-w-[9.5rem]` no texto: em 390px o selo e o
                 texto disputavam a mesma linha e sobravam ~130px para o titulo,
                 que quebrava em duas linhas e empurrava a descricao para tres.
                 Sem espaco para os dois, o selo desce sozinho para a segunda
                 linha (encostado a direita) e o texto fica inteiro. */
              <div
                key={d.key}
                className={`flex min-h-[64px] flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[13px] border border-scv-line p-3.5 ${
                  on ? "bg-scv-card" : "bg-scv-soft"
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${
                    on ? "bg-scv-lilac text-scv-violet" : "bg-scv-card text-scv-muted"
                  }`}
                >
                  <i className={`bi ${ICONE[d.key]}`} aria-hidden />
                </span>
                <div className="min-w-[9.5rem] flex-1">
                  {/* Sobre `bg-scv-soft` o cinza secundário dá 4,2:1 — abaixo do
                      mínimo. Na linha rebaixada o texto sobe para `scv-text2`
                      (9,1:1); o "desligado" quem diz é o selo, não o borrão. */}
                  <p
                    className={`text-[14.5px] font-semibold ${
                      on ? "text-scv-ink" : "text-scv-text2"
                    }`}
                  >
                    {d.titulo}
                  </p>
                  <p
                    className={`mt-0.5 text-[12px] ${on ? "text-scv-muted" : "text-scv-text2"}`}
                  >
                    {d.descricao}
                  </p>
                </div>
                {on ? (
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-scv-teal/10 px-2.5 py-1 text-[11px] font-semibold text-scv-teal-ink">
                    <i className="bi bi-check2" aria-hidden />
                    {sempre ? ROTULO.sempre : ROTULO.ativo}
                  </span>
                ) : (
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-scv-card px-2.5 py-1 text-[11px] font-semibold text-scv-muted">
                    <i className="bi bi-eye-slash" aria-hidden />
                    {ROTULO.oculto}
                  </span>
                )}
              </div>
            );
          })}

          {acao ? (
            /* `!text-white`: `.dash :where(a…)` declara `color` fora das @layer
               do Tailwind e ganha da utility — sem o `!` o rótulo chega violeta. */
            <Link
              href={acao.href}
              className={`${BTN_PRIMARIO} mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 !text-white`}
            >
              <i className={`bi ${acao.icone}`} aria-hidden />
              {acao.label}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
