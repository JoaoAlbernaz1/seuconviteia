import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { appUrl } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "SeuConvite IA — sites de evento lindos para os seus clientes",
  description:
    "A plataforma para cerimonialistas e profissionais de eventos. Monte o site (casamento, 15 anos, bodas e mais), mostre funcionando pro seu cliente com marca d'água e publique com um pagamento único. Recursos extras avulsos. Sem mensalidade, sem programar.",
};

// Links do painel vivem no subdominio `app.` — a partir do marketing (dominio
// raiz) precisam ser ABSOLUTOS, senao caem em 404. `appUrl` resolve dev/prod.
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const CADASTRO = appUrl("/cadastrar", ROOT_DOMAIN);
const ENTRAR = appUrl("/entrar", ROOT_DOMAIN);
// TODO(joão): número de WhatsApp do negócio (ex.: https://wa.me/55DDDNUMERO).
const WHATSAPP = "https://wa.me/";

/** Rise-in delay helper (no-op visually under prefers-reduced-motion). */
function delay(s: number): CSSProperties {
  return { animationDelay: `${s}s` };
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`mkt-wordmark ${className}`}>
      seuconvite<span className="text-gradient">ia</span>
      <span className="mkt-wordmark-tld">.com</span>
    </span>
  );
}

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#precos", label: "Quanto custa" },
] as const;

const STEPS: { n: string; t: string; d: ReactNode }[] = [
  {
    n: "01",
    t: "Monte o site com os dados do cliente",
    d: "nicho, fotos, cores, data — tudo ao vivo, em minutos.",
  },
  {
    n: "02",
    t: "Mostre funcionando — de graça",
    d: "o cliente vê o site pronto no ar, com marca d'água.",
  },
  {
    n: "03",
    t: "Aprovou? Publique com um pagamento único",
    d: (
      <>
        a marca d&apos;água sai e o site fica no ar em{" "}
        <code className="mkt-code">cliente.seuconviteia.com</code>.
      </>
    ),
  },
  {
    n: "04",
    t: "Ative os extras quando quiser",
    d: "confirmação de presença, recados e álbum — avulsos.",
  },
];

const FEATURES: { icon: string; t: string; d: string }[] = [
  { icon: "❖", t: "Multi-nicho", d: "um template para cada tipo de festa." },
  { icon: "↗", t: "Endereço próprio", d: "cada evento num subdomínio automático." },
  {
    icon: "✦",
    t: "Prévia grátis",
    d: "mostre o site funcionando com marca d'água; cobre só quando aprovar.",
  },
  {
    icon: "◈",
    t: "Lista de presentes no Pix",
    d: "QR e copia-e-cola; o valor cai na conta. Sempre incluída.",
  },
  {
    icon: "✓",
    t: "Confirmação de presença",
    d: "convidados confirmam, você acompanha no painel.",
  },
  { icon: "❏", t: "Álbum de fotos", d: "as memórias do grande dia." },
];

const PRICING: {
  name: string;
  price: string;
  d: string;
  featured: boolean;
  badge?: string;
}[] = [
  {
    name: "Criar e mostrar",
    price: "Grátis",
    d: "Monte, personalize e mostre o site funcionando pro cliente — com marca d'água. Quantos eventos quiser.",
    featured: false,
  },
  {
    name: "Publicar o site",
    price: "pagamento único",
    d: "Quando o cliente aprova, um pagamento tira a marca d'água e publica de verdade, no endereço próprio.",
    featured: true,
    badge: "o essencial",
  },
  {
    name: "Recursos extras",
    price: "avulsos",
    d: "Confirmação de presença, recados, álbum e domínio próprio: ative só os que a festa precisa.",
    featured: false,
  },
];

export default function MarketingHome() {
  return (
    <div className="mkt flex flex-1 flex-col">
      {/* ---------- Nav ---------- */}
      <header className="mkt-nav">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <a href="#topo" className="mkt-nav-brand" aria-label="seuconviteia.com — início">
            <Wordmark />
          </a>

          <nav aria-label="Seções" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="mkt-nav-link">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a href={ENTRAR} className="mkt-btn mkt-btn-ghost hidden sm:inline-flex">
              Entrar
            </a>
            <a href={CADASTRO} className="mkt-btn mkt-btn-grad">
              Criar conta
            </a>
          </div>
        </div>
      </header>

      <main id="topo" className="flex-1">
        {/* ---------- Hero ---------- */}
        <section aria-labelledby="hero-h" className="mkt-section mkt-hero">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="mkt-hero-copy">
              <p className="mkt-eyebrow mkt-rise" style={delay(0.02)}>
                <span className="mkt-jewel" aria-hidden>
                  ✦
                </span>{" "}
                Para profissionais de eventos
              </p>

              <h1 id="hero-h" className="mkt-h1 mkt-rise" style={delay(0.08)}>
                Crie sites de evento{" "}
                <span className="mkt-jewel italic">lindos</span> pros seus
                clientes — em minutos.
              </h1>

              <p className="mkt-lede mkt-rise" style={delay(0.16)}>
                Monte o site, mostre funcionando pro seu cliente{" "}
                <strong>de graça, com marca d&apos;água</strong>, e publique com um{" "}
                <strong>pagamento único</strong>. Casamento, 15 anos, bodas e
                mais — cada festa no seu endereço próprio. Sem mensalidade, sem
                programar.
              </p>

              <div className="mkt-hero-cta mkt-rise" style={delay(0.24)}>
                <a href={CADASTRO} className="mkt-btn mkt-btn-grad mkt-btn-lg">
                  Criar conta grátis →
                </a>
                <a href={WHATSAPP} className="mkt-btn mkt-btn-ghost mkt-btn-lg">
                  Falar no WhatsApp
                </a>
              </div>

              <p className="mkt-trust mkt-rise" style={delay(0.32)}>
                Crie e mostre de graça · o cliente paga só pra publicar
              </p>
            </div>

            {/* Hero visual — mock de site no endereço próprio */}
            <div className="mkt-hero-art mkt-rise" style={delay(0.2)} aria-hidden>
              <div className="mkt-hero-float">
                <span className="mkt-spark mkt-spark-1 mkt-twinkle">✦</span>
                <span className="mkt-spark mkt-spark-2 mkt-twinkle">✦</span>
                <span className="mkt-spark mkt-spark-3 mkt-twinkle">✧</span>

                <div className="mkt-browser">
                  <div className="mkt-browser-bar">
                    <span className="mkt-dot" />
                    <span className="mkt-dot" />
                    <span className="mkt-dot" />
                    <span className="mkt-url">cliente.seuconviteia.com</span>
                  </div>
                  <div className="mkt-invite">
                    <p className="mkt-invite-eyebrow">Casamento</p>
                    <p className="mkt-invite-names">
                      Ana <span className="mkt-jewel">&amp;</span> Léo
                    </p>
                    <span className="mkt-invite-rule" />
                    <p className="mkt-invite-date">20 · 12 · 2026 — Búzios</p>
                    <span className="mkt-invite-pill">Confirmar presença</span>
                  </div>
                </div>

                <div className="mkt-chip mkt-chip-rsvp">
                  <span className="mkt-jewel">✓</span> 128 confirmados
                </div>
                <div className="mkt-chip mkt-chip-pix">Pix · R$ 250 recebido</div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Como funciona ---------- */}
        <section
          id="como-funciona"
          aria-labelledby="como-h"
          className="mkt-section"
        >
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
            <header className="mkt-section-head">
              <p className="mkt-kicker mkt-rise">Como funciona</p>
              <h2 id="como-h" className="mkt-h2 mkt-rise" style={delay(0.05)}>
                Do modelo ao site no ar, em{" "}
                <span className="mkt-jewel italic">quatro passos</span>.
              </h2>
            </header>

            <ol className="mkt-steps">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  className="mkt-step mkt-card mkt-rise"
                  style={delay(0.08 + i * 0.07)}
                >
                  <span className="mkt-step-n">{s.n}</span>
                  <h3 className="mkt-step-t">{s.t}</h3>
                  <p className="mkt-step-d">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Recursos ---------- */}
        <section id="recursos" aria-labelledby="rec-h" className="mkt-section">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
            <header className="mkt-section-head">
              <p className="mkt-kicker mkt-rise">Recursos</p>
              <h2 id="rec-h" className="mkt-h2 mkt-rise" style={delay(0.05)}>
                Tudo que a festa precisa,{" "}
                <span className="mkt-jewel italic">num painel só</span>.
              </h2>
            </header>

            <ul className="mkt-grid-3">
              {FEATURES.map((f, i) => (
                <li
                  key={f.t}
                  className="mkt-feature mkt-card mkt-rise"
                  style={delay(0.06 + i * 0.05)}
                >
                  <span className="mkt-ico" aria-hidden>
                    <span className="mkt-jewel">{f.icon}</span>
                  </span>
                  <h3 className="mkt-feature-t">{f.t}</h3>
                  <p className="mkt-feature-d">{f.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Quanto custa ---------- */}
        <section id="precos" aria-labelledby="precos-h" className="mkt-section">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
            <header className="mkt-section-head">
              <p className="mkt-kicker mkt-rise">Quanto custa</p>
              <h2 id="precos-h" className="mkt-h2 mkt-rise" style={delay(0.05)}>
                Sem mensalidade. Você paga{" "}
                <span className="mkt-jewel italic">só quando publica</span>.
              </h2>
            </header>

            <ul className="mkt-grid-3 mkt-plans">
              {PRICING.map((p, i) => (
                <li
                  key={p.name}
                  className={`mkt-plan mkt-rise ${
                    p.featured ? "mkt-plan-featured" : "mkt-card"
                  }`}
                  style={delay(0.08 + i * 0.07)}
                >
                  {p.badge ? (
                    <span className="mkt-plan-badge">{p.badge}</span>
                  ) : null}
                  <h3 className="mkt-plan-name">{p.name}</h3>
                  <p className="mkt-plan-price">{p.price}</p>
                  <p className="mkt-plan-d">{p.d}</p>
                  <a
                    href={CADASTRO}
                    className={`mkt-btn mkt-btn-block ${
                      p.featured ? "mkt-btn-grad" : "mkt-btn-soft"
                    }`}
                  >
                    Criar conta
                  </a>
                </li>
              ))}
            </ul>

            <p className="mkt-plans-note mkt-rise">
              Valores em definição —{" "}
              <a href={WHATSAPP} className="mkt-inline-link">
                fale com a gente
              </a>
              .
            </p>
          </div>
        </section>

        {/* ---------- CTA final ---------- */}
        <section aria-labelledby="cta-h" className="mkt-section">
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-6">
            <div className="mkt-cta mkt-rise">
              <span className="mkt-spark mkt-cta-spark mkt-twinkle" aria-hidden>
                ✦
              </span>
              <h2 id="cta-h" className="mkt-cta-h">
                Pronto para encantar os clientes dos seus clientes?
              </h2>
              <p className="mkt-cta-sub">
                Crie sua conta e monte o primeiro site hoje — de graça.
              </p>
              <a href={CADASTRO} className="mkt-btn mkt-btn-grad mkt-btn-lg">
                Criar conta grátis →
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="mkt-footer">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
          <div className="mkt-footer-top">
            <div className="mkt-footer-brand">
              <Wordmark className="mkt-wordmark-lg" />
              <p className="mkt-footer-tag">O seu site de convite em minutos.</p>
              <p className="mkt-footer-verbs">
                Crie · Personalize · Convide ·{" "}
                <span className="mkt-jewel">Encante</span>
              </p>
            </div>

            <nav aria-label="Rodapé" className="mkt-footer-links">
              <a href="#como-funciona" className="mkt-foot-link">
                Como funciona
              </a>
              <a href="#recursos" className="mkt-foot-link">
                Recursos
              </a>
              <a href="#precos" className="mkt-foot-link">
                Quanto custa
              </a>
              <a href={ENTRAR} className="mkt-foot-link">
                Entrar
              </a>
              <a href="mailto:sac@seuconviteia.com" className="mkt-foot-link">
                sac@seuconviteia.com
              </a>
            </nav>
          </div>

          <div className="mkt-footer-bottom">
            <span>© 2026 seuconviteia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
