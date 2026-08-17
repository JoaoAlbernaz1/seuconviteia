// `/assinar/<plano>` — a porta que a landing usa: clicou no plano, vai para o
// checkout do Mercado Pago.
//
// Quem ainda nao tem conta passa pelo cadastro ANTES (o checkout precisa de um
// e-mail e de uma conta a que amarrar a assinatura) e volta para ca logo depois
// de criar a conta — e o mesmo funil dos SaaS que pedem cartao no teste gratis:
// escolher plano -> criar conta -> cartao -> 7 dias.
import { redirect } from "next/navigation";
import { iniciarAssinatura, planoPago } from "@/lib/assinarFluxo";

export const dynamic = "force-dynamic";

export default async function AssinarPage({
  params,
}: {
  params: Promise<{ plano: string }>;
}) {
  const { plano: bruto } = await params;
  const plano = planoPago(bruto.toUpperCase());
  // Plano que nao existe (ou o Basico, que e gratis): manda ver os planos.
  if (!plano) redirect("/painel/plano");

  const r = await iniciarAssinatura(plano);
  if (r.ok) redirect(r.initPoint);

  if (r.motivo === "sem-sessao") {
    // Guarda a escolha na URL: depois de criar a conta a pessoa volta para ca e
    // segue direto para o cartao, sem ter de escolher o plano de novo.
    redirect(`/entrar?criar=1&plano=${plano.toLowerCase()}`);
  }
  redirect("/painel/plano?assinatura=erro");
}
