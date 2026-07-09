import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { appUrl } from "@/lib/tenant";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Planos } from "@/components/marketing/Planos";

export const metadata: Metadata = {
  title: "seuconvite.ia — seu convite pronto em minutos, não em horas",
  description:
    "Convites digitais com RSVP automático. Preencha algumas informações, escolha o modelo e pronto: um convite lindo, com link exclusivo e confirmação de presença — sem saber design.",
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

// ── Dados ─────────────────────────────────────────────────────────────────────
const STEPS: { n: string; t: string; d: string }[] = [
  { n: "1", t: "Conte sobre o evento", d: "Nomes, data, local e o estilo da festa. A IA cuida do texto, das cores e do layout — nada de arrastar caixinhas." },
  { n: "2", t: "Escolha e ajuste", d: "Receba variações prontas do seu convite. Gostou? Troque uma foto, uma cor ou uma palavra em segundos." },
  { n: "3", t: "Envie o link", d: "Cada convidado recebe um link exclusivo e confirma presença ali mesmo. Você acompanha tudo em tempo real." },
];

const DEPOIMENTOS: { q: string; nm: string; rl: string; av: "j" | "p" | "r"; ini: string }[] = [
  { q: "“Passei duas noites tentando fazer no Canva e desisti. Aqui o convite ficou pronto no intervalo do almoço — e muito mais bonito.”", nm: "Juliana M.", rl: "Noiva · Casamento em Goiânia", av: "j", ini: "J" },
  { q: "“Uso com todas as minhas noivas. O RSVP automático acabou com a planilha de confirmações — só abro o painel e está tudo lá.”", nm: "Patrícia Lemos", rl: "Cerimonialista · 40+ eventos/ano", av: "p", ini: "P" },
  { q: "“Fiz o convite dos 15 anos da minha filha em 10 minutos. Os convidados acharam que tinha sido feito por uma agência.”", nm: "Renata C.", rl: "Mãe da debutante · São Paulo", av: "r", ini: "R" },
];

// Fita de locais (marca própria de cada wordmark). Renderizada 2x p/ loop contínuo.
type Logo = { t: string; ff: "disp" | "inter" | "georgia"; w: number; s: number; ls: number; it?: boolean; dot?: boolean };
const LOGOS: Logo[] = [
  { t: "VILLA LAGO SUL", ff: "disp", w: 800, s: 22, ls: 2.5 },
  { t: "Cerimonial Alvorada", ff: "georgia", w: 400, s: 25, ls: -0.3, it: true },
  { t: "espaço ermida", ff: "inter", w: 600, s: 23, ls: -1 },
  { t: "PONTÃO EVENTOS", ff: "inter", w: 400, s: 20, ls: 4 },
  { t: "Casa Paranoá", ff: "disp", w: 800, s: 24, ls: -0.8, dot: true },
  { t: "Villa Jardins", ff: "disp", w: 600, s: 24, ls: -0.6 },
  { t: "buffet pinheiros", ff: "inter", w: 500, s: 22, ls: -0.4 },
  { t: "CASA IBIRAPUERA", ff: "disp", w: 800, s: 21, ls: 3 },
  { t: "Mansão Urca", ff: "georgia", w: 400, s: 24, ls: -0.5 },
  { t: "Jardim da Lagoa", ff: "georgia", w: 400, s: 25, ls: -0.2, it: true },
  { t: "santa teresa eventos", ff: "inter", w: 600, s: 22, ls: -1 },
  { t: "Mansão Park Way", ff: "disp", w: 600, s: 24, ls: -0.6 },
];

const FAM: Record<Logo["ff"], string> = {
  disp: "var(--font-mktdisplay), sans-serif",
  inter: "var(--font-inter), sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
};

function LogoRun() {
  return (
    <>
      {LOGOS.map((l, i) => (
        <span
          key={i}
          style={{ fontFamily: FAM[l.ff], fontWeight: l.w, fontSize: l.s, letterSpacing: `${l.ls}px`, fontStyle: l.it ? "italic" : "normal" } as CSSProperties}
        >
          {l.t}
          {l.dot ? <span style={{ color: "#a981ff" }}>.</span> : null}
        </span>
      ))}
    </>
  );
}

const FAQ: { q: string; a: string }[] = [
  { q: "Preciso saber design para usar?", a: "Não. Você só responde algumas perguntas sobre o evento e a IA monta o convite inteiro: texto, cores, tipografia e layout. Se quiser mexer em algo, é só clicar e trocar." },
  { q: "Como os convidados confirmam presença?", a: "Cada convidado recebe um link do convite. Ao abrir, ele toca em “Vou confirmar” e pronto — a confirmação aparece na sua lista em tempo real, sem planilha e sem grupo de WhatsApp." },
  { q: "Qual a diferença para o Canva?", a: "No Canva você monta uma imagem estática, do zero, arrastando elementos. Aqui o convite nasce pronto, é interativo (link, mapa, fotos) e ainda coleta as confirmações de presença para você." },
  { q: "Posso cancelar a assinatura quando quiser?", a: "Sim, direto no painel, sem multa e sem ligação. Os convites já publicados continuam no ar até a data dos eventos." },
  { q: "Sou cerimonialista. Consigo usar para vários clientes?", a: "Sim. O plano Cerimonialista tem um painel com todos os seus eventos, lista de convidados exportável e opção de colocar a sua marca nos convites." },
];

export default function MarketingHome() {
  return (
    <div className="mkt" id="topo">
      <MarketingNav links={NAV_LINKS} entrarHref={ENTRAR} cadastroHref={CADASTRO} />

      {/* ───────────── HERO ───────────── */}
      <section className="hero" aria-labelledby="hero-h">
        <span className="badge reveal r1">Convites digitais com RSVP automático</span>
        <h1 id="hero-h" className="title reveal r2">
          Seu convite pronto.<br />Em minutos, não em horas.
        </h1>
        <p className="hero-sub reveal r3">
          Esqueça horas montando convite no Canva. Preencha algumas informações, escolha o modelo e pronto: um convite digital lindo, com link exclusivo e confirmação de presença.
        </p>
        <div className="hero-cta reveal r4">
          <a className="btn accent lg" href={CADASTRO}>Criar meu convite agora</a>
          <a className="btn soft lg" href="#como-funciona">Ver como funciona</a>
        </div>
        <p className="hero-micro reveal r5">Sem precisar saber design · Pronto para casamento, aniversário e 15 anos</p>

        <div className="proof reveal r5">
          <p><b>Mais de 12.000 convites criados</b> nos principais espaços de eventos de Brasília, São Paulo e Rio de Janeiro.</p>
          <div className="marquee" aria-hidden>
            <div className="marquee-track">
              <LogoRun />
              <LogoRun />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── COMO FUNCIONA ───────────── */}
      <section id="como-funciona" className="sec">
        <h2 className="h2">Três passos. Só isso.</h2>
        <p className="h2-sub">Se você sabe preencher um formulário, sabe criar um convite no seuconvite.ia.</p>
        <div className="grid3">
          {STEPS.map((s) => (
            <div key={s.n} className="step">
              <div className="num disp">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── DEPOIMENTOS ───────────── */}
      <section id="depoimentos" className="sec">
        <h2 className="h2">Quem já convidou, aprova.</h2>
        <div className="grid3">
          {DEPOIMENTOS.map((d) => (
            <div key={d.nm} className="tcard">
              <p className="q">{d.q}</p>
              <div className="who">
                <div className={`av ${d.av}`} aria-hidden>{d.ini}</div>
                <div>
                  <div className="nm">{d.nm}</div>
                  <div className="rl">{d.rl}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── PREÇOS ───────────── */}
      <section id="precos" className="sec">
        <h2 className="h2">Um preço para cada momento.</h2>
        <p className="h2-sub">Vai convidar uma vez ou convida o ano inteiro? Tem plano para os dois.</p>
        <Planos cadastroHref={CADASTRO} />
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="sec faqsec">
        <h2 className="h2">Perguntas frequentes</h2>
        <div className="faq">
          {FAQ.map((it, i) => (
            <details key={it.q} name="faq" open={i === 0}>
              <summary>
                <span>{it.q}</span>
                <span className="chev" aria-hidden />
              </summary>
              <p className="ans">{it.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────────── CTA FINAL ───────────── */}
      <section className="final" aria-labelledby="cta-h">
        <div className="final-card">
          <h2 id="cta-h">A festa é sua.<br />O convite é com a gente.</h2>
          <p>Crie seu primeiro convite agora e veja como é rápido. Leva menos tempo que escolher o bolo.</p>
          <a className="btn accent lg" href={CADASTRO}>Criar meu convite agora</a>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="foot">
        <div className="brand disp">seuconvite<span className="ia" style={{ color: "var(--purple)" }}>.ia</span></div>
        <div className="flinks">
          <a href="#">Termos de uso</a>
          <a href="#">Privacidade</a>
          <a href={CONTATO}>Contato</a>
        </div>
        <div className="cop">© 2026 seuconvite.ia</div>
      </footer>
    </div>
  );
}
