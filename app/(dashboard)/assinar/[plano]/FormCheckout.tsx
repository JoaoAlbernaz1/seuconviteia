"use client";

// Formulario de cobranca do checkout. Client so por causa das mascaras e do
// estado de erro — a validacao que vale e a do servidor (`confirmarAssinatura`).
import { useActionState, useState } from "react";
import { confirmarAssinatura, type CheckoutState } from "../acoes";
import { formatarDocumento, formatarTelefone } from "@/lib/documento";
import { INPUT, BTN_PRIMARIO } from "../../painel/_ui/estilos";

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function FormCheckout({
  plano,
  nome,
  email,
  telefone,
  documento,
}: {
  plano: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
}) {
  const [estado, acao, pendente] = useActionState<CheckoutState, FormData>(
    confirmarAssinatura,
    {},
  );
  const [tel, setTel] = useState(telefone);
  const [doc, setDoc] = useState(documento);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="plan" value={plano} />

      <div>
        <label className="mb-1.5 block text-[12.5px] font-semibold text-scv-muted">
          Nome completo do titular
        </label>
        <input name="nome" defaultValue={nome} autoComplete="name" className={INPUT} />
        <Erro msg={estado.fieldErrors?.nome} />
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] font-semibold text-scv-muted">E-mail</label>
        {/* Nao editavel aqui: e a identidade da conta e vai para o gateway. */}
        <input value={email} readOnly disabled className={`${INPUT} opacity-70`} />
        <p className="mt-1 text-[11.5px] text-scv-faint">
          O recibo da assinatura chega neste e-mail.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-scv-muted">
            CPF ou CNPJ
          </label>
          <input
            name="documento"
            inputMode="numeric"
            placeholder="000.000.000-00"
            className={INPUT}
            value={doc}
            onChange={(e) => setDoc(formatarDocumento(e.target.value))}
          />
          <Erro msg={estado.fieldErrors?.documento} />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-scv-muted">
            WhatsApp
          </label>
          <input
            name="telefone"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            className={INPUT}
            value={tel}
            onChange={(e) => setTel(formatarTelefone(e.target.value))}
          />
          <Erro msg={estado.fieldErrors?.telefone} />
        </div>
      </div>

      {estado.erro ? (
        <p role="alert" className="text-sm text-red-600">
          {estado.erro}
        </p>
      ) : null}

      <button type="submit" disabled={pendente} className={`${BTN_PRIMARIO} w-full py-3.5`}>
        {pendente ? "Abrindo o pagamento…" : "Ir para o pagamento"}
      </button>

      {/* A tela do Mercado Pago abre com DUAS opcoes e o cartao fica escondido
          atras da segunda. Sem este aviso a pessoa acha que nao da para pagar. */}
      <p className="text-[12px] leading-relaxed text-scv-faint">
        Você vai para o ambiente seguro do Mercado Pago para digitar o cartão. Se você
        não tem conta lá, escolha <strong className="font-semibold">Sem conta Mercado
        Pago → Cartão</strong>. O cartão nunca passa pelo nosso site.
      </p>
    </form>
  );
}
