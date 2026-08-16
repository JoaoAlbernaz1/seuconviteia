import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { appUrl } from "@/lib/tenant";
import { EMPRESA } from "./legal/dados-da-empresa";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";
import { Contador } from "@/components/marketing/Contador";
import { PLANOS_INFO } from "@/lib/plans";

export const metadata: Metadata = {
  title: "seuconvite — seu evento merece um convite à altura",
  description:
    "Um site de convite completo — confirmação de presença, lista de presentes, localização e contagem regressiva — pronto em minutos e perfeito em qualquer tela.",
};

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const CADASTRO = appUrl("/cadastrar", ROOT_DOMAIN);
const ENTRAR = appUrl("/entrar", ROOT_DOMAIN);
// Endereco de contato: fonte UNICA, compartilhada com os Termos e a Privacidade.
// `sac@seuconviteia.com` apontava para um dominio que nao existe — todo link de
// suporte do rodape abria um e-mail que nunca chegaria a ninguem.
const CONTATO = `mailto:${EMPRESA.email}`;

/** Chaves do design (Claude Design → props do componente). */
const PRECOS_DEFINIDOS: boolean = true;
const MOSTRAR_GARANTIA: boolean = true;

const NAV_LINKS = [
  { href: "#como", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#precos", label: "Preços" },
] as const;

const HERO_CARDS = [
  { t: "No ar em minutos", d: "Preencha os dados e publique. Sem instalar nada." },
  { t: "Um link para todos", d: "Envie no WhatsApp e acompanhe as confirmações." },
  { t: "Fica de lembrança", d: "Recados e fotos no ar por 90 dias após a festa." },
] as const;

const NICHOS = ["Debutantes", "Casamentos", "Aniversários", "Corporativo", "Cerimonialistas"] as const;

const PASSOS = [
  {
    n: "01",
    cor: "#7C3AED",
    t: "Conte sobre o evento",
    d: "Nomes, data, local e horário. A partir daí o convite já existe e tem um endereço.",
  },
  {
    n: "02",
    cor: "#A855F7",
    t: "Ajuste cores e blocos",
    d: "Defina a paleta e ative RSVP, presentes, mapa e recados com um clique.",
  },
  {
    n: "03",
    cor: "#FF2D8D",
    t: "Compartilhe o link",
    d: "Um link único no WhatsApp e as confirmações começam a chegar no seu painel.",
  },
] as const;

type IconeRecurso = "check" | "gift" | "pin" | "clock" | "chat" | "chart";

const RECURSOS: { i: IconeRecurso; t: string; d: string }[] = [
  {
    i: "check",
    t: "Confirmação de presença",
    d: "Cada convidado confirma pelo link e você acompanha a lista em tempo real.",
  },
  {
    i: "gift",
    t: "Lista de presentes",
    d: "Presentes com link externo ou cota em dinheiro via Pix, direto na página.",
  },
  {
    i: "pin",
    t: "Localização e rota",
    d: "Mapa incorporado e botão de rota para Waze e Google Maps.",
  },
  {
    i: "clock",
    t: "Contagem regressiva",
    d: "O convite ganha urgência sozinho, contando os dias até o grande momento.",
  },
  {
    i: "chat",
    t: "Recados dos convidados",
    d: "Mensagens deixadas no convite ficam guardadas como lembrança do evento.",
  },
  {
    i: "chart",
    t: "Painel de acompanhamento",
    d: "Visitas, confirmações e presentes escolhidos em um só lugar, exportável.",
  },
];

/** Ícones de linha do design (stroke 1.6, lilás). */
function IconeR({ nome }: { nome: IconeRecurso }) {
  const comum = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "ico",
    "aria-hidden": true,
  };
  if (nome === "check") return <svg {...comum}><path d="M20 6L9 17l-5-5" /></svg>;
  if (nome === "gift") {
    return (
      <svg {...comum}>
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M12 8v13M3 12h18M12 8s-1-5-4-5-3 5 4 5c7 0 6-5 4-5" />
      </svg>
    );
  }
  if (nome === "pin") {
    return (
      <svg {...comum}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
        <circle cx="12" cy="10" r="2.6" />
      </svg>
    );
  }
  if (nome === "clock") {
    return (
      <svg {...comum}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.2 2" />
      </svg>
    );
  }
  if (nome === "chat") return <svg {...comum}><path d="M4 4h16v13H7l-3 3z" /></svg>;
  return <svg {...comum}><path d="M4 18V9M10 18V5M16 18v-6M22 18H2" /></svg>;
}

const NUMEROS: { ate: number; sufixo: string; decimais?: number; t: string; s: string }[] = [
  { ate: 12, sufixo: " mil+", t: "Convites publicados", s: "Eventos de todos os tamanhos no ar" },
  { ate: 480, sufixo: " mil", t: "Presenças confirmadas", s: "Sem planilha e sem grupo perdido" },
  { ate: 8, sufixo: " min", t: "Tempo médio de criação", s: "Dos dados preenchidos ao link pronto" },
  { ate: 4.9, decimais: 1, sufixo: "/5", t: "Satisfação dos clientes", s: "Avaliação média após o evento" },
];

// Planos da LANDING — derivados de `lib/plans.ts` + `lib/pagamentos/taxa.ts`,
// pra a vitrine nunca divergir do que o produto cobra de verdade.
//
// A escada e desenhada pro plano do MEIO ganhar: o Basico e gratis mas paga a
// taxa cheia; o Classico derruba a taxa em 2,5 pontos por R$ 59 (se paga com
// pouco mais de uma festa); o Premium so compensa pra quem faz volume.
const PLANOS = PLANOS_INFO.map((info) => ({
  nome: info.label,
  para: info.paraQuem,
  preco: info.preco ?? "Grátis",
  ciclo: info.preco ? "/ mês" : "para começar",
  taxaLinha: info.taxaLinha,
  cta: info.destaque ? "Começar agora" : info.preco ? "Assinar" : "Criar de graça",
  destaque: !!info.destaque,
  itens: info.inclui.map((t) => ({ t, off: false })),
}));

/**
 * Depoimentos. `foto` aponta para `public/marketing/depoimentos/*` — hoje são
 * avatares neutros (sem rosto de terceiros). Para publicar depoimento com foto
 * de gente de verdade, basta SUBSTITUIR o arquivo mantendo o nome; o nome e o
 * texto abaixo também precisam ser os reais de quem autorizou.
 */
const DEPOIMENTOS = [
  {
    q: "“Montei o convite dos 15 anos da minha filha numa tarde. As confirmações chegaram sozinhas e eu só acompanhei pelo painel.”",
    foto: "/marketing/depoimentos/cliente-1.png",
    nome: "Carla Ribeiro",
    papel: "Mãe da debutante · Campinas",
  },
  {
    q: "“Uso em todos os eventos que organizo. Entrego um link bonito para o cliente e economizo horas de retrabalho.”",
    foto: "/marketing/depoimentos/cliente-2.png",
    nome: "Marcos Andrade",
    papel: "Cerimonialista · Belo Horizonte",
  },
  {
    q: "“Usamos no lançamento anual da empresa. O credenciamento por QR Code resolveu a fila da recepção.”",
    foto: "/marketing/depoimentos/cliente-3.png",
    nome: "Juliana Prado",
    papel: "Marketing · São Paulo",
  },
] as const;

export default function MarketingHome() {
  return (
    <div className="mkt">
      <RevealOnScroll />

      <MarketingNav links={NAV_LINKS} entrarHref={ENTRAR} cadastroHref={CADASTRO} />

      <main>
        {/* ───────────── HERO ───────────── */}
        <section id="topo" className="hero">
          <div className="hero-glow" aria-hidden />

          <div className="hero-in">
            <div className="badge" data-rv="">
              <span className="dot" aria-hidden />
              Convites digitais para qualquer evento
            </div>

            <h1 className="h1" data-rv="" style={{ "--d": "70ms" } as CSSProperties}>
              Seu evento merece um convite à altura
            </h1>

            <p className="sub" data-rv="" style={{ "--d": "140ms" } as CSSProperties}>
              Um site de convite completo — confirmação de presença, lista de presentes, localização e
              contagem regressiva — pronto em minutos e perfeito em qualquer tela.
            </p>

            <div className="cta-row" data-rv="" style={{ "--d": "210ms" } as CSSProperties}>
              <a className="btn grad" href="#precos">Ver planos e começar</a>
              <a className="btn ghost" href="#como">Ver como funciona</a>
            </div>

            <div className="hero-cards">
              {HERO_CARDS.map((c, i) => (
                <div key={c.t} data-rv="soft" style={{ "--d": `${280 + i * 90}ms` } as CSSProperties}>
                  <div className="t">{c.t}</div>
                  <div className="d">{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── FAIXA DE NICHOS ───────────── */}
        <div className="strip">
          <div className="strip-in">
            <span className="strip-label" data-rv="">Feito para quem organiza eventos</span>
            <div className="strip-words">
              {NICHOS.map((n, i) => (
                <span key={n} data-rv="" style={{ "--d": `${i * 60}ms` } as CSSProperties}>{n}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ───────────── COMO FUNCIONA ───────────── */}
        <section id="como" className="sec">
          <div className="kicker" data-rv="left">Como funciona</div>
          <h2 className="h2" data-rv="left" style={{ "--d": "90ms" } as CSSProperties}>
            Do zero ao convite no ar em três passos
          </h2>

          <div className="grid3">
            {PASSOS.map((p, i) => (
              <div key={p.n} className="card" data-rv="" style={{ "--d": `${i * 90}ms` } as CSSProperties}>
                <div className="no" style={{ color: p.cor }}>{p.n}</div>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── RECURSOS ───────────── */}
        <section id="recursos" className="sec">
          <div className="kicker" data-rv="left">Recursos</div>
          <h2 className="h2" data-rv="left" style={{ "--d": "90ms" } as CSSProperties}>
            Tudo o que o seu convite precisa ter
          </h2>

          <div className="grid3">
            {RECURSOS.map((r, i) => (
              <div key={r.t} className="card feat" data-rv="" style={{ "--d": `${i * 80}ms` } as CSSProperties}>
                <IconeR nome={r.i} />
                <h3>{r.t}</h3>
                <p>{r.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── NÚMEROS ───────────── */}
        <section className="strip">
          <div className="stats">
            {NUMEROS.map((n, i) => (
              <div key={n.t} className="stat" data-rv="" style={{ "--d": `${i * 80}ms` } as CSSProperties}>
                <div className="n">
                  <Contador ate={n.ate} decimais={n.decimais ?? 0} sufixo={n.sufixo} />
                </div>
                <div className="t">{n.t}</div>
                <div className="s">{n.s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── PREÇOS ───────────── */}
        <section id="precos" className="sec">
          <div style={{ textAlign: "center" }}>
            <div className="kicker" data-rv="">Preços</div>
            <h2 className="h2" data-rv="" style={{ margin: "14px auto 0", maxWidth: 600, "--d": "60ms" } as CSSProperties}>
              Escolha o plano do seu evento
            </h2>
            <p className="lead" data-rv="" style={{ margin: "16px auto 0", maxWidth: 520, "--d": "110ms" } as CSSProperties}>
              Comece de graça e só pague quando receber presente. Quanto maior o plano, menor a taxa.
            </p>
          </div>

          <div className="plans">
            {PLANOS.map((p, i) => (
              <div
                key={p.nome}
                className={p.destaque ? "plan hot" : "plan"}
                data-rv=""
                style={{ "--d": `${i * 90}ms` } as CSSProperties}
              >
                {p.destaque ? <div className="p-badge">Melhor negócio</div> : null}
                <div className="p-name">{p.nome}</div>
                <div className="p-for">{p.para}</div>

                {PRECOS_DEFINIDOS ? (
                  <div className="p-price">
                    <span className="v">{p.preco}</span>
                    <span className="per">{p.ciclo}</span>
                  </div>
                ) : (
                  <div className="p-sob">Sob consulta</div>
                )}

                <a className={p.destaque ? "p-cta grad" : "p-cta"} href={p.destaque ? CADASTRO : ENTRAR}>
                  {p.cta}
                </a>

                <div className="p-rule" />
                <div className="p-list">
                  {p.itens.map((it) => (
                    <div key={it.t} className={it.off ? "no" : undefined}>{it.t}</div>
                  ))}
                </div>

                <div className="p-taxa">{p.taxaLinha}</div>
              </div>
            ))}
          </div>

          {MOSTRAR_GARANTIA ? (
            <p className="p-note" data-rv="">
              7 dias de garantia — se não gostar, devolvemos o valor sem perguntas.
            </p>
          ) : null}
        </section>

        {/* ───────────── DEPOIMENTOS ───────────── */}
        <section className="band">
          <div className="sec">
            <div className="kicker" data-rv="left">Depoimentos</div>
            <h2 className="h2" data-rv="left" style={{ "--d": "90ms" } as CSSProperties}>
              Quem já usou, não voltou para o papel
            </h2>

            <div className="grid3">
              {DEPOIMENTOS.map((d, i) => (
                <figure
                  key={d.nome}
                  className="card quote"
                  data-rv="scale"
                  style={{ margin: 0, "--d": `${i * 90}ms` } as CSSProperties}
                >
                  <p>{d.q}</p>
                  <figcaption className="by">
                    <span className="av">
                      <Image src={d.foto} alt={`Foto de ${d.nome}`} width={400} height={400} />
                    </span>
                    <span>
                      <span className="nm" style={{ display: "block" }}>{d.nome}</span>
                      <span className="rl">{d.papel}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── CTA FINAL ───────────── */}
        <section className="sec">
          <div className="cta-card" data-rv="scale">
            <div className="glow" aria-hidden />
            <div className="in">
              <Image src="/brand/monograma.png" alt="" width={793} height={615} />
              <h2>Comece hoje o convite do seu evento</h2>
              <p>Escolha um plano, personalize e envie o link ainda hoje.</p>
              <div className="cta-row">
                <a className="btn grad" href="#precos">Ver planos</a>
                <a className="btn ghost" href={CONTATO}>Falar com a gente</a>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── RODAPÉ ───────────── */}
        <footer className="foot">
          <div className="foot-grid">
            <div data-rv="soft">
              <a className="foot-brand" href="#topo">
                <Image src="/brand/monograma.png" alt="" width={793} height={615} />
                <span>seu<b>convite</b></span>
              </a>
              <p className="foot-desc">
                Convites digitais que transformam momentos especiais em experiências memoráveis.
              </p>
              <div className="foot-orivya">uma marca <b>Orivya</b></div>
            </div>

            <div data-rv="soft" style={{ "--d": "80ms" } as CSSProperties}>
              <h4>Produto</h4>
              <nav className="foot-links" aria-label="Produto">
                <a href="#recursos">Recursos</a>
                <a href="#precos">Preços</a>
              </nav>
            </div>

            <div data-rv="soft" style={{ "--d": "160ms" } as CSSProperties}>
              <h4>Empresa</h4>
              <nav className="foot-links" aria-label="Empresa">
                <a href={CONTATO}>Contato</a>
              </nav>
            </div>

            <div data-rv="soft" style={{ "--d": "240ms" } as CSSProperties}>
              <h4>Suporte</h4>
              <nav className="foot-links" aria-label="Suporte">
                <a href={CONTATO}>Falar com o suporte</a>
                <a href="/termos">Termos de uso</a>
                <a href="/privacidade">Privacidade</a>
              </nav>
            </div>
          </div>

          <div className="foot-bottom">
            <div>
              <span>© 2026 seuconvite. Todos os direitos reservados.</span>
              <span>Feito no Brasil</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
