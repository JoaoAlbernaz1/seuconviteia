/**
 * Frases da home do painel. PURO: sem import de runtime, para o Vitest testar
 * (ele nao resolve o alias `@/`).
 *
 * Existe porque a versao anterior escrevia
 * `${n} convidado${n === 1 ? "" : "s"} confirmaram`: pluralizava o substantivo e
 * esquecia o verbo. Com 1 convidado, a tela dizia "1 convidado confirmaram".
 */

/** "1 convidado confirmou" · "3 convidados confirmaram" · zero tem frase propria. */
export function frasePresencas(n: number): string {
  if (n === 0) return "Nenhum convidado confirmou ainda";
  if (n === 1) return "1 convidado confirmou";
  return `${n} convidados confirmaram`;
}

/** Cada uma das tres posicoes concorda por conta propria. */
export function fraseResumo(
  sites: number,
  presencas: number,
  recados: number,
): string {
  const s = sites === 1 ? "1 site no ar" : `${sites} sites no ar`;
  const p =
    presencas === 1
      ? "1 presença confirmada"
      : `${presencas} presenças confirmadas`;
  const r =
    recados === 1 ? "1 recado de carinho" : `${recados} recados de carinho`;
  return `${s} · ${p} · ${r}`;
}
