// Tela "Recebimentos" (cofre do convite).
//
// A tela é UMA COLUNA e muda de assunto conforme o estado — porque o estado é
// que decide o que a pessoa precisa fazer:
//   1. carteira desligada  -> o assunto é ATIVAR (com ou sem dinheiro parado);
//   2. carteira ligada, sem dinheiro -> o assunto é COMPARTILHAR o convite;
//   3. carteira ligada, com dinheiro -> o assunto é RESGATAR.
//
// O desenho anterior mostrava tudo ao mesmo tempo em duas colunas, com o maior
// elemento da tela sendo "R$ 0,00" — o número que significa "nada" — enquanto a
// ação que importava ficava enterrada num cartão abaixo.
//
// Server-only: ownership por `carregarEventoDono`, agregados/extrato via
// Prisma; forms nativos (salvarChavePix / resgatar).
import Link from "next/link";
import { prisma } from "@/lib/db";
import { carregarEventoDono, hostDoEvento, urlDoEvento, voltarDe } from "../_carregar";
import { salvarChavePix, resgatar } from "@/lib/cofre";
import { getPaymentProvider } from "@/lib/pagamentos";
import { repasseEhAutomatico, rotuloDoRepasse } from "@/lib/repasse";
import { lerCarteira, mascararCpf } from "@/lib/carteira";
import { saldoDoEvento } from "@/lib/pagamentos/contribuicao";
import { AtivarCarteira } from "./AtivarCarteira";
import { BTN_PRIMARIO, BTN_VOLTAR, CARD, INPUT, LABEL, SUB, TITULO } from "../../_ui/estilos";
import { taxaLabel } from "@/lib/pagamentos/taxa";

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

  const host = hostDoEvento(event.subdomain);
  const url = urlDoEvento(event.subdomain);
  // Um pedido em aberto POR VEZ: a action recusa o segundo (dois pedidos vivos
  // da mesma conta é o jeito mais fácil de pagar a mesma pessoa duas vezes), e
  // um botão que aceita clique para depois não fazer nada é pior do que um
  // botão desligado com o motivo escrito ao lado.
  const pedidoEmAberto = payouts.some((p) => p.status === "PENDING");
  // Com Mercado Pago não existe API de saída: o resgate vira um pedido que uma
  // pessoa liquida. A tela precisa dizer isso — ver `lib/repasse.ts`.
  const repasseAutomatico = repasseEhAutomatico(getPaymentProvider());
  const podeResgatar = carteira.ativa && saldo > 0 && temChave && !pedidoEmAberto;

  /** Extrato de quem presenteou. Aparece em qualquer estado que já tenha gente. */
  const extrato = (
    <div className={`${CARD} p-4 sm:p-5`}>
      <div className="mb-3.5 flex items-center gap-2">
        <h2 className="text-[16px] font-bold tracking-[-0.01em] text-scv-ink">Quem já presenteou</h2>
        <span className="rounded-full bg-scv-lilac px-2 py-0.5 text-[11.5px] font-bold text-scv-violet">
          {pagas.length}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {pagas.map((c) => (
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
        ))}
      </div>
    </div>
  );

  /** Onde o dinheiro cai. Só faz sentido com a carteira ligada. */
  const chavePix = (
    <div className={`${CARD} p-4 sm:p-5`}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-scv-teal/10 text-scv-teal">
          <i className="bi bi-wallet2 text-[16px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-scv-ink">Carteira ativa</span>
            <i className="bi bi-patch-check-fill text-[13px] text-scv-teal" aria-hidden />
          </div>
          <div className="truncate text-[12.5px] text-scv-muted">
            {carteira.titular}
            {carteira.cpf ? ` · CPF ${mascararCpf(carteira.cpf)}` : ""}
          </div>
        </div>
      </div>
      <form action={salvarChavePix} className="mt-4 grid gap-3 sm:grid-cols-2">
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
        <div className="sm:col-span-2 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="flex items-center gap-1.5 text-[11.5px] text-scv-faint">
            <i className="bi bi-shield-check" aria-hidden />
            A chave fica só aqui, nunca aparece no site do convite.
          </p>
          <button
            type="submit"
            className="mt-3 cursor-pointer rounded-[11px] border border-scv-line bg-scv-card px-4 py-2 text-[13px] font-semibold text-scv-ink transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field sm:mt-0"
          >
            Salvar chave
          </button>
        </div>
      </form>
    </div>
  );

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

      <div className="mt-7 flex flex-col gap-4">
        {!carteira.ativa ? (
          /* ============ 1. CARTEIRA DESLIGADA — o assunto é ativar ============ */
          <>
            <div className={`${CARD} px-5 py-9 text-center sm:px-8`}>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-scv-lilac text-scv-violet">
                <i className="bi bi-wallet2 text-[22px]" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-[21px] font-semibold text-scv-ink">
                {saldo > 0
                  ? `Você tem ${fmt(saldo)} esperando`
                  : "Ative a carteira para receber os presentes"}
              </h2>
              <p className="mx-auto mt-2 max-w-[460px] text-[13.5px] leading-relaxed text-scv-muted">
                {saldo > 0
                  ? "O dinheiro já entrou pela lista de presentes. Ative a carteira para trazer para a sua conta — leva menos de 2 minutos."
                  : "Os presentes em dinheiro são pagos por Pix dentro do convite e ficam guardados aqui. A ativação leva menos de 2 minutos e libera o resgate."}
              </p>
              <div className="mx-auto mt-5 max-w-[430px]">
                <AtivarCarteira eventId={event.id} apenasBotao />
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-scv-faint">
                <i className="bi bi-shield-check" aria-hidden />
                Seus dados ficam só aqui, nunca aparecem no site do convite.
              </p>
            </div>
            {pagas.length > 0 && extrato}
          </>
        ) : (
          /* ============ 2 e 3. CARTEIRA LIGADA ============ */
          <>
            <div className={`${CARD} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-scv-faint">
                    Saldo disponível
                  </div>
                  <div className="mt-1.5 font-display text-[38px] font-semibold leading-none text-scv-ink">
                    {fmt(saldo)}
                  </div>
                  <div className="mt-2 text-[12.5px] text-scv-muted">
                    {recebido > 0
                      ? `${fmt(recebido)} recebido · ${fmt(taxa)} de taxa (${taxaLabel(event.professional.plan)})`
                      : "Assim que alguém presentear, o valor aparece aqui."}
                  </div>
                </div>
                <form action={resgatar} className="w-full sm:w-auto">
                  <input type="hidden" name="eventId" value={event.id} />
                  <button
                    type="submit"
                    disabled={!podeResgatar}
                    className={`${BTN_PRIMARIO} w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto`}
                  >
                    {pedidoEmAberto
                      ? "Resgate pedido"
                      : saldo > 0
                        ? `Resgatar ${fmt(saldo)}`
                        : "Nada para resgatar"}
                  </button>
                  {pedidoEmAberto ? (
                    <p className="mt-2 text-[11.5px] text-scv-muted">
                      {repasseAutomatico
                        ? "Seu resgate está sendo processado."
                        : "Seu pedido está na fila — o valor cai na sua chave Pix em até 1 dia útil."}
                    </p>
                  ) : saldo > 0 && !temChave ? (
                    <p className="mt-2 text-[11.5px] text-scv-warn-ink">
                      Informe a chave Pix aqui embaixo para liberar o resgate.
                    </p>
                  ) : null}
                </form>
              </div>
            </div>

            {/* Sem dinheiro e sem ninguém: o caminho é o link, não esta tela. */}
            {pagas.length === 0 ? (
              <div className={`${CARD} px-5 py-8 text-center sm:px-8`}>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-scv-lilac text-scv-violet">
                  <i className="bi bi-gift text-[19px]" aria-hidden />
                </span>
                <div className="mt-3.5 text-[15px] font-semibold text-scv-ink">Ninguém presenteou ainda</div>
                <p className="mx-auto mt-1.5 max-w-[420px] text-[13px] leading-relaxed text-scv-muted">
                  Os presentes em dinheiro entram pelo convite. Compartilhe o link e o
                  primeiro Pix aparece aqui.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-[11px] border border-scv-line bg-scv-card px-4 py-2.5 text-[13px] font-semibold text-scv-ink transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field"
                >
                  Ver a lista no convite <span className="text-scv-faint">{host}</span>
                </a>
              </div>
            ) : (
              extrato
            )}

            {chavePix}

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
                        {rotuloDoRepasse(p.status, repasseAutomatico)}
                      </span>
                      <span className="text-[14px] font-semibold text-scv-ink">− {fmt(p.amountCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
