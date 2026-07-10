// Fotos de EXEMPLO para o preview / galeria de templates.
//
// ⚠️ NÃO usar as fotos da Maria (/public/exemplo/*) aqui: são de uma pessoa real
// específica e não devem aparecer como "demonstração" de todos os templates.
//
// Para POVOAR os templates com fotos de OUTRAS pessoas SEM direitos autorais,
// coloque um conjunto seguro (CC0 / geradas por IA / do próprio dono) em
// /public/templates-demo/<ocasiao>/ e preencha o mapa abaixo. Enquanto vazio, o
// preview usa o EMPTY-STATE elegante de cada template (gradiente/inicial) — nunca
// a foto da Maria. Este é um SEAM: trocar aqui não mexe no resto.

import type { EventoFesta } from "@/lib/eventoFesta";
import type { TemplateOccasion } from "@/lib/templates";

type ConjuntoDemo = { capa: string; capaDesktop: string; album: string[] };

/** Fotos demo por ocasião. VAZIO por enquanto (sem a Maria; aguardando set CC0). */
const POR_OCASIAO: Record<TemplateOccasion, ConjuntoDemo> = {
  casamento: { capa: "", capaDesktop: "", album: [] },
  "quinze-anos": { capa: "", capaDesktop: "", album: [] },
  aniversario: { capa: "", capaDesktop: "", album: [] },
};

/** Foto de capa de exemplo (paisagem) da ocasião — vazia até haver set CC0. */
export function capaDemo(ocasiao: TemplateOccasion = "casamento"): string {
  return (POR_OCASIAO[ocasiao] ?? POR_OCASIAO.casamento).capaDesktop;
}

/**
 * Preenche capa/álbum vazios com fotos de exemplo, SÓ no preview. Enquanto o set
 * demo estiver vazio, retorna o evento inalterado (o template mostra o próprio
 * empty-state). NUNCA injeta a foto da Maria.
 */
export function preencherFotosDemo(
  evento: EventoFesta,
  ocasiao: TemplateOccasion = "casamento",
): EventoFesta {
  const demo = POR_OCASIAO[ocasiao] ?? POR_OCASIAO.casamento;
  const temAlgumDemo = !!demo.capa || demo.album.length > 0;
  if (!temAlgumDemo) return evento; // sem set CC0 ainda → empty-state do template

  const semCapa = !evento.fotoUrl;
  const semAlbum = evento.fotos.length === 0;
  if (!semCapa && !semAlbum) return evento;
  const fotoUrl = evento.fotoUrl || demo.capa || undefined;
  return {
    ...evento,
    fotoUrl,
    fotoDesktopUrl: semCapa ? demo.capaDesktop || undefined : evento.fotoDesktopUrl,
    presentesFotoUrl: evento.presentesFotoUrl ?? fotoUrl,
    fotos: semAlbum ? demo.album : evento.fotos,
  };
}
