// Preview AO VIVO do editor — renderiza o SITE DE VERDADE (mesmo wrapper .evt,
// mesmos componentes de pagina do subdominio) a partir do RASCUNHO do form,
// serializado em `?s=` pelo editor. Carregado dentro do iframe da moldura de
// celular/notebook: o que o profissional ve aqui e pixel a pixel o que publica.
//
// `?p=` escolhe a pagina (inicio | evento | presentes | galeria). Os gates sao
// os MESMOS do site (recurso ativo = plano real da conta ∩ toggle do rascunho),
// entao desligar um recurso some na hora — inclusive a pagina bloqueada.
// Links/botoes ficam inertes (e uma previa, nao navegacao).
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerRascunho, eventoDoRascunho } from "@/lib/previewEvento";
import { lerEventoFesta } from "@/lib/eventoFesta";
import { preencherFotosDemo } from "@/lib/demoFotos";
import { ocasiaoDoNicho } from "@/lib/templates";
import { acentoDoTema, varsDoTema, TEMA_PADRAO, lerTemaKey, lerTemaCor } from "@/lib/temas";
import { lerFonteKey, lerFontesCustom, varsDaFonteCombinada, fonteCapsCombinada } from "@/lib/fontes";
import { coresParticulas } from "@/lib/cor";
import { planoPermite, podeVitrine } from "@/lib/plans";
import { recursosDoSite } from "@/lib/recursos";

import { SiteAtmosphere } from "@/components/evt/SiteAtmosphere";
import { SiteNav } from "@/components/evt/SiteNav";
import { SiteFooter } from "@/components/evt/SiteFooter";
import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { PaginaInicio } from "@/components/evt/paginas/PaginaInicio";
import { PaginaEvento } from "@/components/evt/paginas/PaginaEvento";
import { PaginaPresentes } from "@/components/evt/paginas/PaginaPresentes";
import { PaginaGaleria } from "@/components/evt/paginas/PaginaGaleria";
import { PaginaRecados } from "@/components/evt/paginas/PaginaRecados";
import { PaginaObrigada } from "@/components/evt/paginas/PaginaObrigada";
import { RsvpConvite } from "@/components/evt/RsvpConvite";
import { lerRsvpConfig } from "@/lib/rsvpConfig";
import { PreviewFoco } from "@/components/evt/PreviewFoco";

export const dynamic = "force-dynamic";

export default async function PreviewEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; p?: string; f?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  // O plano que gateia o preview e o REAL da conta (nunca vem do cliente).
  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { plan: true, name: true, brandName: true },
  });
  if (!prof) redirect("/entrar");

  const { s, p, f } = await searchParams;
  const SECOES_OK = [
    "capa", "capa-nome", "capa-idade", "monograma",
    "carta", "carta-titulo", "carta-texto", "assinatura", "livre-textos",
    "quando", "onde", "traje", "programacao", "cta", "presentes", "galeria",
    "rsvp", "rsvp-extras", "pix", "recados", "rodape",
    "obrigada-sim", "obrigada-nao",
  ];
  const foco = typeof f === "string" && SECOES_OK.includes(f) ? f : undefined;
  const rascunho = lerRascunho(typeof s === "string" ? s : undefined);
  const sintetico = eventoDoRascunho(rascunho);
  // No preview, capa/álbum vazios são preenchidos com fotos de exemplo — o
  // profissional vê o template POVOADO (nunca capa vazia). Só no preview.
  const evento = preencherFotosDemo(
    lerEventoFesta(sintetico),
    ocasiaoDoNicho(sintetico.type),
  );

  const tema = lerTemaKey(sintetico.customization);
  const temaCor = lerTemaCor(sintetico.customization);
  const particleColors =
    tema === TEMA_PADRAO ? undefined : coresParticulas(acentoDoTema(tema, temaCor));
  const fonteKey = lerFonteKey(sintetico.customization);
  const fontesCustom = lerFontesCustom(sintetico.customization);
  const fonteCaps = fonteCapsCombinada(fonteKey, fontesCustom) ? " evt-fonte-caps" : "";

  const recursos = recursosDoSite(prof.plan, sintetico.customization);
  const whiteLabel = planoPermite(prof.plan, "whiteLabel");

  const pagina =
    p === "evento" || p === "presentes" || p === "galeria" || p === "confirmar" || p === "recados" || p === "obrigada"
      ? p
      : "inicio";

  // Presentear na PRÉVIA: reflete os modos (fixo/cotas/a partir de) do rascunho.
  // Nada arrecadado ainda (é preview) e os botões ficam inertes no preview.
  const usarVitrinePreview = rascunho.listaModelo === "vitrine" && podeVitrine(prof.plan);
  const presentearPreview = {
    eventId: "preview",
    itens: (rascunho.presentes ?? []).map((p, i) => {
      const ehLink = p.tipo === "LINK";
      const reais = parseFloat((p.valor ?? "").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
      const priceCents = Math.round(reais * 100);
      return {
        id: `preview-${i}`,
        titulo: p.titulo,
        valorLabel: undefined,
        tipo: ehLink ? ("LINK" as const) : ("PIX" as const),
        storeUrl: ehLink ? p.link || undefined : undefined,
        imageUrl: p.foto || undefined,
        pricingMode: p.modo ?? ("FIXO" as const),
        priceCents,
        quotaCount: p.cotas ?? null,
        cotasVendidas: 0,
        arrecadadoCents: 0,
        esgotado: false,
      };
    }),
  };

  let corpo: React.ReactNode;
  if (pagina === "evento") {
    corpo = (
      <PaginaEvento evento={evento} nicho={sintetico.type} recursos={recursos} />
    );
  } else if (pagina === "presentes") {
    corpo = recursos.presentes ? (
      <PaginaPresentes evento={evento} nicho={sintetico.type} recursos={recursos} presentear={presentearPreview} usarVitrine={usarVitrinePreview} />
    ) : (
      <RecursoIndisponivel
        titulo="Lista de presentes"
        texto="Este convite não tem lista de presentes."
      />
    );
  } else if (pagina === "galeria") {
    corpo = recursos.galeria ? (
      <PaginaGaleria evento={evento} nicho={sintetico.type} recursos={recursos} />
    ) : (
      <RecursoIndisponivel
        titulo="Galeria indisponível"
        texto="A galeria de fotos não está disponível neste convite."
      />
    );
  } else if (pagina === "confirmar") {
    corpo = recursos.rsvp ? (
      <RsvpConvite
        eventId="preview"
        nome={evento.primeiroNome}
        fotoUrl={evento.fotoUrl}
        config={lerRsvpConfig(sintetico.customization)}
        preview
      />
    ) : (
      <RecursoIndisponivel
        titulo="Confirmação indisponível"
        texto="A confirmação de presença não está ativa neste convite."
      />
    );
  } else if (pagina === "recados") {
    corpo = recursos.recados ? (
      <PaginaRecados evento={evento} nicho={sintetico.type} recursos={recursos} preview />
    ) : (
      <RecursoIndisponivel
        titulo="Recados indisponíveis"
        texto="O mural de recados não está ativo neste convite."
      />
    );
  } else if (pagina === "obrigada") {
    // Tela de agradecimento — o foco escolhe a variante (quem vai / quem não vai).
    corpo = recursos.rsvp ? (
      <PaginaObrigada
        evento={evento}
        config={lerRsvpConfig(sintetico.customization)}
        vai={foco !== "obrigada-nao"}
      />
    ) : (
      <RecursoIndisponivel
        titulo="Confirmação indisponível"
        texto="A confirmação de presença não está ativa neste convite."
      />
    );
  } else {
    corpo = (
      <PaginaInicio evento={evento} nicho={sintetico.type} recursos={recursos} />
    );
  }

  return (
    <div
      className={`evt${fonteCaps}${evento.animacoes ? "" : " evt-sem-anim"} font-evt-body text-evt-ink flex min-h-full flex-1 flex-col ${EVT_FONTS_CLASS} [&_a]:pointer-events-none [&_button]:pointer-events-none [&_header_a]:pointer-events-auto [&_header_button]:pointer-events-auto`}
      style={{ ...varsDoTema(tema, temaCor), ...varsDaFonteCombinada(fonteKey, fontesCustom) }}
    >
      <SiteAtmosphere fotoUrl={evento.fotoUrl} particleColors={particleColors} />
      <SiteNav
        nome={evento.primeiroNome}
        logoUrl={evento.logoUrl}
        monograma={evento.monograma}
        recursos={recursos}
        preview={{ s: typeof s === "string" ? s : "", pagina }}
      />
      {corpo}
      <PreviewFoco sec={foco} />
      <SiteFooter
        nome={evento.primeiroNome}
        linhaInfo={evento.footerInfo}
        mensagem={evento.rodapeMsg}
        whiteLabel={whiteLabel}
        brandName={prof.brandName ?? prof.name}
      />
    </div>
  );
}
