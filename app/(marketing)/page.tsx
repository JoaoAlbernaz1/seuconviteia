import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { appUrl } from "@/lib/tenant";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Icon } from "@/components/marketing/Icon";

export const metadata: Metadata = {
  title: "SeuConviteIA — o seu site de convite em minutos",
  description:
    "Crie um site de convite digital para casamento, 15 anos ou aniversário em minutos. Escolha um modelo, edite textos, cores e fotos e publique num link — com RSVP, lista de presentes no Pix, galeria e programação. Simples para você, profissional para cerimonialistas.",
};

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const CADASTRO = appUrl("/cadastrar", ROOT_DOMAIN);
const ENTRAR = appUrl("/entrar", ROOT_DOMAIN);
const CONTATO = "mailto:sac@seuconviteia.com";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#modelos", label: "Modelos" },
  { href: "#recursos", label: "Recursos" },
  { href: "#profissionais", label: "Para profissionais" },
  { href: "#planos", label: "Planos" },
] as const;

// ── SVGs pontuais do hero ─────────────────────────────────────────────────────
const ArrowSvg = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const PlaySvg = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M8 5.5v13l11-6.5-11-6.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
);

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`eyebrow ${className}`}>
      <span className="dot" aria-hidden />
      {children}
    </span>
  );
}

// ── Dados ─────────────────────────────────────────────────────────────────────
type Ic = Parameters<typeof Icon>[0]["name"];

const STEPS: { icon: Ic; t: string; d: string }[] = [
  { icon: "sparkle", t: "Escolha a ocasião", d: "Casamento, 15 anos ou aniversário." },
  { icon: "panel", t: "Escolha um modelo", d: "Comece por um design pronto e bonito." },
  { icon: "edit", t: "Personalize os detalhes", d: "Textos, cores e fotos, com preview ao vivo." },
  { icon: "share", t: "Publique e compartilhe", d: "No ar num link, pronto pro WhatsApp." },
];

type Modelo = { oc: string; nome: string; label: string; tags: string[]; a: string; b: string };
// Previews tematizados SÓ na paleta nova (ciano/turquesa/roxo) — nada de rosa/magenta.
const MODELOS: Modelo[] = [
  { oc: "Casamento", nome: "Clássico Elegante", label: "Ana & Léo", tags: ["Clássico", "Elegante"], a: "rgba(45,226,230,.5)", b: "rgba(14,165,166,.55)" },
  { oc: "15 anos", nome: "Glamour", label: "Maria Clara", tags: ["Glamour", "Vibrante"], a: "rgba(139,92,246,.55)", b: "rgba(109,40,217,.6)" },
  { oc: "Aniversário", nome: "Adulto", label: "Rafael 40", tags: ["Moderno", "Minimal"], a: "rgba(14,165,166,.5)", b: "rgba(45,226,230,.45)" },
  { oc: "Aniversário", nome: "Infantil", label: "Theo faz 5", tags: ["Divertido", "Colorido"], a: "rgba(45,226,230,.6)", b: "rgba(109,40,217,.55)" },
];

const RECURSOS: { icon: Ic; t: string; d: string }[] = [
  { icon: "rsvp", t: "Confirmação de presença", d: "Convidados confirmam num toque; você vê tudo em tempo real." },
  { icon: "gift", t: "Lista de presentes no Pix", d: "QR e copia-e-cola; o valor cai direto na sua conta." },
  { icon: "camera", t: "Galeria de fotos", d: "As memórias da festa reunidas num só lugar." },
  { icon: "calendar", t: "Programação do evento", d: "Cerimônia, festa e horários bem organizados." },
  { icon: "clock", t: "Contador regressivo", d: "O clima subindo até o grande dia." },
  { icon: "share", t: "Link para compartilhar", d: "Um endereço bonito pra mandar pra todo mundo." },
  { icon: "globe", t: "Página publicada", d: "No ar num subdomínio só seu, sem marca d'água." },
  { icon: "panel", t: "Painel de acompanhamento", d: "Confirmações e presentes num lugar só." },
];

const WHY: string[] = [
  "Não começa do zero",
  "Não precisa saber design",
  "Compartilha por um link",
  "Tudo em um só lugar",
  "Fica lindo no celular",
  "Organiza as confirmações",
];

const PLANOS: { nome: string; para: string; itens: string[]; hot?: boolean }[] = [
  { nome: "Convite Único", para: "Para o seu evento", itens: ["1 site de convite", "RSVP e presentes no Pix", "Galeria e programação", "Link e subdomínio próprios"] },
  { nome: "Profissional", para: "Para cerimonialistas", itens: ["Vários sites de convite", "Todos os modelos e recursos", "Painel para gerenciar clientes", "Entrega rápida ao cliente"], hot: true },
  { nome: "Studio", para: "Para equipes e agências", itens: ["Tudo do Profissional", "Sua marca (white-label)", "Volume maior de eventos", "Suporte prioritário"] },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Preciso saber design?", a: "Não. Você escolhe um modelo pronto e só troca textos, cores e fotos. O resultado já sai bonito." },
  { q: "Posso editar depois de publicar?", a: "Sim. Edite quando quiser e as mudanças aparecem no link na hora, sem republicar do zero." },
  { q: "Funciona no celular?", a: "Sim. Os convites são feitos para abrir lindos no celular — que é onde a maioria dos convidados vai ver." },
  { q: "Tem confirmação de presença?", a: "Tem. Os convidados confirmam num toque e você acompanha a lista em tempo real no painel." },
  { q: "Posso adicionar Pix?", a: "Sim. A lista de presentes usa Pix (QR e copia-e-cola) e o valor cai direto na sua conta." },
  { q: "Posso criar sites para clientes?", a: "Sim. No plano Profissional você cria vários sites, cada cliente no seu endereço, tudo num painel só." },
  { q: "Quais ocasiões são suportadas?", a: "Casamento, 15 anos e aniversário (adulto e infantil) — com mais modelos chegando." },
];

export default function MarketingHome() {
  return (
    <div className="mkt">
      {/* fundo */}
      <div className="aurora" aria-hidden>
        <span className="bloom b1" /><span className="bloom b2" /><span className="bloom b3" /><span className="bloom b4" />
      </div>
      <div className="grid-veil" aria-hidden />
      <div className="noise" aria-hidden />

      <MarketingNav links={NAV_LINKS} entrarHref={ENTRAR} cadastroHref={CADASTRO} />

      <div className="shell" id="topo">
        {/* ───────────── HERO ───────────── */}
        <section className="hero" aria-labelledby="hero-h">
          <div>
            <Eyebrow className="reveal d2">Casamento · 15 anos · Aniversário</Eyebrow>
            <h1 id="hero-h" className="title reveal d3">
              O seu site de convite <span className="grad-txt">em minutos</span>
            </h1>
            <p className="sub reveal d4">
              Crie, personalize e compartilhe convites digitais com <b>RSVP</b>, <b>lista de presentes</b>, <b>galeria</b> e <b>programação</b> — sem complicação.
            </p>
            <div className="cta-row reveal d5">
              <a className="btn primary" href={CADASTRO}>
                Criar meu convite <span className="ic" aria-hidden><ArrowSvg /></span>
              </a>
              <a className="btn ghost" href="#como-funciona">
                Ver como funciona <span className="ic" aria-hidden><PlaySvg /></span>
              </a>
            </div>
            <div className="micro reveal d6">
              <span className="pips" aria-hidden><i /><i /><i /></span>
              Publique num link só · sem instalar nada · pronto para o WhatsApp
            </div>
          </div>

          {/* composição de produto */}
          <div className="composition reveal d5">
            <span className="chip c1"><i />RSVP</span>
            <span className="chip c2"><i />Casamento</span>
            <span className="chip c3"><i />Pix</span>
            <span className="chip c4"><i />Galeria</span>
            <span className="chip c5"><i />15 anos</span>
            <span className="chip c6"><i />Aniversário</span>

            <div className="card-shell">
              <div className="card">
                <div className="card-head">
                  <span className="lbl">
                    <span className="spark" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6L12 3z" fill="currentColor" /></svg>
                    </span>
                    <b>Convite sendo criado</b>
                  </span>
                  <span className="live"><span className="beat" aria-hidden />ao vivo</span>
                </div>

                <div className="steps">
                  <div className="track"><span className="fill" /></div>
                  <div className="nodes">
                    <span className="node done">
                      <span className="bead"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                      <span className="cap">Escolher modelo</span>
                    </span>
                    <span className="node active"><span className="bead" /><span className="cap">Editar dados</span></span>
                    <span className="node"><span className="bead" /><span className="cap">Publicar link</span></span>
                  </div>
                </div>

                <div className="mini" aria-hidden>
                  <div className="bar">
                    <i /><i /><i />
                    <span className="url"><b>ana-e-joao</b>.seuconviteia.com</span>
                  </div>
                  <div className="body">
                    <div className="banner"><span className="ln a" /><span className="ln b" /></div>
                    <div className="row"><span className="thumb" /><span className="thumb" /><span className="thumb" /></div>
                    <div className="lines"><span /><span /></div>
                    <div className="mcta"><em>Confirmar presença</em></div>
                  </div>
                </div>

                <div className="card-foot">
                  <span className="badge pub">
                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M8 12.5l2.4 2.4L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Publicado
                  </span>
                  <span className="badge conf"><b>3</b> confirmações recebidas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── COMO FUNCIONA ───────────── */}
        <section className="sec" id="como-funciona">
          <div className="sec-head">
            <Eyebrow className="reveal d1">Como funciona</Eyebrow>
            <h2 className="h2 reveal d2">Você não começa do zero</h2>
            <p className="lead reveal d3">Escolha um modelo, edite os detalhes e publique o link. O SeuConviteIA guia você até o site final.</p>
          </div>
          <div className="cards">
            {STEPS.map((s, i) => (
              <div key={s.t} className={`feat reveal d${i + 3}`}>
                <span className="step-no">0{i + 1}</span>
                <span className="ico" aria-hidden><Icon name={s.icon} /></span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── MODELOS ───────────── */}
        <section className="sec" id="modelos">
          <div className="sec-head">
            <Eyebrow className="reveal d1">Modelos</Eyebrow>
            <h2 className="h2 reveal d2">Modelos para cada momento</h2>
            <p className="lead reveal d3">Casamento, 15 anos ou aniversário — comece por um design pronto e deixe com a sua cara.</p>
          </div>
          <div className="models">
            {MODELOS.map((m, i) => (
              <div
                key={m.nome}
                className={`model reveal d${i + 3}`}
                style={{ "--mp-a": m.a, "--mp-b": m.b } as CSSProperties}
              >
                <div className="prev">
                  <div className="pv-cover">
                    <span className="ttl">{m.label}</span>
                    <span className="rule" />
                    <span className="pill">Confirmar presença</span>
                  </div>
                  <div className="pv-rows">
                    <span style={{ width: "34%" }} /><span style={{ width: "22%" }} /><span style={{ width: "26%" }} />
                  </div>
                  <div className="pv-grid"><span /><span /><span /><span /></div>
                </div>
                <div className="m-meta">
                  <div className="m-oc">{m.oc}</div>
                  <div className="m-name">{m.nome}</div>
                  <div className="m-tags">{m.tags.map((t) => <span key={t}>{t}</span>)}</div>
                  <a className="m-link" href={CADASTRO}>Visualizar modelo <ArrowSvg /></a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── RECURSOS ───────────── */}
        <section className="sec" id="recursos">
          <div className="sec-head">
            <Eyebrow className="reveal d1">Recursos</Eyebrow>
            <h2 className="h2 reveal d2">Tudo já vem no convite</h2>
            <p className="lead reveal d3">Um site completo pro seu evento, com tudo que a festa precisa — sem instalar nada.</p>
          </div>
          <div className="cards">
            {RECURSOS.map((f, i) => (
              <div key={f.t} className={`feat reveal d${(i % 6) + 3}`}>
                <span className="ico" aria-hidden><Icon name={f.icon} /></span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── DO RASCUNHO AO LINK ───────────── */}
        <section className="sec" id="fluxo">
          <div className="sec-head">
            <Eyebrow className="reveal d1">Na prática</Eyebrow>
            <h2 className="h2 reveal d2">Do rascunho ao link</h2>
            <p className="lead reveal d3">Monte, publique e acompanhe — sem planilha e sem código.</p>
          </div>
          <div className="flow reveal d3">
            <div className="fg">
              <div className="fl">
                <span className="flabel">Você monta</span>
                <h3>Escolha, edite, publique</h3>
                <div className="frow">
                  <span className="fk">Ocasião</span>
                  <span className="seg"><span className="on">Casamento</span><span>15 anos</span><span>Aniversário</span></span>
                </div>
                <div className="frow"><span className="fk">Modelo</span><span className="fval">Clássico Elegante</span></div>
                <div className="frow"><span className="fk">Nome do evento</span><span className="fval">Ana &amp; João</span></div>
                <a className="btn primary block fpub" href={CADASTRO}>Publicar <span className="ic" aria-hidden><ArrowSvg /></span></a>
              </div>
              <div className="fr">
                <span className="flabel">O convidado recebe</span>
                <div className="mini" aria-hidden style={{ marginTop: 14 }}>
                  <div className="bar"><i /><i /><i /><span className="url"><b>ana-e-joao</b>.seuconviteia.com</span></div>
                  <div className="body">
                    <div className="banner"><span className="ln a" /><span className="ln b" /></div>
                    <div className="row"><span className="thumb" /><span className="thumb" /><span className="thumb" /></div>
                    <div className="mcta"><em>Confirmar presença</em></div>
                  </div>
                </div>
                <div className="card-foot" style={{ marginTop: 16 }}>
                  <span className="badge pub">
                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M8 12.5l2.4 2.4L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Publicado
                  </span>
                  <span className="badge conf"><b>3</b> confirmações recebidas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── DOIS PÚBLICOS ───────────── */}
        <section className="sec" id="profissionais">
          <div className="sec-head">
            <Eyebrow className="reveal d1">Para quem é</Eyebrow>
            <h2 className="h2 reveal d2">Para pessoas físicas e profissionais</h2>
          </div>
          <div className="aud">
            <div className="aud-card cy reveal d3">
              <span className="aico" aria-hidden><Icon name="heart" /></span>
              <h3>Para o seu evento</h3>
              <p>Crie seu convite digital sem depender de designer. Escolha um modelo, edite os detalhes e envie o link.</p>
              <a className="alink" href={CADASTRO}>Criar meu convite <ArrowSvg /></a>
            </div>
            <div className="aud-card vi reveal d4">
              <span className="aico" aria-hidden><Icon name="users" /></span>
              <h3>Para profissionais de eventos</h3>
              <p>Crie sites de convite para clientes, acompanhe confirmações e entregue mais rápido — tudo num painel só.</p>
              <a className="alink" href="#planos">Ver planos <ArrowSvg /></a>
            </div>
          </div>
        </section>

        {/* ───────────── POR QUE ───────────── */}
        <section className="sec" id="por-que">
          <div className="sec-head">
            <Eyebrow className="reveal d1">Por que o SeuConviteIA</Eyebrow>
            <h2 className="h2 reveal d2">Melhor que uma imagem no WhatsApp</h2>
            <p className="lead reveal d3">Um site de verdade para o seu evento — bonito, organizado e feito em minutos.</p>
          </div>
          <div className="why">
            {WHY.map((w, i) => (
              <div key={w} className={`why-i reveal d${(i % 6) + 3}`}>
                <span className="ck" aria-hidden><Icon name="check" size={14} strokeWidth={2} /></span>
                {w}
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── PLANOS ───────────── */}
        <section className="sec" id="planos">
          <div className="sec-head center">
            <Eyebrow className="reveal d1">Planos</Eyebrow>
            <h2 className="h2 reveal d2">Planos para cada uso</h2>
            <p className="lead reveal d3">Para eventos únicos e para profissionais. Preços em definição — ainda sem valores finais.</p>
          </div>
          <div className="plans">
            {PLANOS.map((p, i) => (
              <div key={p.nome} className={`plan ${p.hot ? "hot" : ""} reveal d${i + 3}`}>
                {p.hot ? <span className="tag">Recomendado</span> : null}
                <div className="p-for">{p.para}</div>
                <h3>{p.nome}</h3>
                <ul className="p-list">
                  {p.itens.map((it) => (
                    <li key={it}><Icon name="check" size={16} strokeWidth={1.8} /><span>{it}</span></li>
                  ))}
                </ul>
                <a className={`btn ${p.hot ? "primary" : "ghost"} block p-cta`} href={CADASTRO}>Começar</a>
              </div>
            ))}
          </div>
          <p className="plans-note reveal">Preços em definição — <a href={CONTATO}>falar sobre planos</a>.</p>
        </section>

        {/* ───────────── FAQ ───────────── */}
        <section className="sec" id="faq">
          <div className="sec-head center">
            <Eyebrow className="reveal d1">Perguntas frequentes</Eyebrow>
            <h2 className="h2 reveal d2">Ainda com dúvidas?</h2>
          </div>
          <div className="faq reveal d3">
            {FAQ.map((it) => (
              <details key={it.q}>
                <summary>
                  {it.q}
                  <span className="pl" aria-hidden><svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
                </summary>
                <div className="ans">{it.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* ───────────── CTA FINAL ───────────── */}
        <section className="sec tight" aria-labelledby="cta-h">
          <div className="cta-final reveal d2">
            <div className="cta-final-in">
              <h2 id="cta-h">Seu convite merece <span className="grad-txt">mais que uma imagem</span> no WhatsApp</h2>
              <p>Crie um site bonito, compartilhe o link e acompanhe tudo em um só lugar.</p>
              <div className="cta-row">
                <a className="btn primary" href={CADASTRO}>Criar meu convite <span className="ic" aria-hidden><ArrowSvg /></span></a>
                <a className="btn ghost" href="#modelos">Ver modelos <span className="ic" aria-hidden><ArrowSvg /></span></a>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── FOOTER ───────────── */}
        <footer className="foot">
          <div className="fin">
            <div className="fb">
              <a className="brand" href="#topo" aria-label="SeuConviteIA">
                <span className="mark" aria-hidden><svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.2 5.4L20 10l-5.8 1.6L12 17l-2.2-5.4L4 10l5.8-1.6L12 3z" fill="currentColor" /></svg></span>
                <span>Seu<b>Convite</b><span className="ai">IA</span></span>
              </a>
              <p>O seu site de convite em minutos.</p>
            </div>
            <nav className="fnav" aria-label="Rodapé">
              <a href="#como-funciona">Como funciona</a>
              <a href="#modelos">Modelos</a>
              <a href="#recursos">Recursos</a>
              <a href="#planos">Planos</a>
              <a href={ENTRAR}>Entrar</a>
              <a href={CONTATO}>Contato</a>
            </nav>
          </div>
          <div className="fbot"><div>© 2026 SeuConviteIA</div></div>
        </footer>
      </div>
    </div>
  );
}
