// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE COMPONENTES DOS TEMPLATES (lado de render)
// ─────────────────────────────────────────────────────────────────────────────
//
// Cada `templateId` (lib/templates.ts) tem os SEUS proprios componentes de
// pagina: Home, Evento, Presentes, Galeria. NADA de miolo compartilhado entre os
// templates — cada um traz o seu corpo. O que e compartilhado e so LOGICA
// (dados via EventoFesta, contador via useCountdown, recursos, formularios).
//
// Recados/Confirmar/Obrigada continuam usando os componentes de formulario
// compartilhados (funcionais), tematizados pela paleta/fonte do evento.
//
// Este arquivo importa componentes React — NAO deve ser importado por libs puras.

import type { ComponentType } from "react";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";
import { TEMPLATE_PADRAO_ID } from "@/lib/templates";

// ── Homes dos 4 templates do MVP ──
import { HomeCasamentoClassico } from "@/components/templates/casamento/classico-elegante/Home";
import { HomeQuinzeGlamour } from "@/components/templates/quinze-anos/glamour-rose/Home";
import { HomeAniversarioAdulto } from "@/components/templates/aniversario/adulto-elegante/Home";
import { HomeAniversarioInfantil } from "@/components/templates/aniversario/infantil-ludico/Home";

// ── Evento / Presentes / Galeria dos 4 templates do MVP ──
import { EventoCasamentoClassico } from "@/components/templates/casamento/classico-elegante/Evento";
import { PresentesCasamentoClassico } from "@/components/templates/casamento/classico-elegante/Presentes";
import { GaleriaCasamentoClassico } from "@/components/templates/casamento/classico-elegante/Galeria";
import { EventoQuinzeGlamour } from "@/components/templates/quinze-anos/glamour-rose/Evento";
import { PresentesQuinzeGlamour } from "@/components/templates/quinze-anos/glamour-rose/Presentes";
import { GaleriaQuinzeGlamour } from "@/components/templates/quinze-anos/glamour-rose/Galeria";
import { EventoAniversarioAdulto } from "@/components/templates/aniversario/adulto-elegante/Evento";
import { PresentesAniversarioAdulto } from "@/components/templates/aniversario/adulto-elegante/Presentes";
import { GaleriaAniversarioAdulto } from "@/components/templates/aniversario/adulto-elegante/Galeria";
import { EventoAniversarioInfantil } from "@/components/templates/aniversario/infantil-ludico/Evento";
import { PresentesAniversarioInfantil } from "@/components/templates/aniversario/infantil-ludico/Presentes";
import { GaleriaAniversarioInfantil } from "@/components/templates/aniversario/infantil-ludico/Galeria";

/** Props que TODO componente de pagina de template recebe (dados + recursos). */
export type PaginaTemplateProps = {
  evento: EventoFesta;
  /** `event.type` (chave do nicho) — decide a copy pronta. */
  nicho: string;
  recursos: TogglesSite;
};

/** Componentes de pagina que um template fornece (todos com os mesmos dados). */
export type TemplateComponentMap = {
  Home: ComponentType<PaginaTemplateProps>;
  Evento: ComponentType<PaginaTemplateProps>;
  Presentes: ComponentType<PaginaTemplateProps>;
  Galeria: ComponentType<PaginaTemplateProps>;
};

/** id -> componentes proprios do template. */
const COMPONENTES: Record<string, TemplateComponentMap> = {
  "casamento-classico-elegante": {
    Home: HomeCasamentoClassico, Evento: EventoCasamentoClassico,
    Presentes: PresentesCasamentoClassico, Galeria: GaleriaCasamentoClassico,
  },
  "quinze-anos-glamour-rose": {
    Home: HomeQuinzeGlamour, Evento: EventoQuinzeGlamour,
    Presentes: PresentesQuinzeGlamour, Galeria: GaleriaQuinzeGlamour,
  },
  "aniversario-adulto-elegante": {
    Home: HomeAniversarioAdulto, Evento: EventoAniversarioAdulto,
    Presentes: PresentesAniversarioAdulto, Galeria: GaleriaAniversarioAdulto,
  },
  "aniversario-infantil-ludico": {
    Home: HomeAniversarioInfantil, Evento: EventoAniversarioInfantil,
    Presentes: PresentesAniversarioInfantil, Galeria: GaleriaAniversarioInfantil,
  },
};

// Padrao (casamento-classico-elegante) — SEMPRE existe; e o fallback de todo id
// desconhecido/legado (nao ha mais componentes _base).
const PADRAO = COMPONENTES[TEMPLATE_PADRAO_ID];

/** Home do template (fallback = padrao). */
export function homeDoTemplate(id: string): ComponentType<PaginaTemplateProps> {
  return COMPONENTES[id]?.Home ?? PADRAO.Home;
}
/** /evento do template (fallback = padrao). */
export function eventoDoTemplate(id: string): ComponentType<PaginaTemplateProps> {
  return COMPONENTES[id]?.Evento ?? PADRAO.Evento;
}
/** /presentes do template (fallback = padrao). */
export function presentesDoTemplate(id: string): ComponentType<PaginaTemplateProps> {
  return COMPONENTES[id]?.Presentes ?? PADRAO.Presentes;
}
/** /galeria do template (fallback = padrao). */
export function galeriaDoTemplate(id: string): ComponentType<PaginaTemplateProps> {
  return COMPONENTES[id]?.Galeria ?? PADRAO.Galeria;
}
