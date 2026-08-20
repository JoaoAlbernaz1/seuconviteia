/**
 * Helpers PUROS que sobraram do formulario de evento do painel antigo.
 *
 * As telas que liam FormData (Detalhes, Estilo, Recursos, Fotos, Presentes,
 * Programacao) morreram na Task 11 e levaram junto os `parse*` — o editor de 6
 * passos manda um DOCUMENTO em JSON, nao campos soltos. Ficaram os tres que
 * outra gente usa:
 *
 *  - `brlParaCents` — dinheiro digitado ("1.250,50") em centavos; usado pelo
 *    editor (`event-editor/render`) e pela previa.
 *  - `montarMapsUrls` — as URLs do Maps derivadas de local + endereco; usado
 *    pela previa e por `documentToLegacyCustomization` (sem ele o convite
 *    publicado fica sem "Abrir no Maps").
 *  - `semUndefined` — mantem o JSON do `customization` limpo.
 */
/**
 * Converte um valor monetario digitado em centavos (Int >= 0).
 *
 *  - Aceita formato pt-BR ("150,00", "1.250,50"), inteiro ("150"), ou com prefixo
 *    ("R$ 90"). Quando ha virgula, ela e o separador decimal e os pontos sao
 *    milhares; sem virgula, um ponto e tratado como separador decimal.
 *  - Vazio / invalido / negativo -> `null` (a action trata como "sem valor").
 *
 * @example brlParaCents("150,00") // 15000
 * @example brlParaCents("1.250,50") // 125050
 * @example brlParaCents("90") // 9000
 */
export function brlParaCents(valor: string | null | undefined): number | null {
  if (valor == null) return null;
  let s = valor.trim();
  if (!s) return null;
  // Dinheiro nunca e negativo: um sinal "-" invalida a entrada.
  if (s.includes("-")) return null;

  // Mantem apenas digitos, virgula e ponto.
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;

  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");

  if (temVirgula && temPonto) {
    // pt-BR: ponto = milhar, virgula = decimal.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    s = s.replace(",", ".");
  } else if (temPonto && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    // Sem vírgula, grupos exatos de três dígitos representam milhares em BRL.
    // Outros usos de ponto continuam aceitos como decimal (ex.: "150.5").
    s = s.replace(/\./g, "");
  }
  // Ponto que não forma grupos de milhar: separador decimal (deixa como está).

  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/**
 * Deriva os links do Google Maps a partir do local + endereco (sem campo
 * separado). Sem nenhum dos dois -> objeto vazio.
 */
export function montarMapsUrls(
  local?: string | null,
  endereco?: string | null,
): { mapsUrl?: string; mapsEmbedUrl?: string } {
  const query = [local, endereco]
    .filter(Boolean)
    .map((s) => (s as string).trim())
    .filter(Boolean)
    .join(", ");
  if (!query) return {};
  const enc = encodeURIComponent(query);
  return {
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${enc}`,
    mapsEmbedUrl: `https://www.google.com/maps?q=${enc}&output=embed`,
  };
}

/** Remove chaves `undefined` de um objeto (mantem o JSON do customization limpo). */
export function semUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k as keyof T] = v as T[keyof T];
  }
  return out;
}
