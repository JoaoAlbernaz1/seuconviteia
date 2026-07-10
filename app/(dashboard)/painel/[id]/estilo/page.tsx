// Tela "Trocar o estilo" (mockup DARK) — combinações prontas de cor + letras
// (o site inteiro muda de uma vez) e um seletor de cor solta. Server: carrega o
// evento do dono e passa tema/fontes atuais + o rascunho base do preview.
import Link from "next/link";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerTemaKey } from "@/lib/temas";
import { lerFonteKey } from "@/lib/fontes";
import { lerTemplateId } from "@/lib/templates";
import { rascunhoDoEvento } from "@/lib/previewEvento";
import { BTN_VOLTAR, COLUNA, SUB, TITULO } from "../../_ui/estilos";
import { carregarEventoDono, hostDoEvento, voltarDe } from "../_carregar";
import { EscolherEstilo } from "./EscolherEstilo";

export const dynamic = "force-dynamic";

export default async function EstiloPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await carregarEventoDono(id);
  const voltar = voltarDe(sp, `/painel/${id}`);

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-20 ${EVT_FONTS_CLASS}`}>
      <div className="flex items-start gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div>
          <h1 className={TITULO}>Trocar o estilo</h1>
          <p className={`${SUB} mt-1`}>
            Combinações prontas de cores e letras — o site inteiro muda de uma vez.
          </p>
        </div>
      </div>

      <EscolherEstilo
        eventId={event.id}
        voltar={voltar}
        host={hostDoEvento(event.subdomain)}
        nicho={event.type}
        nome={event.title}
        temaAtual={lerTemaKey(event.customization)}
        fonteAtual={lerFonteKey(event.customization)}
        templateAtual={lerTemplateId(event.customization)}
        rascunhoBase={rascunhoDoEvento(event)}
      />
    </div>
  );
}
