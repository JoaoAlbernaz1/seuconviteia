// Tela "Convidados" — mesmo layout de duas colunas dos Presentes (estilo Wedy),
// na marca do painel. ESQUERDA: resumo (quantos confirmaram, aguardando,
// acompanhantes) + atalhos (compartilhar o link, ver a página de confirmação).
// DIREITA: a lista em si (adicionar nome + linhas com status e remover).
// Server component: forms nativos com server actions; ownership por `carregarEventoDono`.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { carregarEventoDono, hostDoEvento, urlDoEvento, voltarDe } from "../_carregar";
import { adicionarConvidado, removerConvidado } from "../../acoes";
import { CopiarLink } from "../CopiarLink";
import { BTN_VOLTAR, CARD, INPUT, SUB, TITULO } from "../../_ui/estilos";
import { planoEfetivo } from "@/lib/plans";
import { BaixarConvidados } from "./BaixarConvidados";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmou", cls: "bg-scv-teal/10 text-scv-teal" },
  PENDING: { label: "Aguardando", cls: "bg-scv-warn-bg text-scv-warn-ink" },
  DECLINED: { label: "Não vai", cls: "bg-scv-soft text-scv-faint" },
};

const formatadorDia = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });

/** "dd/mm/aaaa" no fuso de Brasília (usado no arquivo da lista). */
function formatarData(data: Date): string {
  return formatadorDia.format(data);
}

/** Iniciais para o avatar (1ª + última palavra do nome). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default async function ConvidadosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await carregarEventoDono(id);
  const voltar = voltarDe(sp, `/painel/${event.id}`);
  const host = hostDoEvento(event.subdomain);
  const url = urlDoEvento(event.subdomain);

  const convidados = await prisma.guest.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
  });

  const plano = event.professional ? planoEfetivo(event.professional, new Date()) : "BASICO";

  const total = convidados.length;
  const confirmados = convidados.filter((g) => g.status === "CONFIRMED");
  const aguardando = convidados.filter((g) => g.status === "PENDING").length;
  const acompanhantes = confirmados.reduce((s, g) => s + (g.companions ?? 0), 0);

  const stats = [
    { n: confirmados.length, label: "Confirmaram" },
    { n: aguardando, label: "Aguardando" },
    { n: acompanhantes, label: "Acompanhantes" },
  ];

  const progresso = total > 0 ? Math.round((confirmados.length / total) * 100) : 0;

  /** Bloco do link — a única coisa que faz convidado aparecer sozinho na lista. */
  const blocoLink = (
    <div className={`${CARD} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-scv-lilac text-scv-violet">
          <i className="bi bi-link-45deg text-[19px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-scv-ink">Link de confirmação</div>
          <div className="truncate text-[13px] text-scv-muted">{host}</div>
        </div>
        <CopiarLink
          url={url}
          idleLabel="Compartilhar com os convidados"
          className="w-full shrink-0 cursor-pointer rounded-[11px] bg-violeta px-5 py-2.5 text-[13.5px] font-semibold !text-white transition-colors duration-200 hover:brightness-110 sm:w-auto"
        />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-scv-faint">
        <i className="bi bi-info-circle" aria-hidden />
        Quem abrir o convite confirma presença sozinho — e aparece aqui na hora.
      </p>
    </div>
  );

  /** Formulário de adicionar à mão. Existe UMA vez na tela, nunca duas. */
  const formAdicionar = (
    <form action={adicionarConvidado} className="flex items-center gap-2.5" id="add-convidado">
      <input type="hidden" name="eventId" value={event.id} />
      <label htmlFor="nome-convidado" className="sr-only">
        Nome do convidado
      </label>
      <input
        id="nome-convidado"
        name="name"
        placeholder="Nome do convidado"
        required
        maxLength={140}
        className={`${INPUT} flex-1`}
      />
      <button
        type="submit"
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[11px] bg-violeta px-4 py-3 text-[13.5px] font-semibold text-white transition-colors duration-200 hover:brightness-110"
      >
        <i className="bi bi-plus-lg" aria-hidden /> Adicionar
      </button>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-[1120px] scv-fade px-4 py-9 pb-24 sm:px-7">
      {/* CABEÇALHO */}
      <div className="flex flex-wrap items-center gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div className="flex-1">
          <h1 className={TITULO}>Convidados</h1>
          <p className={`mt-1 ${SUB}`}>
            Acompanhe quem confirmou — ou só compartilhe o link e deixe cada um confirmar sozinho.
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {/* Extra de quem assina: a mesma tela, com a lista para levar embora.
              No plano grátis o botão continua aqui, com cadeado e explicação. */}
          <BaixarConvidados
            plano={plano}
            liberado={plano !== "BASICO"}
            nomeEvento={event.title}
            convidados={convidados.map((g) => ({
              nome: g.name,
              status: g.status,
              acompanhantes: g.companions ?? 0,
              recado: g.message,
              quando: formatarData(g.createdAt),
            }))}
          />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[11px] border border-scv-line bg-scv-card px-4 py-2.5 text-[13px] font-semibold text-scv-ink transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field"
          >
            Ver no site <i className="bi bi-box-arrow-up-right text-[12px]" aria-hidden />
          </a>
        </div>
      </div>

      {total === 0 ? (
        /* ===================== LISTA VAZIA =====================
           O estado real de quem acabou de criar o convite. Aqui a tela tem UM
           assunto: o link. Números zerados e atalhos repetidos só ocupavam
           espaço dizendo "nada". */
        <div className="mt-7 flex flex-col gap-4">
          <div className={`${CARD} px-5 py-9 text-center sm:px-8`}>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-scv-lilac text-scv-violet">
              <i className="bi bi-send text-[22px]" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-[21px] font-semibold text-scv-ink">
              Comece compartilhando o link
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] leading-relaxed text-scv-muted">
              Mande o convite no WhatsApp. Quem abrir confirma presença sozinho, com
              acompanhantes e recado — e aparece nesta lista na hora.
            </p>
            <div className="mx-auto mt-5 flex max-w-[430px] flex-col items-center gap-2.5">
              <div className="w-full truncate rounded-[11px] border border-scv-line bg-scv-soft px-4 py-2.5 text-[13px] text-scv-muted">
                {host}
              </div>
              <CopiarLink
                url={url}
                idleLabel="Compartilhar com os convidados"
                className="w-full cursor-pointer rounded-[11px] bg-violeta px-5 py-3 text-[13.5px] font-semibold !text-white transition-colors duration-200 hover:brightness-110"
              />
            </div>
          </div>

          <div className={`${CARD} p-4 sm:p-5`}>
            <div className="mb-3 text-[13.5px] font-semibold text-scv-ink">
              Prefere colocar os nomes você mesmo?
            </div>
            {formAdicionar}
            <p className="mt-2.5 text-[12px] text-scv-faint">
              Vale para quem você já sabe que vai — dá para confirmar por eles depois.
            </p>
          </div>
        </div>
      ) : (
        /* ===================== COM CONVIDADOS ===================== */
        <div className="mt-7 flex flex-col gap-4">
          {/* Placar em faixa. Sem degradê: o número é o que importa, não a caixa. */}
          <div className={`${CARD} p-4 sm:p-5`}>
            <div className="grid grid-cols-3 divide-x divide-scv-line">
              {stats.map((s) => (
                <div key={s.label} className="px-2 text-center first:pl-0 last:pr-0">
                  <div className="font-display text-[30px] font-semibold leading-none text-scv-ink">
                    {s.n}
                  </div>
                  <div className="mt-1.5 text-[12px] text-scv-muted">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-scv-soft"
                role="img"
                aria-label={`${confirmados.length} de ${total} confirmaram`}
              >
                <div className="h-full rounded-full bg-teal transition-[width] duration-300" style={{ width: `${progresso}%` }} />
              </div>
              <div className="mt-2 text-[12px] text-scv-muted">
                {confirmados.length} de {total} confirmaram
              </div>
            </div>
          </div>

          {blocoLink}

          {/* A lista, com o campo de adicionar em cima dela. */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <div className="mb-3.5 flex items-center gap-2">
              <h2 className="text-[16px] font-bold tracking-[-0.01em] text-scv-ink">Na lista</h2>
              <span className="rounded-full bg-scv-lilac px-2 py-0.5 text-[11.5px] font-bold text-scv-violet">
                {total}
              </span>
            </div>

            {formAdicionar}

            <div className="mt-4 flex flex-col gap-1.5">
              {convidados.map((g) => {
                const chip = STATUS[g.status] ?? STATUS.PENDING;
                return (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 rounded-[13px] border border-scv-line bg-scv-card px-3.5 py-2.5 transition-colors duration-200 hover:border-scv-dash"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-scv-lilac text-[12px] font-bold text-scv-violet">
                      {iniciais(g.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-scv-ink">{g.name}</div>
                      {g.companions > 0 && (
                        <div className="text-[11.5px] text-scv-muted">
                          +{g.companions} acompanhante{g.companions === 1 ? "" : "s"}
                        </div>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${chip.cls}`}>
                      {chip.label}
                    </span>
                    <form action={removerConvidado} className="shrink-0">
                      <input type="hidden" name="guestId" value={g.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <button
                        type="submit"
                        aria-label={`Remover ${g.name}`}
                        className="grid size-8 cursor-pointer place-items-center rounded-[9px] text-scv-faint transition-colors duration-200 hover:bg-scv-soft hover:text-red-600"
                      >
                        <i className="bi bi-trash text-[13px]" aria-hidden />
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
