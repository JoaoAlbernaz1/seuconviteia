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

// Bases (fallback p/ id legado/invalido)
import { HomeClassica } from "@/components/templates/_base/HomeClassica";
import { EventoBase } from "@/components/templates/_base/EventoBase";
import { PresentesBase } from "@/components/templates/_base/PresentesBase";
import { GaleriaBase } from "@/components/templates/_base/GaleriaBase";
import { PaginaInicioEditorial } from "@/components/evt/paginas/PaginaInicioEditorial";

// ── Homes dos 9 templates ──
import { HomeCasamentoClassico } from "@/components/templates/casamento/classico-elegante/Home";
import { HomeCasamentoEditorial } from "@/components/templates/casamento/editorial-moderno/Home";
import { HomeCasamentoNoite } from "@/components/templates/casamento/noite-luxo/Home";
import { HomeQuinzeGlamour } from "@/components/templates/quinze-anos/glamour-rose/Home";
import { HomeQuinzeFashion } from "@/components/templates/quinze-anos/fashion-editorial/Home";
import { HomeQuinzePrincesa } from "@/components/templates/quinze-anos/princesa-delicado/Home";
import { HomeAniversarioAdulto } from "@/components/templates/aniversario/adulto-elegante/Home";
import { HomeAniversarioInfantil } from "@/components/templates/aniversario/infantil-ludico/Home";
import { HomeAniversarioTropical } from "@/components/templates/aniversario/tropical-festa/Home";

// ── Evento / Presentes / Galeria dos 9 templates ──
import { EventoCasamentoClassico } from "@/components/templates/casamento/classico-elegante/Evento";
import { PresentesCasamentoClassico } from "@/components/templates/casamento/classico-elegante/Presentes";
import { GaleriaCasamentoClassico } from "@/components/templates/casamento/classico-elegante/Galeria";
import { EventoCasamentoEditorial } from "@/components/templates/casamento/editorial-moderno/Evento";
import { PresentesCasamentoEditorial } from "@/components/templates/casamento/editorial-moderno/Presentes";
import { GaleriaCasamentoEditorial } from "@/components/templates/casamento/editorial-moderno/Galeria";
import { EventoCasamentoNoite } from "@/components/templates/casamento/noite-luxo/Evento";
import { PresentesCasamentoNoite } from "@/components/templates/casamento/noite-luxo/Presentes";
import { GaleriaCasamentoNoite } from "@/components/templates/casamento/noite-luxo/Galeria";
import { EventoQuinzeGlamour } from "@/components/templates/quinze-anos/glamour-rose/Evento";
import { PresentesQuinzeGlamour } from "@/components/templates/quinze-anos/glamour-rose/Presentes";
import { GaleriaQuinzeGlamour } from "@/components/templates/quinze-anos/glamour-rose/Galeria";
import { EventoQuinzeFashion } from "@/components/templates/quinze-anos/fashion-editorial/Evento";
import { PresentesQuinzeFashion } from "@/components/templates/quinze-anos/fashion-editorial/Presentes";
import { GaleriaQuinzeFashion } from "@/components/templates/quinze-anos/fashion-editorial/Galeria";
import { EventoQuinzePrincesa } from "@/components/templates/quinze-anos/princesa-delicado/Evento";
import { PresentesQuinzePrincesa } from "@/components/templates/quinze-anos/princesa-delicado/Presentes";
import { GaleriaQuinzePrincesa } from "@/components/templates/quinze-anos/princesa-delicado/Galeria";
import { EventoAniversarioAdulto } from "@/components/templates/aniversario/adulto-elegante/Evento";
import { PresentesAniversarioAdulto } from "@/components/templates/aniversario/adulto-elegante/Presentes";
import { GaleriaAniversarioAdulto } from "@/components/templates/aniversario/adulto-elegante/Galeria";
import { EventoAniversarioInfantil } from "@/components/templates/aniversario/infantil-ludico/Evento";
import { PresentesAniversarioInfantil } from "@/components/templates/aniversario/infantil-ludico/Presentes";
import { GaleriaAniversarioInfantil } from "@/components/templates/aniversario/infantil-ludico/Galeria";
import { EventoAniversarioTropical } from "@/components/templates/aniversario/tropical-festa/Evento";
import { PresentesAniversarioTropical } from "@/components/templates/aniversario/tropical-festa/Presentes";
import { GaleriaAniversarioTropical } from "@/components/templates/aniversario/tropical-festa/Galeria";

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
  "casamento-editorial-moderno": {
    Home: HomeCasamentoEditorial, Evento: EventoCasamentoEditorial,
    Presentes: PresentesCasamentoEditorial, Galeria: GaleriaCasamentoEditorial,
  },
  "casamento-noite-luxo": {
    Home: HomeCasamentoNoite, Evento: EventoCasamentoNoite,
    Presentes: PresentesCasamentoNoite, Galeria: GaleriaCasamentoNoite,
  },
  "quinze-anos-glamour-rose": {
    Home: HomeQuinzeGlamour, Evento: EventoQuinzeGlamour,
    Presentes: PresentesQuinzeGlamour, Galeria: GaleriaQuinzeGlamour,
  },
  "quinze-anos-fashion-editorial": {
    Home: HomeQuinzeFashion, Evento: EventoQuinzeFashion,
    Presentes: PresentesQuinzeFashion, Galeria: GaleriaQuinzeFashion,
  },
  "quinze-anos-princesa-delicado": {
    Home: HomeQuinzePrincesa, Evento: EventoQuinzePrincesa,
    Presentes: PresentesQuinzePrincesa, Galeria: GaleriaQuinzePrincesa,
  },
  "aniversario-adulto-elegante": {
    Home: HomeAniversarioAdulto, Evento: EventoAniversarioAdulto,
    Presentes: PresentesAniversarioAdulto, Galeria: GaleriaAniversarioAdulto,
  },
  "aniversario-infantil-ludico": {
    Home: HomeAniversarioInfantil, Evento: EventoAniversarioInfantil,
    Presentes: PresentesAniversarioInfantil, Galeria: GaleriaAniversarioInfantil,
  },
  "aniversario-tropical-festa": {
    Home: HomeAniversarioTropical, Evento: EventoAniversarioTropical,
    Presentes: PresentesAniversarioTropical, Galeria: GaleriaAniversarioTropical,
  },
  // Legado — renderiza para eventos antigos; fora do seletor novo.
  classico: { Home: HomeClassica, Evento: EventoBase, Presentes: PresentesBase, Galeria: GaleriaBase },
  editorial: { Home: PaginaInicioEditorial, Evento: EventoBase, Presentes: PresentesBase, Galeria: GaleriaBase },
};

const PADRAO = COMPONENTES[TEMPLATE_PADRAO_ID];

/** Home do template (fallback = padrao; ultimo = HomeClassica). */
export function homeDoTemplate(id: string): ComponentType<PaginaTemplateProps> {
  return COMPONENTES[id]?.Home ?? PADRAO?.Home ?? HomeClassica;
}
/** /evento do template (fallback = padrao; ultimo = EventoBase). */
export function eventoDoTemplate(id: string): ComponentType<PaginaTemplateProps> {
  return COMPONENTES[id]?.Evento ?? PADRAO?.Evento ?? EventoBase;
}
/** /presentes do template (fallback = padrao; ultimo = PresentesBase). */
export function presentesDoTemplate(id: string): ComponentType<PaginaTemplateProps> {
  return COMPONENTES[id]?.Presentes ?? PADRAO?.Presentes ?? PresentesBase;
}
/** /galeria do template (fallback = padrao; ultimo = GaleriaBase). */
export function galeriaDoTemplate(id: string): ComponentType<PaginaTemplateProps> {
  return COMPONENTES[id]?.Galeria ?? PADRAO?.Galeria ?? GaleriaBase;
}
