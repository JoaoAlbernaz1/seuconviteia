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
import { acentoDoTema, varsDoTema, TEMA_PADRAO, lerTemaKey } from "@/lib/temas";
import { fonteDupla, lerFonteKey, varsDaFonte } from "@/lib/fontes";
import { coresParticulas } from "@/lib/cor";
import { planoPermite } from "@/lib/plans";
import { recursosDoSite } from "@/lib/recursos";

import { SiteAtmosphere } from "@/components/evt/SiteAtmosphere";
import { SiteNav } from "@/components/evt/SiteNav";
import { SiteFooter } from "@/components/evt/SiteFooter";
import { RecursoIndisponivel } from "@/components/evt/RecursoIndisponivel";
import { PaginaInicio } from "@/components/evt/paginas/PaginaInicio";
import { PaginaEvento } from "@/components/evt/paginas/PaginaEvento";
import { PaginaPresentes } from "@/components/evt/paginas/PaginaPresentes";
import { PaginaGaleria } from "@/components/evt/paginas/PaginaGaleria";

export const dynamic = "force-dynamic";

export default async function PreviewEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; p?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  // O plano que gateia o preview e o REAL da conta (nunca vem do cliente).
  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { plan: true, name: true, brandName: true },
  });
  if (!prof) redirect("/entrar");

  const { s, p } = await searchParams;
  const rascunho = lerRascunho(typeof s === "string" ? s : undefined);
  const sintetico = eventoDoRascunho(rascunho);
  // No preview, capa/álbum vazios são preenchidos com fotos de exemplo — o
  // profissional vê o template POVOADO (nunca capa vazia). Só no preview.
  const evento = preencherFotosDemo(
    lerEventoFesta(sintetico),
    ocasiaoDoNicho(sintetico.type),
  );

  const tema = lerTemaKey(sintetico.customization);
  const particleColors =
    tema === TEMA_PADRAO ? undefined : coresParticulas(acentoDoTema(tema));
  const fonteKey = lerFonteKey(sintetico.customization);
  const fonteCaps = fonteDupla(fonteKey).caps ? " evt-fonte-caps" : "";

  const recursos = recursosDoSite(prof.plan, sintetico.customization);
  const whiteLabel = planoPermite(prof.plan, "whiteLabel");

  const pagina =
    p === "evento" || p === "presentes" || p === "galeria" ? p : "inicio";

  let corpo: React.ReactNode;
  if (pagina === "evento") {
    corpo = (
      <PaginaEvento evento={evento} nicho={sintetico.type} recursos={recursos} />
    );
  } else if (pagina === "presentes") {
    corpo = recursos.presentes ? (
      <PaginaPresentes evento={evento} nicho={sintetico.type} recursos={recursos} />
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
  } else {
    corpo = (
      <PaginaInicio evento={evento} nicho={sintetico.type} recursos={recursos} />
    );
  }

  return (
    <div
      className={`evt${fonteCaps} font-evt-body text-evt-ink flex min-h-full flex-1 flex-col ${EVT_FONTS_CLASS} [&_a]:pointer-events-none [&_button]:pointer-events-none [&_header_a]:pointer-events-auto [&_header_button]:pointer-events-auto`}
      style={{ ...varsDoTema(tema), ...varsDaFonte(fonteKey) }}
    >
      <SiteAtmosphere fotoUrl={evento.fotoUrl} particleColors={particleColors} />
      <SiteNav
        nome={evento.primeiroNome}
        recursos={recursos}
        preview={{ s: typeof s === "string" ? s : "", pagina }}
      />
      {corpo}
      <SiteFooter
        nome={evento.primeiroNome}
        linhaInfo={evento.footerInfo}
        whiteLabel={whiteLabel}
        brandName={prof.brandName ?? prof.name}
      />
    </div>
  );
}
