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
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ic, IC } from "../_shell/Ic";
import { criarConvite } from "./acoes";
import { podeVitrine, type Plan } from "@/lib/plans";
import { PreviewSite } from "../_ui/PreviewSite";
import { SeletorFontes } from "../_ui/SeletorFontes";
import { enviarUpload } from "../_ui/Uploads";
import { paletasSeletor, deriveTemaVars } from "@/lib/temas";
import { fonteTemNegritoNoNome } from "@/lib/fontes";
import { moverItem } from "@/lib/presentesOrdem";
import { paginaDaPrevia } from "@/lib/previaPagina";
import { deveResalvar } from "@/lib/autosave";
import { taxaLabel } from "@/lib/pagamentos/taxa";
import { MSG_CONFIRMA_PADRAO, MSG_RECUSA_PADRAO } from "@/lib/rsvpConfig";
import { programacaoSugerida, type ItemProgramacao } from "@/lib/sugestoes";

// Passo 2: o controle "Tamanho dos textos" (Pequeno/Médio/Grande) vira este
// multiplicador do lockup da capa — mexe no nome e na idade JUNTOS (uniforme),
// mantendo o responsivo. Índice = valor do <Seg>.
const ESCALAS_CAPA = [0.9, 1, 1.15] as const;

// Passo 3 (botão principal): a "Ação do botão" (índice do Chip) → destino real +
// o texto padrão do botão (ao trocar a ação, a escrita do botão acompanha).
const BTN_HREFS = ["/confirmar", "/evento", "/presentes"] as const;
const BTN_LABELS = ["Confirmar presença", "Ver localização", "Ver presentes"] as const;

/** Como cobrar o presente: valor único (FIXO) ou dividido em cotas (COTAS). */
type GiftModo = "FIXO" | "COTAS";
/** Linha da lista de presentes no editor: nome + descrição + valor + foto + cobrança (Pix). */
type GiftRow = { n: string; desc: string; v: string; foto?: string; modo?: GiftModo; cotas?: number };
/** Mapeia uma linha do editor para o item `presentes` do payload/rascunho (sempre Pix). */
function giftParaPresente(g: GiftRow) {
  const modo: GiftModo = g.modo ?? "FIXO";
  return {
    titulo: g.n,
    descricao: g.desc,
    valor: g.v,
    tipo: "PIX" as const,
    modo,
    cotas: modo === "COTAS" ? g.cotas ?? undefined : undefined,
    foto: g.foto?.trim() || undefined,
  };
}

/**
 * Lista de presentes que vai pro site: as linhas do editor + (quando ligada) a
 * "Contribuição com valor livre". Sem valor, a gravação classifica o item como
 * `LIVRE` (ver `criar/acoes.ts`), e o modal do convidado abre o campo de valor.
 */
function presentesDoEditor(S: State) {
  if (!S.gifts) return [];
  const linhas = S.giftList.filter((g) => g.n.trim()).map(giftParaPresente);
  if (!S.free || !S.freeTitulo.trim()) return linhas;
  return [
    ...linhas,
    {
      titulo: S.freeTitulo.trim(),
      descricao: S.freeValores.trim(),
      valor: "",
      tipo: "PIX" as const,
      modo: "FIXO" as const,
      cotas: undefined,
      foto: undefined,
    },
  ];
}

/** Junta nomes em pt-BR — MESMA regra do adapter (lib/eventoFesta). */
function juntarNomes(nomes: string[]): string {
  const ns = nomes.map((n) => n.trim()).filter(Boolean);
  if (ns.length <= 1) return ns[0] ?? "";
  return `${ns.slice(0, -1).join(", ")} e ${ns[ns.length - 1]}`;
}

// Copy padrao da pagina /recados (espelha `lib/textos.ts` para QUINZE_ANOS). O
// editor so manda o texto quando ele DIFERE daqui — assim o `customization` fica
// limpo e o site segue o default do nicho.
const REC_PADRAO = {
  eyebrow: "Mural de recados",
  titulo: "Deixe seu carinho",
  convite: "Escreva um recado de carinho para {nome}. Ela vai amar ler cada palavra.",
  mural: "Recados de quem ama",
} as const;

/** Texto do editor -> rascunho: `undefined` quando e igual ao padrao ou vazio. */
function seMudou(valor: string, padrao: string): string | undefined {
  const v = valor.trim();
  return v && v !== padrao ? v : undefined;
}

/** Primeiro nome do convite — o site usa `primeiroNome` na copy dos recados. */
function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

/** "aaaa-mm-dd" (valor do <input type="date">) -> "dd/mm/aaaa". */
function isoParaDDMM(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

// Rascunho salvo no navegador (resume ao reabrir a página).
const RASCUNHO_KEY = "sc-editor-rascunho";

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


// Passo 3 (Conteúdo) tem accordions (accDefs, na ordem abaixo). Cada um aponta
// para a seção do site que a prévia deve rolar até e destacar.
const ACC_SEC = ["carta-titulo", "assinatura", "quando", "traje", "programacao", "cta", "rodape"];

/** Tipo do accordion (a.kind) → seção do site para a prévia focar. */
const KIND_SEC: Record<string, string> = {
  abertura: "carta-titulo",
  pais: "assinatura",
  local: "quando",
  traje: "traje",
  programacao: "programacao",
  botao: "cta",
  rodape: "rodape",
};

/** Seção do site em edição — a prévia rola até ela e destaca ("onde você mexe"). */
function focoDoPasso(step: number, acc: number): string {
  if (step === 2) return ACC_SEC[acc] ?? "carta"; // Conteúdo (accordions)
  if (step === 3) return "rsvp"; // Confirmação -> destaca o formulário
  if (step === 4) return "presentes";
  if (step === 5) return "galeria";
  return "capa"; // 1 (Capa), 6 (Revisar)
}

/**
 * Estado do editor -> rascunho serializado do `/preview-evento` (o MESMO shape
 * que as telas do painel usam). Assim a prévia mostra o SITE REAL (template
 * rosé, mesmos componentes) reagindo ao que o usuário edita. Foto/álbum ficam
 * vazios de propósito — o preview povoa com fotos de exemplo (U5 liga o upload).
 */
// Config do formulário de confirmação (RSVP) a partir do passo 5. Índices de
// rsvpOpts: 0 permitir acompanhantes · 1 pedir nomes · 2 telefone · 3 e-mail ·
// 4 restrição · 5 recado. corBotao só quando "Personalizar cores".
function rsvpConfigDe(S: State) {
  const permitir = S.rsvpOpts[0];
  return {
    permitirAcompanhantes: permitir,
    pedirNomeAcompanhantes: S.rsvpOpts[1],
    maxAcompanhantes: permitir ? Math.max(0, Math.min(20, Number(S.maxComp) || 0)) : 0,
    pedirTelefone: S.rsvpOpts[2],
    pedirEmail: S.rsvpOpts[3],
    pedirRestricao: S.rsvpOpts[4],
    permitirRecado: S.rsvpOpts[5],
    corBotao: S.theme === 1 && /^#[0-9a-fA-F]{6}$/.test(S.rsvpCorBotao) ? S.rsvpCorBotao : undefined,
    dataLimite: S.rsvpDataLimite || undefined,
    msgConfirma: S.rsvpMsgSim.trim() || undefined,
    msgRecusa: S.rsvpMsgNao.trim() || undefined,
  };
}

function montarRascunho(S: State) {
  const endereco = [S.endereco, S.cidade, S.uf]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(", ");
  return {
    type: "QUINZE_ANOS",
    tema: S.tema,
    temaCor: S.tema === "custom" ? S.corCustom : undefined,
    fontes: S.fonte,
    negrito: S.negrito,
    template: "quinze-anos-glamour-rose",
    title: S.nome,
    fotoUrl: S.capaFoto || undefined,
    fotoDesktopUrl: S.capaDoisFotos ? S.capaFotoDesktop || undefined : undefined,
    idade: S.idade ? Number(S.idade) : undefined,
    monograma: S.monograma,
    logoUrl: S.monogramaFoto || undefined,
    animacoes: S.animacoes,
    capaEscala: ESCALAS_CAPA[S.szT] ?? 1,
    capaOverlay: S.overlay,
    pais: S.paisOn ? { pai: S.pai, mae: S.mae } : undefined,
    ctaLabel: S.btnTx || undefined,
    ctaHref: BTN_HREFS[S.btnDest] ?? "/confirmar",
    ctaLead: S.btnAcima || undefined,
    rodapeMsg: S.rodapeTx || undefined,
    date: ddmmParaISO(S.data),
    time: S.hIni,
    mensagem: S.abTx,
    aberturaTitulo: S.abT,
    recadosEyebrow: S.rec ? seMudou(S.recEyebrow, REC_PADRAO.eyebrow) : undefined,
    recadosTitulo: S.rec ? seMudou(S.recTitulo, REC_PADRAO.titulo) : undefined,
    recadosConvite: S.rec ? seMudou(S.recConvite, REC_PADRAO.convite) : undefined,
    recadosMural: S.rec ? seMudou(S.recMural, REC_PADRAO.mural) : undefined,
    local: S.local,
    endereco,
    traje: S.trajeOn ? S.traje : "",
    pixNome: S.gifts ? S.pixNome : undefined,
    pixChave: S.gifts ? S.pixChave : undefined,
    presentesTexto: S.gifts ? S.presentesTexto || undefined : undefined,
    presentes: presentesDoEditor(S),
    rsvpConfig: S.rsvp ? rsvpConfigDe(S) : undefined,
    listaModelo: S.listaModelo,
    programacao: S.programacao.filter((p) => p.hora.trim() || p.titulo.trim()),
    recursosOff: [
      !S.rsvp ? "rsvp" : null,
      !S.gifts ? "presentes" : null,
      !S.gal ? "galeria" : null,
      !S.rec ? "recados" : null,
      !S.prog ? "programacao" : null,
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
    // Assinatura = "pai, mãe e a debutante" (ou só a debutante) — MESMA regra do
    // adapter, pra a caixa "Pais e família" refletir os nomes ao vivo.
    assinatura:
      S.paisOn && (S.pai.trim() || S.mae.trim())
        ? juntarNomes([S.pai, S.mae, S.nome])
        : S.nome,
    "rodape-msg": S.rodapeTx.trim() || "Feito com carinho.",
    local: S.local,
    endereco: [S.endereco, S.cidade, S.uf].map((x) => x.trim()).filter(Boolean).join(", "),
    traje: S.trajeOn ? S.traje : "",
    "pix-nome": S.gifts ? S.pixNome : "",
    "pix-chave": S.gifts ? S.pixChave : "",
    "recados-eyebrow": S.recEyebrow,
    "recados-titulo": S.recTitulo,
    "recados-convite": S.recConvite.replaceAll("{nome}", primeiroNome(S.nome)),
    "recados-mural": S.recMural,
    "obrigada-msg-sim": S.rsvpMsgSim,
    "obrigada-msg-nao": S.rsvpMsgNao,
  };
  const d = dataLabelLive(S.data, S.hIni);
  if (d) m.data = d;
  const h = horarioLive(S.hIni);
  if (h) m.horario = h;
  if (S.btnTx.trim()) m["cta-label"] = S.btnTx;
  if (S.btnAcima.trim()) m["cta-lead"] = S.btnAcima;
  return m;
}

// Assinatura do que EXIGE recarregar a prévia (muda → recarrega o iframe). De
// FORA ficam os textos que já refletem AO VIVO via [data-live]: o TÍTULO da carta,
// o rodapé, endereço/local/cidade/UF, o traje e as mensagens de confirmação —
// mexer neles NÃO recarrega (não "pula" nem re-rola).
// A MENSAGEM da carta (abTx) fica no reload: é `data-live-multi` (multi-parágrafo),
// que o patch ao vivo não atualiza de forma confiável — reload garante que aparece.
// Ver PreviewSite.
function estruturalDoEditor(S: State): string {
  return JSON.stringify([
    S.nome, S.idade, S.tema, S.tema === "custom" ? S.corCustom : "", S.fonte, S.negrito,
    S.capaFoto, S.capaDoisFotos ? S.capaFotoDesktop : "", S.capaDoisFotos,
    S.monograma, S.monogramaFoto, S.szT, S.overlay, S.animacoes,
    S.abTx,
    S.paisOn, S.pai, S.mae,
    S.btnDest, S.btnTx, S.btnAcima,
    S.data, S.hIni,
    S.gifts, S.free, S.listaModelo,
    S.gifts ? S.giftList.map((g) => `${g.n}${g.v}${g.desc}${g.foto ?? ""}${g.modo ?? ""}${g.cotas ?? ""}`).join("") : "",
    S.gifts ? S.pixNome : "", S.gifts ? S.pixChave : "", S.gifts ? S.presentesTexto : "",
    S.gifts && S.free ? `${S.freeTitulo}|${S.freeValores}` : "",
    S.programacao.map((p) => `${p.hora}|${p.titulo}`).join("~"),
    S.gal, S.rec, S.prog,
    // Só o liga/desliga GERAL da confirmação fica no reload (some/adiciona a
    // página inteira). As OPÇÕES do RSVP (acompanhantes/telefone/e-mail/restrição/
    // recado/cor/data) vão AO VIVO por postMessage pro formulário — instantâneas,
    // sem recarregar. Ver `liveRsvpConfig` no PreviewSite + RsvpConvite.
    S.rsvp,
  ]);
}

const V = "#7C3AED";
const MUT = "#6E6E76";
const STEP_NAMES = ["Capa", "Conteúdo", "Confirmação", "Presentes e Pix", "Galeria e recados", "Revisar e publicar"];
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
// Sugestões de presente (adicionar com 1 toque no passo 6) — deixa a lista fácil.
const SUGESTOES_PRESENTES = [
  { n: "Buffet & jantar", v: "R$ 200", desc: "Ajude com a comida da noite" },
  { n: "Decoração", v: "R$ 150", desc: "Flores e ambientação" },
  { n: "Sessão de fotos", v: "R$ 300", desc: "Registros para a vida toda" },
  { n: "DJ / Música", v: "R$ 250", desc: "A trilha da festa" },
  { n: "Bolo & doces", v: "R$ 120", desc: "A mesa mais disputada" },
  { n: "Cabelo & maquiagem", v: "R$ 180", desc: "Para ficar linda no grande dia" },
  { n: "Vestido", v: "R$ 400", desc: "O look da debutante" },
  { n: "Lembrancinhas", v: "R$ 90", desc: "Um carinho para os convidados" },
];

const RECADOS = [
  { n: "Tio Marcos", txt: "Que noite linda vai ser! Estamos contando os dias, minha querida.", d: "02/07" },
  { n: "Maria e Carlos", txt: "Amiga, você merece o mundo! Te amamos!", d: "30/06" },
  { n: "Vô Antônio", txt: "Minha neta, que Deus abençoe seus 15 anos.", d: "28/06" },
];

type State = {
  step: number;
  sv: "salvo" | "salvando" | "erro";
  showErr: boolean;
  foco: string;
  nome: string; data: string; hIni: string; pai: string; mae: string;
  cep: string; local: string; endereco: string; cidade: string; uf: string; traje: string; slug: string;
  capaFoto: string; capaFotoDesktop: string; capaDoisFotos: boolean;
  idade: string; monograma: boolean; monogramaFoto: string;
  capaT: string; capaS: string; capaD: string;
  tema: string; corCustom: string; fonte: string; corFocou: boolean; negrito: boolean;
  szT: number; szS: number; szD: number; corTxt: number; corDet: number; overlay: boolean;
  acc: number; abT: string; abTx: string;
  paisOn: boolean; paisTx: string; trajeOn: boolean; btnTx: string; btnDest: number; btnAcima: string; rodapeTx: string;
  rsvp: boolean; maxComp: string; rsvpOpts: boolean[]; theme: number; corBtn: number;
  rsvpDataLimite: string; rsvpCorBotao: string; rsvpMsgSim: string; rsvpMsgNao: string;
  gifts: boolean; free: boolean; giftList: GiftRow[]; pixNome: string; pixChave: string; presentesTexto: string;
  freeTitulo: string; freeValores: string;
  programacao: ItemProgramacao[]; prog: boolean;
  gal: boolean; rec: boolean; recSt: string[];
  recEyebrow: string; recTitulo: string; recConvite: string; recMural: string;
  listaModelo: "painel" | "vitrine";
  animacoes: boolean;
  published: boolean; copied: boolean; pvMode: "celular" | "desktop";
};

const INICIAL: State = {
  step: 1, sv: "salvo", showErr: false, foco: "capa",
  nome: "Teste", data: "23/11/2026", hIni: "19:00", pai: "Marcos Martins", mae: "Maria Martins",
  cep: "", local: "Espaço Villa Eventos", endereco: "Av. das Palmeiras, 1200", cidade: "São Paulo", uf: "SP",
  traje: "Esporte fino", slug: "teste",
  capaFoto: "", capaFotoDesktop: "", capaDoisFotos: false,
  idade: "15", monograma: true, monogramaFoto: "",
  capaT: "Teste", capaS: "15 anos", capaD: "Uma noite para celebrar sonhos e momentos inesquecíveis.",
  tema: "rose", corCustom: "#CE578B", fonte: "classica", corFocou: false, negrito: false,
  szT: 1, szS: 1, szD: 1, corTxt: 0, corDet: 0, overlay: false,
  acc: 0, abT: "Vem comemorar comigo!",
  abTx: "Estou muito feliz e quero compartilhar esse momento especial com as pessoas que eu amo. Conto com você!",
  paisOn: true, paisTx: "Com a alegria dos meus pais, convido você para celebrar este momento comigo.",
  trajeOn: true, btnTx: "Confirmar presença", btnDest: 0, btnAcima: "",
  rodapeTx: "Obrigada por fazer parte da minha história.",
  rsvp: true, maxComp: "2", rsvpOpts: [true, true, false, false, true, true], theme: 0, corBtn: 0,
  rsvpDataLimite: "10/11/2026", rsvpCorBotao: "#CE578B",
  rsvpMsgSim: MSG_CONFIRMA_PADRAO, rsvpMsgNao: MSG_RECUSA_PADRAO,
  gifts: true, free: true, listaModelo: "painel",
  giftList: GIFTS.map((g) => ({ n: g.n, desc: g.desc, v: g.v })),
  pixNome: "", pixChave: "", presentesTexto: "",
  freeTitulo: "Contribua com o valor que desejar", freeValores: "R$ 50 · R$ 100 · R$ 200",
  programacao: programacaoSugerida("QUINZE_ANOS"), prog: true,
  gal: true, rec: true, recSt: ["pendente", "publicado", "pendente"],
  recEyebrow: REC_PADRAO.eyebrow, recTitulo: REC_PADRAO.titulo,
  recConvite: REC_PADRAO.convite, recMural: REC_PADRAO.mural,
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

// Cor personalizada — o cliente escolhe QUALQUER cor (quick-picks das mais usadas
// + seletor livre). Derivamos a família inteira do site por HSL (deriveTemaVars).
function CorPersonalizada({ ativo, cor, onPick }: { ativo: boolean; cor: string; onPick: (hex: string) => void }) {
  const QUICK = ["#CE578B", "#E23744", "#E8853A", "#E0B341", "#3FA05B", "#2F8F83", "#3B74E0", "#7C4CE0", "#B84A8E", "#111827"];
  const hexOk = /^#[0-9a-fA-F]{6}$/.test(cor);
  const fam = deriveTemaVars(hexOk ? cor : "#CE578B");
  const strip = [fam["--ev-framboesa-deep"], fam["--ev-framboesa"], fam["--ev-rosa"], fam["--ev-rose"], fam["--ev-blush"], fam["--ev-ivory"]];
  return (
    <div
      style={{ borderColor: ativo ? V : "#E4E4EA", background: ativo ? "#F6F3FE" : "#fff" }}
      className="mt-2 rounded-xl border-[1.5px] px-3.5 py-3 transition-colors"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold" style={{ color: ativo ? "#6D28D9" : "#3a3a42" }}>
          Cor personalizada{ativo && <span className="font-normal text-[#8b8b93]"> · {cor.toUpperCase()}</span>}
        </span>
        <span
          className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-lg border border-[#E4E4EA]"
          style={{ background: ativo ? cor : "conic-gradient(from 0deg,#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)" }}
          title="Escolher qualquer cor"
        >
          <input
            type="color"
            value={hexOk ? cor : "#CE578B"}
            onChange={(e) => onPick(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Escolher qualquer cor"
          />
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((c) => (
          <span
            key={c}
            onClick={() => onPick(c)}
            style={{ background: c, borderColor: ativo && cor.toLowerCase() === c.toLowerCase() ? V : "#E4E4EA" }}
            className="size-6 cursor-pointer rounded-full border-2 shadow-[inset_0_0_0_2px_#fff]"
          />
        ))}
      </div>
      {ativo && (
        <div className="mt-2.5 flex overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
          {strip.map((c, i) => (
            <span key={i} style={{ background: c }} className="h-2.5 flex-1" />
          ))}
        </div>
      )}
      <div className="mt-2 text-[11px] text-[#A6A6AE]">O convite inteiro se ajusta à cor — nós criamos os tons que combinam.</div>
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

export function CriarConvite({ plano = "BASICO" }: { plano?: Plan }) {
  const router = useRouter();
  const [S, setS] = useState<State>(INICIAL);
  // Persistencia: id do convite ja gravado (idempotente), link publico apos
  // publicar, erro da gravacao e estado "gravando".
  const [eventId, setEventId] = useState<string | null>(null);
  const [pubInfo, setPubInfo] = useState<{ host: string; url: string } | null>(null);
  const [erroPub, setErroPub] = useState<string | null>(null);
  // Motivo REAL da falha do autosave (ex.: "Sua sessao expirou"). Sem isto o
  // cliente so via "Nao foi possivel salvar" e nao sabia o que fazer.
  const [salvarErro, setSalvarErro] = useState("");
  const [gravando, iniciarGravacao] = useTransition();
  const [cepLoading, setCepLoading] = useState(false);
  const [capaEnviando, setCapaEnviando] = useState(false);
  const [capaErro, setCapaErro] = useState("");
  const [capaDeskEnviando, setCapaDeskEnviando] = useState(false);
  const [capaDeskErro, setCapaDeskErro] = useState("");
  const [monoEnviando, setMonoEnviando] = useState(false);
  const [monoErro, setMonoErro] = useState("");
  // Busca de prévia do link de loja (presente tipo LINK).
  const [subindoFoto, setSubindoFoto] = useState<number | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AUTOSAVE (rascunho): refs pra salvar sem fechar sobre estado velho.
  const salvarRef = useRef<() => Promise<void>>(async () => {});
  const dadosRef = useRef("");
  const lastSavedRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const primeiroRender = useRef(true);
  // Resume: restaura o rascunho do localStorage ao reabrir; só persiste depois
  // que o usuário muda algo (não guarda o demo intocado).
  const restauradoRef = useRef(false);
  const dadosInicialRef = useRef("");

  const upd = (patch: Partial<State>) => setS((s) => ({ ...s, ...patch }));
  const inp = (key: keyof State) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    upd({ [key]: e.target.value } as Partial<State>);

  // Foco da prévia: quando o profissional clica/foca um campo, a prévia rola até
  // a seção correspondente (o campo/grupo leva `data-foco="<secao>"`). Só muda o
  // alvo da prévia (não marca "salvando").
  const setFoco = (sec: string) => setS((s) => (s.foco === sec ? s : { ...s, foco: sec }));

  // Foto do presente: upload manual -> imageUrl do card (vitrine) / miniatura (painel).
  async function subirFotoGift(i: number, file: File) {
    setSubindoFoto(i);
    try {
      const url = await enviarUpload(file);
      setS((s) => ({
        ...s,
        giftList: s.giftList.map((x, j) => (j === i ? { ...x, foto: url } : x)),
      }));
    } catch {
      /* ignora */
    } finally {
      setSubindoFoto(null);
    }
  }
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

  // Foto da capa PARA O COMPUTADOR (paisagem) — opcional. Vazia = usa a do celular.
  const subirCapaDesktop = async (file: File | undefined) => {
    if (!file) return;
    setCapaDeskErro("");
    setCapaDeskEnviando(true);
    try {
      upd({ capaFotoDesktop: await enviarUpload(file) });
    } catch (e) {
      setCapaDeskErro(e instanceof Error ? e.message : "Não consegui enviar a foto. Tente de novo.");
    } finally {
      setCapaDeskEnviando(false);
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
  // Obrigatórios por passo: nome na Capa (passo 1); data/local no Conteúdo (passo 2);
  // link/endereço no Revisar (passo final, antes de publicar).
  const reqNome = req(S.nome);
  const reqDataLocal = req(S.data) && req(S.hIni) && req(S.local) && req(S.cidade) && req(S.uf);
  const reqOk = reqNome && reqDataLocal && slugOk;

  const next = () => {
    if (S.step === 1 && !reqNome) return setS((s) => ({ ...s, showErr: true }));
    // Data/local moram no acordeão "Local" do Conteúdo: se faltar, abre-o e destaca.
    if (S.step === 2 && !reqDataLocal) return setS((s) => ({ ...s, showErr: true, acc: 2, foco: "quando" }));
    setS((s) => {
      const step = Math.min(STEP_NAMES.length, s.step + 1);
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
    fotoDesktopUrl: S.capaDoisFotos ? S.capaFotoDesktop || undefined : undefined,
    idade: S.idade ? Number(S.idade) : undefined,
    monograma: S.monograma,
    logoUrl: S.monogramaFoto || undefined,
    animacoes: S.animacoes,
    negrito: S.negrito,
    tema: S.tema,
    temaCor: S.tema === "custom" ? S.corCustom : undefined,
    fontes: S.fonte,
    capaEscala: ESCALAS_CAPA[S.szT] ?? 1,
    capaOverlay: S.overlay,
    ctaLabel: S.btnTx || undefined,
    ctaHref: BTN_HREFS[S.btnDest] ?? "/confirmar",
    ctaLead: S.btnAcima || undefined,
    rodapeMsg: S.rodapeTx || undefined,
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
    recadosEyebrow: S.rec ? seMudou(S.recEyebrow, REC_PADRAO.eyebrow) : undefined,
    recadosTitulo: S.rec ? seMudou(S.recTitulo, REC_PADRAO.titulo) : undefined,
    recadosConvite: S.rec ? seMudou(S.recConvite, REC_PADRAO.convite) : undefined,
    recadosMural: S.rec ? seMudou(S.recMural, REC_PADRAO.mural) : undefined,
    pixNome: S.gifts ? S.pixNome : undefined,
    pixChave: S.gifts ? S.pixChave : undefined,
    presentesTexto: S.gifts ? S.presentesTexto || undefined : undefined,
    presentes: presentesDoEditor(S),
    listaModelo: S.listaModelo,
    programacao: S.programacao.filter((p) => p.hora.trim() || p.titulo.trim()),
    recursosOff: [
      !S.rsvp ? "rsvp" : null,
      !S.gifts ? "presentes" : null,
      !S.gal ? "galeria" : null,
      !S.rec ? "recados" : null,
      !S.prog ? "programacao" : null,
    ].filter(Boolean) as string[],
    pais: S.paisOn ? { pai: S.pai, mae: S.mae } : undefined,
    rsvpConfig: S.rsvp ? rsvpConfigDe(S) : undefined,
  });

  // Grava no banco: rascunho (publicar=false) ou publica (site no ar).
  const enviar = (publicar: boolean) => {
    // Antes de publicar, o link precisa estar válido — está no passo final.
    if (publicar && !slugOk) {
      setS((s) => ({ ...s, step: STEP_NAMES.length, showErr: true }));
      return;
    }
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
        try {
          localStorage.removeItem(RASCUNHO_KEY);
        } catch {}
      } else {
        setS((s) => ({ ...s, sv: "salvo" }));
      }
    });
  };

  // ── AUTOSAVE do rascunho ──────────────────────────────────────────────────
  // "Impressão digital" do conteúdo: muda a cada alteração real do convite.
  const dadosStr = JSON.stringify(montarRascunho(S));

  // A função de salvar mora num ref e é reescrita a cada render, então ela sempre
  // enxerga o estado MAIS NOVO (sem "stale closure"). Salva como rascunho (false).
  useEffect(() => {
    dadosRef.current = dadosStr;
    salvarRef.current = async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      const snapshot = dadosStr;
      let salvouOk = false;
      setS((s) => ({ ...s, sv: "salvando" }));
      try {
        const r = await criarConvite({ ...montarPayload(), id: eventId ?? undefined }, false);
        if (r.ok) {
          salvouOk = true;
          setSalvarErro("");
          setEventId(r.id);
          lastSavedRef.current = snapshot;
          setS((s) => ({ ...s, sv: "salvo" }));
        } else {
          setSalvarErro(r.error || "Não consegui salvar agora.");
          setS((s) => ({ ...s, sv: "erro" }));
        }
      } catch {
        setSalvarErro("Sem conexão com o servidor.");
        setS((s) => ({ ...s, sv: "erro" }));
      } finally {
        savingRef.current = false;
        // Mudou durante o save? Salva de novo o que ficou pra trás — MAS só se o
        // save deu certo. Falhou (sessão expirada, validação), o conteúdo atual
        // fica diferente do último salvo pra sempre, e re-tentar aqui vira laço
        // infinito de POSTs (86 mil numa sessão do João, 11/08). Ver lib/autosave.
        if (deveResalvar(salvouOk, dadosRef.current, lastSavedRef.current)) {
          void salvarRef.current();
        }
      }
    };
  });

  // Debounce: dispara o save ~800ms depois da última alteração.
  useEffect(() => {
    if (primeiroRender.current) {
      primeiroRender.current = false;
      lastSavedRef.current = dadosStr;
      dadosInicialRef.current = dadosStr;
      return;
    }
    if (!restauradoRef.current) return; // espera restaurar o rascunho do navegador
    if (S.published) return; // depois de publicar não fica salvando por cima
    if (!req(S.nome)) return; // só persiste quando já há nome (garante slug bom)
    if (dadosStr === lastSavedRef.current) return;
    setS((s) => (s.sv === "salvando" ? s : { ...s, sv: "salvando" }));
    const t = setTimeout(() => void salvarRef.current(), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosStr]);

  // Evita perder trabalho: avisa ao fechar/sair com alteração ainda não salva.
  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => {
      if (savingRef.current || dadosRef.current !== lastSavedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", antesDeSair);
    return () => window.removeEventListener("beforeunload", antesDeSair);
  }, []);

  // RESUME: ao reabrir a página, restaura o rascunho salvo no navegador.
  // setState no mount é o padrão canônico aqui (initializer preguiçoso quebraria
  // a hidratação do SSR), então a regra de cascading-render não se aplica.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RASCUNHO_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { S?: Partial<State>; eventId?: string | null };
        if (saved?.S) setS((s) => ({ ...s, ...saved.S, sv: "salvo", showErr: false }));
        if (saved?.eventId) setEventId(saved.eventId);
      }
    } catch {}
    restauradoRef.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Guarda o rascunho no navegador a cada alteração (após restaurar; nunca o demo intocado).
  useEffect(() => {
    if (!restauradoRef.current) return;
    if (dadosStr === dadosInicialRef.current) return;
    try {
      localStorage.setItem(RASCUNHO_KEY, JSON.stringify({ S, eventId }));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosStr, S.step, eventId]);

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
    { name: "Data e local", tag: "", kind: "local", st: reqDataLocal ? "Preenchido" : "Faltando", ok: reqDataLocal },
    { name: "Traje", tag: "· opcional", kind: "traje", st: S.trajeOn ? "Visível" : "Oculta", ok: S.trajeOn },
    {
      name: "Programação da festa",
      tag: "· opcional",
      kind: "programacao",
      // Desligada vence o "preenchida": o que o resumo mostra é o que o convidado vê.
      st: !S.prog
        ? "Oculta"
        : S.programacao.some((p) => p.hora.trim() || p.titulo.trim())
          ? "Preenchida"
          : "Vazia",
      ok: S.prog && S.programacao.some((p) => p.hora.trim() || p.titulo.trim()),
    },
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

  const svText =
    S.sv === "salvo"
      ? "Alterações salvas"
      : S.sv === "erro"
        ? salvarErro || "Não foi possível salvar"
        : "Salvando…";
  const svColor = S.sv === "salvo" ? "#34A177" : S.sv === "erro" ? "#E11D48" : V;


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
                  {n < STEP_NAMES.length && <div style={{ background: done ? "#C4B5FD" : "#E4E4EA" }} className="mx-2.5 h-[1.5px] w-[30px]" />}
                </div>
              );
            })}
          </div>
          <div style={{ color: svColor }} className="flex shrink-0 items-center gap-2 text-[12.5px] font-medium">
            <span style={{ background: svColor }} className={`size-[7px] rounded-full ${S.sv === "salvando" ? "sc-pulse" : ""}`} />
            {svText}
            {S.sv === "erro" && (
              <button
                type="button"
                onClick={() => void salvarRef.current()}
                className="cursor-pointer font-semibold text-[#E11D48] underline underline-offset-2"
              >
                Tentar de novo
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_500px] xl:grid-cols-[minmax(0,1fr)_620px] 2xl:grid-cols-[minmax(0,1fr)_760px]">
          {/* ===================== FORM COLUMN ===================== */}
          {/* onFocus/onClick borbulham: ao tocar num campo com `data-foco`, a
              prévia rola até aquela seção do site ("vai para onde estou mexendo"). */}
          <div className="flex flex-col gap-4" onFocus={onFocoCampo} onClick={onFocoCampo}>
            {/* STEP 1 — Capa (o nome da debutante mora aqui) */}
            {S.step === 1 && (
              <div data-foco="capa" className={cardCls}>
                <div className="text-[18px] font-bold tracking-[-0.02em]">Personalize a capa</div>
                <div className="mb-5 mt-1.5 text-[13.5px] text-[#6e6e76]">Ajuste a foto, os textos e as cores principais do convite.</div>
                {/* Foto da capa — UMA foto (padrão: vale pro celular e pro computador).
                    O bloco leva data-foco="capa": a prévia rola até a capa ao mexer. */}
                <div data-foco="capa">
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
                    <span className="font-semibold text-[#3a3a42]">Medida ideal</span> — foto <b>vertical (em pé)</b>, de pelo menos <b>1080 × 1350&nbsp;px</b> (ideal <b>1600 × 2000</b>). Deixe a pessoa <b>mais ao centro</b> pra ficar bem no celular e no computador.
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

                  {/* Opção: foto diferente no computador (default OFF). */}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-[#ECECF0] bg-[#F4F4F6] px-4 py-3">
                    <div className="pr-3">
                      <div className="text-[13px] font-semibold">Quero uma foto diferente no computador</div>
                      <div className="text-[12px] text-[#6e6e76]">Sem isso, a mesma foto vale pros dois. Toque em “Computador” na prévia pra conferir.</div>
                    </div>
                    <Toggle on={S.capaDoisFotos} onClick={() => upd({ capaDoisFotos: !S.capaDoisFotos })} />
                  </div>
                  {S.capaDoisFotos && (
                    <div className="mt-3">
                      <div className="mb-2.5 text-[12.5px] font-semibold text-[#3F3F46]">Foto do computador <span className="font-normal text-[#A6A6AE]">· deitada (paisagem)</span></div>
                      <div className="flex items-stretch gap-3.5">
                        <div
                          className="flex h-[100px] w-[178px] flex-none items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(160deg,#1a1426,#3b2a63_70%,#7C3AED)] bg-cover bg-center"
                          style={
                            S.capaFotoDesktop
                              ? { backgroundImage: `url('${S.capaFotoDesktop}')` }
                              : S.capaFoto
                                ? { backgroundImage: `url('${S.capaFoto}')`, opacity: 0.5 }
                                : undefined
                          }
                        >
                          {!S.capaFotoDesktop && !S.capaFoto && (
                            <span className="font-[family-name:var(--font-playfair)] text-[18px] text-white">{S.nome}</span>
                          )}
                        </div>
                        <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#D5D5DC] text-[#6e6e76] transition-colors hover:border-[#7C3AED] hover:bg-[#FBFAFE] hover:text-[#7C3AED]">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={capaDeskEnviando}
                            onChange={(e) => {
                              void subirCapaDesktop(e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                          <Ic d={IC.upload} size={18} stroke="currentColor" width={1.8} />
                          <span className="text-[12.5px] font-semibold">
                            {capaDeskEnviando ? "Enviando…" : S.capaFotoDesktop ? "Trocar foto do computador" : "Enviar foto do computador"}
                          </span>
                          <span className="text-[11px] text-[#A6A6AE]">Ideal 2000 × 1200</span>
                        </label>
                      </div>
                      {(capaDeskErro || S.capaFotoDesktop) && (
                        <div className="mt-2 text-[11.5px]">
                          {capaDeskErro ? (
                            <span className="text-[#E11D48]">{capaDeskErro}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => upd({ capaFotoDesktop: "" })}
                              className="cursor-pointer font-semibold text-[#6e6e76] hover:text-[#E11D48]"
                            >
                              Remover foto do computador
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="my-5 h-px bg-[#F0F0F3]" />
                <div className="mb-3 text-[13.5px] font-bold">Textos da capa</div>
                <div className="flex flex-col gap-3">
                  <div data-foco="capa-nome">
                    <Label>Nome da debutante</Label>
                    <input value={S.nome} onChange={inp("nome")} style={{ borderColor: S.showErr && !req(S.nome) ? "#FF2D8D" : "#E4E4EA" }} className={`${inputCls} text-[15px] font-semibold`} />
                    <div className="mt-1 text-[11.5px] text-[#A6A6AE]">É o nome que aparece em destaque na capa.</div>
                    {S.showErr && !req(S.nome) && (
                      <div className="mt-2 rounded-[11px] border border-[#FF2D8D]/25 bg-[#FDF0F5] px-3.5 py-2.5 text-[13px] text-[#C2185B]">
                        Preencha o nome da debutante para continuar.
                      </div>
                    )}
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
                {/* Monograma da barra — aponta para a marquinha no topo do site (data-foco="monograma"). */}
                <div data-foco="monograma" className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-bold">Monograma na barra</div>
                    <div className="text-[12px] text-[#6e6e76]">A marquinha no topo do site. Sem imagem, usa as iniciais do nome.</div>
                  </div>
                  <Toggle on={S.monograma} onClick={() => upd({ monograma: !S.monograma })} />
                </div>
                {S.monograma && (
                  <div data-foco="monograma">
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
                  </div>
                )}

                <div className="my-5 h-px bg-[#F0F0F3]" />
                <div className="mb-1 text-[13.5px] font-bold">Tamanho dos textos da capa</div>
                <div className="mb-3 text-[12px] text-[#6e6e76]">Deixa o nome e a idade maiores ou menores juntos — sempre ajustado no celular e no computador.</div>
                <Seg value={S.szT} onChange={(i) => upd({ szT: i })} />
                <div className="my-5 h-px bg-[#F0F0F3]" />
                {/* data-foco="livre": ao trocar a cor NÃO destaca uma seção só — a
                    prévia fica livre pra pessoa ver o site inteiro re-tingido. */}
                {/* Trocar a cor RECARREGA a prévia (re-tinge). Mantendo foco="carta"
                    (seção dos textos), todo reload rola pros textos — nunca sobe pra
                    capa. A 1ª cor desce até lá; as próximas ficam lá. */}
                <div data-foco="livre-textos">
                  <div className="mb-1 text-[13.5px] font-bold">Paleta de cores</div>
                  <div className="mb-3 text-[12px] text-[#6e6e76]">Muda a cor do convite inteiro. Escolha uma das mais usadas ou qualquer cor.</div>
                  <Paletas value={S.tema} onChange={(k) => upd({ tema: k, corFocou: true })} />
                  <CorPersonalizada ativo={S.tema === "custom"} cor={S.corCustom} onPick={(hex) => upd({ tema: "custom", corCustom: hex, corFocou: true })} />
                </div>
                <div className="my-5 h-px bg-[#F0F0F3]" />
                {/* Letras do convite — mesmo seletor visual da tela "Trocar o estilo".
                    data-foco="livre": ao trocar a fonte a prévia recarrega re-fontada
                    sem forçar rolagem (mostra o nome na capa). */}
                <div data-foco="livre">
                  <div className="mb-1 text-[13.5px] font-bold">Letras do convite</div>
                  <div className="mb-3 text-[12px] text-[#6e6e76]">Toque para ver o nome do convite em cada estilo de fonte.</div>
                  <SeletorFontes nome={S.nome} value={S.fonte} onChange={(k) => upd({ fonte: k })} />
                </div>
                <div className="my-5 h-px bg-[#F0F0F3]" />
                {/* Letra em negrito: engrossa títulos/corpo do convite inteiro. O NOME
                    da capa só acompanha nas letras com peso forte publicado — nas
                    manuscritas o aviso conta isso em vez de fingir que aplicou. */}
                <div data-foco="livre" className="flex items-center justify-between gap-3 rounded-xl border border-[#ECECF0] bg-[#F4F4F6] px-4 py-3">
                  <div>
                    <div className="text-[13px] font-semibold">Letra em negrito</div>
                    <div className="text-[12px] text-[#6e6e76]">
                      Deixa os títulos e os textos do convite com o traço mais forte.
                      {!fonteTemNegritoNoNome(S.fonte) && " Esta letra não tem negrito no nome da capa."}
                    </div>
                  </div>
                  <Toggle on={S.negrito} onClick={() => upd({ negrito: !S.negrito })} />
                </div>
                <div className="my-5 h-px bg-[#F0F0F3]" />
                <div className="flex items-center justify-between rounded-xl border border-[#ECECF0] bg-[#F4F4F6] px-4 py-3">
                  <div>
                    <div className="text-[13px] font-semibold">Escurecer a foto da capa</div>
                    <div className="text-[12px] text-[#6e6e76]">Ajuda a ler o nome quando a foto é clara.</div>
                  </div>
                  <Toggle on={S.overlay} onClick={() => upd({ overlay: !S.overlay })} />
                </div>
              </div>
            )}

            {/* STEP 2 — Conteúdo (inclui Data e local, dentro do acordeão "Local") */}
            {S.step === 2 && (
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
                                <span className="text-[13px] font-semibold">Mostrar o nome dos pais na assinatura</span>
                                <Toggle on={S.paisOn} onClick={() => upd({ paisOn: !S.paisOn })} />
                              </div>
                              {S.paisOn && (
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
                              )}
                              <div className="rounded-xl border border-[#ECECF0] bg-[#FAFAFC] px-3.5 py-2.5 text-[12px] leading-[1.5] text-[#6e6e76]">
                                {S.paisOn ? (
                                  <>Aparecem na <b>assinatura</b> do convite, junto com a debutante — ex.: “{juntarNomes([S.pai, S.mae, S.nome]) || S.nome}”.</>
                                ) : (
                                  <>Sem os pais, a assinatura mostra só <b>{S.nome || "a debutante"}</b>.</>
                                )}
                              </div>
                            </div>
                          )}
                          {a.kind === "local" && (
                            <div className="flex flex-col gap-3">
                              <div data-foco="quando" className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Data da festa</Label>
                                  <input
                                    type="date"
                                    value={ddmmParaISO(S.data)}
                                    onChange={(e) => upd({ data: isoParaDDMM(e.target.value) })}
                                    style={{ borderColor: S.showErr && !req(S.data) ? "#FF2D8D" : "#E4E4EA" }}
                                    className={`${inputCls} [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                  />
                                </div>
                                <div>
                                  <Label>Horário de início</Label>
                                  <input
                                    type="time"
                                    value={S.hIni}
                                    onChange={inp("hIni")}
                                    style={{ borderColor: S.showErr && !req(S.hIni) ? "#FF2D8D" : "#E4E4EA" }}
                                    className={`${inputCls} [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                  />
                                </div>
                              </div>
                              <div data-foco="quando" className="grid grid-cols-1 gap-3 sm:grid-cols-[0.8fr_1.2fr]">
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
                              <div data-foco="quando">
                                <Label>Endereço</Label>
                                <input value={S.endereco} onChange={inp("endereco")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                              </div>
                              <div data-foco="quando" className="grid grid-cols-[1.6fr_0.6fr] gap-3">
                                <div>
                                  <Label>Cidade</Label>
                                  <input value={S.cidade} onChange={inp("cidade")} style={{ borderColor: S.showErr && !req(S.cidade) ? "#FF2D8D" : "#E4E4EA" }} className={inputCls} />
                                </div>
                                <div>
                                  <Label>UF</Label>
                                  <input value={S.uf} onChange={inp("uf")} style={{ borderColor: S.showErr && !req(S.uf) ? "#FF2D8D" : "#E4E4EA" }} className={inputCls} />
                                </div>
                              </div>
                              {S.showErr && !reqDataLocal && (
                                <div className="rounded-[11px] border border-[#FF2D8D]/25 bg-[#FDF0F5] px-3.5 py-2.5 text-[13px] text-[#C2185B]">
                                  Preencha data, horário, local, cidade e UF para continuar.
                                </div>
                              )}
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
                          {a.kind === "programacao" && (
                            <div className="flex flex-col gap-3">
                              {/* Liga/desliga da seção inteira — mesmo padrão da Galeria e do
                                  Mural de recados (passo 5). Desligado, a seção some da prévia
                                  e do site publicado (viaja em `recursosOff`). */}
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[13px] font-semibold">Mostrar a programação no convite</span>
                                <Toggle on={S.prog} onClick={() => upd({ prog: !S.prog })} />
                              </div>
                              {S.prog && (
                                <>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[12.5px] text-[#6e6e76]">
                                  A festa hora a hora — aparece na página do evento. Deixe vazio pra esconder.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => upd({ programacao: programacaoSugerida("QUINZE_ANOS") })}
                                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F6F3FE] px-3 py-1.5 text-[12px] font-semibold text-[#6D28D9] hover:bg-[#EFE7FE]"
                                >
                                  ✨ Sugerir
                                </button>
                              </div>
                              <div className="flex flex-col gap-2">
                                {S.programacao.map((p, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <input
                                      value={p.hora}
                                      onChange={(e) =>
                                        upd({
                                          programacao: S.programacao.map((x, j) =>
                                            j === i ? { ...x, hora: e.target.value } : x,
                                          ),
                                        })
                                      }
                                      placeholder="20h30"
                                      maxLength={20}
                                      style={{ borderColor: "#E4E4EA" }}
                                      className="w-[86px] flex-none rounded-[11px] border bg-white px-2 py-2.5 text-center text-[14px] font-semibold text-[#17171B]"
                                    />
                                    <input
                                      value={p.titulo}
                                      onChange={(e) =>
                                        upd({
                                          programacao: S.programacao.map((x, j) =>
                                            j === i ? { ...x, titulo: e.target.value } : x,
                                          ),
                                        })
                                      }
                                      placeholder="Recepção"
                                      maxLength={140}
                                      style={{ borderColor: "#E4E4EA" }}
                                      className={`${inputCls} min-w-0 flex-1`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        upd({ programacao: S.programacao.filter((_, j) => j !== i) })
                                      }
                                      title="Remover momento"
                                      className="grid size-8 flex-none cursor-pointer place-items-center rounded-lg text-[#A6A6AE] hover:bg-[#FDECEF] hover:text-[#E11D48]"
                                    >
                                      <Ic d={IC.x} size={15} stroke="currentColor" width={2} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  upd({ programacao: [...S.programacao, { hora: "", titulo: "" }] })
                                }
                                className="w-full cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-[#D5D5DC] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#7C3AED] hover:border-[#7C3AED] hover:bg-[#FBFAFE]"
                              >
                                + Adicionar momento
                              </button>
                                </>
                              )}
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
                                  {BTN_LABELS.map((l, bi) => (
                                    // Ao trocar a ação, a escrita do botão acompanha (o texto continua editável logo acima).
                                    <Chip key={l} label={l} active={S.btnDest === bi} onClick={() => upd({ btnDest: bi, btnTx: l })} />
                                  ))}
                                </div>
                              </div>
                              <div className="text-[12px] text-[#A6A6AE]">A escrita do botão acompanha a ação escolhida — e você ainda pode ajustá-la acima.</div>
                            </div>
                          )}
                          {a.kind === "rodape" && (
                            <div className="flex flex-col gap-3">
                              <div>
                                <Label>Frase de despedida</Label>
                                <input value={S.rodapeTx} onChange={inp("rodapeTx")} placeholder="Feito com carinho." style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                                <div className="mt-1 text-[11.5px] text-[#A6A6AE]">O fecho do site, logo abaixo do seu nome e da data.</div>
                              </div>
                              <div className="text-[12px] text-[#A6A6AE]">
                                O nome (<b>{S.nome || "—"}</b>) e a data aparecem automáticos, do que você preencheu nas etapas anteriores.
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


            {/* STEP 3 — Confirmação */}
            {S.step === 3 && (
              <div data-foco="rsvp" className={cardCls}>
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
                        <input
                          type="date"
                          value={ddmmParaISO(S.rsvpDataLimite)}
                          onChange={(e) => upd({ rsvpDataLimite: isoParaDDMM(e.target.value) })}
                          style={{ borderColor: "#E4E4EA" }}
                          className={`${inputCls} [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                        />
                      </div>
                      <div>
                        <Label>Máximo de acompanhantes</Label>
                        <input value={S.maxComp} onChange={(e) => upd({ maxComp: e.target.value.replace(/\D/g, "").slice(0, 2) })} inputMode="numeric" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {RSVP_LABELS.map((name, i) => (
                        // Sem trocar o foco ao ligar/desligar: a mudança vai AO VIVO
                        // pro formulário por postMessage (instantâneo, sem recarregar).
                        <div key={name} className="flex items-center justify-between border-b border-[#F0F0F3] py-2.5">
                          <span className="text-[13.5px] text-[#3F3F46]">{name}</span>
                          <Toggle on={S.rsvpOpts[i]} onClick={() => { const rsvpOpts = [...S.rsvpOpts]; rsvpOpts[i] = !rsvpOpts[i]; upd({ rsvpOpts }); }} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="mb-2 text-[12.5px] font-semibold text-[#3F3F46]">Cor do botão</div>
                      <div className="flex flex-wrap gap-2">
                        <Chip label="Usar a cor do convite" active={S.theme === 0} onClick={() => upd({ theme: 0 })} />
                        <Chip label="Escolher outra cor" active={S.theme === 1} onClick={() => upd({ theme: 1 })} />
                      </div>
                      {S.theme === 1 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {["#CE578B", "#B83D6B", "#C0663F", "#E0B341", "#3FA05B", "#2F8F83", "#3B74E0", "#7C4CE0", "#111827"].map((c) => (
                            <span
                              key={c}
                              onClick={() => upd({ rsvpCorBotao: c })}
                              style={{ background: c, borderColor: S.rsvpCorBotao.toLowerCase() === c.toLowerCase() ? V : "#E4E4EA" }}
                              className="size-7 cursor-pointer rounded-full border-2 shadow-[inset_0_0_0_2px_#fff]"
                            />
                          ))}
                          <span
                            className="relative inline-flex size-7 items-center justify-center overflow-hidden rounded-full border border-[#E4E4EA]"
                            style={{ background: /^#[0-9a-fA-F]{6}$/.test(S.rsvpCorBotao) ? S.rsvpCorBotao : "#CE578B" }}
                            title="Qualquer cor"
                          >
                            <input
                              type="color"
                              value={/^#[0-9a-fA-F]{6}$/.test(S.rsvpCorBotao) ? S.rsvpCorBotao : "#CE578B"}
                              onChange={(e) => upd({ rsvpCorBotao: e.target.value })}
                              className="absolute inset-0 cursor-pointer opacity-0"
                              aria-label="Qualquer cor do botão"
                            />
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Prévia da tela de agradecimento (o que o convidado vê APÓS
                        responder): botões pra ver cada variante ao vivo, à vontade.
                        Clicar leva a prévia pra a página /obrigada correspondente. */}
                    <div className="rounded-xl border border-[#ECECF0] bg-[#FAFAFC] px-4 py-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[12.5px] font-semibold text-[#3F3F46]">Tela de agradecimento</span>
                        <div className="flex gap-1.5">
                          {([["obrigada-sim", "Ver: quem confirma"], ["obrigada-nao", "Ver: quem não vai"]] as const).map(([f, l]) => {
                            const on = S.foco === f;
                            return (
                              <button
                                key={f}
                                type="button"
                                data-foco={f}
                                onClick={() => setFoco(f)}
                                style={{ borderColor: on ? V : "#E4E4EA", background: on ? "#F3EFFE" : "#fff", color: on ? "#6D28D9" : MUT }}
                                className="cursor-pointer rounded-full border px-3 py-[6px] text-[12px] font-medium"
                              >
                                {l}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-[11.5px] leading-[1.5] text-[#A6A6AE]">
                        É a tela que o convidado vê depois de responder. Toque numa opção pra ver na prévia — e edite a mensagem abaixo. Depois é só clicar em qualquer outra parte pra a prévia voltar ao convite.
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* data-foco="obrigada-sim/nao": ao editar, a prévia pula pra
                          tela de "Obrigada" e mostra ONDE a mensagem aparece. */}
                      <div data-foco="obrigada-sim">
                        <Label>Mensagem para quem confirma</Label>
                        <textarea rows={2} value={S.rsvpMsgSim} onChange={inp("rsvpMsgSim")} style={{ borderColor: "#E4E4EA" }} className={`${inputCls} resize-y leading-relaxed`} />
                        <div className="mt-1 text-[11.5px] text-[#A6A6AE]">Aparece na tela de agradecimento de quem confirmou presença.</div>
                      </div>
                      <div data-foco="obrigada-nao">
                        <Label>Mensagem para quem não pode ir</Label>
                        <textarea rows={2} value={S.rsvpMsgNao} onChange={inp("rsvpMsgNao")} style={{ borderColor: "#E4E4EA" }} className={`${inputCls} resize-y leading-relaxed`} />
                        <div className="mt-1 text-[11.5px] text-[#A6A6AE]">Aparece para quem respondeu que não vai.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 — Presentes e Pix */}
            {S.step === 4 && (
              <>
                <div className={cardCls}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[18px] font-bold tracking-[-0.02em]">Presentes e Pix</div>
                      <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">Sua lista de presentes e onde o dinheiro cai.</div>
                    </div>
                    <Toggle on={S.gifts} onClick={() => upd({ gifts: !S.gifts })} size="lg" />
                  </div>
                </div>
                {S.gifts && (
                  <>
                    {/* ── Caixa 1: como a lista aparece pro convidado ── */}
                    <div className={cardCls}>
                      <div className="mb-4 text-[15.5px] font-bold">Como a lista aparece</div>
                      <div className="flex flex-col gap-4">
                      <div>
                        <Label>Modelo da lista</Label>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          {([
                            { k: "painel", nome: "Painel", desc: "Foto + lista, clássico", trava: false },
                            { k: "vitrine", nome: "Vitrine", desc: "Cards com foto, estilo loja", trava: !podeVitrine(plano) },
                          ] as const).map((m) => {
                            const ativo = S.listaModelo === m.k;
                            return (
                              <button
                                key={m.k}
                                type="button"
                                disabled={m.trava}
                                onClick={() => !m.trava && upd({ listaModelo: m.k })}
                                className={`rounded-xl border p-3 text-left transition-colors ${ativo ? "border-[#7C3AED] bg-[#F6F3FE]" : "border-[#E4E4EA] bg-white hover:bg-[#FAFAFC]"} ${m.trava ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                              >
                                <div className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#17171B]">
                                  {m.nome}
                                  {m.trava && <span className="text-[11px]">🔒</span>}
                                </div>
                                <div className="mt-0.5 text-[11.5px] text-[#6e6e76]">{m.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                        {!podeVitrine(plano) && (
                          <p className="mt-1.5 text-[11.5px] text-[#A6A6AE]">A Vitrine (cards com foto) está disponível nos planos pagos.</p>
                        )}
                      </div>
                      <div>
                        <Label>Texto de apresentação</Label>
                        <input value={S.presentesTexto} onChange={inp("presentesTexto")} placeholder="Escolha um presente e ajude a tornar essa noite ainda mais especial" style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                      </div>
                      </div>
                    </div>

                    {/* ── Caixa 2: os presentes em si (ordem = ordem no site) ── */}
                    <div className={cardCls}>
                      <div className="mb-4 text-[15.5px] font-bold">Seus presentes</div>
                      <div className="flex flex-col gap-4">
                      {/* Adicionar rápido — 1 toque adiciona um presente pronto (fácil). */}
                      <div>
                        <div className="mb-2 text-[12.5px] font-semibold text-[#3F3F46]">Adicionar rápido <span className="font-normal text-[#A6A6AE]">— toque para incluir</span></div>
                        <div className="flex flex-wrap gap-2">
                          {SUGESTOES_PRESENTES.map((s) => {
                            const jaTem = S.giftList.some((g) => g.n.trim().toLowerCase() === s.n.toLowerCase());
                            return (
                              <button
                                key={s.n}
                                type="button"
                                disabled={jaTem}
                                onClick={() => upd({ giftList: [...S.giftList, { n: s.n, desc: s.desc, v: s.v }] })}
                                className={`rounded-full border px-3 py-[7px] text-[12.5px] font-medium transition-colors ${
                                  jaTem
                                    ? "cursor-default border-[#ECECF0] bg-[#F4F4F6] text-[#B9B9C0]"
                                    : "cursor-pointer border-[#DCCDFB] bg-[#F6F3FE] text-[#6D28D9] hover:bg-[#EFE7FE]"
                                }`}
                              >
                                {jaTem ? "✓ " : "+ "}{s.n}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div data-foco="presentes" className="flex flex-col gap-2.5">
                        {S.giftList.length === 0 && (
                          <div className="rounded-xl border border-dashed border-[#E4E4EA] bg-[#FAFAFC] px-4 py-6 text-center text-[13px] text-[#A6A6AE]">
                            Nenhum presente ainda. Toque numa sugestão acima ou em “Adicionar presente”.
                          </div>
                        )}
                        {S.giftList.map((g, i) => {
                          const setRow = (patch: Partial<GiftRow>) =>
                            upd({ giftList: S.giftList.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                          const emCotas = g.modo === "COTAS";
                          const nCotas = g.cotas ?? 10;
                          const totalCentsGift = (parseInt(g.v.replace(/\D/g, ""), 10) || 0) * 100;
                          const cotaCentsGift = emCotas && nCotas > 0 ? Math.round(totalCentsGift / nCotas) : 0;
                          return (
                          <div key={i} className="rounded-2xl border border-[#ECECF0] bg-white p-3 shadow-[0_1px_4px_rgba(23,23,27,0.03)]">
                            <div className="flex items-center gap-2.5">
                              <span className="grid size-6 flex-none place-items-center rounded-full bg-[#F3EFFE] text-[11px] font-bold text-[#7C3AED]">{i + 1}</span>
                              {/* Ordem da lista = ordem que o convidado vê no site. */}
                              <div className="flex flex-none flex-col">
                                <button
                                  type="button"
                                  aria-label="Subir presente"
                                  title="Subir"
                                  disabled={i === 0}
                                  onClick={() => upd({ giftList: moverItem(S.giftList, i, i - 1) })}
                                  className="cursor-pointer px-1 text-[10px] leading-none text-[#A6A6AE] hover:text-[#7C3AED] disabled:cursor-default disabled:opacity-25"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  aria-label="Descer presente"
                                  title="Descer"
                                  disabled={i === S.giftList.length - 1}
                                  onClick={() => upd({ giftList: moverItem(S.giftList, i, i + 1) })}
                                  className="mt-0.5 cursor-pointer px-1 text-[10px] leading-none text-[#A6A6AE] hover:text-[#7C3AED] disabled:cursor-default disabled:opacity-25"
                                >
                                  ▼
                                </button>
                              </div>
                              <input
                                value={g.n}
                                onChange={(e) => setRow({ n: e.target.value })}
                                placeholder="Nome do presente"
                                style={{ borderColor: "#E4E4EA" }}
                                className={`${inputCls} flex-1 font-semibold`}
                              />
                              <div className="relative w-[120px] flex-none">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#8b8b93]">R$</span>
                                <input
                                  value={g.v.replace(/[^\d]/g, "")}
                                  onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, "");
                                    setRow({ v: digits ? `R$ ${digits}` : "" });
                                  }}
                                  inputMode="numeric"
                                  placeholder="0"
                                  style={{ borderColor: "#E4E4EA" }}
                                  className={`${inputCls} pl-9 text-right font-semibold`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => upd({ giftList: S.giftList.filter((_, j) => j !== i) })}
                                title="Remover presente"
                                className="grid size-8 flex-none cursor-pointer place-items-center rounded-lg text-[#A6A6AE] hover:bg-[#FDECEF] hover:text-[#E11D48]"
                              >
                                <Ic d={IC.x} size={15} stroke="currentColor" width={2} />
                              </button>
                            </div>

                            {/* Cobrança: valor único ou dividido em cotas (presente caro → 1 cota) */}
                            <div className="mt-2 flex flex-wrap items-center gap-2 pl-[38px]">
                              <div className="inline-flex overflow-hidden rounded-lg border border-[#E4E4EA]">
                                <button
                                  type="button"
                                  onClick={() => setRow({ modo: "FIXO" })}
                                  className={`px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${!emCotas ? "bg-[#7C3AED] text-white" : "bg-white text-[#6e6e76] hover:bg-[#F6F3FE]"}`}
                                >
                                  Valor único
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRow({ modo: "COTAS", cotas: g.cotas ?? 10 })}
                                  className={`px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${emCotas ? "bg-[#7C3AED] text-white" : "bg-white text-[#6e6e76] hover:bg-[#F6F3FE]"}`}
                                >
                                  Em cotas
                                </button>
                              </div>
                              {emCotas ? (
                                <label className="flex items-center gap-1.5 text-[12px] text-[#6e6e76]">
                                  dividir em
                                  <input
                                    type="number"
                                    min={2}
                                    max={200}
                                    value={nCotas}
                                    onChange={(e) =>
                                      setRow({ cotas: Math.max(2, Math.min(200, parseInt(e.target.value, 10) || 2)) })
                                    }
                                    style={{ borderColor: "#E4E4EA" }}
                                    className="w-[62px] rounded-[8px] border px-2 py-1 text-center text-[12.5px] font-semibold"
                                  />
                                  cotas
                                  {totalCentsGift > 0 && (
                                    <span className="text-[#A6A6AE]">
                                      · R$ {(cotaCentsGift / 100).toFixed(2).replace(".", ",")} cada
                                    </span>
                                  )}
                                </label>
                              ) : (
                                <span className="text-[11px] text-[#A6A6AE]">
                                  {totalCentsGift > 0 ? "O convidado paga o valor cheio" : "Sem valor: o convidado escolhe quanto dar"}
                                </span>
                              )}
                            </div>

                            {/* Foto do presente (opcional) — miniatura no painel, capa na vitrine */}
                            <div className="mt-2 flex flex-wrap items-center gap-2.5 pl-[38px]">
                              {g.foto && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={g.foto} alt="" className="h-11 w-11 flex-none rounded-lg border border-[#ECECF0] object-cover" />
                              )}
                              <label className="cursor-pointer rounded-[10px] border border-[#DCCDFB] bg-[#F6F3FE] px-3 py-1.5 text-[12px] font-semibold text-[#6D28D9] hover:bg-[#EFE7FE]">
                                {subindoFoto === i ? "Enviando…" : g.foto ? "Trocar foto" : "Adicionar foto (opcional)"}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirFotoGift(i, f); e.target.value = ""; }} />
                              </label>
                              {g.foto && (
                                <button type="button" onClick={() => setRow({ foto: "" })} className="text-[11.5px] text-[#A6A6AE] hover:text-[#E11D48]">Remover</button>
                              )}
                            </div>

                            {/* Descrição do presente (opcional) — aparece abaixo do nome, na lista */}
                            <div className="mt-2 pl-[38px]">
                              <Label opt>Descrição</Label>
                              <input
                                value={g.desc}
                                onChange={(e) => setRow({ desc: e.target.value })}
                                placeholder="Ex.: “o momento mais esperado”"
                                style={{ borderColor: "#E4E4EA" }}
                                className={`${inputCls} text-[13px]`}
                              />
                            </div>
                          </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => upd({ giftList: [...S.giftList, { n: "", desc: "", v: "" }] })}
                          className="w-full cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-[#D5D5DC] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#7C3AED] hover:border-[#7C3AED] hover:bg-[#FBFAFE]"
                        >
                          + Adicionar presente em branco
                        </button>
                      </div>
                      </div>
                    </div>

                    {/* ── Caixa 3: dinheiro (valor livre + recebimento) ── */}
                    <div className={cardCls}>
                      <div className="text-[15.5px] font-bold">Dinheiro</div>
                      <div className="mb-4 mt-1 text-[13px] text-[#6e6e76]">Os presentes em dinheiro entram pela plataforma e ficam na sua carteira.</div>
                      <div className="mb-4 rounded-2xl border border-[#ECECF0] bg-[#F4F4F6] px-[18px] py-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-[13.5px] font-bold">Contribuição com valor livre</div>
                          <Toggle on={S.free} onClick={() => upd({ free: !S.free })} />
                        </div>
                        {S.free && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <Label>Título</Label>
                              <input value={S.freeTitulo} onChange={inp("freeTitulo")} maxLength={140} style={{ borderColor: "#E4E4EA" }} className="w-full rounded-[11px] border bg-white px-3 py-2.5 text-[13.5px] text-[#17171B]" />
                            </div>
                            <div>
                              <Label opt>Valores sugeridos</Label>
                              <input value={S.freeValores} onChange={inp("freeValores")} maxLength={140} style={{ borderColor: "#E4E4EA" }} className="w-full rounded-[11px] border bg-white px-3 py-2.5 text-[13.5px] text-[#17171B]" />
                            </div>
                          </div>
                        )}
                      </div>
                    <div className="flex items-center gap-3.5 rounded-[13px] border border-[#ECECF0] bg-[#F8F7FB] px-4 py-3.5">
                      <span className="grid size-11 flex-none place-items-center rounded-[13px] bg-[#EDE9FE] text-[#7C3AED]">
                        <Ic d={IC.card} size={19} stroke="#7C3AED" width={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold">O convidado paga pelo site — o valor cai na sua carteira</div>
                        <div className="mt-0.5 text-[12.5px] leading-snug text-[#6e6e76]">
                          Depois de publicar, ative a carteira em <span className="font-semibold text-[#17171b]">Recebimentos</span> e resgate por Pix quando quiser. Taxa de {taxaLabel(plano)} por presente.
                        </div>
                      </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* STEP 5 — Galeria e recados */}
            {S.step === 5 && (
              <>
                <div>
                  <div className="text-[18px] font-bold tracking-[-0.02em]">Galeria e recados</div>
                  <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">As fotos da festa e os recados dos convidados.</div>
                </div>
                <div data-foco="galeria" className={cardCls}>
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
                <div data-foco="recados" className={cardCls}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="text-[14.5px] font-bold">Mural de recados</div>
                    <Toggle on={S.rec} onClick={() => upd({ rec: !S.rec })} />
                  </div>
                  {S.rec && (
                    <>
                      {/* Textos da página /recados — vão AO VIVO pra prévia (data-live). */}
                      <div className="mb-4 mt-3 flex flex-col gap-3 rounded-[13px] border border-[#ECECF0] bg-[#FAFAFC] p-3.5">
                        <div className="text-[13px] font-semibold">Textos da página</div>
                        <div>
                          <Label>Chapéu</Label>
                          <input value={S.recEyebrow} onChange={inp("recEyebrow")} maxLength={60} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                        <div>
                          <Label>Título</Label>
                          <input value={S.recTitulo} onChange={inp("recTitulo")} maxLength={80} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                        <div>
                          <Label>Convite</Label>
                          <input value={S.recConvite} onChange={inp("recConvite")} maxLength={220} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                          <div className="mt-1 text-[11.5px] text-[#A6A6AE]">Escreva <span className="font-semibold">{"{nome}"}</span> onde quiser que apareça o nome do convite.</div>
                        </div>
                        <div>
                          <Label>Título do mural</Label>
                          <input value={S.recMural} onChange={inp("recMural")} maxLength={80} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
                        </div>
                      </div>
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
              </>
            )}

            {/* STEP 6 — Revisar e publicar */}
            {S.step === 6 && (
              <>
                <div>
                  <div className="text-[18px] font-bold tracking-[-0.02em]">Revisar e publicar</div>
                  <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">Confira se está tudo certo e publique o convite.</div>
                </div>
                {/* Link/endereço do convite — configurado aqui, no fim do fluxo. */}
                <div className={cardCls}>
                  <div className="text-[15.5px] font-bold">Endereço do seu convite</div>
                  <div className="mb-3.5 mt-1 text-[13px] text-[#6e6e76]">É o link que seus convidados vão receber.</div>
                  <div className="flex items-center overflow-hidden rounded-[11px] border bg-[#F4F4F6]" style={{ borderColor: S.showErr && !slugOk ? "#FF2D8D" : "#E4E4EA" }}>
                    <input value={S.slug} onChange={(e) => upd({ slug: e.target.value.toLowerCase().replace(/\s/g, "") })} className="min-w-[60px] flex-1 border-none bg-transparent px-3 py-2.5 text-[14px] font-semibold text-[#17171B]" />
                    <span className="whitespace-nowrap pr-3 text-[13px] text-[#8b8b93]">.seuconvite.orivya.com</span>
                  </div>
                  <div style={{ color: slugOk ? "#2E8A66" : "#D9376E" }} className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium">
                    <Ic d={slugOk ? IC.check : IC.alertCircle} size={13} stroke={slugOk ? "#2E8A66" : "#D9376E"} width={2.4} />
                    {slugTaken ? "Este endereço já está sendo usado." : slugOk ? "Endereço disponível" : "Use de 4 a 30 letras minúsculas, números ou hífen, sem espaços."}
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
                estruturalJson={estruturalDoEditor(S)}
                liveRsvpConfig={S.rsvp ? rsvpConfigDe(S) : null}
                pagina={paginaDaPrevia(S.step, S.foco, {
                  rsvp: S.rsvp,
                  presentes: S.gifts,
                  galeria: S.gal,
                  recados: S.rec,
                })}
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
        <div className="hidden text-[12.5px] text-[#8b8b93] sm:block">Etapa {S.step} de {STEP_NAMES.length} · {STEP_NAMES[S.step - 1]}</div>
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
        {S.step < STEP_NAMES.length ? (
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
