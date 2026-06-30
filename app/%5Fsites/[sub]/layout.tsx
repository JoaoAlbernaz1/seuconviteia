// Layout do site publico do evento (servido por subdominio, ex.: maria-clara.<root>).
// Porta o "chrome" do festa-15-maria-clara (atmosfera + nav + rodape) e aplica o
// PRESET de cor do evento (vars `--ev-*`) + as 4 fontes via next/font, tudo num
// wrapper `.evt`. Data-driven: carrega o Event pelo subdominio (cacheado por
// request, compartilhado com a page). Sem PwaRegister/AppTabBar/Seal/Intro.
import { Cormorant, Jost } from "next/font/google";
import localFont from "next/font/local";

import { SiteAtmosphere } from "@/components/evt/SiteAtmosphere";
import { SiteNav } from "@/components/evt/SiteNav";
import { SiteFooter } from "@/components/evt/SiteFooter";
import { carregarEventoFesta, lerEventoFesta } from "@/lib/eventoFesta";
import { eventoPublico } from "@/lib/event";
import { acentoDoTema, varsDoTema, TEMA_PADRAO } from "@/lib/temas";
import { coresParticulas } from "@/lib/cor";
import { recursosDoPlano } from "@/lib/plans";

// ── Tipografia (igual ao festa) ───────────────────────────────────────────────
//  Script  = Milton One  (local)  -> --font-milton    -> token evt-script
//  Display = Classy Vogue (local) -> --font-vogue     -> token evt-display
//  Body    = Cormorant (google)   -> --font-cormorant -> token evt-body
//  Utility = Jost (google)        -> --font-jost      -> token evt-util
const milton = localFont({
  src: "../../fonts/MiltonOneBold.otf",
  variable: "--font-milton",
  display: "swap",
});
const vogue = localFont({
  src: "../../fonts/ClassyVogueRegular.ttf",
  variable: "--font-vogue",
  display: "swap",
});
const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

const FONT_VARS = `${milton.variable} ${vogue.variable} ${cormorant.variable} ${jost.variable}`;

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

  // Gating por upsell do evento: a nav filtra os links; o rodape e a marca d'agua
  // dependem de `purchased` (preview x comprado). Comprado + marca do profissional
  // -> credito do profissional; senao, credito da plataforma.
  const recursos = recursosDoPlano(event.plan);
  const brandName = event.professional?.brandName ?? event.professional?.name;

  return (
    <div
      className={`evt font-evt-body text-evt-ink flex min-h-full flex-1 flex-col ${FONT_VARS}`}
      style={varsDoTema(tema)}
    >
      <SiteAtmosphere fotoUrl={dados.fotoUrl} particleColors={particleColors} />
      <SiteNav nome={dados.primeiroNome} recursos={recursos} />
      {children}
      <SiteFooter
        nome={dados.primeiroNome}
        linhaInfo={dados.footerInfo}
        whiteLabel={recursos.whiteLabel}
        brandName={brandName}
      />
    </div>
  );
}
