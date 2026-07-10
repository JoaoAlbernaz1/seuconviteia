/**
 * Estado de um evento na home do painel. PURO e testavel: `agora` entra por
 * parametro (a pagina e force-dynamic; nada de Date.now() escondido aqui).
 *
 * Import de TIPO, relativo: o Vitest nao resolve o alias `@/`.
 *
 * Existe porque a tela antiga so perguntava `status === "PUBLISHED"` e tratava
 * todo o resto como rascunho — entao um evento EXPIRADO aparecia como
 * "Em preparacao", com o botao "Continuar montando".
 */
import type { StatusEvento } from "./event";

export type EstadoEvento = "RASCUNHO" | "NO_AR" | "NO_AR_PENDENTE" | "EXPIRADO";

/** Subconjunto do Event necessario para decidir o estado. */
export interface EventoParaEstado {
  status: StatusEvento;
  expiresAt: Date;
}

/**
 * A ordem das perguntas importa:
 *  1. Nunca publicado -> RASCUNHO (mesmo com o prazo vencido: nunca esteve no ar).
 *  2. EXPIRED, ou prazo vencido -> EXPIRADO. Mesma regra de `eventoPublico`
 *     (lib/event.ts), que ja decide assim a visibilidade do site publico.
 *  3. Pendencia -> NO_AR_PENDENTE.
 *  4. Caso contrario -> NO_AR.
 */
export function estadoDoEvento(
  ev: EventoParaEstado,
  pendencia: string | null,
  agora: Date,
): EstadoEvento {
  if (ev.status === "DRAFT") return "RASCUNHO";
  if (ev.status === "EXPIRED" || ev.expiresAt.getTime() < agora.getTime()) {
    return "EXPIRADO";
  }
  return pendencia ? "NO_AR_PENDENTE" : "NO_AR";
}

/** O que falta para o site ficar completo. `null` = nada falta. */
export function pendenciaDoEvento(
  temFoto: boolean,
  qtdPresentes: number,
): string | null {
  if (!temFoto) return "faltam as fotos";
  if (qtdPresentes === 0) return "falta a lista de presentes";
  return null;
}
