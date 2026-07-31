// Tela "Recebimentos" (cofre do convite) — mostra o quanto entrou pela lista de
// presentes (Pix via plataforma), a taxa retida, o saldo disponível, o extrato de
// quem presenteou e o resgate (com a chave Pix do dono). Server-only: ownership por
// `carregarEventoDono` (404 se não for), agregados e extrato via Prisma.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { carregarEventoDono, voltarDe } from "../_carregar";
import { salvarChavePix, resgatar } from "@/lib/cofre";
import { saldoDoEvento } from "@/lib/pagamentos/contribuicao";
import {
  BTN_PRIMARIO,
  BTN_VOLTAR,
  CARD,
  COLUNA_ESTREITA,
  INPUT,
  LABEL,
  SUB,
  TITULO,
} from "../../_ui/estilos";

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

  return (
    <div className={`${COLUNA_ESTREITA} scv-fade py-9 pb-20`}>
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

      {/* ── Saldo em destaque ── */}
      <div className={`${CARD} mt-8 p-6`}>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-scv-muted">
          Saldo disponível
        </p>
        <p className="mt-1 font-display text-[40px] font-semibold leading-none text-scv-ink">
          {fmt(saldo)}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-scv-line bg-scv-soft/40 px-4 py-3">
            <p className="text-[12px] text-scv-muted">Recebido (bruto)</p>
            <p className="mt-0.5 text-[17px] font-semibold text-scv-ink">{fmt(recebido)}</p>
          </div>
          <div className="rounded-xl border border-scv-line bg-scv-soft/40 px-4 py-3">
            <p className="text-[12px] text-scv-muted">Taxa da plataforma (5%)</p>
            <p className="mt-0.5 text-[17px] font-semibold text-scv-ink">− {fmt(taxa)}</p>
          </div>
        </div>
      </div>

      {/* ── Chave Pix + resgate ── */}
      <div className={`${CARD} mt-5 p-6`}>
        <h2 className="text-[15px] font-semibold text-scv-ink">Onde você recebe</h2>
        <p className={`mt-1 ${SUB}`}>
          Sua chave Pix fica só aqui — nunca aparece no site do convite.
        </p>

        <form action={salvarChavePix} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="eventId" value={event.id} />
          <div>
            <label className={LABEL} htmlFor="pixKey">Chave Pix</label>
            <input
              id="pixKey"
              name="pixKey"
              defaultValue={event.payoutPixKey ?? ""}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              required
              maxLength={140}
              className={INPUT}
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
              className={INPUT}
            />
          </div>
          <button type="submit" className="self-start rounded-xl border border-scv-line bg-scv-card px-5 py-2.5 text-[13.5px] font-semibold text-scv-ink transition-colors hover:border-scv-dash hover:bg-scv-field">
            Salvar chave
          </button>
        </form>

        <form action={resgatar} className="mt-5 border-t border-scv-line pt-5">
          <input type="hidden" name="eventId" value={event.id} />
          <button
            type="submit"
            disabled={saldo <= 0 || !temChave}
            className={`${BTN_PRIMARIO} w-full`}
          >
            {saldo > 0 ? `Resgatar ${fmt(saldo)}` : "Nada para resgatar"}
          </button>
          <p className="mt-2 text-center text-[12px] text-scv-faint">
            {temChave
              ? "O valor cai na sua chave Pix (transferência simulada por enquanto)."
              : "Cadastre uma chave Pix acima para poder resgatar."}
          </p>
        </form>
      </div>

      {/* ── Extrato de quem presenteou ── */}
      <div className={`${CARD} mt-5 p-6`}>
        <h2 className="text-[15px] font-semibold text-scv-ink">Quem já presenteou</h2>
        <ul className="mt-4 flex flex-col gap-1.5">
          {pagas.length === 0 ? (
            <li className="rounded-xl border border-dashed border-scv-line px-4 py-8 text-center text-[13px] text-scv-muted">
              Ninguém presenteou ainda. Compartilhe o link do convite 💝
            </li>
          ) : (
            pagas.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-scv-line bg-scv-soft/40 px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-scv-ink">{c.buyerName}</p>
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
              </li>
            ))
          )}
        </ul>
      </div>

      {/* ── Histórico de resgates ── */}
      {payouts.length > 0 && (
        <div className={`${CARD} mt-5 p-6`}>
          <h2 className="text-[15px] font-semibold text-scv-ink">Resgates</h2>
          <ul className="mt-4 flex flex-col gap-1.5">
            {payouts.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-scv-line bg-scv-soft/40 px-3.5 py-2.5"
              >
                <span className="text-[13px] text-scv-muted">
                  {dataBR.format(p.paidAt ?? p.createdAt)} · {p.status === "PAID" ? "Pago" : p.status === "PENDING" ? "Processando" : "Falhou"}
                </span>
                <span className="text-[14px] font-semibold text-scv-ink">− {fmt(p.amountCents)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
