"use client";

// Editor guiado "Criar convite" — réplica do Claude Design "seuconvite - Criar
// convite.dc.html": 6 passos (Festa · Capa e estilo · Conteúdo · Confirmação ·
// Presentes e Pix · Galeria e publicação) com PRÉVIA AO VIVO à direita.
//
// Melhorias (pedidos do João, 16/07):
//  · Passo 1 DESPOLUÍDO (grupos + "detalhes opcionais" recolhidos).
//  · CEP (ViaCEP, API grátis) preenche endereço/cidade/estado sozinho.
//  · Prévia ACOMPANHA o passo: rola até a seção em edição e a destaca.
//  · Aparelhos REALISTAS: iPhone (celular) e MacBook (computador), toggle em
//    todos os passos. No MacBook o convite ocupa a TELA INTEIRA num layout de
//    desktop (hero full-bleed + corpo largo), como um visitante veria no PC.
// (IA de imagem/texto fica para a próxima fatia — a pedido do João.)
//
// Estado 100% local — a gravação no banco é a próxima fatia.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ic, IC } from "../_shell/Ic";
import { criarConvite } from "./acoes";
import { PreviewSite } from "../_ui/PreviewSite";
import { enviarUpload } from "../_ui/Uploads";
import { paletasSeletor } from "@/lib/temas";

// Passo 2: o controle "Tamanho dos textos" (Pequeno/Médio/Grande) vira este
// multiplicador do lockup da capa — mexe no nome e na idade JUNTOS (uniforme),
// mantendo o responsivo. Índice = valor do <Seg>.
const ESCALAS_CAPA = [0.9, 1, 1.15] as const;

// Passo 3 (botão principal): a "Ação do botão" (índice do Chip) → destino real.
// Ordem = ["Confirmar presença", "Ver localização", "Ver presentes"].
const BTN_HREFS = ["/confirmar", "/evento", "/presentes"] as const;

/** "dd/mm/aaaa" -> "aaaa-mm-dd" (vazio se invalido; a action valida). */
function ddmmParaISO(s: string): string {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// Rótulo de data IGUAL ao do site ("Sábado, 29 de agosto"), pra prévia ao vivo bater
// com o que o reload renderiza (mesmo formatador; fuso -03:00 fixo — ver skill evt).
const fmtDataLive = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "numeric",
  month: "long",
});
/** "dd/mm/aaaa" (+ "HH:MM") -> "Sábado, 29 de agosto"; "" se a data ainda não é válida. */
function dataLabelLive(ddmm: string, hIni: string): string {
  const iso = ddmmParaISO(ddmm);
  if (!iso) return "";
  const dt = new Date(`${iso}T${hIni || "20:00"}:00-03:00`);
  if (Number.isNaN(dt.getTime())) return "";
  const s = fmtDataLive.format(dt);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
/** "20:00" -> "20h"; "20:30" -> "20h30"; "" se inválido. */
function horarioLive(hhmm: string): string {
  const m = (hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  return m[2] === "00" ? `${m[1]}h` : `${m[1]}h${m[2]}`;
}

/** Página do site que a prévia mostra em cada passo do editor. */
function paginaDoPasso(step: number): string {
  if (step === 5) return "presentes";
  if (step === 6) return "galeria";
  if (step === 3 || step === 4) return "evento";
  return "inicio";
}

// Passo 3 (Conteúdo) tem accordions (accDefs, na ordem abaixo). Cada um aponta
// para a seção do site que a prévia deve rolar até e destacar.
const ACC_SEC = ["carta-titulo", "carta-texto", "quando", "traje", "cta", "cta"];

/** Tipo do accordion (a.kind) → seção do site para a prévia focar. */
const KIND_SEC: Record<string, string> = {
  abertura: "carta-titulo",
  abaixo: "capa",
  pais: "carta-texto",
  local: "quando",
  traje: "traje",
  botao: "cta",
  rodape: "cta",
};

/** Seção do site em edição — a prévia rola até ela e destaca ("onde você mexe"). */
function focoDoPasso(step: number, acc: number): string {
  if (step === 3) return ACC_SEC[acc] ?? "carta";
  if (step === 4) return "cta";
  if (step === 5) return "presentes";
  if (step === 6) return "galeria";
  return "capa"; // passos 1 (Festa) e 2 (Capa e estilo)
}

/**
 * Estado do editor -> rascunho serializado do `/preview-evento` (o MESMO shape
 * que as telas do painel usam). Assim a prévia mostra o SITE REAL (template
 * rosé, mesmos componentes) reagindo ao que o usuário edita. Foto/álbum ficam
 * vazios de propósito — o preview povoa com fotos de exemplo (U5 liga o upload).
 */
function montarRascunho(S: State) {
  const endereco = [S.endereco, S.cidade, S.uf]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(", ");
  return {
    type: "QUINZE_ANOS",
    tema: S.tema,
    fontes: "classica",
    template: "quinze-anos-glamour-rose",
    title: S.nome,
    fotoUrl: S.capaFoto || undefined,
    idade: S.idade ? Number(S.idade) : undefined,
    monograma: S.monograma,
    logoUrl: S.monogramaFoto || undefined,
    animacoes: S.animacoes,
    capaEscala: ESCALAS_CAPA[S.szT] ?? 1,
    capaOverlay: S.overlay,
    pais: S.paisOn ? { pai: S.pai, mae: S.mae, texto: S.paisTx } : undefined,
    ctaLabel: S.btnTx || undefined,
    ctaHref: BTN_HREFS[S.btnDest] ?? "/confirmar",
    ctaLead: S.btnAcima || undefined,
    date: ddmmParaISO(S.data),
    time: S.hIni,
    mensagem: S.abTx,
    aberturaTitulo: S.abT,
    local: S.local,
    endereco,
    traje: S.trajeOn ? S.traje : "",
    pixNome: S.gifts ? S.pixNome : undefined,
    pixChave: S.gifts ? S.pixChave : undefined,
    presentes: S.gifts
      ? S.giftList
          .filter((g) => g.n.trim())
          .map((g) => ({ titulo: g.n, descricao: g.desc, valor: g.v }))
      : [],
    recursosOff: [
      !S.rsvp ? "rsvp" : null,
      !S.gifts ? "presentes" : null,
      !S.gal ? "galeria" : null,
      !S.rec ? "recados" : null,
    ].filter(Boolean) as string[],
  };
}

/**
 * Mapa de patch AO VIVO da prévia (por tecla, sem recarregar): chave = `data-live`
 * no template, valor = texto. Chave AUSENTE = não mexe naquele elemento (por isso
 * data/horário só entram quando já são válidos — evita "apagar" a prévia digitando).
 */
function liveMapa(S: State): Record<string, string> {
  const m: Record<string, string> = {
    nome: S.nome,
    idade: S.idade,
    "carta-titulo": S.abT,
    "carta-msg": S.abTx,
    local: S.local,
    endereco: [S.endereco, S.cidade, S.uf].map((x) => x.trim()).filter(Boolean).join(", "),
    traje: S.trajeOn ? S.traje : "",
    "pix-nome": S.gifts ? S.pixNome : "",
    "pix-chave": S.gifts ? S.pixChave : "",
  };
  const d = dataLabelLive(S.data, S.hIni);
  if (d) m.data = d;
  const h = horarioLive(S.hIni);
  if (h) m.horario = h;
  if (S.btnTx.trim()) m["cta-label"] = S.btnTx;
  if (S.btnAcima.trim()) m["cta-lead"] = S.btnAcima;
  return m;
}

const V = "#7C3AED";
const MUT = "#6E6E76";
const STEP_NAMES = ["Festa", "Capa e estilo", "Conteúdo", "Confirmação", "Presentes e Pix", "Galeria e publicação"];
const BTNC = ["#7C3AED", "#FF2D8D", "#C4B5FD", "#E8C87A"];
const RSVP_LABELS = [
  "Permitir acompanhantes",
  "Solicitar nome dos acompanhantes",
  "Solicitar telefone",
  "Solicitar e-mail",
  "Perguntar sobre restrição alimentar",
  "Permitir recado para a debutante",
];
const GIFTS = [
  { n: "Jantar de gala", desc: "Ajude com o buffet da noite", v: "R$ 180", q: 4, c1: "#2b2440", c2: "#7C3AED" },
  { n: "Valsa da debutante", desc: "O momento mais esperado", v: "R$ 250", q: 2, c1: "#241a12", c2: "#D4AF37" },
  { n: "Sessão de fotos", desc: "Registros para a vida toda", v: "R$ 320", q: 1, c1: "#101426", c2: "#5B8DEF" },
  { n: "Kit lembrancinhas", desc: "Para os convidados", v: "R$ 90", q: 8, c1: "#191114", c2: "#C97B7F" },
];
const RECADOS = [
  { n: "Tia Márcia", txt: "Que noite linda vai ser! Estamos contando os dias, minha querida.", d: "02/07" },
  { n: "Bia e Carol", txt: "Amiga, você merece o mundo! Te amamos!", d: "30/06" },
  { n: "Vô Antônio", txt: "Minha neta, que Deus abençoe seus 15 anos.", d: "28/06" },
];

type State = {
  step: number;
  sv: "salvo" | "salvando";
  showErr: boolean;
  foco: string;
  nome: string; data: string; hIni: string; pai: string; mae: string;
  cep: string; local: string; endereco: string; cidade: string; uf: string; traje: string; slug: string;
  capaFoto: string;
  idade: string; monograma: boolean; monogramaFoto: string;
  capaT: string; capaS: string; capaD: string;
  tema: string;
  szT: number; szS: number; szD: number; corTxt: number; corDet: number; overlay: boolean;
  acc: number; abT: string; abTx: string;
  paisOn: boolean; paisTx: string; trajeOn: boolean; btnTx: string; btnDest: number; btnAcima: string; rodapeTx: string;
  rsvp: boolean; maxComp: string; rsvpOpts: boolean[]; theme: number; corBtn: number;
  gifts: boolean; free: boolean; giftList: { n: string; desc: string; v: string }[]; pixNome: string; pixChave: string;
  gal: boolean; rec: boolean; recSt: string[];
  animacoes: boolean;
  published: boolean; copied: boolean; pvMode: "celular" | "desktop";
};

const INICIAL: State = {
  step: 1, sv: "salvo", showErr: false, foco: "capa",
  nome: "Luiza", data: "23/11/2026", hIni: "19:00", pai: "Marcos Martins", mae: "Renata Martins",
  cep: "", local: "Espaço Villa Eventos", endereco: "Av. das Palmeiras, 1200", cidade: "São Paulo", uf: "SP",
  traje: "Esporte fino", slug: "luiza15",
  capaFoto: "",
  idade: "15", monograma: true, monogramaFoto: "",
  capaT: "Luiza", capaS: "15 anos", capaD: "Uma noite para celebrar sonhos e momentos inesquecíveis.",
  tema: "rose",
  szT: 1, szS: 1, szD: 1, corTxt: 0, corDet: 0, overlay: false,
  acc: 0, abT: "Vem comemorar comigo!",
  abTx: "Estou muito feliz e quero compartilhar esse momento especial com as pessoas que eu amo. Conto com você!",
  paisOn: true, paisTx: "Com a alegria dos meus pais, convido você para celebrar este momento comigo.",
  trajeOn: true, btnTx: "Confirmar presença", btnDest: 0, btnAcima: "",
  rodapeTx: "Obrigada por fazer parte da minha história.",
  rsvp: true, maxComp: "2", rsvpOpts: [true, true, false, false, true, true], theme: 0, corBtn: 0,
  gifts: true, free: true,
  giftList: GIFTS.map((g) => ({ n: g.n, desc: g.desc, v: g.v })),
  pixNome: "Renata Martins", pixChave: "renata.martins@email.com",
  gal: true, rec: true, recSt: ["pendente", "publicado", "pendente"],
  animacoes: false,
  published: false, copied: false, pvMode: "celular",
};

const inputCls = "w-full rounded-[11px] border bg-white px-3 py-2.5 text-[14px] text-[#17171B]";
const cardCls = "rounded-[18px] border border-[#ECECF0] bg-white p-6 shadow-[0_2px_10px_rgba(23,23,27,0.04)]";

function Label({ children, opt }: { children: React.ReactNode; opt?: boolean }) {
  return (
    <div className="mb-1.5 text-[12.5px] font-semibold text-[#3F3F46]">
      {children}
      {opt && <span className="font-normal text-[#A6A6AE]"> · opcional</span>}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.09em] text-[#A6A6AE]">{children}</div>;
}

function Toggle({ on, onClick, size = "sm" }: { on: boolean; onClick: () => void; size?: "sm" | "lg" }) {
  const w = size === "lg" ? 42 : 38;
  const h = size === "lg" ? 24 : 22;
  const knob = h - 5;
  const left = on ? (size === "lg" ? 20 : 18) : 3;
  return (
    <span onClick={onClick} style={{ width: w, height: h, background: on ? V : "#D5D5DC" }} className="relative shrink-0 cursor-pointer rounded-full transition-colors">
      <span style={{ top: 2.5, left, width: knob, height: knob }} className="absolute rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all" />
    </span>
  );
}

function Seg({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  return (
    <div className="flex gap-0.5 rounded-[10px] border border-[#ECECF0] bg-[#F4F4F6] p-[3px]">
      {["Pequeno", "Médio", "Grande"].map((l, i) => (
        <span key={l} onClick={() => onChange(i)} style={{ background: value === i ? "#fff" : "transparent", color: value === i ? "#17171B" : MUT, boxShadow: value === i ? "0 1px 3px rgba(0,0,0,0.1)" : "none", fontWeight: value === i ? 600 : 400 }} className="cursor-pointer rounded-lg px-4 py-1.5 text-[12px]">
          {l}
        </span>
      ))}
    </div>
  );
}

function Swatches({ colors, value, onChange }: { colors: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <div className="flex gap-2">
      {colors.map((c, i) => (
        <span key={i} onClick={() => onChange(i)} style={{ background: c, borderColor: value === i ? V : "#E4E4EA" }} className="size-7 cursor-pointer rounded-full border-2 shadow-[inset_0_0_0_2px_#fff]" />
      ))}
    </div>
  );
}

// Seletor de PALETA de cores — as 6 paletas reais de lib/temas (re-tingem o site
// inteiro). Cada opção mostra 4 bolinhas da paleta + o nome. Valor = chave do tema.
function Paletas({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {paletasSeletor().map((p) => {
        const on = value === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            style={{ borderColor: on ? V : "#E4E4EA", background: on ? "#F6F3FE" : "#fff" }}
            className="flex items-center gap-2.5 rounded-xl border-[1.5px] px-3 py-2.5 text-left transition-colors hover:border-[#B69CF4]"
          >
            <span className="flex flex-none">
              {p.dots.map((c, i) => (
                <span key={i} style={{ background: c, marginLeft: i ? -6 : 0 }} className="size-[18px] rounded-full border-2 border-white" />
              ))}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ color: on ? "#6D28D9" : "#3a3a42" }}>
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <span onClick={onClick} style={{ borderColor: active ? V : "#E4E4EA", background: active ? "#F3EFFE" : "#fff", color: active ? "#6D28D9" : MUT, fontWeight: active ? 600 : 400 }} className="cursor-pointer rounded-full border px-3.5 py-[7px] text-[12.5px]">
      {label}
    </span>
  );
}

export function CriarConvite() {
  const router = useRouter();
  const [S, setS] = useState<State>(INICIAL);
  // Persistencia: id do convite ja gravado (idempotente), link publico apos
  // publicar, erro da gravacao e estado "gravando".
  const [eventId, setEventId] = useState<string | null>(null);
  const [pubInfo, setPubInfo] = useState<{ host: string; url: string } | null>(null);
  const [erroPub, setErroPub] = useState<string | null>(null);
  const [gravando, iniciarGravacao] = useTransition();
  const [maisDetalhes, setMaisDetalhes] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [capaEnviando, setCapaEnviando] = useState(false);
  const [capaErro, setCapaErro] = useState("");
  const [monoEnviando, setMonoEnviando] = useState(false);
  const [monoErro, setMonoErro] = useState("");
  const svTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upd = (patch: Partial<State>) => {
    if (svTimer.current) clearTimeout(svTimer.current);
    setS((s) => ({ ...s, ...patch, sv: "salvando" }));
    svTimer.current = setTimeout(() => setS((s) => ({ ...s, sv: "salvo" })), 900);
  };
  const inp = (key: keyof State) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    upd({ [key]: e.target.value } as Partial<State>);

  // Foco da prévia: quando o profissional clica/foca um campo, a prévia rola até
  // a seção correspondente (o campo/grupo leva `data-foco="<secao>"`). Só muda o
  // alvo da prévia (não marca "salvando").
  const setFoco = (sec: string) => setS((s) => (s.foco === sec ? s : { ...s, foco: sec }));
  const onFocoCampo = (e: React.FocusEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    const alvo = (e.target as HTMLElement).closest("[data-foco]");
    const sec = alvo?.getAttribute("data-foco");
    if (sec) setFoco(sec);
  };

  // Foto da capa → /api/upload (storage local em dev, Blob em prod) → grava a URL.
  const subirCapa = async (file: File | undefined) => {
    if (!file) return;
    setCapaErro("");
    setCapaEnviando(true);
    try {
      upd({ capaFoto: await enviarUpload(file) });
    } catch (e) {
      setCapaErro(e instanceof Error ? e.message : "Não consegui enviar a foto. Tente de novo.");
    } finally {
      setCapaEnviando(false);
    }
  };

  // Monograma (logo da barra) → mesmo /api/upload.
  const subirMonograma = async (file: File | undefined) => {
    if (!file) return;
    setMonoErro("");
    setMonoEnviando(true);
    try {
      upd({ monogramaFoto: await enviarUpload(file), monograma: true });
    } catch (e) {
      setMonoErro(e instanceof Error ? e.message : "Não consegui enviar o monograma. Tente de novo.");
    } finally {
      setMonoEnviando(false);
    }
  };

  // CEP → ViaCEP (API pública grátis) preenche endereço, cidade e estado.
  const onCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const mask = digits.replace(/(\d{5})(\d)/, "$1-$2");
    upd({ cep: mask });
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await r.json();
      if (!d.erro) {
        const rua = [d.logradouro, d.bairro].filter(Boolean).join(", ");
        upd({ cep: mask, endereco: rua || S.endereco, cidade: d.localidade || S.cidade, uf: d.uf || S.uf });
      }
    } catch {
      /* offline / CEP inválido — segue com preenchimento manual */
    } finally {
      setCepLoading(false);
    }
  };

  const req = (v: string) => !!v && v.trim().length > 0;
  const slugValid = /^[a-z0-9-]{4,30}$/.test(S.slug);
  const slugTaken = ["maria15", "festa15"].includes(S.slug);
  const slugOk = slugValid && !slugTaken;
  const reqOk = req(S.nome) && req(S.data) && req(S.hIni) && req(S.local) && req(S.cidade) && req(S.uf) && slugOk;


  const next = () => {
    if (S.step === 1 && !reqOk) return setS((s) => ({ ...s, showErr: true }));
    setS((s) => {
      const step = Math.min(6, s.step + 1);
      return { ...s, step, showErr: false, foco: focoDoPasso(step, s.acc) };
    });
  };
  const prev = () =>
    setS((s) => {
      const step = Math.max(1, s.step - 1);
      return { ...s, step, showErr: false, foco: focoDoPasso(step, s.acc) };
    });
  const goStep = (n: number) => setS((s) => ({ ...s, step: n, showErr: false, foco: focoDoPasso(n, s.acc) }));

  const linkPublico = pubInfo?.url ?? `https://${S.slug}.seuconvite.orivya.com`;
  const hostPublico = pubInfo?.host ?? `${S.slug}.seuconvite.orivya.com`;

  const copyLink = () => {
    navigator.clipboard?.writeText(linkPublico).catch(() => {});
    setS((s) => ({ ...s, copied: true }));
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setS((s) => ({ ...s, copied: false })), 1500);
  };

  // Estado do editor -> payload da server action (so o que o template consome
  // hoje; capa/estilo detalhados e RSVP dinamico ligam nas proximas fatias).
  const montarPayload = () => ({
    id: eventId ?? undefined,
    title: S.nome,
    fotoUrl: S.capaFoto || undefined,
    idade: S.idade ? Number(S.idade) : undefined,
    monograma: S.monograma,
    logoUrl: S.monogramaFoto || undefined,
    animacoes: S.animacoes,
    tema: S.tema,
    capaEscala: ESCALAS_CAPA[S.szT] ?? 1,
    capaOverlay: S.overlay,
    ctaLabel: S.btnTx || undefined,
    ctaHref: BTN_HREFS[S.btnDest] ?? "/confirmar",
    ctaLead: S.btnAcima || undefined,
    date: ddmmParaISO(S.data),
    time: S.hIni,
    local: S.local,
    endereco: [S.endereco, S.cidade, S.uf]
      .map((x) => x.trim())
      .filter(Boolean)
      .join(", "),
    traje: S.trajeOn ? S.traje : undefined,
    slug: S.slug,
    mensagem: S.abTx,
    aberturaTitulo: S.abT,
    pixNome: S.gifts ? S.pixNome : undefined,
    pixChave: S.gifts ? S.pixChave : undefined,
    presentes: S.gifts
      ? S.giftList
          .filter((g) => g.n.trim())
          .map((g) => ({ titulo: g.n, descricao: g.desc, valor: g.v }))
      : [],
    recursosOff: [
      !S.rsvp ? "rsvp" : null,
      !S.gifts ? "presentes" : null,
      !S.gal ? "galeria" : null,
      !S.rec ? "recados" : null,
    ].filter(Boolean) as string[],
    pais: S.paisOn ? { pai: S.pai, mae: S.mae, texto: S.paisTx } : undefined,
  });

  // Grava no banco: rascunho (publicar=false) ou publica (site no ar).
  const enviar = (publicar: boolean) => {
    setErroPub(null);
    iniciarGravacao(async () => {
      const r = await criarConvite(montarPayload(), publicar);
      if (!r.ok) {
        setErroPub(r.error);
        return;
      }
      setEventId(r.id);
      if (publicar) {
        setPubInfo({ host: r.host, url: r.url });
        setS((s) => ({ ...s, published: true }));
      } else {
        setS((s) => ({ ...s, sv: "salvo" }));
      }
    });
  };

  const rsvpFieldNames: string[] = [];
  if (S.rsvpOpts[0]) rsvpFieldNames.push(`Quantos acompanhantes? (até ${S.maxComp})`);
  if (S.rsvpOpts[1]) rsvpFieldNames.push("Nome dos acompanhantes");
  if (S.rsvpOpts[2]) rsvpFieldNames.push("Telefone");
  if (S.rsvpOpts[3]) rsvpFieldNames.push("E-mail");
  if (S.rsvpOpts[4]) rsvpFieldNames.push("Alguma restrição alimentar?");
  if (S.rsvpOpts[5]) rsvpFieldNames.push(`Deixe um recado para ${S.nome}`);

  const accDefs = [
    { name: "Mensagem de abertura", tag: "", kind: "abertura", st: "Preenchida", ok: true },
    { name: "Pais e família", tag: "· opcional", kind: "pais", st: S.paisOn ? "Visível" : "Oculta", ok: S.paisOn },
    { name: "Local da festa", tag: "", kind: "local", st: "Sincronizada", ok: true },
    { name: "Traje", tag: "· opcional", kind: "traje", st: S.trajeOn ? "Visível" : "Oculta", ok: S.trajeOn },
    { name: "Botão principal", tag: "", kind: "botao", st: "Configurado", ok: true },
    { name: "Rodapé", tag: "", kind: "rodape", st: "Preenchido", ok: true },
  ];

  const checklist = [
    { name: "Informações da festa preenchidas", ok: reqOk, note: "" },
    { name: "Foto da capa adicionada", ok: !!S.capaFoto, note: S.capaFoto ? "" : "usando imagem padrão" },
    { name: "Textos revisados", ok: true, note: "" },
    { name: "Localização configurada", ok: req(S.local), note: "" },
    { name: "Confirmação configurada", ok: S.rsvp, note: S.rsvp ? "" : "desativada" },
    { name: "Presentes configurados", ok: S.gifts, note: S.gifts ? `${S.giftList.filter((g) => g.n.trim()).length} presentes` : "desativados" },
    { name: "QR Code do Pix adicionado", ok: S.gifts, note: "opcional" },
    { name: "Galeria revisada", ok: S.gal, note: "opcional" },
    { name: "Recados configurados", ok: S.rec, note: "opcional" },
  ];

  const recStyles: Record<string, { s: string; sBg: string; sColor: string }> = {
    pendente: { s: "Aguardando aprovação", sBg: "#FFF3E5", sColor: "#B8730F" },
    publicado: { s: "Publicado", sBg: "rgba(52,161,119,0.12)", sColor: "#2E8A66" },
    oculto: { s: "Oculto", sBg: "#F0F0F3", sColor: "#8B8B93" },
  };

  const svText = S.sv === "salvo" ? "Tudo salvo." : "Salvando suas alterações...";
  const svColor = S.sv === "salvo" ? "#34A177" : V;


  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 px-4 pb-8 pt-6 sm:px-8">
        {/* STEPPER */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center overflow-x-auto pb-1">
            {STEP_NAMES.map((label, i) => {
              const n = i + 1;
              const active = n === S.step;
              const done = n < S.step;
              return (
                <div key={label} className="flex items-center">
                  <div onClick={() => goStep(n)} className="flex cursor-pointer items-center gap-2.5">
                    <span style={{ background: active ? V : done ? "#F3EFFE" : "#fff", borderColor: active ? V : done ? "#DCCDFB" : "#E4E4EA", color: active ? "#fff" : done ? V : "#A6A6AE" }} className="grid size-7 place-items-center rounded-full border-[1.5px] text-[12px] font-bold">
                      {done ? <Ic d={IC.check} size={12} stroke={V} width={3} /> : n}
                    </span>
                    <span style={{ color: active ? "#17171B" : done ? "#3F3F46" : "#A6A6AE", fontWeight: active ? 700 : 500 }} className="whitespace-nowrap text-[12.5px]">
                      {label}
                    </span>
                  </div>
                  {n < 6 && <div style={{ background: done ? "#C4B5FD" : "#E4E4EA" }} className="mx-2.5 h-[1.5px] w-[30px]" />}
                </div>
              );
            })}
          </div>
          <div style={{ color: svColor }} className="flex shrink-0 items-center gap-2 text-[12.5px] font-medium">
            <span style={{ background: svColor }} className={`size-[7px] rounded-full ${S.sv === "salvando" ? "sc-pulse" : ""}`} />
            {svText}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_500px] xl:grid-cols-[minmax(0,1fr)_620px] 2xl:grid-cols-[minmax(0,1fr)_760px]">
          {/* ===================== FORM COLUMN ===================== */}
          {/* onFocus/onClick borbulham: ao tocar num campo com `data-foco`, a
              prévia rola até aquela seção do site ("vai para onde estou mexendo"). */}
          <div className="flex flex-col gap-4" onFocus={onFocoCampo} onClick={onFocoCampo}>
            {/* STEP 1 — despoluído: essenciais visíveis, opcionais recolhidos */}
            {S.step === 1 && (
              <>
                <div className={cardCls}>
                  <div className="text-[18px] font-bold tracking-[-0.02em]">Conte-nos sobre a festa</div>
                  <div className="mb-5 mt-1.5 text-[13.5px] text-[#6e6e76]">O essencial primeiro. Os detalhes opcionais podem ficar para depois.</div>

                  <Sub>A debutante</Sub>
                  <div data-foco="capa-nome" className="flex flex-col gap-3.5">
                    <div>
                      <Label>Nome da debutante</Label>
                      <input value={S.nome} onChange={inp("nome")} style={{ borderColor: S.showErr && !req(S.nome) ? "#FF2D8D" : "#E4E4EA" }} className={`${inputCls} text-[15px] font-semibold`} />
                    </div>
                  </div>

                  <div className="my-5 h-px bg-[#F0F0F3]" />
                  <Sub>Quando e onde</Sub>
                  <div data-foco="quando" className="flex flex-col gap-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Data da festa</Label>
                        <input value={S.data} onChange={inp("data")} style={{ borderColor: S.showErr && !req(S.data) ? "#FF2D8D" : "#E4E4EA" }} className={inputCls} />
                      </div>
                      <div>
                        <Label>Horário de início</Label>
                        <input value={S.hIni} onChange={inp("hIni")} style={{ borderColor: S.showErr && !req(S.hIni) ? "#FF2D8D" : "#E4E4EA" }} className={inputCls} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                      <div>
                        <Label>CEP</Label>
                        <div className="relative">
                          <input value={S.cep} onChange={(e) => onCep(e.target.value)} inputMode="numeric" placeholder="00000-000" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                          {cepLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2"><Ic d={IC.help} size={15} stroke="#7C3AED" className="ai-spin" /></span>}
                        </div>
                        <div className="mt-1 text-[11.5px] text-[#A6A6AE]">Preenchemos o endereço pra você.</div>
                      </div>
                      <div>
                        <Label>Nome do local</Label>
                        <input value={S.local} onChange={inp("local")} style={{ borderColor: S.showErr && !req(S.local) ? "#FF2D8D" : "#E4E4EA" }} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <Label>Endereço</Label>
                      <input value={S.endereco} onChange={inp("endereco")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-[1.6fr_0.6fr] gap-3">
                      <div>
                        <Label>Cidade</Label>
                        <input value={S.cidade} onChange={inp("cidade")} style={{ borderColor: S.showErr && !req(S.cidade) ? "#FF2D8D" : "#E4E4EA" }} className={inputCls} />
                      </div>
                      <div>
                        <Label>UF</Label>
                        <input value={S.uf} onChange={inp("uf")} style={{ borderColor: S.showErr && !req(S.uf) ? "#FF2D8D" : "#E4E4EA" }} className={inputCls} />
                      </div>
                    </div>
                  </div>

                  <div className="my-5 h-px bg-[#F0F0F3]" />
                  <button onClick={() => setMaisDetalhes((v) => !v)} className="flex w-full items-center gap-2 text-[13px] font-semibold text-[#7C3AED]">
                    <span style={{ transform: `rotate(${maisDetalhes ? 180 : 0}deg)` }} className="transition-transform">
                      <Ic d={IC.chevronDown} size={15} stroke="#7C3AED" width={2.2} />
                    </span>
                    {maisDetalhes ? "Menos detalhes" : "Mais detalhes (opcional)"}
                  </button>
                  {maisDetalhes && (
                    <div className="mt-4 flex flex-col gap-3.5">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label opt>Nome do pai</Label>
                          <input value={S.pai} onChange={inp("pai")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                        <div>
                          <Label opt>Nome da mãe</Label>
                          <input value={S.mae} onChange={inp("mae")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label opt>Horário de término</Label>
                          <input placeholder="—" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                        <div>
                          <Label opt>Complemento</Label>
                          <input placeholder="Salão 2…" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label opt>Link do mapa</Label>
                          <input placeholder="https://maps.app…" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                        <div>
                          <Label opt>Traje</Label>
                          <input value={S.traje} onChange={inp("traje")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                      </div>
                    </div>
                  )}

                  {S.showErr && (
                    <div className="mt-4 rounded-[11px] border border-[#FF2D8D]/25 bg-[#FDF0F5] px-3.5 py-2.5 text-[13px] text-[#C2185B]">
                      Preencha os campos destacados para continuar. Os campos opcionais podem ficar para depois.
                    </div>
                  )}
                </div>
                <div className={cardCls}>
                  <div className="text-[15.5px] font-bold">Endereço do seu convite</div>
                  <div className="mb-3.5 mt-1 text-[13px] text-[#6e6e76]">É o link que seus convidados vão receber.</div>
                  <div className="flex items-center overflow-hidden rounded-[11px] border border-[#E4E4EA] bg-[#F4F4F6]">
                    <input value={S.slug} onChange={(e) => upd({ slug: e.target.value.toLowerCase().replace(/\s/g, "") })} className="min-w-[60px] flex-1 border-none bg-transparent px-3 py-2.5 text-[14px] font-semibold text-[#17171B]" />
                    <span className="whitespace-nowrap pr-3 text-[13px] text-[#8b8b93]">.seuconvite.orivya.com</span>
                  </div>
                  <div style={{ color: slugOk ? "#2E8A66" : "#D9376E" }} className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium">
                    <Ic d={slugOk ? IC.check : IC.alertCircle} size={13} stroke={slugOk ? "#2E8A66" : "#D9376E"} width={2.4} />
                    {slugTaken ? "Este endereço já está sendo usado." : slugOk ? "Endereço disponível" : "Use de 4 a 30 letras minúsculas, números ou hífen, sem espaços."}
                  </div>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {S.step === 2 && (
              <div data-foco="capa" className={cardCls}>
                <div className="text-[18px] font-bold tracking-[-0.02em]">Personalize a capa</div>
                <div className="mb-5 mt-1.5 text-[13.5px] text-[#6e6e76]">Ajuste a foto, os textos e as cores principais do convite.</div>
                <div className="mb-2.5 text-[13.5px] font-bold">Foto da capa</div>
                <div className="flex items-stretch gap-3.5">
                  <div
                    className="flex h-[100px] w-[150px] flex-none items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(160deg,#1a1426,#3b2a63_70%,#7C3AED)] bg-cover bg-center"
                    style={S.capaFoto ? { backgroundImage: `url('${S.capaFoto}')` } : undefined}
                  >
                    {!S.capaFoto && (
                      <span className="font-[family-name:var(--font-playfair)] text-[20px] text-white">{S.nome}</span>
                    )}
                  </div>
                  <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#D5D5DC] text-[#6e6e76] transition-colors hover:border-[#7C3AED] hover:bg-[#FBFAFE] hover:text-[#7C3AED]">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={capaEnviando}
                      onChange={(e) => {
                        void subirCapa(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <Ic d={IC.upload} size={18} stroke="currentColor" width={1.8} />
                    <span className="text-[12.5px] font-semibold">
                      {capaEnviando ? "Enviando…" : S.capaFoto ? "Trocar foto" : "Enviar foto"}
                    </span>
                    <span className="text-[11px] text-[#A6A6AE]">JPG, PNG ou WebP · até 6 MB</span>
                  </label>
                </div>
                <div className="mt-2.5 rounded-xl border border-[#ECECF0] bg-[#FAFAFC] px-3.5 py-2.5 text-[11.5px] leading-[1.5] text-[#6e6e76]">
                  <span className="font-semibold text-[#3a3a42]">Medida ideal da foto</span> — use uma foto <b>vertical (em pé)</b>, de pelo menos <b>1080 × 1350&nbsp;px</b> (ideal <b>1600 × 2000</b>). No <b>celular</b> ela aparece em pé; no <b>computador</b> a mesma foto é cortada mais larga, então deixe a pessoa <b>mais ao centro</b> pra ficar bem enquadrada nos dois.
                </div>
                {(capaErro || S.capaFoto) && (
                  <div className="mt-2 text-[12px]">
                    {capaErro ? (
                      <span className="text-[#E11D48]">{capaErro}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => upd({ capaFoto: "" })}
                        className="cursor-pointer font-semibold text-[#6e6e76] hover:text-[#E11D48]"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                )}
                <div className="my-5 h-px bg-[#F0F0F3]" />
                <div className="mb-3 text-[13.5px] font-bold">Textos da capa</div>
                <div className="flex flex-col gap-3">
                  <div data-foco="capa-nome">
                    <Label>Nome da debutante (na capa)</Label>
                    <input value={S.nome} onChange={inp("nome")} style={{ borderColor: "#E4E4EA" }} className={`${inputCls} text-[15px] font-semibold`} />
                    <div className="mt-1 text-[11.5px] text-[#A6A6AE]">É o nome que aparece em destaque na capa.</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
                    <div data-foco="capa-idade">
                      <Label>Idade</Label>
                      <input
                        value={S.idade}
                        onChange={(e) => upd({ idade: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                        inputMode="numeric"
                        placeholder="15"
                        style={{ borderColor: "#E4E4EA" }}
                        className={inputCls}
                      />
                      <div className="mt-1 text-[11.5px] text-[#A6A6AE]">Aparece na capa (ex.: “15 ANOS”).</div>
                    </div>
                  </div>
                </div>

                <div className="my-5 h-px bg-[#F0F0F3]" />
                {/* Monograma da barra — subir ou não */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-bold">Monograma na barra</div>
                    <div className="text-[12px] text-[#6e6e76]">A marquinha no topo do site. Sem imagem, usa as iniciais do nome.</div>
                  </div>
                  <Toggle on={S.monograma} onClick={() => upd({ monograma: !S.monograma })} />
                </div>
                {S.monograma && (
                  <>
                    <div className="flex items-stretch gap-3.5">
                      <div
                        className="grid h-[72px] w-[72px] flex-none place-items-center overflow-hidden rounded-xl border border-[#ECECF0] bg-[#F4F4F6] bg-contain bg-center bg-no-repeat"
                        style={S.monogramaFoto ? { backgroundImage: `url('${S.monogramaFoto}')` } : undefined}
                      >
                        {!S.monogramaFoto && (
                          <span className="font-[family-name:var(--font-playfair)] text-[18px] text-[#7C3AED]">
                            {(S.nome.trim()[0] ?? "M").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#D5D5DC] text-[#6e6e76] transition-colors hover:border-[#7C3AED] hover:bg-[#FBFAFE] hover:text-[#7C3AED]">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={monoEnviando}
                          onChange={(e) => {
                            void subirMonograma(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                        <Ic d={IC.upload} size={16} stroke="currentColor" width={1.8} />
                        <span className="text-[12.5px] font-semibold">
                          {monoEnviando ? "Enviando…" : S.monogramaFoto ? "Trocar monograma" : "Enviar monograma"}
                        </span>
                        <span className="text-[11px] text-[#A6A6AE]">PNG com fundo transparente · até 6 MB</span>
                      </label>
                    </div>
                    {(monoErro || S.monogramaFoto) && (
                      <div className="mt-2 text-[12px]">
                        {monoErro ? (
                          <span className="text-[#E11D48]">{monoErro}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => upd({ monogramaFoto: "" })}
                            className="cursor-pointer font-semibold text-[#6e6e76] hover:text-[#E11D48]"
                          >
                            Remover monograma (usar iniciais)
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="my-5 h-px bg-[#F0F0F3]" />
                <div className="mb-1 text-[13.5px] font-bold">Tamanho dos textos da capa</div>
                <div className="mb-3 text-[12px] text-[#6e6e76]">Deixa o nome e a idade maiores ou menores juntos — sempre ajustado no celular e no computador.</div>
                <Seg value={S.szT} onChange={(i) => upd({ szT: i })} />
                <div className="my-5 h-px bg-[#F0F0F3]" />
                {/* data-foco="quando": ao trocar a cor, a prévia rola até o cartão
                    "Quando/Onde" + botão, onde o acento aparece forte (fica óbvio). */}
                <div data-foco="quando">
                  <div className="mb-1 text-[13.5px] font-bold">Paleta de cores</div>
                  <div className="mb-3 text-[12px] text-[#6e6e76]">Muda a cor do convite inteiro. Escolha a que mais combina com a festa.</div>
                  <Paletas value={S.tema} onChange={(k) => upd({ tema: k })} />
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-[#ECECF0] bg-[#F4F4F6] px-4 py-3">
                  <div>
                    <div className="text-[13px] font-semibold">Escurecer a foto da capa</div>
                    <div className="text-[12px] text-[#6e6e76]">Ajuda a ler o nome quando a foto é clara.</div>
                  </div>
                  <Toggle on={S.overlay} onClick={() => upd({ overlay: !S.overlay })} />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {S.step === 3 && (
              <>
                <div>
                  <div className="text-[18px] font-bold tracking-[-0.02em]">Edite as mensagens do convite</div>
                  <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">Personalize os textos, a apresentação e as seções do site.</div>
                </div>
                {accDefs.map((a, i) => {
                  const open = S.acc === i;
                  const sec = KIND_SEC[a.kind] ?? "carta";
                  return (
                    <div key={a.name} data-foco={sec} className="overflow-hidden rounded-2xl border border-[#ECECF0] bg-white shadow-[0_2px_8px_rgba(23,23,27,0.03)]">
                      <div onClick={() => setS((s) => ({ ...s, acc: open ? -1 : i, foco: sec }))} className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-[#FBFBFC]">
                        <span className="flex-1 text-[14px] font-semibold">
                          {a.name} {a.tag && <span className="text-[12px] font-normal text-[#A6A6AE]">{a.tag}</span>}
                        </span>
                        <span style={{ color: a.ok ? "#2E8A66" : "#A6A6AE" }} className="text-[12px] font-medium">{a.st}</span>
                        <span style={{ transform: `rotate(${open ? 180 : 0}deg)` }} className="transition-transform">
                          <Ic d={IC.chevronDown} size={14} stroke="#A6A6AE" width={2} />
                        </span>
                      </div>
                      {open && (
                        <div className="border-t border-[#F0F0F3] px-5 pb-5 pt-3.5">
                          {a.kind === "abertura" && (
                            <div className="flex flex-col gap-3">
                              <div data-foco="carta-titulo">
                                <Label>Título</Label>
                                <input value={S.abT} onChange={inp("abT")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                              </div>
                              <div data-foco="carta-texto">
                                <Label>Texto</Label>
                                <textarea rows={3} value={S.abTx} onChange={inp("abTx")} style={{ borderColor: "#E4E4EA" }} className={`${inputCls} resize-y leading-relaxed`} />
                              </div>
                            </div>
                          )}
                          {a.kind === "pais" && (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[13px] font-semibold">Mostrar o nome dos pais</span>
                                <Toggle on={S.paisOn} onClick={() => upd({ paisOn: !S.paisOn })} />
                              </div>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                  <Label>Nome do pai</Label>
                                  <input value={S.pai} onChange={inp("pai")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                                </div>
                                <div>
                                  <Label>Nome da mãe</Label>
                                  <input value={S.mae} onChange={inp("mae")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                                </div>
                              </div>
                              <div>
                                <Label>Texto de apresentação</Label>
                                <textarea rows={2} value={S.paisTx} onChange={inp("paisTx")} style={{ borderColor: "#E4E4EA" }} className={`${inputCls} resize-y leading-relaxed`} />
                              </div>
                              <div className="text-[12px] text-[#A6A6AE]">Os nomes ficam sincronizados com a etapa 1.</div>
                            </div>
                          )}
                          {a.kind === "local" && (
                            <div className="flex flex-col gap-3">
                              <div className="rounded-xl border border-[#ECECF0] bg-[#F4F4F6] px-4 py-3.5 text-[13px] leading-[1.8] text-[#3F3F46]">
                                <b>{S.data}</b> · início às <b>{S.hIni}</b>
                                <br />
                                {S.local} — {S.endereco}
                                <br />
                                {S.cidade} — {S.uf}
                              </div>
                              <div className="text-[12px] text-[#A6A6AE]">
                                Esses dados vêm da etapa 1.{" "}
                                <span onClick={() => goStep(1)} className="cursor-pointer font-semibold text-[#7C3AED]">Editar informações</span>
                              </div>
                            </div>
                          )}
                          {a.kind === "traje" && (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[13px] font-semibold">Mostrar seção de traje</span>
                                <Toggle on={S.trajeOn} onClick={() => upd({ trajeOn: !S.trajeOn })} />
                              </div>
                              <div>
                                <Label>Descrição (ex.: Traje social · Esporte fino)</Label>
                                <input value={S.traje} onChange={inp("traje")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                              </div>
                            </div>
                          )}
                          {a.kind === "botao" && (
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                  <Label opt>Texto acima do botão</Label>
                                  <input value={S.btnAcima} onChange={inp("btnAcima")} placeholder="Ex.: Faça parte dessa noite" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                                </div>
                                <div>
                                  <Label>Texto do botão</Label>
                                  <input value={S.btnTx} onChange={inp("btnTx")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="w-[130px] text-[12.5px] text-[#6e6e76]">Ação do botão</span>
                                <div className="flex flex-wrap gap-2">
                                  {["Confirmar presença", "Ver localização", "Ver presentes"].map((l, bi) => (
                                    <Chip key={l} label={l} active={S.btnDest === bi} onClick={() => upd({ btnDest: bi })} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {a.kind === "rodape" && (
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                  <Label>Nome exibido</Label>
                                  <input value={S.nome} onChange={inp("nome")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                                </div>
                                <div>
                                  <Label>Data exibida</Label>
                                  <input value={S.data} onChange={inp("data")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 rounded-[11px] border border-[#ECECF0] bg-[#F4F4F6] px-3.5 py-2.5 text-[12.5px] text-[#6e6e76]">
                                <Ic d={IC.lock} size={13} stroke="#A6A6AE" width={2} />
                                A assinatura “Criado com seuconvite · uma marca Orivya” é fixa e não pode ser removida.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* STEP 4 */}
            {S.step === 4 && (
              <div data-foco="cta" className={cardCls}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[18px] font-bold tracking-[-0.02em]">Configure as confirmações</div>
                    <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">Defina como seus convidados vão confirmar presença.</div>
                  </div>
                  <Toggle on={S.rsvp} onClick={() => upd({ rsvp: !S.rsvp })} size="lg" />
                </div>
                {!S.rsvp ? (
                  <div className="mt-[18px] rounded-xl border border-[#ECECF0] bg-[#F4F4F6] p-4 text-[13px] leading-relaxed text-[#6e6e76]">
                    A confirmação de presença está desativada. A seção não aparecerá no convite e os convidados não poderão responder pelo site.
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col gap-3.5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Data limite para confirmação</Label>
                        <input defaultValue="10/11/2026" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                      </div>
                      <div>
                        <Label>Máximo de acompanhantes</Label>
                        <input value={S.maxComp} onChange={inp("maxComp")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {RSVP_LABELS.map((name, i) => (
                        <div key={name} className="flex items-center justify-between border-b border-[#F0F0F3] py-2.5">
                          <span className="text-[13.5px] text-[#3F3F46]">{name}</span>
                          <Toggle on={S.rsvpOpts[i]} onClick={() => { const rsvpOpts = [...S.rsvpOpts]; rsvpOpts[i] = !rsvpOpts[i]; upd({ rsvpOpts }); }} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="mb-2 text-[12.5px] font-semibold text-[#3F3F46]">Cores do formulário</div>
                      <div className="flex flex-wrap gap-2">
                        <Chip label="Usar as cores do meu convite" active={S.theme === 0} onClick={() => upd({ theme: 0 })} />
                        <Chip label="Personalizar cores" active={S.theme === 1} onClick={() => upd({ theme: 1 })} />
                      </div>
                      {S.theme === 1 && (
                        <div className="mt-3 flex items-center gap-3">
                          <span className="w-[130px] text-[12.5px] text-[#6e6e76]">Cor do botão</span>
                          <Swatches colors={BTNC} value={S.corBtn} onChange={(i) => upd({ corBtn: i })} />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Mensagem para quem confirma</Label>
                        <textarea rows={2} defaultValue="Obrigado! Mal podemos esperar para ter você nesse dia especial!" style={{ borderColor: "#E4E4EA" }} className={`${inputCls} resize-y leading-relaxed`} />
                      </div>
                      <div>
                        <Label>Mensagem para quem não pode ir</Label>
                        <textarea rows={2} defaultValue="Tudo bem! Agradecemos por nos avisar. Sentiremos sua falta!" style={{ borderColor: "#E4E4EA" }} className={`${inputCls} resize-y leading-relaxed`} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5 */}
            {S.step === 5 && (
              <>
                <div className={cardCls}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[18px] font-bold tracking-[-0.02em]">Configure sua lista de presentes</div>
                      <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">Adicione presentes, organize contribuições e informe o recebimento.</div>
                    </div>
                    <Toggle on={S.gifts} onClick={() => upd({ gifts: !S.gifts })} size="lg" />
                  </div>
                  {S.gifts && (
                    <div className="mt-5 flex flex-col gap-3.5">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
                        <div>
                          <Label>Título da lista</Label>
                          <input defaultValue="Lista de presentes" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                        <div>
                          <Label>Texto de apresentação</Label>
                          <input defaultValue="Escolha um presente e ajude a tornar essa noite ainda mais especial" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                      </div>
                      <div data-foco="presentes" className="flex flex-col gap-3">
                        {S.giftList.map((g, i) => (
                          <div key={i} className="rounded-2xl border border-[#ECECF0] bg-white p-3.5 shadow-[0_1px_4px_rgba(23,23,27,0.03)]">
                            <div className="flex items-start gap-2.5">
                              <span className="mt-2 grid size-6 flex-none place-items-center rounded-full bg-[#F3EFFE] text-[11px] font-bold text-[#7C3AED]">{i + 1}</span>
                              <div className="flex-1">
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_120px]">
                                  <input
                                    value={g.n}
                                    onChange={(e) => upd({ giftList: S.giftList.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)) })}
                                    placeholder="Nome do presente"
                                    style={{ borderColor: "#E4E4EA" }}
                                    className={`${inputCls} font-semibold`}
                                  />
                                  <input
                                    value={g.v}
                                    onChange={(e) => upd({ giftList: S.giftList.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)) })}
                                    inputMode="numeric"
                                    placeholder="R$ 0"
                                    style={{ borderColor: "#E4E4EA" }}
                                    className={`${inputCls} text-center`}
                                  />
                                </div>
                                <input
                                  value={g.desc}
                                  onChange={(e) => upd({ giftList: S.giftList.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)) })}
                                  placeholder="Descrição (opcional)"
                                  style={{ borderColor: "#E4E4EA" }}
                                  className={`${inputCls} mt-2.5 text-[13px]`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => upd({ giftList: S.giftList.filter((_, j) => j !== i) })}
                                title="Remover presente"
                                className="mt-1 grid size-8 flex-none cursor-pointer place-items-center rounded-lg text-[#A6A6AE] hover:bg-[#FDECEF] hover:text-[#E11D48]"
                              >
                                <Ic d={IC.x} size={15} stroke="currentColor" width={2} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => upd({ giftList: [...S.giftList, { n: "", desc: "", v: "" }] })}
                          className="w-full cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-[#D5D5DC] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#7C3AED] hover:border-[#7C3AED] hover:bg-[#FBFAFE]"
                        >
                          + Adicionar presente
                        </button>
                      </div>
                      <div className="rounded-2xl border border-[#ECECF0] bg-[#F4F4F6] px-[18px] py-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-[13.5px] font-bold">Contribuição com valor livre</div>
                          <Toggle on={S.free} onClick={() => upd({ free: !S.free })} />
                        </div>
                        {S.free && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <Label>Título</Label>
                              <input defaultValue="Contribua com o valor que desejar" style={{ borderColor: "#E4E4EA" }} className="w-full rounded-[11px] border bg-white px-3 py-2.5 text-[13.5px] text-[#17171B]" />
                            </div>
                            <div>
                              <Label opt>Valores sugeridos</Label>
                              <input defaultValue="R$ 50 · R$ 100 · R$ 200" style={{ borderColor: "#E4E4EA" }} className="w-full rounded-[11px] border bg-white px-3 py-2.5 text-[13.5px] text-[#17171B]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {S.gifts && (
                  <div className={cardCls}>
                    <div className="text-[15.5px] font-bold">Recebimento por Pix</div>
                    <div className="mb-4 mt-1 text-[13px] text-[#6e6e76]">Os convidados pagam usando o QR Code do seu banco.</div>
                    <div className="flex flex-col gap-[18px] sm:flex-row">
                      <div className="w-[130px] flex-none text-center">
                        <div className="flex size-[130px] items-center justify-center rounded-[14px] border border-[#ECECF0] bg-white p-3">
                          <QrMock size={90} />
                        </div>
                        <div className="mt-2 flex justify-center gap-1.5">
                          <span className="cursor-pointer text-[11.5px] font-semibold text-[#7C3AED]">Trocar</span>
                          <span className="cursor-pointer text-[11.5px] text-[#A6A6AE]">Remover</span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Quem recebe</Label>
                            <input value={S.pixNome} onChange={inp("pixNome")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                          </div>
                          <div>
                            <Label>Chave Pix</Label>
                            <input value={S.pixChave} onChange={inp("pixChave")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                          </div>
                        </div>
                        <div>
                          <Label>Texto de orientação</Label>
                          <input defaultValue="Aponte a câmera do celular para o QR Code ou copie a chave Pix" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                        <div className="flex items-center gap-2 rounded-[11px] border border-[#D99B37]/30 bg-[#FFF8ED] px-3.5 py-2.5 text-[12.5px] text-[#9A6B15]">
                          <Ic d={IC.alertTriangle} size={14} stroke="#C08A2D" width={2} />
                          O QR Code precisa estar inteiro e legível. Confira a prévia antes de publicar.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 6 */}
            {S.step === 6 && (
              <>
                <div>
                  <div className="text-[18px] font-bold tracking-[-0.02em]">Finalize seu convite</div>
                  <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">Revise a galeria, os recados e publique quando estiver tudo pronto.</div>
                </div>
                <div className={cardCls}>
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className="text-[14.5px] font-bold">Galeria de fotos</div>
                    <Toggle on={S.gal} onClick={() => upd({ gal: !S.gal })} />
                  </div>
                  {S.gal && (
                    <>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                        <div className="relative aspect-square rounded-[10px] bg-[linear-gradient(150deg,#2b2440,#463366)]">
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#7C3AED] px-[7px] py-0.5 text-[9px] font-bold text-white">Destaque</span>
                        </div>
                        <div className="aspect-square rounded-[10px] bg-[linear-gradient(150deg,#3a2d55,#2b2440)]" />
                        <div className="aspect-square rounded-[10px] bg-[linear-gradient(150deg,#241f38,#39304f)]" />
                        <div className="aspect-square rounded-[10px] bg-[linear-gradient(150deg,#39304f,#241f38)]" />
                        <div className="aspect-square rounded-[10px] bg-[linear-gradient(150deg,#463366,#2b2440)]" />
                        <div className="flex aspect-square cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[#D5D5DC] bg-[#FBFBFC] text-[22px] text-[#A6A6AE] hover:border-[#7C3AED] hover:text-[#7C3AED]">+</div>
                      </div>
                      <div className="mt-2.5 text-[12px] text-[#A6A6AE]">5 de 20 fotos · arraste para reordenar · toque para legenda</div>
                    </>
                  )}
                </div>
                <div className={cardCls}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="text-[14.5px] font-bold">Mural de recados</div>
                    <Toggle on={S.rec} onClick={() => upd({ rec: !S.rec })} />
                  </div>
                  {S.rec && (
                    <>
                      <div className="mb-3.5 text-[12.5px] text-[#6e6e76]">Os recados passam pela sua aprovação antes de aparecer no convite.</div>
                      {RECADOS.map((r, i) => {
                        const st = S.recSt[i];
                        const sty = recStyles[st];
                        return (
                          <div key={r.n} className="flex items-center gap-3 border-b border-[#F5F5F7] py-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-semibold">{r.n} <span className="text-[11.5px] font-normal text-[#A6A6AE]">· {r.d}</span></div>
                              <div className="truncate text-[12.5px] text-[#6e6e76]">{r.txt}</div>
                            </div>
                            <span style={{ background: sty.sBg, color: sty.sColor }} className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">{sty.s}</span>
                            {st !== "publicado" && (
                              <span onClick={() => { const recSt = [...S.recSt]; recSt[i] = "publicado"; upd({ recSt }); }} className="shrink-0 cursor-pointer text-[12px] font-semibold text-[#7C3AED]">Aprovar</span>
                            )}
                            <span onClick={() => { const recSt = [...S.recSt]; recSt[i] = "oculto"; upd({ recSt }); }} className="shrink-0 cursor-pointer text-[12px] text-[#A6A6AE] hover:text-[#17171B]">Ocultar</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
                <div className={cardCls}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14.5px] font-bold">Animações ao abrir o site</div>
                      <div className="mt-1 text-[12.5px] text-[#6e6e76]">
                        Efeitos de entrada quando a página carrega (foto com leve zoom, textos que surgem). Desligado, o site aparece pronto na hora.
                      </div>
                    </div>
                    <Toggle on={S.animacoes} onClick={() => upd({ animacoes: !S.animacoes })} />
                  </div>
                </div>
                <div className={cardCls}>
                  <div className="mb-2 text-[14.5px] font-bold">Antes de publicar</div>
                  {checklist.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 border-b border-[#F5F5F7] py-2.5">
                      <span style={{ background: c.ok ? "rgba(52,161,119,0.14)" : "#F0F0F3" }} className="grid size-[22px] flex-none place-items-center rounded-full">
                        {c.ok ? <Ic d={IC.check} size={11} stroke="#2E8A66" width={2.8} /> : <span className="size-1.5 rounded-full bg-[#A6A6AE]" />}
                      </span>
                      <span style={{ color: c.ok ? "#17171B" : MUT }} className="flex-1 text-[13px]">{c.name}</span>
                      <span className="text-[11.5px] text-[#A6A6AE]">{c.note}</span>
                    </div>
                  ))}
                  <div className="mt-2.5 text-[12px] text-[#A6A6AE]">Itens opcionais não bloqueiam a publicação.</div>
                </div>
              </>
            )}
          </div>

          {/* ===================== PREVIEW COLUMN ===================== */}
          {/* Prévia = SITE REAL (mesmos componentes do publicado), reagindo ao
              editor. Segue o passo: capa/home, evento, presentes, galeria. */}
          <div className="scv lg:sticky lg:top-0">
            <div className={`${cardCls} p-4`}>
              <PreviewSite
                rascunhoJson={JSON.stringify(montarRascunho(S))}
                pagina={paginaDoPasso(S.step)}
                foco={S.foco}
                live={liveMapa(S)}
                host={hostPublico}
                rotulo="É assim que os convidados vão ver"
                altura={700}
              />
              <div className="mt-3 text-center text-[11.5px] text-[#A6A6AE]">A prévia é o site de verdade · {S.slug}.seuconvite.orivya.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="sticky bottom-0 z-30 flex items-center gap-2.5 border-t border-[#ECECF0] bg-white px-4 py-3 sm:px-8">
        <div className="hidden text-[12.5px] text-[#8b8b93] sm:block">Etapa {S.step} de 6 · {STEP_NAMES[S.step - 1]}</div>
        {erroPub && (
          <div className="text-[12.5px] font-semibold text-[#d9376e]" role="alert">
            {erroPub}
          </div>
        )}
        <div className="flex-1" />
        {S.step > 1 && (
          <button onClick={prev} disabled={gravando} className="cursor-pointer rounded-[11px] border border-[#E4E4EA] bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[#17171B] hover:bg-[#F4F4F6] disabled:cursor-not-allowed disabled:opacity-50">Voltar</button>
        )}
        <button onClick={() => enviar(false)} disabled={gravando} className="hidden cursor-pointer rounded-[11px] border border-[#E4E4EA] bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[#17171B] hover:bg-[#F4F4F6] disabled:cursor-not-allowed disabled:opacity-50 sm:block">{gravando ? "Salvando…" : "Salvar rascunho"}</button>
        {S.step < 6 ? (
          <button onClick={next} className="cursor-pointer rounded-[11px] bg-[#7C3AED] px-6 py-[11px] text-[13.5px] font-semibold text-white hover:bg-[#6D28D9]">Continuar</button>
        ) : (
          <button onClick={() => enviar(true)} disabled={gravando} className="cursor-pointer rounded-[11px] bg-[#7C3AED] px-6 py-[11px] text-[13.5px] font-bold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60">{gravando ? "Publicando…" : "Publicar convite"}</button>
        )}
      </div>

      {/* PUBLISH MODAL */}
      {S.published && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#080808]/55 p-4 backdrop-blur-[5px]">
          <div className="w-[440px] max-w-full rounded-[22px] bg-white p-9 text-center shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-5 grid size-[66px] place-items-center rounded-full bg-[#F3EFFE]">
              <Ic d={IC.check} size={28} stroke="#7C3AED" width={2.4} />
            </div>
            <div className="text-[22px] font-extrabold tracking-[-0.02em]">Seu convite está no ar</div>
            <div className="mb-5 mt-2 text-[13.5px] leading-relaxed text-[#6e6e76]">Compartilhe o link com os convidados e acompanhe tudo pelo painel.</div>
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#ECECF0] bg-[#F4F4F6] px-3 py-2.5">
              <span className="flex-1 truncate text-left text-[13px] font-semibold text-[#7C3AED]">{hostPublico}</span>
              <button onClick={copyLink} className="cursor-pointer rounded-lg border border-[#E4E4EA] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#17171B] hover:bg-[#F4F4F6]">{S.copied ? "Copiado!" : "Copiar"}</button>
            </div>
            <a href={linkPublico} target="_blank" rel="noopener noreferrer" className="mb-2 block w-full cursor-pointer rounded-xl bg-[#7C3AED] py-3 text-center text-[13.5px] font-semibold text-white hover:bg-[#6D28D9]">Ver meu convite ↗</a>
            <button onClick={() => router.push("/painel")} className="w-full cursor-pointer rounded-xl border border-[#E4E4EA] bg-white py-3 text-[13.5px] font-semibold text-[#17171B] hover:bg-[#F4F4F6]">Voltar ao dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini QR decorativo (usado no passo "Presentes e Pix" do formulario).
function QrMock({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" aria-hidden>
      <path
        d="M0 0h26v26H0zM8 8h10v10H8zM64 0h26v26H64zM72 8h10v10H72zM0 64h26v26H0zM8 72h10v10H8zM36 0h8v8h-8zM52 8h8v8h-8zM36 18h8v8h-8zM44 28h8v8h-8zM60 36h8v8h-8zM36 44h8v8h-8zM74 44h8v8h-8zM52 56h8v8h-8zM36 64h8v8h-8zM68 64h8v8h-8zM52 74h8v8h-8zM80 76h8v8h-8zM64 82h8v8h-8z"
        fill="#17171B"
      />
    </svg>
  );
}
