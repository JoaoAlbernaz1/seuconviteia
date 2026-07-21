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

import { lerEventoFesta, type EventoFesta } from "@/lib/eventoFesta";
import { ocasiaoDoNicho, type TemplateOccasion } from "@/lib/templates";

type ConjuntoDemo = { capa: string; capaDesktop: string; album: string[] };

const Q15 = "/templates-demo/quinze-anos";

/**
 * Fotos demo por ocasião — arte ORIGINAL, livre de direitos (gerada no projeto,
 * `public/templates-demo/<ocasiao>/`). O 15 anos já tem um conjunto rosé-glamour
 * (capa cinematográfica + 6 tiles de galeria) p/ o template NUNCA ficar sem
 * graça. Casamento/aniversário seguem vazios (empty-state) até ganharem o seu.
 */
const POR_OCASIAO: Record<TemplateOccasion, ConjuntoDemo> = {
  casamento: { capa: "", capaDesktop: "", album: [] },
  "quinze-anos": {
    capa: `${Q15}/capa.jpg`,
    capaDesktop: `${Q15}/capa-desktop.jpg`,
    album: [1, 2, 3, 4, 5, 6].map((n) => `${Q15}/g${n}.jpg`),
  },
  aniversario: { capa: "", capaDesktop: "", album: [] },
};

/** Foto de capa de exemplo (paisagem) da ocasião — vazia até haver set CC0. */
export function capaDemo(ocasiao: TemplateOccasion = "casamento"): string {
  return (POR_OCASIAO[ocasiao] ?? POR_OCASIAO.casamento).capaDesktop;
}

/**
 * Preenche capa/álbum vazios com as imagens-padrão da ocasião (arte livre).
 * Usado no preview E no site publicado (o cliente que não subiu foto ainda vê o
 * template povoado, nunca "sem graça"). Se o evento já tem foto/álbum próprios
 * (ex.: Maria Clara), fica inalterado. Sem set demo → empty-state do template.
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

/**
 * Atalho para o site publicado: `lerEventoFesta` + preenche as fotos-padrão da
 * ocasião. Use no lugar de `lerEventoFesta` nas páginas/layout do site do evento
 * para o convite sem foto própria já sair bonito (só 15 anos tem set hoje).
 */
export function comFotosDemo(
  event: Parameters<typeof lerEventoFesta>[0],
): EventoFesta {
  return preencherFotosDemo(lerEventoFesta(event), ocasiaoDoNicho(event.type));
}
