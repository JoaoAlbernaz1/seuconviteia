// Helpers de apresentação do PAINEL (puros, sem prisma) — compartilhados pela
// visão geral, pela grade de eventos e pelo editor. Rótulos/ícones de nicho e
// formatação de moeda.
//
// O visual de status NAO mora mais aqui: `STATUS_INFO`/`FILTROS_STATUS` eram
// código morto com o vocabulário velho ("Publicado", "Rascunho", "Encerrado") —
// uma quinta cópia da palavra, esperando alguém reaproveitar a errada. Quem
// responde por estado e palavra é `lib/estadoConvite`, e pelo selo, `SELO_ESTADO`
// (app/(dashboard)/painel/_ui/estilos).
import type { EventType } from "@prisma/client";

export const TIPO_LABEL: Record<EventType, string> = {
  CASAMENTO: "Casamento",
  QUINZE_ANOS: "15 anos",
  SESSENTA_ANOS: "60 anos",
  BODAS: "Bodas",
  ANIVERSARIO: "Aniversário",
};

export const TIPO_ICON: Record<EventType, string> = {
  CASAMENTO: "bi-suit-heart",
  QUINZE_ANOS: "bi-stars",
  SESSENTA_ANOS: "bi-balloon",
  BODAS: "bi-gem",
  ANIVERSARIO: "bi-balloon-heart",
};

/** Formata centavos como moeda BR (R$ 1.234,56). */
export function moedaBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Valor compacto para KPI (R$ 18,4 mil / R$ 950). */
export function moedaCompacta(cents: number): string {
  const reais = cents / 100;
  if (reais >= 1000) {
    return `R$ ${(reais / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }
  return moedaBRL(cents);
}

/** Primeira letra (maiúscula) de um título — usada na miniatura/banner. */
export function inicialEvento(titulo: string): string {
  return titulo.trim().charAt(0).toUpperCase() || "•";
}

/** "há 5 min" / "há 2 h" / "ontem" / "há 3 d" / data — relativo a `agora`. */
export function tempoRelativo(date: Date, agora: Date): string {
  const ms = agora.getTime() - date.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 7) return `há ${d} d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
