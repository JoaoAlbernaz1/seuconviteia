// `/assinar/<plano>` — o checkout NOSSO, a porta que a landing usa.
//
// Aqui a pessoa ve o que esta levando, quanto vai pagar e QUANDO, e informa os
// dados de cobranca. O Mercado Pago entra so no fim, para o cartao. Antes esta
// rota redirecionava direto para o gateway: a primeira coisa que a pessoa via
// ao decidir pagar era uma tela cinza com duas opcoes e nenhum detalhe.
//
// Quem ainda nao tem conta passa pelo cadastro e volta para ca sozinho.
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { planoPago } from "@/lib/assinarFluxo";
import { DIAS_TESTE_GRATIS, primeiraCobrancaEm } from "@/lib/pagamentos/assinatura";
import { formatarDocumento, formatarTelefone } from "@/lib/documento";
import { PLANOS_INFO } from "@/lib/plans";
import { COLUNA, SUB, TITULO } from "../../painel/_ui/estilos";
import { FormCheckout } from "./FormCheckout";

export const dynamic = "force-dynamic";

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "America/Sao_Paulo",
});

export default async function AssinarPage({ params }: { params: Promise<{ plano: string }> }) {
  const { plano: bruto } = await params;
  const plano = planoPago(bruto.toUpperCase());
  // Plano que nao existe (ou o Basico, que e gratis): manda ver os planos.
  if (!plano) redirect("/painel/plano");

  const session = await auth();
  // Guarda a escolha na URL: depois de criar a conta a pessoa volta para ca.
  if (!session?.user) redirect(`/entrar?criar=1&plano=${plano.toLowerCase()}`);

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      telefone: true,
      documento: true,
      mpPreapprovalId: true,
    },
  });
  if (!prof) redirect("/entrar");

  const info = PLANOS_INFO.find((p) => p.key === plano)!;
  // Teste gratis vale uma vez por conta (ver `iniciarAssinatura`).
  const comTeste = !prof.mpPreapprovalId;
  const primeiraCobranca = primeiraCobrancaEm(comTeste);
  const preco = (info.mensalidadeCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className={`${COLUNA} scv-fade py-11 pb-20`}>
      {/* Checkout sem menu, de proposito (menos saida = mais conversao), mas
          com uma volta clara — beco sem saida assusta mais do que distrai. */}
      <Link
        href="/painel/plano"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-scv-muted transition hover:text-scv-ink"
      >
        <i className="bi bi-arrow-left" aria-hidden /> Ver todos os planos
      </Link>
      <h1 className={`${TITULO} text-[30px]`}>Finalizar assinatura</h1>
      <p className={`mt-2 ${SUB}`}>
        {comTeste
          ? `Você não paga nada hoje. Os primeiros ${DIAS_TESTE_GRATIS} dias são grátis.`
          : "Confirme seus dados para concluir a assinatura."}
      </p>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* ESQUERDA — dados de cobrança */}
        <div className="rounded-[18px] border border-scv-line bg-scv-card p-6">
          <h2 className="mb-5 font-display text-[18px] font-semibold text-scv-ink">
            Dados de cobrança
          </h2>
          <FormCheckout
            plano={plano}
            nome={prof.name}
            email={prof.email}
            telefone={prof.telefone ? formatarTelefone(prof.telefone) : ""}
            documento={prof.documento ? formatarDocumento(prof.documento) : ""}
          />
        </div>

        {/* DIREITA — resumo do pedido */}
        <aside className="rounded-[18px] border-2 border-violeta bg-scv-card p-6 shadow-[0_22px_44px_-28px_rgba(109,40,217,0.55)]">
          <h2 className="font-display text-[18px] font-semibold text-scv-ink">Resumo do pedido</h2>

          <div className="mt-4 flex items-baseline justify-between border-b border-scv-line pb-4">
            <div>
              <div className="font-display text-[20px] font-semibold text-scv-ink">
                Plano {info.label}
              </div>
              <div className="text-[12.5px] text-scv-muted">{info.paraQuem}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-[22px] font-semibold text-scv-ink">{preco}</div>
              <div className="text-[11.5px] text-scv-faint">por mês</div>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {info.inclui.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] text-scv-text2">
                <i className="bi bi-check-lg font-bold text-scv-teal" aria-hidden />
                {/* Quem chega da landing nunca viu o Básico — a referência a ele
                    não diz nada aqui. */}
                {item === "Tudo do Básico" ? "Convite digital completo" : item}
              </li>
            ))}
          </ul>

          {/* O que a pessoa mais quer saber antes de dar o cartão: quanto sai
              HOJE e quando começa a cobrar. */}
          <div className="mt-5 rounded-[12px] bg-scv-soft p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-semibold text-scv-ink">Total hoje</span>
              <span className="font-display text-[22px] font-semibold text-scv-teal">
                {comTeste ? "R$ 0,00" : preco}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-scv-muted">
              {comTeste ? (
                <>
                  Primeira cobrança em{" "}
                  <strong className="font-semibold text-scv-ink">
                    {DATA_LONGA.format(primeiraCobranca)}
                  </strong>
                  , de {preco} por mês. Cancele antes dessa data no painel e não pagará nada.
                </>
              ) : (
                <>
                  Renova todo mês, {preco}. Cancele quando quiser — você continua com o plano
                  até o fim do período já pago.
                </>
              )}
            </p>
          </div>

          <p className="mt-4 text-[11.5px] leading-relaxed text-scv-faint">
            {info.taxaLinha} · Pagamento processado pelo Mercado Pago.
          </p>
        </aside>
      </div>
    </div>
  );
}
