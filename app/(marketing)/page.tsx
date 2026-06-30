import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { appUrl } from "@/lib/tenant";
import { PLANOS_INFO, PLAN_ORDER } from "@/lib/plans";

export const metadata: Metadata = {
  title: "SeuConvite IA — sites de evento lindos para os seus clientes",
  description:
    "A plataforma para cerimonialistas e profissionais de eventos. Assine um plano e crie eventos ilimitados (casamento, 15 anos, bodas e mais), com recursos liberados por nível de plano. Publicar é incluído — sem marca d'água, sem mensalidade por site, sem programar.",
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
    t: "Assine um plano",
    d: "Básico, Clássico ou Premium — recursos liberam por nível.",
  },
  {
    n: "02",
    t: "Monte o site do cliente",
    d: "nicho, fotos, cores, data e tudo ao vivo — em minutos.",
  },
  {
    n: "03",
    t: "Personalize com preview ao vivo",
    d: "ajuste cada detalhe e veja o resultado na hora.",
  },
  {
    n: "04",
    t: "Publique — incluído no plano",
    d: (
      <>
        no ar em <code className="mkt-code">cliente.seuconviteia.com</code>, sem
        marca d&apos;água.
      </>
    ),
  },
];

const FEATURES: { icon: string; t: string; d: string }[] = [
  { icon: "❖", t: "Multi-nicho", d: "casamento, 15 anos, 60 anos, bodas, aniversário." },
  {
    icon: "↗",
    t: "Endereço próprio",
    d: "cada evento num subdomínio automático.",
  },
  {
    icon: "✓",
    t: "Confirmação de presença",
    d: "convidados confirmam, você acompanha no painel.",
  },
  {
    icon: "◈",
    t: "Lista de presentes no Pix",
    d: "QR e copia-e-cola; o valor cai na conta do cliente.",
  },
  {
    icon: "❏",
    t: "Mural de recados & álbum",
    d: "memórias e mensagens dos convidados num só lugar.",
  },
  {
    icon: "✦",
    t: "Eventos ilimitados",
    d: "crie quantos sites quiser a partir do Clássico.",
  },
];

// Planos exibidos na ordem canonica (do menor para o maior), com os metadados
// (label, descricaoCurta, inclui[], destaque) vindos da fonte unica `lib/plans`.
const PLANOS = PLAN_ORDER.map(
  (key) => PLANOS_INFO.find((p) => p.key === key)!,
);

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
                <strong>Assine um plano</strong> e crie quantos eventos quiser —
                casamento, 15 anos, bodas e mais, cada festa no seu endereço
                próprio. Os recursos liberam <strong>por nível de plano</strong>.{" "}
                <strong>Publicar é incluído no plano.</strong> Sem programar.
              </p>

              <div className="mkt-hero-cta mkt-rise" style={delay(0.24)}>
                <a href={CADASTRO} className="mkt-btn mkt-btn-grad mkt-btn-lg">
                  Criar conta →
                </a>
                <a href={WHATSAPP} className="mkt-btn mkt-btn-ghost mkt-btn-lg">
                  Falar no WhatsApp
                </a>
              </div>

              <p className="mkt-trust mkt-rise" style={delay(0.32)}>
                Eventos ilimitados no Clássico · publique sem custo extra
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
                Um plano,{" "}
                <span className="mkt-jewel italic">eventos ilimitados</span>.
              </h2>
            </header>

            <ul className="mkt-grid-3 mkt-plans">
              {PLANOS.map((p, i) => {
                const featured = p.destaque === true;
                return (
                  <li
                    key={p.key}
                    className={`mkt-plan mkt-rise ${
                      featured ? "mkt-plan-featured" : "mkt-card"
                    }`}
                    style={delay(0.08 + i * 0.07)}
                  >
                    {featured ? (
                      <span className="mkt-plan-badge">mais popular</span>
                    ) : null}
                    <h3 className="mkt-plan-name">{p.label}</h3>
                    <p className="mkt-plan-price">Assinatura mensal</p>
                    <p className="mkt-plan-d">{p.descricaoCurta}</p>
                    <ul className="mkt-plan-feats">
                      {p.inclui.map((item) => (
                        <li key={item} className="mkt-plan-feat">
                          <i className="bi bi-check2" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={CADASTRO}
                      className={`mkt-btn mkt-btn-block ${
                        featured ? "mkt-btn-grad" : "mkt-btn-soft"
                      }`}
                    >
                      Criar conta
                    </a>
                  </li>
                );
              })}
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
                Assine um plano e monte o primeiro site hoje — publicar é
                incluído.
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
