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

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmou", cls: "bg-scv-teal/10 text-scv-teal" },
  PENDING: { label: "Aguardando", cls: "bg-scv-warn-bg text-scv-warn-ink" },
  DECLINED: { label: "Não vai", cls: "bg-scv-soft text-scv-faint" },
};

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

  const total = convidados.length;
  const confirmados = convidados.filter((g) => g.status === "CONFIRMED");
  const aguardando = convidados.filter((g) => g.status === "PENDING").length;
  const acompanhantes = confirmados.reduce((s, g) => s + (g.companions ?? 0), 0);

  const stats = [
    { n: confirmados.length, label: "Confirmaram" },
    { n: aguardando, label: "Aguardando" },
    { n: acompanhantes, label: "Acompanhantes" },
  ];

  const tileForte =
    "flex flex-col items-start gap-2 rounded-[15px] p-3.5 text-left transition-colors";

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
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-[11px] border border-scv-line bg-scv-card px-4 py-2.5 text-[13px] font-semibold text-scv-ink transition-colors hover:border-scv-dash hover:bg-scv-field sm:inline-flex"
        >
          Ver no site <i className="bi bi-box-arrow-up-right text-[12px]" aria-hidden />
        </a>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[358px_minmax(0,1fr)] lg:gap-7">
        {/* ================= ESQUERDA — resumo + atalhos ================= */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px]">
          <div className={`${CARD} overflow-hidden`}>
            {/* Header com o placar */}
            <div className="relative p-5">
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg,#6D28D9 0%,#9B4DCA 46%,#E27D96 100%)" }}
              />
              <i className="bi bi-people absolute right-4 top-3.5 text-[22px] text-white/35" aria-hidden />
              <div className="relative">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/70">
                  Sua lista de convidados
                </div>
                <div className="mt-1.5 font-display text-[26px] font-semibold leading-tight text-white">
                  {total === 0
                    ? "Ninguém ainda"
                    : `${confirmados.length} de ${total} confirmaram`}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4">
              {/* Placar */}
              <div className="grid grid-cols-3 gap-2.5">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-[13px] bg-scv-soft p-3 text-center">
                    <div className="font-display text-[22px] font-semibold text-scv-ink">{s.n}</div>
                    <div className="mt-0.5 text-[11px] leading-tight text-scv-muted">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Atalhos */}
              <div className="grid grid-cols-2 gap-2.5">
                <a href="#add-convidado" className={`${tileForte} bg-violeta text-white hover:brightness-110`}>
                  <i className="bi bi-person-plus text-[18px]" aria-hidden />
                  <span className="text-[12px] font-semibold leading-tight">Adicionar<br />convidado</span>
                </a>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={`${tileForte} bg-scv-soft text-scv-ink hover:bg-scv-field`}
                >
                  <i className="bi bi-eye text-[18px] text-scv-violet" aria-hidden />
                  <span className="text-[12px] font-semibold leading-tight">Ver página<br />de confirmação</span>
                </a>
              </div>

              {/* Compartilhar link (ação principal do RSVP) */}
              <div className="rounded-[15px] border border-scv-line p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-scv-lilac text-scv-violet">
                    <i className="bi bi-link-45deg text-[17px]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-scv-ink">Link de confirmação</div>
                    <div className="truncate text-[12px] text-scv-muted">{host}</div>
                  </div>
                </div>
                <CopiarLink
                  url={url}
                  idleLabel="Compartilhar com os convidados"
                  className="mt-3 w-full cursor-pointer rounded-[11px] bg-violeta px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
                />
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-scv-faint">
                  <i className="bi bi-info-circle" aria-hidden />
                  Quem abrir o site confirma presença sozinho — aparece aqui na hora.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= DIREITA — a lista ================= */}
        <section className={`${CARD} p-4 sm:p-5`} id="add-convidado">
          <div className="mb-3.5 flex items-center gap-2">
            <h2 className="text-[16px] font-bold tracking-[-0.01em] text-scv-ink">Convidados</h2>
            <span className="rounded-full bg-scv-lilac px-2 py-0.5 text-[11.5px] font-bold text-scv-violet">
              {total}
            </span>
          </div>

          {/* Adicionar */}
          <form action={adicionarConvidado} className="flex items-center gap-2.5">
            <input type="hidden" name="eventId" value={event.id} />
            <input
              name="name"
              placeholder="Nome do convidado"
              required
              maxLength={140}
              className={`${INPUT} flex-1`}
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[11px] bg-violeta px-4 py-3 text-[13.5px] font-semibold text-white transition hover:brightness-110"
            >
              <i className="bi bi-plus-lg" aria-hidden /> Adicionar
            </button>
          </form>

          {/* Lista */}
          <div className="mt-4 flex flex-col gap-1.5">
            {total === 0 ? (
              <div className="rounded-[14px] border border-dashed border-scv-line px-4 py-10 text-center">
                <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-scv-lilac text-scv-violet">
                  <i className="bi bi-people text-[20px]" aria-hidden />
                </span>
                <div className="text-[14px] font-semibold text-scv-ink">Ninguém na lista ainda</div>
                <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-scv-muted">
                  Adicione o primeiro nome aí em cima — ou compartilhe o link e deixe os convidados confirmarem.
                </p>
              </div>
            ) : (
              convidados.map((g) => {
                const chip = STATUS[g.status] ?? STATUS.PENDING;
                return (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 rounded-[13px] border border-scv-line bg-scv-card px-3.5 py-2.5 transition-colors hover:border-scv-dash"
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
                        className="grid size-8 place-items-center rounded-[9px] text-scv-faint transition hover:bg-scv-soft hover:text-red-600"
                      >
                        <i className="bi bi-trash text-[13px]" aria-hidden />
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
