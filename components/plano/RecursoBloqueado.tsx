"use client";

// Popup de RECURSO BLOQUEADO — a explicação que aparece quando a pessoa toca
// numa coisa que ela ainda não pode usar.
//
// São dois motivos, e eles NÃO se parecem de propósito (pedido do João, 17/08):
//  · "plano"    — existe, mas é de um plano melhor. Diz o que libera e leva pros
//                 planos. É a hora de vender.
//  · "em-breve" — ninguém tem: está sendo construído. Sem botão de upgrade, que
//                 seria vender o que não existe.
//
// Quem tem o plano nunca vê o popup: o botão simplesmente funciona.
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { rotuloPlano, type Plan } from "@/lib/plans";

export type MotivoBloqueio = "plano" | "em-breve";

export function RecursoBloqueado({
  aberto,
  onFechar,
  titulo,
  descricao,
  motivo,
  planoNecessario,
  planoAtual,
  ganhos = [],
}: {
  aberto: boolean;
  onFechar: () => void;
  /** Nome do recurso, do jeito que a pessoa chama ("Baixar a lista de convidados"). */
  titulo: string;
  /** Uma linha explicando o que o recurso faz. */
  descricao: string;
  motivo: MotivoBloqueio;
  /** Plano que libera (só quando `motivo === "plano"`). */
  planoNecessario?: Plan;
  /** Plano atual da conta — para dizer "você está no Grátis". */
  planoAtual?: Plan;
  /** O que mais entra junto no plano (2 a 4 itens curtos). */
  ganhos?: string[];
}) {
  const dePlano = motivo === "plano";
  return (
    <Modal
      open={aberto}
      onClose={onFechar}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={`grid size-7 place-items-center rounded-full text-[14px] ${
              dePlano ? "bg-[#F3EFFE] text-[#7C3AED]" : "bg-[#F0F0F3] text-[#8B8B93]"
            }`}
          >
            {dePlano ? "🔒" : "🛠️"}
          </span>
          {titulo}
        </span>
      }
      footer={
        dePlano ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="cursor-pointer rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-[#6e6e76] hover:bg-[#F4F4F6]"
            >
              Agora não
            </button>
            {/* `color` inline: o painel tem uma regra global de cor para <a> que
                ganha do `text-white` e deixava o botão com a letra invisível. */}
            <Link
              href="/painel/plano"
              style={{ color: "#fff" }}
              className="rounded-xl bg-[#7C3AED] px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-[#6D28D9]"
            >
              Ver planos
            </Link>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onFechar}
              className="cursor-pointer rounded-xl bg-[#17171B] px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-black"
            >
              Entendi
            </button>
          </div>
        )
      }
    >
      <p className="text-[14px] leading-relaxed text-[#3F3F46]">{descricao}</p>

      {dePlano && planoNecessario && (
        <div className="mt-4 rounded-2xl border border-[#ECECF0] bg-[#FAFAFC] p-4">
          <div className="text-[13px] font-bold text-[#17171B]">
            Está no plano {rotuloPlano(planoNecessario)}
            {planoAtual && (
              <span className="ml-1.5 font-normal text-[#8b8b93]">· você está no {rotuloPlano(planoAtual)}</span>
            )}
          </div>
          {ganhos.length > 0 && (
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {ganhos.map((g) => (
                <li key={g} className="flex items-start gap-2 text-[13px] text-[#3F3F46]">
                  <span aria-hidden className="mt-[3px] text-[#2E8A66]">✓</span>
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!dePlano && (
        <p className="mt-3 rounded-2xl border border-[#ECECF0] bg-[#FAFAFC] p-4 text-[13px] text-[#6e6e76]">
          Assim que ficar pronto, ele aparece aqui sozinho — sem você precisar fazer nada.
        </p>
      )}
    </Modal>
  );
}

/**
 * Botão que parece um botão de verdade, mas abre o popup em vez de agir. Use no
 * lugar do controle real quando o plano não libera — some o cadeado quando
 * libera (aí o chamador renderiza o controle de verdade).
 */
export function BotaoBloqueado({
  label,
  className = "",
  ...popup
}: {
  label: string;
  className?: string;
} & Omit<Parameters<typeof RecursoBloqueado>[0], "aberto" | "onFechar">) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={
          className ||
          "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E4E4EA] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#6e6e76] transition-colors hover:border-[#DCCDFB] hover:bg-[#F6F3FE] hover:text-[#6D28D9]"
        }
      >
        <span aria-hidden>{popup.motivo === "plano" ? "🔒" : "🛠️"}</span>
        {label}
      </button>
      <RecursoBloqueado aberto={aberto} onFechar={() => setAberto(false)} {...popup} />
    </>
  );
}
