// Tela "Editar o site" (mockup DARK) — o essencial do convite num card, com o
// SITE DE VERDADE ao lado reagindo na hora. Server: carrega o evento do dono,
// deriva os valores iniciais dos campos e serializa o rascunho base do preview.
import Link from "next/link";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerConteudo } from "@/lib/convite";
import { dividirDataHoraSP } from "@/lib/dates";
import { rascunhoDoEvento } from "@/lib/previewEvento";
import { NOME_LABEL } from "../../_ui/estilosDoSite";
import { BTN_VOLTAR, COLUNA, SUB, TITULO } from "../../_ui/estilos";
import { carregarEventoDono, hostDoEvento, voltarDe } from "../_carregar";
import { FormDetalhes } from "./FormDetalhes";

export const dynamic = "force-dynamic";

export default async function DetalhesPage({
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

  const conteudo = lerConteudo(event);
  const { date, time } = dividirDataHoraSP(event.eventDate);
  const inicial = {
    title: event.title,
    date,
    time,
    local: conteudo.local ?? "",
    endereco: conteudo.endereco ?? "",
    traje: conteudo.traje ?? "",
    mensagem: conteudo.mensagem ?? "",
  };

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-20 ${EVT_FONTS_CLASS}`}>
      <div className="flex items-start gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div>
          <h1 className={TITULO}>Editar o site</h1>
          <p className={`${SUB} mt-1`}>
            O essencial do convite — o site ao lado reage na hora.
          </p>
        </div>
      </div>

      <FormDetalhes
        eventId={event.id}
        voltar={voltar}
        host={hostDoEvento(event.subdomain)}
        rascunhoBase={rascunhoDoEvento(event)}
        inicial={inicial}
        nomeLabel={NOME_LABEL[event.type] ?? "Nome do evento"}
      />
    </div>
  );
}
