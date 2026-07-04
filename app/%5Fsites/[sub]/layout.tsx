// Layout do site publico do evento (servido por subdominio, ex.: maria-clara.<root>).
// Porta o "chrome" do festa-15-maria-clara (atmosfera + nav + rodape) e aplica o
// PRESET de cor (vars `--ev-*`) + a DUPLA DE FONTES do evento (vars `--ev-font-*`,
// fontes carregadas em app/evt-fonts.ts), tudo num wrapper `.evt`. Data-driven:
// carrega o Event pelo subdominio (cacheado por request, compartilhado com a page).
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { SiteAtmosphere } from "@/components/evt/SiteAtmosphere";
import { SiteNav } from "@/components/evt/SiteNav";
import { SiteFooter } from "@/components/evt/SiteFooter";
import { carregarEventoFesta, lerEventoFesta } from "@/lib/eventoFesta";
import { eventoPublico } from "@/lib/event";
import { acentoDoTema, varsDoTema, TEMA_PADRAO } from "@/lib/temas";
import { templatePorId } from "@/lib/templates";
import { fonteDupla, lerFonteKey, varsDaFonte } from "@/lib/fontes";
import { coresParticulas } from "@/lib/cor";
import { planoPermite } from "@/lib/plans";
import { recursosDoSite } from "@/lib/recursos";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

export default async function EventSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sub: string }>;
}) {
  const { sub } = await params;
  const event = await carregarEventoFesta(sub);
  const visivel = eventoPublico(event, new Date());

  // Evento inexistente / rascunho / expirado -> a page renderiza <SiteIndisponivel>
  // sozinha (sem o chrome do convite, que ficaria estranho ao redor do aviso).
  if (!visivel.ok || !event) {
    return <>{children}</>;
  }

  const dados = lerEventoFesta(event);
  const tema = dados.tema;
  // Particulas: no tema "rose" usa o trio EXATO do festa (default do componente);
  // nos demais presets, deriva as faiscas do acento p/ re-tingir.
  const particleColors =
    tema === TEMA_PADRAO ? undefined : coresParticulas(acentoDoTema(tema));

  // Dupla de fontes do evento: vars `--ev-font-*` + classe de versal espacada
  // quando a dupla nao tem cursiva (Moderna/Minimalista).
  const fonteKey = lerFonteKey(event.customization);
  const fonteCaps = fonteDupla(fonteKey).caps ? " evt-fonte-caps" : "";

  // Recursos ATIVOS = plano permite ∩ toggle do evento (lib/recursos). A nav
  // filtra os links; o rodape/white-label continua so por plano.
  const recursos = recursosDoSite(event.plan, event.customization);
  const whiteLabel = planoPermite(event.plan, "whiteLabel");
  const brandName = event.professional?.brandName ?? event.professional?.name;
  // Clima do template: "escuro" (noite) -> chrome (atmosfera/nav/rodape) escuro.
  const escuro = templatePorId(dados.templateId).clima === "escuro";

  return (
    <div
      className={`evt${fonteCaps} font-evt-body ${escuro ? "text-[#F3E4C4]" : "text-evt-ink"} flex min-h-full flex-1 flex-col ${EVT_FONTS_CLASS}`}
      style={{ ...varsDoTema(tema), ...varsDaFonte(fonteKey) }}
    >
      <SiteAtmosphere fotoUrl={dados.fotoUrl} particleColors={particleColors} dark={escuro} />
      <SiteNav nome={dados.primeiroNome} recursos={recursos} dark={escuro} />
      {children}
      <SiteFooter
        nome={dados.primeiroNome}
        linhaInfo={dados.footerInfo}
        whiteLabel={whiteLabel}
        brandName={brandName}
        dark={escuro}
      />
    </div>
  );
}
