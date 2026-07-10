"use client";

// Card de um TEMPLATE (layout real do site) — usado no wizard (passo 2) e na tela
// "Trocar o estilo". Miniatura com foto de exemplo na paleta/fonte padrão do
// template + nome, ocasião, descrição, badge de categoria e de plano. "Em breve"
// para os templates ainda não disponíveis (não selecionáveis).
import { CapaEvento } from "./CapaEvento";
import {
  CATEGORIA_LABEL,
  OCASIAO_LABEL,
  type TemplateDefinition,
} from "@/lib/templates";
import { rotuloPlano } from "@/lib/plans";

export function CardTemplate({
  tpl,
  nome,
  fotoUrl,
  altura = 148,
  selecionado,
  onSelect,
}: {
  tpl: TemplateDefinition;
  nome: string;
  fotoUrl?: string;
  altura?: number;
  selecionado: boolean;
  onSelect: () => void;
}) {
  const indisponivel = !tpl.disponivel;
  return (
    <button
      type="button"
      disabled={indisponivel}
      aria-pressed={selecionado}
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-[18px] bg-scv-card text-left transition ${
        indisponivel
          ? "cursor-not-allowed border border-scv-line opacity-70"
          : selecionado
            ? "border-2 border-violeta shadow-[0_18px_40px_-24px_rgba(122,64,237,0.5)]"
            : "border border-scv-line shadow-[0_12px_32px_-28px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 hover:border-scv-dash"
      }`}
    >
      <div className="relative">
        <CapaEvento
          tema={tpl.paletaPadrao}
          fontes={tpl.fontesPadrao}
          nome={nome}
          kicker={OCASIAO_LABEL[tpl.ocasiao]}
          fotoUrl={fotoUrl}
          altura={altura}
        />
        {/* Badge de categoria (canto superior esquerdo). */}
        <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          {CATEGORIA_LABEL[tpl.categoria]}
        </span>
        {/* Badge de plano recomendado (só quando não é o Básico). */}
        {tpl.planoRecomendado !== "BASICO" && (
          <span className="absolute right-3 top-3 rounded-full bg-scv-lilac px-2.5 py-0.5 text-[10px] font-semibold text-scv-violet">
            {rotuloPlano(tpl.planoRecomendado)}
          </span>
        )}
        {indisponivel && (
          <span className="absolute inset-0 flex items-center justify-center bg-scv-card/70 text-[12px] font-semibold uppercase tracking-[0.2em] text-scv-ink backdrop-blur-[2px]">
            Em breve
          </span>
        )}
      </div>

      <span className="flex w-full items-start justify-between gap-3 px-4 py-3.5">
        <span className="min-w-0">
          <span className="block font-display text-base font-semibold text-scv-ink">
            {tpl.nome}
          </span>
          <span className="mt-1 block text-[12px] leading-snug text-scv-muted">
            {tpl.descricao}
          </span>
        </span>
        <span
          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
            selecionado ? "bg-violeta text-white" : "bg-scv-soft text-transparent"
          }`}
        >
          <i className="bi bi-check-lg text-[13px]" aria-hidden />
        </span>
      </span>
    </button>
  );
}
