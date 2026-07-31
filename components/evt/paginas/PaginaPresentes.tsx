// Dispatcher da pagina /presentes — renderiza o /presentes do template escolhido.
import { createElement } from "react";
import type { EventoFesta } from "@/lib/eventoFesta";
import type { TogglesSite } from "@/lib/recursos";
import type { PresentearData } from "@/lib/presentesTipos";
import { presentesDoTemplate } from "@/components/templates/registro";

export function PaginaPresentes({
  evento,
  nicho,
  recursos,
  presentear,
}: {
  evento: EventoFesta;
  nicho: string;
  recursos: TogglesSite;
  presentear?: PresentearData;
}) {
  return createElement(presentesDoTemplate(evento.templateId), {
    evento,
    nicho,
    recursos,
    presentear,
  });
}
