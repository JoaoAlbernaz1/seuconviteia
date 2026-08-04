// Tela "Recebimentos" (cofre do convite) — mesma família visual do editor:
// ESQUERDA um cartão de controle com a CAPA em gradiente do saldo + os números
// (recebido/taxa) + chave Pix e resgate; DIREITA o extrato de quem presenteou e
// o histórico de resgates. Server-only: ownership por `carregarEventoDono`,
// agregados/extrato via Prisma; forms nativos (salvarChavePix / resgatar).
import Link from "next/link";
import { prisma } from "@/lib/db";
import { carregarEventoDono, voltarDe } from "../_carregar";
import { salvarChavePix, resgatar } from "@/lib/cofre";
import { lerCarteira, mascararCpf } from "@/lib/carteira";
import { saldoDoEvento } from "@/lib/pagamentos/contribuicao";
import { AtivarCarteira } from "./AtivarCarteira";
import { BTN_PRIMARIO, BTN_VOLTAR, CARD, INPUT, LABEL, SUB, TITULO } from "../../_ui/estilos";

export const dynamic = "force-dynamic";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (cents: number) => brl.format(cents / 100);

const dataBR = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default async function CofrePage({
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

  const [contribs, payouts] = await Promise.all([
    prisma.giftContribution.findMany({
      where: { eventId: event.id },
      include: { giftItem: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pagas = contribs.filter((c) => c.status === "PAID");
  const recebido = pagas.reduce((s, c) => s + c.grossCents, 0);
  const taxa = pagas.reduce((s, c) => s + c.feeCents, 0);
  const saldo = saldoDoEvento(
    contribs.map((c) => ({ netCents: c.netCents, status: c.status })),
    payouts.map((p) => ({ amountCents: p.amountCents, status: p.status })),
  );
  const temChave = !!event.payoutPixKey;
  const carteira = lerCarteira(event.customization);

  return (
    <div className="mx-auto w-full max-w-[1120px] scv-fade px-4 py-9 pb-24 sm:px-7">
      {/* CABEÇALHO */}
      <div className="flex items-center gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div>
          <h1 className={TITULO}>Recebimentos</h1>
          <p className={`mt-1 ${SUB}`}>
            O que entrou pela lista de presentes e o resgate para a sua conta.
          </p>
        </div>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[358px_minmax(0,1fr)] lg:gap-7">
        {/* ================= ESQUERDA — saldo + chave + resgate ================= */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px]">
          <div className={`${CARD} overflow-hidden`}>
            {/* CAPA do saldo */}
            <div className="relative p-5">
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg,#6D28D9 0%,#9B4DCA 46%,#E27D96 100%)" }}
              />
              <i className="bi bi-piggy-bank absolute right-4 top-3.5 text-[22px] text-white/35" aria-hidden />
              <div className="relative">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/70">
                  Saldo disponível
                </div>
                <div className="mt-1 font-display text-[34px] font-semibold leading-none text-white">
                  {fmt(saldo)}
                </div>
                <div className="mt-1.5 text-[12px] text-white/75">
                  {recebido > 0 ? `de ${fmt(recebido)} recebido no total` : "assim que alguém presentear, aparece aqui"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4">
              {/* números */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[13px] bg-scv-soft p-3">
                  <p className="text-[11px] text-scv-muted">Recebido (bruto)</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-scv-ink">{fmt(recebido)}</p>
                </div>
                <div className="rounded-[13px] bg-scv-soft p-3">
                  <p className="text-[11px] text-scv-muted">Taxa (5%)</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-scv-ink">− {fmt(taxa)}</p>
                </div>
              </div>

              {carteira.ativa ? (
                <>
                  {/* carteira ATIVA — titular + chave Pix editável */}
                  <div className="rounded-[15px] border border-scv-line p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-scv-teal/10 text-scv-teal">
                        <i className="bi bi-wallet2 text-[16px]" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-scv-ink">Carteira ativa</span>
                          <i className="bi bi-patch-check-fill text-[13px] text-scv-teal" aria-hidden />
                        </div>
                        <div className="truncate text-[12px] text-scv-muted">
                          {carteira.titular}
                          {carteira.cpf ? ` · CPF ${mascararCpf(carteira.cpf)}` : ""}
                        </div>
                      </div>
                    </div>
                    <form action={salvarChavePix} className="mt-3 flex flex-col gap-3">
                      <input type="hidden" name="eventId" value={event.id} />
                      <div>
                        <label className={LABEL} htmlFor="pixKey">Chave Pix do resgate</label>
                        <input
                          id="pixKey"
                          name="pixKey"
                          defaultValue={event.payoutPixKey ?? ""}
                          placeholder="CPF, e-mail, telefone ou chave aleatória"
                          required
                          maxLength={140}
                          className={`${INPUT} text-[13.5px]`}
                        />
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="pixName">Nome do recebedor (opcional)</label>
                        <input
                          id="pixName"
                          name="pixName"
                          defaultValue={event.payoutPixName ?? ""}
                          placeholder="Como aparece na sua conta"
                          maxLength={120}
                          className={`${INPUT} text-[13.5px]`}
                        />
                      </div>
                      <button
                        type="submit"
                        className="self-start rounded-[11px] border border-scv-line bg-scv-card px-4 py-2 text-[13px] font-semibold text-scv-ink transition-colors hover:border-scv-dash hover:bg-scv-field"
                      >
                        Salvar chave
                      </button>
                    </form>
                    <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-scv-faint">
                      <i className="bi bi-shield-check" aria-hidden />
                      A chave fica só aqui, nunca aparece no site do convite.
                    </p>
                  </div>

                  {/* resgate */}
                  <form action={resgatar}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <button type="submit" disabled={saldo <= 0 || !temChave} className={`${BTN_PRIMARIO} w-full`}>
                      {saldo > 0 ? `Resgatar ${fmt(saldo)}` : "Nada para resgatar"}
                    </button>
                    <p className="mt-2 text-center text-[11.5px] text-scv-faint">
                      O valor cai na sua chave Pix (transferência simulada por enquanto).
                    </p>
                  </form>
                </>
              ) : (
                <>
                  {/* carteira INATIVA — fluxo de ativação (modelo Wedy) */}
                  <AtivarCarteira eventId={event.id} />
                  <div>
                    <button type="button" disabled className={`${BTN_PRIMARIO} w-full opacity-50`}>
                      {saldo > 0 ? `Resgatar ${fmt(saldo)}` : "Nada para resgatar"}
                    </button>
                    <p className="mt-2 text-center text-[11.5px] text-scv-faint">
                      Ative a carteira para liberar o resgate.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ================= DIREITA — extrato + resgates ================= */}
        <section className="flex flex-col gap-6">
          <div className={`${CARD} p-4 sm:p-5`}>
            <div className="mb-3.5 flex items-center gap-2">
              <h2 className="text-[16px] font-bold tracking-[-0.01em] text-scv-ink">Quem já presenteou</h2>
              <span className="rounded-full bg-scv-lilac px-2 py-0.5 text-[11.5px] font-bold text-scv-violet">
                {pagas.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {pagas.length === 0 ? (
                <div className="rounded-[14px] border border-dashed border-scv-line px-4 py-10 text-center">
                  <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-scv-lilac text-scv-violet">
                    <i className="bi bi-gift text-[20px]" aria-hidden />
                  </span>
                  <div className="text-[14px] font-semibold text-scv-ink">Ninguém presenteou ainda</div>
                  <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-scv-muted">
                    Compartilhe o link do convite — os presentes por Pix aparecem aqui.
                  </p>
                </div>
              ) : (
                pagas.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-[13px] border border-scv-line bg-scv-card px-3.5 py-2.5"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-scv-lilac text-scv-violet">
                      <i className="bi bi-heart-fill text-[13px]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-scv-ink">{c.buyerName}</p>
                      <p className="truncate text-[12px] text-scv-muted">
                        {c.giftItem.title}
                        {c.message ? ` · “${c.message}”` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[14px] font-semibold text-scv-ink">{fmt(c.grossCents)}</p>
                      <p className="text-[11px] text-scv-faint">
                        {c.paidAt ? dataBR.format(c.paidAt) : dataBR.format(c.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {payouts.length > 0 && (
            <div className={`${CARD} p-4 sm:p-5`}>
              <h2 className="mb-3.5 text-[16px] font-bold tracking-[-0.01em] text-scv-ink">Resgates</h2>
              <div className="flex flex-col gap-1.5">
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-[13px] border border-scv-line bg-scv-card px-3.5 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-[13px] text-scv-muted">
                      <i className="bi bi-arrow-up-right-circle text-scv-violet" aria-hidden />
                      {dataBR.format(p.paidAt ?? p.createdAt)} ·{" "}
                      {p.status === "PAID" ? "Pago" : p.status === "PENDING" ? "Processando" : "Falhou"}
                    </span>
                    <span className="text-[14px] font-semibold text-scv-ink">− {fmt(p.amountCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
