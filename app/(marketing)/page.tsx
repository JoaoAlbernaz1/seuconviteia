import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { appUrl } from "@/lib/tenant";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";
import { Pricing } from "@/components/marketing/Pricing";
import { Faq } from "@/components/marketing/Faq";

export const metadata: Metadata = {
  title: "seuconvite.ia — seu convite pronto em minutos, não em horas",
  description:
    "Esqueça horas montando convite no Canva. Preencha algumas informações, escolha o modelo e pronto: um convite digital lindo, com link exclusivo e confirmação de presença (RSVP). Para casamento, 15 anos e aniversário.",
};

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const CADASTRO = appUrl("/cadastrar", ROOT_DOMAIN);
const ENTRAR = appUrl("/entrar", ROOT_DOMAIN);
const CONTATO = "mailto:sac@seuconviteia.com";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#precos", label: "Preços" },
  { href: "#faq", label: "FAQ" },
] as const;

// Ticker de espaços de eventos (prova social — trocar por reais antes do launch).
// `v` = variante tipográfica p/ o mosaico de estilos do jitter.
const VENUES: { n: string; v: string }[] = [
  { n: "VILLA LAGO SUL", v: "caps" },
  { n: "Cerimonial Alvorada", v: "serif" },
  { n: "espaço ermida", v: "tight" },
  { n: "PONTÃO EVENTOS", v: "wide" },
  { n: "Casa Paranoá.", v: "brand" },
  { n: "Villa Jardins", v: "semi" },
  { n: "buffet pinheiros", v: "tight" },
  { n: "CASA IBIRAPUERA", v: "caps" },
  { n: "Mansão Urca", v: "serif" },
  { n: "Jardim da Lagoa", v: "serif" },
  { n: "santa teresa eventos", v: "tight" },
  { n: "Mansão Park Way", v: "semi" },
];

const STEPS: { t: string; d: string }[] = [
  {
    t: "Conte sobre o evento",
    d: "Nomes, data, local e o estilo da festa. A IA cuida do texto, das cores e do layout — nada de arrastar caixinhas.",
  },
  {
    t: "Escolha e ajuste",
    d: "Receba variações prontas do seu convite. Gostou? Troque uma foto, uma cor ou uma palavra em segundos.",
  },
  {
    t: "Envie o link",
    d: "Cada convidado recebe um link exclusivo e confirma presença ali mesmo. Você acompanha tudo em tempo real.",
  },
];

const TESTIMONIALS: { q: string; nome: string; papel: string; ini: string; av: string }[] = [
  {
    q: "Passei duas noites tentando fazer no Canva e desisti. Aqui o convite ficou pronto no intervalo do almoço — e muito mais bonito.",
    nome: "Rafael M.",
    papel: "Noivo · Casamento em Goiânia",
    ini: "R",
    av: "grad",
  },
  {
    q: "Uso com todos os meus clientes. O RSVP automático acabou com a planilha de confirmações — só abro o painel e está tudo lá.",
    nome: "Paulo Lemos",
    papel: "Cerimonialista · 40+ eventos/ano",
    ini: "P",
    av: "ink",
  },
  {
    q: "Fiz o convite dos 15 anos da minha filha em 10 minutos. Os convidados acharam que tinha sido feito por uma agência.",
    nome: "Bruno C.",
    papel: "Pai da debutante · São Paulo",
    ini: "B",
    av: "acc",
  },
];

export default function MarketingHome() {
  return (
    <div className="mkt">
      <RevealOnScroll />

      <MarketingNav links={NAV_LINKS} entrarHref={ENTRAR} cadastroHref={CADASTRO} />

      <main id="topo">
        {/* ───────────── HERO ───────────── */}
        <section className="hero" aria-labelledby="hero-h">
          <span className="eyebrow" data-rv="">Convites digitais com RSVP automático</span>
          <h1 id="hero-h" className="h1" data-rv="" style={{ "--d": "60ms" } as CSSProperties}>
            Seu convite pronto.<br />Em minutos, não em horas.
          </h1>
          <p className="sub" data-rv="" style={{ "--d": "120ms" } as CSSProperties}>
            Esqueça horas montando convite no Canva. Preencha algumas informações, escolha o modelo e
            pronto: um convite digital lindo, com link exclusivo e confirmação de presença.
          </p>
          <div className="cta-row" data-rv="" style={{ "--d": "180ms" } as CSSProperties}>
            <a className="btn primary" href={CADASTRO}>Criar meu convite agora</a>
            <a className="btn soft" href="#como-funciona">Ver como funciona</a>
          </div>
          <p className="hero-note" data-rv="" style={{ "--d": "220ms" } as CSSProperties}>
            Sem precisar saber design · Pronto para casamento, aniversário e 15 anos
          </p>

          {/* prova social + ticker de espaços */}
          <div className="proof" data-rv="" style={{ "--d": "280ms" } as CSSProperties}>
            <p className="proof-line">
              <b>Mais de 12.000 convites criados</b> nos principais espaços de eventos de Brasília,
              São Paulo e Rio de Janeiro.
            </p>
            <div className="marquee" aria-hidden>
              <div className="mq-track">
                {[...VENUES, ...VENUES].map((v, i) => (
                  <span key={i} className={`mq-item v-${v.v}`}>{v.n}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── COMO FUNCIONA ───────────── */}
        <section className="sec" id="como-funciona">
          <div className="sec-head">
            <h2 className="h2" data-rv="">Três passos. Só isso.</h2>
            <p className="lead" data-rv="">
              Se você sabe preencher um formulário, sabe criar um convite no seuconvite.ia.
            </p>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={s.t} className="step" data-rv="" style={{ "--d": `${i * 70}ms` } as CSSProperties}>
                <span className="step-no">{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── DEPOIMENTOS ───────────── */}
        <section className="sec" id="depoimentos">
          <div className="sec-head">
            <h2 className="h2" data-rv="">Quem já convidou, aprova.</h2>
          </div>
          <div className="tmns">
            {TESTIMONIALS.map((t, i) => (
              <figure key={t.nome} className="tmn" data-rv="" style={{ "--d": `${i * 70}ms` } as CSSProperties}>
                <blockquote>{t.q}</blockquote>
                <figcaption className="tmn-by">
                  <span className={`tmn-av ${t.av}`} aria-hidden>{t.ini}</span>
                  <span className="tmn-id">
                    <b>{t.nome}</b>
                    <span>{t.papel}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ───────────── PREÇOS ───────────── */}
        <Pricing id="precos" cadastroHref={CADASTRO} />

        {/* ───────────── FAQ ───────────── */}
        <Faq id="faq" />

        {/* ───────────── CTA FINAL ───────────── */}
        <section className="sec finale-wrap">
          <div className="finale" data-rv="">
            <h2>A festa é sua.<br />O convite é com a gente.</h2>
            <p>Crie seu primeiro convite agora e veja como é rápido. Leva menos tempo que escolher o bolo.</p>
            <a className="btn primary" href={CADASTRO}>Criar meu convite agora</a>
          </div>
        </section>

        {/* ───────────── FOOTER ───────────── */}
        <footer className="foot">
          <a className="foot-brand" href="#topo" aria-label="seuconvite.ia — início">
            seuconvite<span className="ia">.ia</span>
          </a>
          <nav className="foot-links" aria-label="Rodapé">
            <a href={CONTATO}>Termos de uso</a>
            <a href={CONTATO}>Privacidade</a>
            <a href={CONTATO}>Contato</a>
          </nav>
          <div className="foot-copy">© 2026 seuconvite.ia</div>
        </footer>
      </main>
    </div>
  );
}
