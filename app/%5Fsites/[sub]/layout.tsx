// Layout do site publico do evento (servido por subdominio, ex.: maria-clara.<root>).
// Porta o "chrome" do festa-15-maria-clara (atmosfera + nav + rodape) e aplica o
// PRESET de cor (vars `--ev-*`) + a DUPLA DE FONTES do evento (vars `--ev-font-*`,
// fontes carregadas em app/evt-fonts.ts), tudo num wrapper `.evt`. Data-driven:
// carrega o Event pelo subdominio (cacheado por request, compartilhado com a page).
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { SiteAtmosphere } from "@/components/evt/SiteAtmosphere";
import { SiteNav } from "@/components/evt/SiteNav";
import { SiteFooter } from "@/components/evt/SiteFooter";
import { carregarEventoFesta } from "@/lib/eventoFestaDb";
import { comFotosDemo } from "@/lib/demoFotos";
import { eventoPublico } from "@/lib/event";
import { acentoDoTema, varsDoTema, TEMA_PADRAO } from "@/lib/temas";
import { lerFonteKey, lerFontesCustom, lerTamanhoTexto, varsDaFonteCombinada, fonteCapsCombinada, fonteTemNegritoNoNome } from "@/lib/fontes";
import { coresParticulas } from "@/lib/cor";
import { planoDoSite, planoPermite } from "@/lib/plans";
import { recursosDoSite } from "@/lib/recursos";
import { publishedEditorDocument } from "@/lib/event-editor/public-document";

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

  const dados = comFotosDemo(event);
  const tema = dados.tema;
  const temaCor = dados.temaCor;
  // Particulas: no tema "rose" usa o trio EXATO do festa (default do componente);
  // nos demais presets / cor personalizada, deriva as faiscas do acento p/ re-tingir.
  const particleColors =
    tema === TEMA_PADRAO ? undefined : coresParticulas(acentoDoTema(tema, temaCor));

  // Dupla de fontes do evento: vars `--ev-font-*` + classe de versal espacada
  // quando a dupla nao tem cursiva (Moderna/Minimalista).
  const fonteKey = lerFonteKey(event.customization);
  const fontesCustom = lerFontesCustom(event.customization);
  const fonteCaps = fonteCapsCombinada(fonteKey, fontesCustom) ? " evt-fonte-caps" : "";
  // "Letra em negrito": engrossa titulos/corpo/utilitarios; o NOME da capa so
  // acompanha nas letras que tem peso forte publicado (ver lib/fontes.ts).
  const negrito = dados.negrito
    ? ` evt-negrito${fonteTemNegritoNoNome(fonteKey, fontesCustom) ? " evt-negrito-nome" : ""}`
    : "";

  // Recursos ATIVOS = plano permite ∩ toggle do evento (lib/recursos). A nav
  // filtra os links; o rodape/white-label continua so por plano.
  const recursos = recursosDoSite(planoDoSite(event, new Date()), event.customization);
  const whiteLabel = planoPermite(planoDoSite(event, new Date()), "whiteLabel");
  // Só a marca EXPLÍCITA do profissional (não vaza o nome interno da conta): sem
  // brandName, o rodapé white-label fica sem crédito (como o site real da festa).
  const brandName = event.professional?.brandName ?? undefined;
  const publishedDocument = publishedEditorDocument(event);
  const footerEnabled = publishedDocument?.footer.enabled ?? true;

  return (
    <div
      className={`evt${fonteCaps}${negrito}${dados.animacoes ? "" : " evt-sem-anim"} font-evt-body text-evt-ink flex min-h-full flex-1 flex-col ${EVT_FONTS_CLASS}`}
      style={{ ...varsDoTema(tema, temaCor), ...varsDaFonteCombinada(fonteKey, fontesCustom, lerTamanhoTexto(event.customization)) }}
    >
      <SiteAtmosphere fotoUrl={dados.fotoUrl} particleColors={particleColors} />
      <SiteNav nome={dados.primeiroNome} logoUrl={dados.logoUrl} monograma={dados.monograma} recursos={recursos} />
      {children}
      {footerEnabled && (
        <SiteFooter
          nome={dados.primeiroNome}
          linhaInfo={dados.footerInfo}
          mensagem={dados.rodapeMsg}
          whiteLabel={whiteLabel}
          brandName={brandName}
        />
      )}
    </div>
  );
}
