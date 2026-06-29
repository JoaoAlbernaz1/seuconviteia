// Planos da plataforma. O gating real (limites + features liberadas por plano)
// e detalhado em fase posterior; aqui ficam os tipos e o esqueleto.

export type Plan = "BASICO" | "CLASSICO" | "PREMIUM";

export interface PlanDefinition {
  label: string;
  /** Identificadores de features liberadas pelo plano (placeholder). */
  features: string[];
}

export const PLANS: Record<Plan, PlanDefinition> = {
  BASICO: {
    label: "Basico",
    features: ["site_evento", "rsvp"],
  },
  CLASSICO: {
    label: "Classico",
    features: ["site_evento", "rsvp", "lista_presentes", "dominio_personalizado"],
  },
  PREMIUM: {
    label: "Premium",
    features: [
      "site_evento",
      "rsvp",
      "lista_presentes",
      "dominio_personalizado",
      "galeria_fotos",
      "mensagens_convidados",
      "remover_marca",
    ],
  },
};

/**
 * Indica se um plano libera uma feature.
 * TODO: implementar gating real por fase (hoje retorna sempre true).
 */
export function planAllows(plan: Plan, feature: string): boolean {
  void plan;
  void feature;
  return true;
}
