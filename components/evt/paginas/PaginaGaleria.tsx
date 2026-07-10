// Dispatcher da pagina /galeria — renderiza a /galeria do template escolhido.
import { createElement } from "react";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";
import { galeriaDoTemplate } from "@/components/templates/registro";

export function PaginaGaleria({
  evento,
  nicho,
  recursos,
}: {
  evento: EventoFesta;
  nicho: string;
  recursos: TogglesSite;
}) {
  return createElement(galeriaDoTemplate(evento.templateId), { evento, nicho, recursos });
}
