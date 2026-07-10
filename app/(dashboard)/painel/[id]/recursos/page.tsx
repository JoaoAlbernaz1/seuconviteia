// Tela "O que o seu site vai ter?" (mockup DARK) — liga/desliga cada recurso do
// site (com o site ao lado reagindo na hora) e mostra o que o plano ainda trava.
// Server: carrega o evento do dono, lê o plano e os toggles atuais.
import Link from "next/link";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerToggles } from "@/lib/recursos";
import { rascunhoDoEvento } from "@/lib/previewEvento";
import { BTN_VOLTAR, COLUNA, SUB, TITULO } from "../../_ui/estilos";
import { carregarEventoDono, hostDoEvento, voltarDe } from "../_carregar";
import { RecursosCliente } from "./RecursosCliente";

export const dynamic = "force-dynamic";

export default async function RecursosPage({
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
          <h1 className={TITULO}>O que o seu site vai ter?</h1>
          <p className={`${SUB} mt-1`}>
            Toque para ligar ou desligar — o site{" "}
            <span className="lg:hidden">logo abaixo</span>
            <span className="hidden lg:inline">ao lado</span> muda na hora.
          </p>
        </div>
      </div>

      <RecursosCliente
        eventId={event.id}
        plan={event.plan}
        voltar={voltar}
        host={hostDoEvento(event.subdomain)}
        rascunhoBase={rascunhoDoEvento(event)}
        inicial={lerToggles(event.customization)}
      />
    </div>
  );
}
