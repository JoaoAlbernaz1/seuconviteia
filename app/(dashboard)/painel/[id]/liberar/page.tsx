// Tela de LIBERAR a edicao de um convite publicado.
//
// E a primeira tela desta feature que o cliente ve — e a unica onde ele paga.
// Por isso ela e um cartao so, em coluna estreita: identidade do convite (para
// nao mexer no convite errado), as quatro frases que evitam arrependimento
// ("o que abre", "o site continua no ar", "vale 48h", "compra unica") e UMA
// acao. Nada mais.
//
// O servidor decide QUAL acao aparece (cota do plano x Pix) e monta a parte que
// nao muda; o cliente (`LiberarCliente`) so cuida do que troca depois do clique.
// A capa vem pronta daqui como `ReactNode`: `CapaEvento` continua no servidor.
//
// Quem chega aqui com a janela JA aberta nao ve tela de venda: vai direto para
// o editor (`edicaoAberta` -> redirect). E a ponta complementar do redirect que
// manda o editor fechado para ca — as duas condicoes sao opostas, sem loop.
import Link from "next/link";
import { redirect } from "next/navigation";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerTemaKey } from "@/lib/temas";
import { lerFonteKey } from "@/lib/fontes";
import { conviteEncerrado } from "@/lib/event";
import {
  PASSE_HORAS,
  PASSE_PRECO_CENTS,
  edicaoAberta,
  passesIncluidos,
  temPasseIncluido,
} from "@/lib/edicao";
import { planoEfetivo } from "@/lib/plans";
import { carregarEventoDono, hostDoEvento, lerCustomStr } from "../_carregar";
import { CapaEvento } from "../../_ui/CapaEvento";
import { BTN_VOLTAR, CARD, COLUNA_ESTREITA } from "../../_ui/estilos";
import { LiberarCliente } from "./LiberarCliente";

export const dynamic = "force-dynamic";

// Data curta de proposito: em 390px a versao por extenso era cortada no meio
// ("Publicado em 16 de agosto de 20..."), o que e pior do que nao ter data.
const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function LiberarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await carregarEventoDono(id);

  const agora = new Date();
  // Janela aberta = nao ha o que vender. Vale tambem para rascunho (que edita
  // sempre), entao ninguem cai aqui num beco.
  if (edicaoAberta(event, agora)) redirect(`/painel/criar?id=${event.id}`);

  const plano = planoEfetivo(event.professional, agora);
  const usadas = event.passesGratisUsados;
  const temIncluido = temPasseIncluido(plano, usadas);
  const incluidosRestantes = Math.max(0, passesIncluidos(plano) - usadas);

  const host = hostDoEvento(event.subdomain);
  const publicadoEm = event.publishedAt ? DATA_CURTA.format(event.publishedAt) : null;

  return (
    <div className={`${COLUNA_ESTREITA} scv-fade py-9 pb-20 ${EVT_FONTS_CLASS}`}>
      {/* `after:-inset-1` estica a area de toque do quadradinho de 36px para 44px
          sem mudar o desenho que as outras ~15 telas do painel usam. */}
      <Link
        href={`/painel/${event.id}`}
        aria-label="Voltar ao convite"
        className={`${BTN_VOLTAR} relative after:absolute after:-inset-1 after:content-[""]`}
      >
        <i className="bi bi-chevron-left" aria-hidden />
      </Link>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {/*
          Mesmo desenho do `TopoCartao` (icone + chapeu + titulo), escrito aqui
          porque o titulo desta tela e o `<h1>` da pagina — e o componente
          compartilhado devolve `<div>`. Visual identico, semantica certa.
        */}
        <div className="flex items-center gap-3.5 border-b border-scv-line px-4 py-3.5 sm:px-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-scv-lilac text-scv-violet">
            <i className="bi bi-unlock text-[18px]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-scv-faint">
              Convite publicado
            </div>
            <h1 className="mt-0.5 font-display text-[19px] font-semibold leading-tight text-scv-ink">
              Liberar edição do site
            </h1>
          </div>
        </div>

        {/* Que convite e este. Fica visivel em TODOS os estados, inclusive com o
            QR na tela: e a hora em que mais importa ter certeza. */}
        <div className="flex items-center gap-3.5 px-4 py-4 sm:px-5">
          <div className="w-[112px] shrink-0 overflow-hidden rounded-[13px] ring-1 ring-black/5 sm:w-[128px]">
            <CapaEvento
              tema={lerTemaKey(event.customization)}
              fontes={lerFonteKey(event.customization)}
              nome={event.title}
              fotoUrl={lerCustomStr(event.customization, "fotoUrl")}
              altura={100}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-semibold text-scv-ink">{event.title}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-scv-muted">{host}</p>
            {publicadoEm ? (
              <p className="mt-0.5 truncate text-[12px] text-scv-muted">
                Publicado em {publicadoEm}
              </p>
            ) : null}
          </div>
        </div>

        <LiberarCliente
          eventId={event.id}
          precoCents={PASSE_PRECO_CENTS}
          horas={PASSE_HORAS}
          temIncluido={temIncluido}
          incluidosRestantes={incluidosRestantes}
          encerrado={conviteEncerrado(event, agora)}
          foraDoAr={event.foraDoAr}
        />
      </div>
    </div>
  );
}
