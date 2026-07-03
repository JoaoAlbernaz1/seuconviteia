// Tela "Programação" (mockup DARK) — a linha do tempo da festa, hora a hora, com
// PREVIEW AO VIVO da página /evento ao lado. Carrega o evento do dono (404 se não
// for) e lê a programação já salva em `customization` (ou começa com uma linha
// vazia). A gravação usa `salvarProgramacao` (action que retorna void).
import {
  carregarEventoDono,
  hostDoEvento,
  voltarDe,
} from "../_carregar";
import { rascunhoDoEvento } from "@/lib/previewEvento";
import { ProgramacaoCliente } from "./ProgramacaoCliente";

export const dynamic = "force-dynamic";

/** Lê a programação (array de {hora, titulo}) do customization, tolerante. */
function lerProgramacao(c: unknown): { hora: string; titulo: string }[] {
  if (c && typeof c === "object" && "programacao" in c) {
    const p = (c as { programacao?: unknown }).programacao;
    if (Array.isArray(p)) {
      return p
        .filter(
          (x): x is Record<string, unknown> => !!x && typeof x === "object",
        )
        .map((x) => ({
          hora: typeof x.hora === "string" ? x.hora : "",
          titulo: typeof x.titulo === "string" ? x.titulo : "",
        }));
    }
  }
  return [];
}

export default async function ProgramacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await carregarEventoDono(id);

  const salva = lerProgramacao(event.customization);

  return (
    <ProgramacaoCliente
      eventId={event.id}
      voltar={voltarDe(sp, `/painel/${event.id}`)}
      host={hostDoEvento(event.subdomain)}
      tipo={event.type}
      rascunhoBase={rascunhoDoEvento(event)}
      programacaoInicial={salva.length ? salva : [{ hora: "", titulo: "" }]}
    />
  );
}
