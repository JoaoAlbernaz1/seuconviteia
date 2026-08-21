// FILA DE REPASSES — a tela do operador da plataforma (não a do dono do convite).
//
// Existe porque o Mercado Pago não tem API de saída para a chave Pix de um
// terceiro: o dinheiro dos presentes entra na conta da plataforma e sai daqui,
// na mão. O dono pede o resgate no cofre dele (o valor já sai do saldo na hora),
// e esta tela é onde alguém paga e diz que pagou.
//
// `notFound()` em vez de "acesso negado": para quem não é operador esta rota não
// deve nem existir — é a única do sistema que mostra dinheiro de todos os
// convites, e uma mensagem de negado confirma que a fila está ali.
//
// Sem `ADMIN_EMAILS` configurado, ninguém entra (ver `ehAdminDeRepasse`).
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ehAdminDeRepasse } from "@/lib/repasse";
import { CARD, COLUNA, TITULO, SUB } from "../_ui/estilos";
import { CopiarChave } from "./CopiarChave";
import { marcarRepassePago, recusarRepasse } from "./acoes";

export const dynamic = "force-dynamic";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (cents: number) => brl.format(cents / 100);
const quando = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const SELECAO = {
  id: true,
  amountCents: true,
  pixKey: true,
  pixName: true,
  status: true,
  createdAt: true,
  paidAt: true,
  event: {
    select: {
      title: true,
      subdomain: true,
      professional: { select: { name: true, email: true } },
    },
  },
} as const;

export default async function RepassesPage() {
  const session = await auth();
  if (!ehAdminDeRepasse(session?.user?.email)) notFound();

  const [naFila, liquidados] = await Promise.all([
    prisma.payout.findMany({
      where: { status: "PENDING" },
      select: SELECAO,
      orderBy: { createdAt: "asc" }, // quem pediu primeiro recebe primeiro
    }),
    prisma.payout.findMany({
      where: { status: { in: ["PAID", "FAILED"] } },
      select: SELECAO,
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const total = naFila.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-24`}>
      <h1 className={TITULO}>Repasses</h1>
      <p className={`${SUB} mt-1.5`}>
        Resgates pedidos pelos donos dos convites. Pague pelo app do banco e marque aqui.
      </p>

      {naFila.length === 0 ? (
        <div className={`${CARD} mt-6 px-5 py-10 text-center`}>
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-scv-lilac text-scv-violet">
            <i className="bi bi-check2-all text-[19px]" aria-hidden />
          </span>
          <div className="mt-3.5 text-[15px] font-semibold text-scv-ink">Nada na fila</div>
          <p className="mx-auto mt-1.5 max-w-[420px] text-[13px] leading-relaxed text-scv-muted">
            Quando alguém pedir resgate, o pedido aparece aqui com a chave Pix e o valor.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-[13px] font-semibold text-scv-muted">
              {naFila.length === 1 ? "1 pedido esperando" : `${naFila.length} pedidos esperando`}
            </span>
            <span className="text-[13px] text-scv-faint">· total {fmt(total)}</span>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {naFila.map((p) => (
              <div key={p.id} className={`${CARD} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-scv-ink">
                      {p.pixName || p.event.professional.name}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-scv-muted">
                      {p.event.title} · {p.event.subdomain}
                    </div>
                    <div className="text-[12px] text-scv-faint">
                      {p.event.professional.email} · pedido em {quando.format(p.createdAt)}
                    </div>
                  </div>
                  <div className="font-display text-[24px] font-semibold leading-none text-scv-ink">
                    {fmt(p.amountCents)}
                  </div>
                </div>

                <div className="mt-3.5">
                  <CopiarChave chave={p.pixKey} />
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <form action={marcarRepassePago}>
                    <input type="hidden" name="payoutId" value={p.id} />
                    <button
                      type="submit"
                      className="min-h-[44px] cursor-pointer rounded-xl bg-violeta px-5 text-[13.5px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(109,40,217,0.45)] transition-[filter] duration-200 hover:brightness-110"
                    >
                      Paguei — marcar como pago
                    </button>
                  </form>
                  <form action={recusarRepasse}>
                    <input type="hidden" name="payoutId" value={p.id} />
                    {/* Recusar DEVOLVE o valor ao saldo do dono (o saldo só
                        desconta PAID e PENDING) e libera um novo pedido — é o
                        caminho de quando a chave está errada. */}
                    <button
                      type="submit"
                      className="min-h-[44px] cursor-pointer rounded-xl border border-scv-line bg-scv-card px-5 text-[13.5px] font-semibold text-scv-muted transition-colors hover:bg-scv-field hover:text-scv-ink"
                    >
                      Não consegui pagar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {liquidados.length > 0 && (
        <div className={`${CARD} mt-7 p-4 sm:p-5`}>
          <h2 className="mb-3 text-[16px] font-bold tracking-[-0.01em] text-scv-ink">
            Últimos liquidados
          </h2>
          <div className="flex flex-col gap-1.5">
            {liquidados.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[13px] border border-scv-line px-3.5 py-2.5"
              >
                <span className="min-w-0 text-[13px] text-scv-muted">
                  <i
                    className={`bi ${p.status === "PAID" ? "bi-check2-circle text-scv-violet" : "bi-x-circle text-scv-faint"} mr-1.5`}
                    aria-hidden
                  />
                  {quando.format(p.paidAt ?? p.createdAt)} · {p.event.title} ·{" "}
                  {p.status === "PAID" ? "pago" : "não saiu"}
                </span>
                <span className="text-[14px] font-semibold text-scv-ink">
                  {fmt(p.amountCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
