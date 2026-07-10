// Dispatcher da pagina /evento — renderiza o /evento do template escolhido
// (`evento.templateId`). Compartilhado entre o site publico e o preview do editor.
import { createElement } from "react";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";
import { eventoDoTemplate } from "@/components/templates/registro";

export function PaginaEvento({
  evento,
  nicho,
  recursos,
}: {
  evento: EventoFesta;
  nicho: string;
  recursos: TogglesSite;
}) {
  return createElement(eventoDoTemplate(evento.templateId), { evento, nicho, recursos });
}
