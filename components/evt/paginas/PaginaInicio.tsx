// Dispatcher da HOME do site do evento. Escolhe a Home do template escolhido
// (`evento.templateId`) via o registro de componentes; cai na base (Cinematográfica)
// se o template nao tiver Home propria. Compartilhado entre o site publico
// (subdominio) e o preview do editor — os dois renderizam EXATAMENTE isto, entao
// o que o profissional ve e o que publica. Data-driven por `EventoFesta` +
// recursos ativos (plano ∩ toggle).
import { createElement } from "react";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";
import { homeDoTemplate } from "@/components/templates/registro";

export function PaginaInicio({
  evento,
  nicho,
  recursos,
}: {
  evento: EventoFesta;
  /** `event.type` (chave do nicho) — decide a copy pronta. */
  nicho: string;
  recursos: TogglesSite;
}) {
  // `homeDoTemplate` devolve uma referência ESTÁVEL do registro (não é um
  // componente criado no render) — createElement evita o falso positivo do
  // lint e é o jeito idiomático de renderizar um componente dinâmico.
  return createElement(homeDoTemplate(evento.templateId), { evento, nicho, recursos });
}
