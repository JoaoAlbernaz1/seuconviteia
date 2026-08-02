// Pagina /presentes do site publico (servida por subdominio). Porte fiel do
// festa-15-maria-clara (`app/presentes/page.tsx`): UM painel unico (foto +
// lista de presentes + Pix). Data-driven via `lerEventoFesta` (gifts do evento +
// Pix do customization). Pix DIRETO (copiar chave) — sem checkout/taxa.
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFesta";
import { comFotosDemo } from "@/lib/demoFotos";
import { recursosDoSite } from "@/lib/recursos";
import { prisma } from "@/lib/db";
import { podeVitrine } from "@/lib/plans";
import type { GiftPricing } from "@/lib/pagamentos/contribuicao";
import type { PresentearData, PresenteInterativo } from "@/lib/presentesTipos";

import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { PaginaPresentes } from "@/components/evt/paginas/PaginaPresentes";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function PresentesPage({
  params,
}: {
  params: Promise<{ sub: string }>;
}) {
  const { sub } = await params;
  const event = await carregarEventoFesta(sub);

  const visivel = eventoPublico(event, new Date());
  if (!visivel.ok || !event) {
    return <SiteIndisponivel motivo={visivel.motivo ?? "inexistente"} />;
  }

  // Recurso "presentes" desligado no evento -> pagina indisponivel (o link ja
  // some da nav; isto cobre o acesso direto pela URL).
  if (!recursosDoSite(event.plan, event.customization).presentes) {
    return (
      <RecursoIndisponivel
        titulo="Lista de presentes"
        texto="Este convite não tem lista de presentes."
      />
    );
  }

  const presentear = await montarPresentear(event);
  const modelo = (event.customization as { listaModelo?: string } | null)?.listaModelo;
  const usarVitrine = modelo === "vitrine" && podeVitrine(event.plan);

  return (
    <PaginaPresentes
      evento={comFotosDemo(event)}
      nicho={event.type}
      recursos={recursosDoSite(event.plan, event.customization)}
      presentear={presentear}
      usarVitrine={usarVitrine}
    />
  );
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Monta o payload interativo da lista (Pix via plataforma): junta cada gift do
 * evento com o quanto já foi arrecadado (contribuições PAGAS, agregadas por item).
 * Fica aqui (server) para NÃO tocar o pipeline puro `lerConteudo`/`EventoFesta`.
 */
async function montarPresentear(event: {
  id: string;
  gifts: {
    id: string;
    title: string;
    priceCents: number;
    pricingMode: string;
    quotaCount: number | null;
    purchased: boolean;
    mode: string;
    storeUrl: string | null;
    imageUrl: string | null;
  }[];
}): Promise<PresentearData> {
  const sums = await prisma.giftContribution.groupBy({
    by: ["giftItemId"],
    where: { eventId: event.id, status: "PAID" },
    _sum: { grossCents: true, quotas: true },
  });
  const porItem = new Map(sums.map((s) => [s.giftItemId, s._sum]));

  const itens: PresenteInterativo[] = event.gifts.map((g) => {
    const ehLink = g.mode === "ITEM";
    const soma = porItem.get(g.id);
    const arrecadadoCents = soma?.grossCents ?? 0;
    const cotasVendidas = soma?.quotas ?? 0;
    const mode = g.pricingMode as GiftPricing;
    const esgotado =
      !ehLink &&
      (g.purchased ||
        (mode === "FIXO" && arrecadadoCents >= g.priceCents) ||
        (mode === "COTAS" && g.quotaCount != null && cotasVendidas >= g.quotaCount));
    return {
      id: g.id,
      titulo: g.title,
      valorLabel: !ehLink && g.priceCents > 0 ? brl.format(g.priceCents / 100) : undefined,
      tipo: ehLink ? "LINK" : "PIX",
      storeUrl: ehLink ? g.storeUrl ?? undefined : undefined,
      imageUrl: ehLink ? g.imageUrl ?? undefined : undefined,
      pricingMode: mode,
      priceCents: g.priceCents,
      quotaCount: g.quotaCount,
      cotasVendidas,
      arrecadadoCents,
      esgotado,
    };
  });

  return { eventId: event.id, itens };
}
