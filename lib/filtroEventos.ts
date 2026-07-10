/**
 * Busca, filtro e ordenacao da lista de eventos do painel.
 *
 * PURO de proposito: o componente `_ui/FiltroEventos.tsx` so liga os controles.
 * Assim esta logica ganha teste, como os outros modulos puros do repo.
 */
import type { EstadoEvento } from "./painelEstado";

export type FiltroStatus = "TODOS" | "NO_AR" | "RASCUNHO" | "EXPIRADO";
export type Ordenacao = "RECENTES" | "PROXIMOS" | "ALFABETICA";

export interface ItemFiltravel {
  id: string;
  titulo: string;
  estado: EstadoEvento;
  criadoEm: Date;
  dataEvento: Date;
}

/** "Aniversário" -> "aniversario". A busca nao pode exigir o acento certo. */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

function casaStatus(estado: EstadoEvento, filtro: FiltroStatus): boolean {
  if (filtro === "TODOS") return true;
  // "No ar" inclui quem esta no ar COM pendencia: o site esta publicado do mesmo jeito.
  if (filtro === "NO_AR") return estado === "NO_AR" || estado === "NO_AR_PENDENTE";
  return estado === filtro;
}

/** Devolve uma lista NOVA; nunca muta a recebida. */
export function filtrarEOrdenar<T extends ItemFiltravel>(
  itens: readonly T[],
  busca: string,
  status: FiltroStatus,
  ordem: Ordenacao,
): T[] {
  const termo = normalizar(busca);
  const filtrados = itens.filter(
    (i) =>
      casaStatus(i.estado, status) &&
      (termo === "" || normalizar(i.titulo).includes(termo)),
  );

  const copia = [...filtrados];
  switch (ordem) {
    case "RECENTES":
      return copia.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
    case "PROXIMOS":
      return copia.sort((a, b) => a.dataEvento.getTime() - b.dataEvento.getTime());
    case "ALFABETICA":
      return copia.sort((a, b) => collator.compare(a.titulo, b.titulo));
  }
}
