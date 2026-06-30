/**
 * RSVP "festa" — tipos + regras PURAS (sem banco, sem Date) do formulario
 * multi-convidado portado do festa-15-maria-clara (`RsvpConvite`). O festa
 * coletava uma LISTA de convidados (adultos/criancas, cada um com presenca);
 * aqui mapeamos essa lista para UMA linha `Guest` do schema multi-tenant
 * (name + status + companions + message), que e a representacao mais fiel
 * possivel sem novo modelo.
 *
 * `validateGuests` e copia fiel do `lib/rsvp.ts` do festa. `montarGuestRow`
 * faz o "achatamento" para o `Guest`. Mantido puro para os testes do Vitest.
 */
export type GuestTipo = "adulto" | "crianca";

export type GuestInput = {
  nome: string;
  tipo: GuestTipo;
  vai_comparecer: boolean;
};

export type ValidateResult =
  | { ok: true; guests: GuestInput[] }
  | { ok: false; error: string };

/** Limpa nomes (trim) e descarta vazios; exige ao menos um convidado nomeado. */
export function validateGuests(input: GuestInput[]): ValidateResult {
  const cleaned = input
    .map((x) => ({ ...x, nome: x.nome.trim() }))
    .filter((x) => x.nome.length > 0);

  if (cleaned.length === 0) {
    return { ok: false, error: "Informe o nome de pelo menos um convidado." };
  }
  return { ok: true, guests: cleaned };
}

/** Dados de UMA linha `Guest` derivados da lista de convidados do festa. */
export type GuestRowData = {
  name: string;
  status: "CONFIRMED" | "DECLINED";
  /** Demais pessoas que VEM com o titular (confirmados - 1). */
  companions: number;
  /** Detalhamento de quem vai / nao vai (nomes extras + observacoes). */
  message: string | null;
};

const rotulo = (g: GuestInput) =>
  g.tipo === "crianca" ? `${g.nome} (criança)` : g.nome;

/**
 * Achata a lista de convidados (ja validada) em uma linha `Guest`:
 *  - titular = primeiro CONFIRMADO (ou, se ninguem vai, o primeiro da lista);
 *  - companions = nº de confirmados - 1 (quem vem junto do titular);
 *  - status = CONFIRMED se ha ao menos um confirmado, senao DECLINED;
 *  - message = resumo "Confirmados: … · Não vão: …" (preserva os nomes extras).
 */
export function montarGuestRow(guests: GuestInput[]): GuestRowData {
  const confirmados = guests.filter((g) => g.vai_comparecer);
  const recusados = guests.filter((g) => !g.vai_comparecer);
  const algumVai = confirmados.length > 0;

  const titular = (algumVai ? confirmados[0] : guests[0]).nome;

  const partes: string[] = [];
  if (confirmados.length > 0) {
    partes.push(`Confirmados: ${confirmados.map(rotulo).join(", ")}`);
  }
  if (recusados.length > 0) {
    partes.push(`Não vão: ${recusados.map(rotulo).join(", ")}`);
  }

  return {
    name: titular,
    status: algumVai ? "CONFIRMED" : "DECLINED",
    companions: algumVai ? confirmados.length - 1 : 0,
    message: partes.length > 0 ? partes.join(" · ") : null,
  };
}
