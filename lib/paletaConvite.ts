// Paleta do convite (telas de RSVP) mapeada para as vars de runtime do preset
// definidas no wrapper `.evt` — assim as duas telas seguem o tema escolhido.
//
// Mora aqui, e nao dentro de um componente, porque a MESMA paleta vale para as
// duas pontas do RSVP: o formulario (`RsvpConvite`) e a tela de resposta
// (`PaginaObrigada`). Enquanto cada uma tinha a sua copia, so o formulario
// respeitava a cor escolhida no editor e a tela seguinte voltava ao rosa do
// tema — a pessoa preenchia em uma cor e era agradecida em outra.
import type { CSSProperties } from "react";

export const PALETA_CONVITE = {
  "--plum": "var(--ev-framboesa)",
  "--plum-2": "var(--ev-framboesa-deep)",
  "--wine": "var(--ev-rosa-ink)",
  "--rose": "var(--ev-rosa)",
  "--rose-soft": "var(--ev-blush)",
  "--gold": "var(--ev-rose)",
  "--ivory": "var(--ev-ivory)",
  "--ivory-2": "var(--ev-blush-soft)",
  "--ink": "var(--ev-ink)",
} as CSSProperties;

/**
 * Paleta do RSVP com a cor escolhida no editor (`rsvpConfig.corBotao`). Sem
 * cor, devolve a paleta do tema — a mesma referencia, para nao remontar estilo
 * a toa.
 */
export function paletaDoRsvp(cor?: string): CSSProperties {
  if (!cor) return PALETA_CONVITE;
  return {
    ...PALETA_CONVITE,
    "--plum": cor,
    "--plum-2": `color-mix(in srgb, ${cor} 78%, #000)`,
    "--wine": cor,
  } as CSSProperties;
}
