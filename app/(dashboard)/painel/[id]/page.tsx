// A tela de um convite — o que continua VIVO nele.
//
// Ela cravava "No ar" e "Seu convite está no ar" para qualquer convite, e
// oferecia "Editar o site" num botão gordo mesmo depois que o servidor passou a
// recusar (publicou, fecha — ver `lib/edicao`). Agora ela mostra os MESMOS
// quatro estados da lista (`lib/estadoConvite`) e só oferece o que existe:
//
//   no ar          -> compartilhar; a edição é a porta discreta ("Liberar")
//   no ar + janela  -> "Editar o site agora" vira o botão dominante
//   fora do ar     -> a consequência em âmbar e "Voltar ao ar" como dominante
//   festa encerrada -> nada a liberar (o servidor recusa) e nada a religar
//
// Rascunho não abre aqui: gerenciar é para site publicado, então volta para
// "Meus convites" (o rascunho se edita no editor).
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerTemaKey } from "@/lib/temas";
import { lerFonteKey } from "@/lib/fontes";
import { textosDoNicho } from "@/lib/textos";
import { RECUSA_FESTA_PASSOU, edicaoAberta } from "@/lib/edicao";
import { estadoDoConvite } from "@/lib/estadoConvite";
import { planoEfetivo, podeCriarEvento } from "@/lib/plans";
import { tirarDoAr, voltarAoAr } from "@/app/(dashboard)/actions";
import { ExcluirEvento } from "./ExcluirEvento";
import {
  carregarEventoDono,
  hostDoEvento,
  urlDoEvento,
  lerCustomStr,
} from "./_carregar";
import { CapaEvento } from "../_ui/CapaEvento";
import { CopiarLink } from "./CopiarLink";
import {
  BTN_CARD,
  BTN_FORTE,
  BTN_GHOST,
  CARD,
  COLUNA,
  PILL_ATENCAO,
  PILL_NEUTRO,
  SELO_ESTADO,
  BTN_VOLTAR,
} from "../_ui/estilos";

export const dynamic = "force-dynamic";

/**
 * O botão DOMINANTE do herói — no máximo um por vez nesta tela.
 *
 * `!text-white` porque `.dash :where(a…)` declara `color` fora das @layer do
 * Tailwind e vence a utility; sem o `!`, o rótulo sai branco no JSX e chega
 * violeta na tela.
 */
const CTA_DOMINANTE =
  "group inline-flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl bg-violeta py-3.5 pl-5 pr-3.5 text-[14.5px] font-semibold !text-white shadow-[0_10px_24px_-12px_rgba(109,40,217,0.45)] transition-[filter,box-shadow,transform] duration-200 hover:brightness-110 hover:shadow-[0_14px_30px_-12px_rgba(109,40,217,0.5)] active:scale-[0.99]";

/** Ação de apoio do herói (mesmo alvo de 44px, sem peso de cor). */
const CTA_APOIO = `${BTN_GHOST} inline-flex min-h-[44px] items-center gap-2 !text-scv-ink`;

const DATA_DDMM = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SO_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

const DIA_E_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Ate quando a janela de edicao esta aberta — em frase curta.
 *
 * "Edicao aberta" sozinho escondia o que a janela tem de mais importante: ela
 * EXPIRA (a cortesia dura 1 hora). Hoje mostra so a hora, que e o dado que
 * decide se da tempo; noutro dia entra tambem o dia.
 */
function ateQuando(fim: Date, agora: Date): string {
  const hoje = DATA_DDMM.format(fim) === DATA_DDMM.format(agora);
  return hoje ? `até ${SO_HORA.format(fim)}` : `até ${DIA_E_HORA.format(fim)}`;
}

/** Iniciais para o avatar (primeira + última palavra do nome). */
function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = p[0]?.[0] ?? "";
  const ultima = p.length > 1 ? (p[p.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase() || "•";
}

export default async function AcompanharEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await carregarEventoDono(id);
  if (event.status === "DRAFT") redirect("/painel/convites");

  const agora = new Date();
  const estado = estadoDoConvite(event, agora);
  const noAr = estado === "no-ar";
  const fora = estado === "fora-do-ar";
  const encerrada = estado === "encerrada";
  // A janela de edição NÃO se deduz do estado: um convite no ar convive com a
  // edição aberta (a cortesia de 1h, a cota do plano, o passe pago).
  const podeEditar = edicaoAberta(event, agora);
  // Festa encerrada e o unico estado sem nada a fazer NESTE convite — a saida e
  // o proximo. So aqui a conta e consultada: perguntar vaga de plano em toda
  // visita seria uma query a mais para nada.
  const podeCriarOutro =
    encerrada &&
    podeCriarEvento(
      planoEfetivo(event.professional, agora),
      await prisma.event.count({
        where: { professionalId: event.professionalId, expiresAt: { gt: agora } },
      }),
    );

  const host = hostDoEvento(event.subdomain);
  const url = urlDoEvento(event.subdomain);
  const base = `/painel/${event.id}`;
  const selo = SELO_ESTADO[estado];
  // Uma string so (e nao texto + expressao soltos): num flex com `gap`, cada
  // pedaco de texto vira um item e o selo ganhava um espaco duplo no meio.
  const rotuloEdicao = `Edição aberta${
    event.edicaoAte ? ` ${ateQuando(event.edicaoAte, agora)}` : ""
  }`;

  const local = lerCustomStr(event.customization, "local");
  const subtitulo = [local, DATA_LONGA.format(event.eventDate)]
    .filter(Boolean)
    .join(" · ");

  const confirmados = await prisma.guest.findMany({
    where: { eventId: event.id, status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const kpis = [
    { n: event._count.guests, label: "confirmaram presença", icon: "bi-check2-circle" },
    // Conta so os APROVADOS (ver `_carregar`), entao o rotulo precisa dizer
    // isso — senao esconder um recado derruba o numero sem explicacao. E "no
    // site" so vale enquanto o site responde, a mesma regra dos selos.
    {
      n: event._count.recados,
      label: estado === "no-ar" ? "recados no site" : "recados visíveis",
      icon: "bi-chat-heart",
    },
    { n: event.gifts.length, label: "presentes na lista", icon: "bi-gift" },
  ];

  // O menu só lista o que continua acontecendo depois de publicar. Fotos,
  // Presentes, Programação e Recursos do site saíram: são o EDITOR, e o editor
  // tem uma porta só (liberar a edição), não quatro atalhos que dão em recusa.
  const menu = [
    { label: "Convidados", desc: "Lista e confirmações", href: `${base}/convidados`, icon: "bi-people" },
    { label: "Recados", desc: "O que os convidados escreveram", href: `${base}/recados`, icon: "bi-chat-heart" },
    { label: "Recebimentos", desc: "Presentes recebidos e resgate por Pix", href: `${base}/cofre`, icon: "bi-wallet2" },
    // Único caminho para a tela de leitura dos recursos: ela não edita nada, só
    // conta o que o convidado encontra no site publicado.
    { label: "O que está no ar", desc: "Os recursos que o site mostra hoje", href: `${base}/recursos`, icon: "bi-broadcast" },
  ];

  // Festa encerrada não tem o que liberar: o servidor recusa o passe, e um botão
  // que só dá erro é pior do que botão nenhum.
  const acaoEdicao = encerrada
    ? null
    : podeEditar
      ? {
          href: `/painel/criar?id=${event.id}`,
          label: "Editar o site agora",
          icone: "bi-unlock",
        }
      : { href: `${base}/liberar`, label: "Liberar edição", icone: "bi-lock" };
  // Um violeta só por área. Com o convite fora do ar o dominante é devolvê-lo ao
  // ar — a edição desce para apoio, senão os dois botões brigam pela mesma
  // atenção e nenhum vence.
  const edicaoDominante = acaoEdicao !== null && podeEditar && !fora;

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-20 ${EVT_FONTS_CLASS}`}>
      {/* topo */}
      <div className="flex flex-wrap items-center gap-3.5">
        <Link href="/painel" aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate font-display text-[28px] font-semibold tracking-tight text-scv-ink">
              {event.title}
            </h1>
            {/* DOIS NÍVEIS, a mesma dupla da lista: o estado do convite
                (colorido) e, ao lado, o que dá para mexer (neutro). */}
            <span className={`${selo.cls} inline-flex items-center gap-1.5`}>
              {selo.ponto ? <span className="size-1.5 rounded-full bg-current" /> : null}
              {selo.icone ? <i className={`bi ${selo.icone}`} aria-hidden /> : null}
              {selo.texto}
            </span>
            {encerrada ? null : podeEditar ? (
              // Com o prazo junto: a janela EXPIRA (a cortesia dura 1 hora), e
              // "Edição aberta" sozinho escondia justamente isso.
              <span className={`${PILL_ATENCAO} inline-flex items-center gap-1.5`}>
                <i className="bi bi-unlock" aria-hidden />
                {rotuloEdicao}
              </span>
            ) : (
              <span className={`${PILL_NEUTRO} inline-flex items-center gap-1.5`}>
                <i className="bi bi-lock" aria-hidden /> Edição fechada
              </span>
            )}
          </div>
          {subtitulo ? (
            <p className="mt-0.5 truncate text-[13px] text-scv-muted">{subtitulo}</p>
          ) : null}
        </div>
      </div>

      {/* cartão-herói: prévia + link + a ação que o estado permite */}
      <div className={`${CARD} mt-6`}>
        <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-stretch sm:gap-6 sm:p-6">
          {/* `sm:self-start`: no desktop a capa tem altura propria (180px) e NAO
              se estica com a coluna — esticada, o estado com aviso deixava uma
              faixa branca embaixo da foto, que le como imagem quebrada. So a
              partir do `sm` porque no celular a linha e coluna: ali `self-start`
              encolheria a LARGURA da capa. */}
          <div className="shrink-0 overflow-hidden rounded-[16px] ring-1 ring-black/5 sm:w-[300px] sm:self-start">
            <CapaEvento
              tema={lerTemaKey(event.customization)}
              fontes={lerFonteKey(event.customization)}
              nome={event.title}
              kicker={textosDoNicho(event.type).conviteTitulo}
              fotoUrl={lerCustomStr(event.customization, "fotoUrl")}
              altura={180}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* `text-scv-teal-ink` e não `text-scv-teal`: o teal claro sobre
                branco dá 3,02:1 — reprova AA, e a frase que anuncia o estado do
                convite era a menos legível da tela. */}
            {noAr ? (
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-scv-teal-ink">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-scv-teal/60 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-scv-teal" />
                </span>
                Seu convite está no ar
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-scv-text2">
                <i
                  className={`bi ${fora ? "bi-eye-slash" : "bi-calendar2-check"} text-[13px]`}
                  aria-hidden
                />
                {fora ? "Seu convite está fora do ar" : "A festa já aconteceu"}
              </div>
            )}

            {/* link público */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-scv-line bg-scv-field px-3.5 py-2.5">
              <i className="bi bi-link-45deg text-lg text-scv-violet" aria-hidden />
              {/* `basis-[160px]`: em 390px os dois botoes espremiam o endereco
                  ate "maria-...". Com uma base minima, quem nao cabe e o BOTAO,
                  que desce para a segunda linha — o link fica legivel inteiro. */}
              <span className="min-w-0 flex-1 basis-[160px] truncate text-[13.5px] text-scv-ink">
                {host}
              </span>
              {/* Copiar some com a festa encerrada: quem abrir o link le que o
                  convite acabou, e espalhar isso nao serve a ninguem. "Ver
                  site" fica — e como o dono confere o que o convidado ve. */}
              {encerrada ? null : (
                <CopiarLink url={url} className={`${BTN_CARD} min-h-[44px]`} />
              )}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${BTN_FORTE} inline-flex min-h-[44px] items-center !text-scv-btn-ink`}
              >
                Ver site ↗
              </a>
            </div>

            {/* A CONSEQUÊNCIA do estado, colada no link a que ela se refere.
                Âmbar só aqui: fora do ar é o único caso em que alguma coisa
                está quebrada AGORA e tem conserto num clique. */}
            {fora ? (
              <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-scv-warn-bg px-3.5 py-2.5 text-[12.5px] leading-relaxed text-scv-warn-ink">
                <i className="bi bi-exclamation-triangle mt-0.5" aria-hidden />
                Quem abrir este link agora vê um aviso de convite indisponível.
              </p>
            ) : encerrada ? (
              /* A MESMA frase que o servidor responde a quem tenta editar uma
                 festa vencida (`RECUSA_FESTA_PASSOU`) — dita antes do clique, e
                 nao depois dele, e escrita num lugar so. */
              <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-scv-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-scv-text2">
                <i className="bi bi-archive mt-0.5" aria-hidden />
                <span>
                  {RECUSA_FESTA_PASSOU} As confirmações, os recados e os presentes
                  recebidos continuam aqui.
                </span>
              </p>
            ) : null}

            {/* ações principais */}
            {fora || acaoEdicao || encerrada ? (
              <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">
                {fora ? (
                  <form action={voltarAoAr}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <button type="submit" className={CTA_DOMINANTE}>
                      Voltar ao ar
                      <span className="grid size-7 place-items-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
                        <i className="bi bi-arrow-clockwise text-[13px]" aria-hidden />
                      </span>
                    </button>
                  </form>
                ) : null}
                {/* A unica saida de quem chegou ao fim: o proximo convite. Sem
                    vaga no plano ele nao some — leva aos planos, dizendo por
                    que (mesmo padrao da lista). */}
                {encerrada ? (
                  <Link
                    href={podeCriarOutro ? "/painel/criar" : "/painel/plano"}
                    className={CTA_DOMINANTE}
                  >
                    {podeCriarOutro ? "Criar convite novo" : "Ver planos"}
                    <span className="grid size-7 place-items-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
                      <i className="bi bi-arrow-right text-[13px]" aria-hidden />
                    </span>
                  </Link>
                ) : null}
                {acaoEdicao ? (
                  <Link
                    href={acaoEdicao.href}
                    className={edicaoDominante ? CTA_DOMINANTE : CTA_APOIO}
                  >
                    {edicaoDominante ? (
                      <>
                        {acaoEdicao.label}
                        <span className="grid size-7 place-items-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
                          <i className="bi bi-arrow-right text-[13px]" aria-hidden />
                        </span>
                      </>
                    ) : (
                      <>
                        <i className={`bi ${acaoEdicao.icone}`} aria-hidden />
                        {acaoEdicao.label}
                      </>
                    )}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className={`${CARD} flex items-center gap-4 p-5`}>
            <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-scv-lilac text-scv-violet">
              <i className={`bi ${k.icon} text-lg`} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="font-display text-[28px] font-semibold leading-none text-scv-ink">
                {k.n}
              </div>
              <div className="mt-1.5 text-[12.5px] text-scv-muted">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* corpo */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* confirmações recentes */}
        <div className={`${CARD} p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-scv-ink">Confirmações recentes</h2>
            {confirmados.length > 0 ? (
              <Link
                href={`${base}/convidados`}
                className="shrink-0 text-[12.5px] font-semibold text-scv-violet transition-opacity hover:opacity-80"
              >
                Ver todos →
              </Link>
            ) : null}
          </div>
          {confirmados.length === 0 ? (
            <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-scv-dash/70 bg-scv-field py-10 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-scv-lilac text-scv-violet">
                <i className="bi bi-people text-lg" aria-hidden />
              </span>
              {/* O vazio também não pode mentir: pedir "compartilhe o link" a
                  quem está fora do ar (ou depois da festa) é mandar a pessoa
                  divulgar uma página que não abre. */}
              <p className="max-w-[280px] text-[13px] leading-relaxed text-scv-muted">
                {encerrada
                  ? "Ninguém confirmou presença neste convite."
                  : fora
                    ? "Ainda ninguém confirmou — e o convite está fora do ar. Volte ao ar para receber confirmações."
                    : "Ainda ninguém confirmou. Compartilhe o link do site e as confirmações aparecem aqui na hora."}
              </p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-1">
              {confirmados.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-scv-field"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-scv-lilac text-[12.5px] font-bold text-scv-violet">
                    {iniciais(g.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-scv-ink">
                      {g.name}
                    </div>
                    <div className="text-[12px] text-scv-muted">
                      {g.companions > 0
                        ? `leva +${g.companions} acompanhante${g.companions === 1 ? "" : "s"}`
                        : "vai sozinho(a)"}
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] text-scv-faint">
                    {DATA_DDMM.format(g.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* menu único: o que continua acontecendo no convite */}
        <div className={`${CARD} overflow-hidden`}>
          <div className="border-b border-scv-line px-5 py-4">
            <h2 className="text-[15px] font-semibold text-scv-ink">Gerenciar o site</h2>
            <p className="mt-0.5 text-[12.5px] text-scv-muted">
              Acompanhe o que está acontecendo no seu convite
            </p>
          </div>
          <div className="flex flex-col">
            {menu.map((m, i) => (
              <Link
                key={m.href}
                href={m.href}
                className={`group flex min-h-[44px] items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-scv-field ${
                  i > 0 ? "border-t border-scv-line/70" : ""
                }`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-scv-lilac text-scv-violet">
                  <i className={`bi ${m.icon}`} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-scv-ink">
                    {m.label}
                  </span>
                  <span className="block truncate text-[12px] text-scv-muted">{m.desc}</span>
                </span>
                <i
                  className="bi bi-chevron-right text-scv-faint transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* zona de ajustes / risco. "Tirar do ar" só aparece com o site no ar:
          pausar o que já está pausado (ou a festa que acabou) é um botão que não
          faz nada. Quem está fora do ar tem "Voltar ao ar" lá em cima, colado no
          aviso que explica o problema. */}
      <div className="mt-8 flex flex-col gap-3.5 rounded-2xl border border-scv-line/80 bg-scv-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-scv-ink">Ajustes do site</div>
          <div className="text-[12px] text-scv-muted">
            {/* A consequencia ANTES do clique: "Tirar do ar" e um toque so, e
                antes disso a pessoa so descobria o que tinha feito depois.
                Comecando pelo nome do estado ("Fora do ar, quem abrir..."), a
                frase lia como ROTULO do estado atual; "Se voce tirar do ar" diz
                que e uma condicao, e nao o que esta acontecendo agora. */}
            {noAr
              ? "Se você tirar do ar, quem abrir o link vê um aviso de convite indisponível — e você traz de volta quando quiser."
              : "Apague este convite de vez. Não tem volta."}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {noAr ? (
            <>
              <form action={tirarDoAr}>
                <input type="hidden" name="eventId" value={event.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-scv-muted transition-colors duration-200 hover:text-scv-ink"
                >
                  <i className="bi bi-pause-circle" aria-hidden />
                  Tirar do ar
                </button>
              </form>
              <span className="hidden h-4 w-px bg-scv-line sm:block" aria-hidden />
            </>
          ) : null}
          <ExcluirEvento eventId={event.id} titulo={event.title} />
        </div>
      </div>
    </div>
  );
}
