// Tela "Lista de presentes" (mockup DARK) — chave Pix + QR opcional + texto +
// itens, com PREVIEW AO VIVO da página de presentes ao lado. Carrega o evento do
// dono (404 se não for) e serializa o estado inicial: dados do Pix vindos do
// `customization` e os presentes já cadastrados (valor em BRL para edição).
import {
  carregarEventoDono,
  hostDoEvento,
  lerCustomStr,
  voltarDe,
} from "../_carregar";
import { rascunhoDoEvento } from "@/lib/previewEvento";
import { PresentesCliente } from "./PresentesCliente";

export const dynamic = "force-dynamic";

export default async function PresentesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await carregarEventoDono(id);
  const c = event.customization;

  return (
    <PresentesCliente
      eventId={event.id}
      voltar={voltarDe(sp, `/painel/${event.id}`)}
      host={hostDoEvento(event.subdomain)}
      tipo={event.type}
      rascunhoBase={rascunhoDoEvento(event)}
      pixNomeInicial={lerCustomStr(c, "pixNome") ?? ""}
      pixChaveInicial={lerCustomStr(c, "pixChave") ?? ""}
      pixQrUrlInicial={lerCustomStr(c, "pixQrUrl") ?? ""}
      presentesTextoInicial={lerCustomStr(c, "presentesTexto") ?? ""}
      giftsIniciais={event.gifts.map((g) => ({
        titulo: g.title,
        valor:
          g.priceCents > 0
            ? (g.priceCents / 100).toFixed(2).replace(".", ",")
            : "",
      }))}
    />
  );
}
