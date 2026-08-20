// Tela "O que está no ar" — o retrato SOMENTE LEITURA dos recursos do convite.
//
// Ela era um painel de liga/desliga que gravava em `Event.customization`. Só que
// o convite publicado não lê mais dali: `publishedEventProjection`
// (`lib/event-editor/public-document`) TROCA o `customization` inteiro pelo
// derivado do snapshot (`documentToLegacyCustomization`). Ou seja, depois de
// publicado, cada toggle salvo aqui mudava um JSON que ninguém consulta — a
// pessoa desligava a galeria, via "salvo" e o site continuava com a galeria.
//
// Então a tela deixa de escrever e passa a LER do que está no ar (o snapshot
// publicado). Quem quiser mudar tem um caminho só, o que o servidor de fato
// aceita: liberar a edição e mexer no editor de 6 passos.
//
// O bloco de upsell tracejado ("com o plano X você desbloqueia") morreu junto:
// desde 17/08 o Básico libera RSVP, recados e galeria (`lib/plans.ts`) e os
// outros três nunca tiveram trava, então a lista de bloqueados era sempre vazia
// e aquele bloco nunca chegou a renderizar.
import Link from "next/link";
import { redirect } from "next/navigation";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { RECURSOS_SITE, lerToggles, type RecursoSite, type TogglesSite } from "@/lib/recursos";
import { publishedEditorDocument } from "@/lib/event-editor/public-document";
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
  encerrada: "Isto é o que o convite mostrou até o dia da festa.",
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

  // A VERDADE do site publicado mora no snapshot. Sem snapshot (convite legado,
  // publicado antes do editor novo), o site ainda lê o `customization` — e aí é
  // dali que a tela tem de ler para não inventar.
  const documento = publishedEditorDocument(event);
  const ativos: TogglesSite = documento
    ? {
        rsvp: documento.rsvp.enabled,
        presentes: documento.gifts.enabled,
        // O contador não tem liga/desliga: `documentToRenderModel` o entrega
        // sempre ligado (`lib/event-editor/render.ts`).
        contador: true,
        programacao: documento.schedule.program.enabled,
        recados: documento.messages.enabled,
        galeria: documento.gallery.enabled,
      }
    : lerToggles(event.customization);

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
            <span className={selo.cls}>
              {selo.icone ? <i className={`bi ${selo.icone} mr-1`} aria-hidden /> : null}
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
              <div
                key={d.key}
                className={`flex min-h-[64px] items-center gap-3.5 rounded-[13px] border border-scv-line p-3.5 ${
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
                <div className="min-w-0 flex-1">
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
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-scv-teal/10 px-2.5 py-1 text-[11px] font-semibold text-scv-teal-ink">
                    <i className="bi bi-check2" aria-hidden />
                    {sempre ? "Sempre ativo" : "Ativo no site"}
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-scv-card px-2.5 py-1 text-[11px] font-semibold text-scv-muted">
                    <i className="bi bi-eye-slash" aria-hidden />
                    Oculto no site
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
