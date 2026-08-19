// Seu plano (mockup DARK): 3 cards — o atual em destaque teal, o popular em
// violeta. Preços vêm de lib/plans (PLANOS_INFO.preco).
//
// SUBIR de plano abre o checkout do Mercado Pago (`assinarPlano`); DESCER é
// cancelamento e segue direto (`trocarPlano`). O plano mostrado como "seu" é o
// EFETIVO: vencida a assinatura, a conta aparece no Básico mesmo com PREMIUM
// gravado na linha.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { planoEfetivo, PLANOS_INFO, rotuloPlano, SELECT_ASSINATURA } from "@/lib/plans";
import { DIAS_TESTE_GRATIS } from "@/lib/pagamentos/assinatura";
import { assinarPlano, trocarPlano } from "../../actions";
import { BTN_PRIMARIO, COLUNA, SUB, TITULO } from "../_ui/estilos";

export const dynamic = "force-dynamic";

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ assinatura?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const [prof, { assinatura }] = await Promise.all([
    prisma.professional.findUnique({
      where: { id: session.user.id },
      select: { ...SELECT_ASSINATURA, mpPreapprovalId: true },
    }),
    searchParams,
  ]);
  // O teste grátis vale UMA vez por conta: quem já assinou alguma vez (mesmo
  // tendo cancelado) paga desde o primeiro dia.
  const podeTestar = !prof?.mpPreapprovalId;
  const agora = new Date();
  const atual = prof ? planoEfetivo(prof, agora) : "BASICO";
  // Estado da assinatura em uma linha — sem isso, quem cancela não vê nada
  // mudar na tela (o plano continua até vencer, de propósito) e acha quebrado.
  const venceEm =
    prof?.assinaturaAte && prof.assinaturaAte > agora
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(
          prof.assinaturaAte,
        )
      : null;
  const aviso =
    prof?.assinaturaStatus === "cancelled" && venceEm
      ? `Assinatura cancelada — você continua no ${rotuloPlano(atual)} até ${venceEm}.`
      : prof?.assinaturaStatus === "pending" && !venceEm
        ? "Assinatura criada. O plano libera assim que o Mercado Pago confirmar o pagamento."
        : venceEm
          ? `Assinatura ativa — próxima cobrança em ${venceEm}.`
          : null;

  return (
    <div className={`${COLUNA} scv-fade py-11 pb-20`}>
      <h1 className={`${TITULO} text-[30px]`}>Seu plano</h1>
      <p className={`mt-2 ${SUB}`}>
        Uma assinatura, eventos sem limite. Troque quando quiser — hoje você está
        no <strong className="font-semibold text-scv-ink">{rotuloPlano(atual)}</strong>.
      </p>

      {aviso ? <p className={`mt-1.5 ${SUB}`}>{aviso}</p> : null}

      {assinatura === "ok" ? (
        <p className="mt-5 rounded-[12px] border border-teal/25 bg-teal/5 px-4 py-3 text-[13px] text-scv-text2">
          <i className="bi bi-check-circle-fill mr-2 text-scv-teal" aria-hidden />
          Recebemos sua assinatura. O plano libera assim que o Mercado Pago
          confirmar o pagamento — pode levar alguns minutos.
        </p>
      ) : assinatura === "erro" ? (
        <p className="mt-5 rounded-[12px] border border-scv-line bg-scv-card px-4 py-3 text-[13px] text-scv-text2">
          <i className="bi bi-exclamation-circle mr-2 text-scv-violet" aria-hidden />
          Não conseguimos abrir o checkout agora. Tente de novo em instantes — nada
          foi cobrado.
        </p>
      ) : assinatura === "erro-cancelar" ? (
        <p className="mt-5 rounded-[12px] border border-scv-line bg-scv-card px-4 py-3 text-[13px] text-scv-text2">
          <i className="bi bi-exclamation-circle mr-2 text-scv-violet" aria-hidden />
          Não conseguimos cancelar no Mercado Pago agora, então nada foi alterado
          aqui — sua assinatura continua como estava. Tente de novo em instantes.
        </p>
      ) : null}

      <div className="mt-7 grid items-stretch gap-4 md:grid-cols-3">
        {PLANOS_INFO.map((p) => {
          const ehAtual = p.key === atual;
          const borda = ehAtual
            ? "border-2 border-teal"
            : p.destaque
              ? "border-2 border-violeta shadow-[0_22px_44px_-28px_rgba(109,40,217,0.55)]"
              : "border border-scv-line";
          return (
            <div key={p.key} className={`flex flex-col rounded-[18px] bg-scv-card p-6 ${borda}`}>
              {ehAtual ? (
                <span className="self-start rounded-full bg-teal/10 px-3 py-1 text-[10.5px] font-bold text-scv-teal-ink">
                  Seu plano <i className="bi bi-check-lg" aria-hidden />
                </span>
              ) : p.destaque ? (
                <span className="self-start rounded-full bg-scv-lilac px-3 py-1 text-[10.5px] font-bold text-scv-violet">
                  Mais popular
                </span>
              ) : (
                <span className="self-start rounded-full bg-scv-teal/10 px-3 py-1 text-[10.5px] font-bold text-scv-teal-ink">
                  Para profissionais
                </span>
              )}

              <h2 className="mt-3.5 font-display text-[21px] font-semibold text-scv-ink">
                {p.label}
              </h2>
              {p.preco ? (
                <div
                  className={`mt-2 font-display text-[32px] font-semibold ${
                    p.destaque ? "text-scv-violet" : "text-scv-ink"
                  }`}
                >
                  {p.preco}
                  <span className="font-sans text-[13px] font-medium text-scv-faint">/mês</span>
                </div>
              ) : (
                <div className="mt-2 font-display text-[19px] font-semibold text-scv-muted">
                  Grátis
                </div>
              )}

              <ul className="mt-4 flex flex-1 flex-col gap-2.5">
                {p.inclui.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13px] text-scv-text2">
                    <i
                      className={`bi bi-check-lg font-bold ${
                        p.destaque ? "text-scv-violet" : "text-scv-teal"
                      }`}
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>

              {!ehAtual ? (
                // Ir para o Básico é CANCELAR a assinatura (para de cobrar no
                // MP); qualquer plano pago é assinar — inclusive trocar de um
                // pago para outro, que é uma assinatura nova no novo preço.
                <form action={p.key === "BASICO" ? trocarPlano : assinarPlano} className="mt-5">
                  <input type="hidden" name="plan" value={p.key} />
                  <button
                    type="submit"
                    className={
                      p.destaque
                        ? `${BTN_PRIMARIO} w-full py-3 text-[13.5px]`
                        : "w-full rounded-[11px] bg-scv-btn py-3 text-[13.5px] font-semibold text-scv-btn-ink transition hover:opacity-90"
                    }
                  >
                    {p.key === "BASICO"
                      ? "Cancelar assinatura"
                      : podeTestar
                        ? `Testar ${DIAS_TESTE_GRATIS} dias grátis`
                        : "Assinar"}
                  </button>
                </form>
              ) : (
                <div className="mt-5 rounded-[11px] border border-teal/25 py-3 text-center text-[13px] font-semibold text-scv-teal">
                  Ativo agora
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-scv-faint">
        {podeTestar
          ? `Os ${DIAS_TESTE_GRATIS} primeiros dias são grátis: o cartão é cadastrado agora e a primeira cobrança só acontece depois desse prazo. `
          : ""}
        Assinatura mensal no cartão, cobrada pelo Mercado Pago — o cartão é
        digitado lá, nunca aqui. Você pode cancelar quando quiser e continua com
        o plano até o fim do período já pago. O plano vale para todos os seus eventos.
      </p>
    </div>
  );
}
