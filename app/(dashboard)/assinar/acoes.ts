"use server";

// Confirmacao do pedido antes de ir ao gateway.
//
// O checkout do Mercado Pago e sequinho: duas opcoes de pagamento e uma linha
// de resumo. Quem explica o que a pessoa esta levando, quanto vai pagar e
// QUANDO — e quem coleta o dado de cobranca — e esta tela, como em qualquer
// ecommerce. Ao MP fica so o cartao, que e onde ele tem de ficar.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { iniciarAssinatura, planoPago } from "@/lib/assinarFluxo";
import { documentoValido, soDigitos, telefoneValido } from "@/lib/documento";

export type CheckoutState = {
  erro?: string;
  fieldErrors?: Partial<Record<"nome" | "documento" | "telefone", string>>;
};

export async function confirmarAssinatura(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const plano = planoPago(String(formData.get("plan") ?? "").toUpperCase());
  if (!plano) return { erro: "Plano inválido." };

  const nome = String(formData.get("nome") ?? "").trim();
  const documento = String(formData.get("documento") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();

  const fieldErrors: CheckoutState["fieldErrors"] = {};
  if (nome.split(/\s+/).filter(Boolean).length < 2) fieldErrors.nome = "Informe nome e sobrenome.";
  if (!documentoValido(documento)) fieldErrors.documento = "CPF ou CNPJ inválido.";
  if (!telefoneValido(telefone)) fieldErrors.telefone = "Informe o WhatsApp com DDD.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  // Grava ANTES de ir ao gateway: se a pessoa desistir no cartao e voltar
  // depois, os dados dela ja estao aqui e o formulario volta preenchido.
  await prisma.professional.update({
    where: { id: session.user.id },
    data: { name: nome, documento: soDigitos(documento), telefone: soDigitos(telefone) },
  });

  const r = await iniciarAssinatura(plano);
  if (!r.ok) {
    return {
      erro:
        r.motivo === "gateway"
          ? "O Mercado Pago não respondeu agora. Tente de novo em instantes — nada foi cobrado."
          : "Não foi possível abrir o pagamento. Tente de novo.",
    };
  }
  redirect(r.initPoint);
}
