// Tela "Fotos do site" (mockup DARK) — capa + álbum + foto da lista de presentes,
// com PREVIEW AO VIVO do site de verdade ao lado. Carrega o evento do dono (404
// se não for), lê as URLs salvas em `customization` e as fotos do álbum, e passa
// o estado inicial pro cliente montar o formulário + a prévia.
import {
  carregarEventoDono,
  hostDoEvento,
  lerCustomStr,
  voltarDe,
} from "../_carregar";
import { rascunhoDoEvento } from "@/lib/previewEvento";
import { lerTemaKey } from "@/lib/temas";
import { FotosCliente } from "./FotosCliente";

export const dynamic = "force-dynamic";

export default async function FotosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await carregarEventoDono(id);

  return (
    <FotosCliente
      eventId={event.id}
      voltar={voltarDe(sp, `/painel/${event.id}`)}
      host={hostDoEvento(event.subdomain)}
      tema={lerTemaKey(event.customization)}
      rascunhoBase={rascunhoDoEvento(event)}
      fotoUrlInicial={lerCustomStr(event.customization, "fotoUrl") ?? ""}
      presentesFotoUrlInicial={
        lerCustomStr(event.customization, "presentesFotoUrl") ?? ""
      }
      fotosIniciais={event.photos.map((p) => p.url)}
    />
  );
}
