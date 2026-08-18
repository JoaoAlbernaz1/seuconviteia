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
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ic, IC } from "../_shell/Ic";
import { publicarDocumentoConvite, salvarDocumentoConvite, type SalvarDocumentoResult } from "./acoes";
import { planoPermite, podeVitrine, rotuloPlano, type Plan } from "@/lib/plans";
import { EditorPreview } from "@/components/event-editor/EditorPreview";
import type { EditorPreviewPage } from "@/lib/event-editor/preview-bridge";
import { SeletorFontes } from "../_ui/SeletorFontes";
import { enviarUpload } from "../_ui/Uploads";
import { paletasSeletor, deriveTemaVars, corDoConvite } from "@/lib/temas";
import { fonteTemNegritoNoNome } from "@/lib/fontes";
import { moverItem } from "@/lib/presentesOrdem";
import { paginaDaPrevia } from "@/lib/previaPagina";
import { deveResalvar } from "@/lib/autosave";
import { taxaLabel } from "@/lib/pagamentos/taxa";
import { MSG_CONFIRMA_PADRAO, MSG_RECUSA_PADRAO } from "@/lib/rsvpConfig";
import { programacaoSugerida, type ItemProgramacao } from "@/lib/sugestoes";
import { createDefaultEventDocument, withFreshGiftIds, type EventEditorDocument } from "@/lib/event-editor/document";
import { activeDraftPointerKey, esquecerRascunhoLocal, localDraftKey, versaoInicialDoRascunho } from "@/lib/event-editor/local-draft";
import { eventPublicUrl, rootDomain } from "@/lib/tenant";
import { EscolherModelo } from "./EscolherModelo";
import { BotaoBloqueado, RecursoBloqueado } from "@/components/plano/RecursoBloqueado";

// Domínio raiz dos sites de evento. Vem do ambiente como em todo o resto do
// painel: escrito na mão, o editor mostrava um endereço que não existe (faltava
// o `.br`) e ignorava o dev, mandando o link de produção em localhost.
const ROOT_DOMAIN = rootDomain();

// Passo 3 (botão principal): a "Ação do botão" (índice do Chip) → destino real +
// o texto padrão do botão (ao trocar a ação, a escrita do botão acompanha).
const BTN_HREFS = ["/confirmar", "/evento", "/presentes"] as const;
const BTN_LABELS = ["Confirmar presença", "Ver localização", "Ver presentes"] as const;

/** Como cobrar o presente: valor único (FIXO) ou dividido em cotas (COTAS). */
type GiftModo = "FIXO" | "COTAS";
/** Linha da lista de presentes no editor: nome + descrição + valor + foto + cobrança (Pix). */
type GiftRow = { id: string; n: string; desc: string; v: string; foto?: string; modo?: GiftModo; cotas?: number };
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

/** "aaaa-mm-dd" (valor do <input type="date">) -> "dd/mm/aaaa". */
function isoParaDDMM(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

// Rascunho salvo no navegador (resume ao reabrir a página).

/** "dd/mm/aaaa" -> "aaaa-mm-dd" (vazio se invalido; a action valida). */
function ddmmParaISO(s: string): string {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
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
/** Converte a UI legada no documento canônico consumido pelo renderer e pelo
 * autosave versionado. Não existe estado de preview separado. */
export function documentoDoEditor(S: State): EventEditorDocument {
  return createDefaultEventDocument({
    basic: { name: S.nome, slug: S.slug, eventType: "QUINZE_ANOS" },
    template: { id: "quinze-anos-glamour-rose", version: 1 },
    cover: {
      mobileImageUrl: S.capaFoto,
      desktopImage: { enabled: S.capaDoisFotos, url: S.capaFotoDesktop },
      age: S.idade,
      monogram: { enabled: S.monograma, imageUrl: S.monogramaFoto },
    },
    content: {
      opening: { title: S.abT, text: S.abTx },
      parents: { enabled: S.paisOn, father: S.pai, mother: S.mae },
      dressCode: { enabled: S.trajeOn, text: S.traje },
      cta: { label: S.btnTx, href: BTN_HREFS[S.btnDest] ?? "/confirmar", lead: S.btnAcima },
    },
    schedule: {
      date: ddmmParaISO(S.data),
      time: S.hIni,
      program: { enabled: S.prog, items: S.programacao.map((item) => ({ time: item.hora, title: item.titulo })) },
    },
    location: { enabled: true, venue: S.local, address: S.endereco, city: S.cidade, state: S.uf, zipCode: S.cep },
    rsvp: {
      enabled: S.rsvp,
      companionsEnabled: S.rsvpOpts[0],
      requestCompanionNames: S.rsvpOpts[1],
      maxCompanions: Math.max(0, Math.min(20, Number(S.maxComp) || 0)),
      requestPhone: S.rsvpOpts[2],
      requestEmail: S.rsvpOpts[3],
      requestDietaryRestrictions: S.rsvpOpts[4],
      allowMessage: S.rsvpOpts[5],
      deadline: S.rsvpDataLimite,
      // "Usar a cor do convite" (S.theme === 0) tem que MUDAR a cor de verdade:
      // antes o chip so marcava um flag e o botao ficava rosa fixo, mesmo com o
      // convite noutra paleta (reclamacao do Joao, 17/08).
      buttonColor:
        S.theme === 0
          ? corDoConvite(S.tema, S.corCustom)
          : /^#[0-9a-fA-F]{6}$/.test(S.rsvpCorBotao)
            ? S.rsvpCorBotao
            : corDoConvite(S.tema, S.corCustom),
      confirmationMessage: S.rsvpMsgSim,
      declineMessage: S.rsvpMsgNao,
    },
    gifts: {
      enabled: S.gifts,
      listModel: S.listaModelo,
      introduction: S.presentesTexto,
      items: S.giftList.map((gift) => ({ id: gift.id, title: gift.n, description: gift.desc, value: gift.v, imageUrl: gift.foto ?? "", pricingMode: gift.modo ?? "FIXO", quotas: gift.cotas })),
      freeContribution: { enabled: S.free, title: S.freeTitulo, suggestedValues: S.freeValores },
    },
    pix: { enabled: S.pixOn, name: S.pixNome, key: S.pixChave },
    gallery: { enabled: S.gal, imageUrls: S.galFotos },
    messages: { enabled: S.rec, eyebrow: S.recEyebrow, title: S.recTitulo, invitation: S.recConvite, wallTitle: S.recMural },
    footer: { enabled: S.rodapeOn, text: S.rodapeTx },
    appearance: {
      theme: S.tema,
      customColor: /^#[0-9a-fA-F]{6}$/.test(S.corCustom) ? S.corCustom : "#CE578B",
      font: S.fonte,
      titleSize: (["small", "medium", "large"] as const)[S.szT] ?? "medium",
      bold: S.negrito,
      overlay: S.overlay,
      animations: S.animacoes,
    },
  });
}

const V = "#7C3AED";
const MUT = "#6E6E76";
/** Teto de fotos do álbum (o schema do documento aceita 40; 20 é o que a UI promete). */
const MAX_FOTOS_GALERIA = 20;
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

type State = {
  step: number;
  sv: "salvo" | "salvando" | "erro";
  showErr: boolean;
  foco: string;
  nome: string; data: string; hIni: string; pai: string; mae: string;
  cep: string; local: string; endereco: string; cidade: string; uf: string; traje: string; slug: string;
  capaFoto: string; capaFotoDesktop: string; capaDoisFotos: boolean;
  idade: string; monograma: boolean; monogramaFoto: string;
  tema: string; corCustom: string; fonte: string; negrito: boolean;
  szT: number; overlay: boolean;
  acc: number; abT: string; abTx: string;
  paisOn: boolean; trajeOn: boolean; btnTx: string; btnDest: number; btnAcima: string; rodapeOn: boolean; rodapeTx: string;
  rsvp: boolean; maxComp: string; rsvpOpts: boolean[]; theme: number;
  rsvpDataLimite: string; rsvpCorBotao: string; rsvpMsgSim: string; rsvpMsgNao: string;
  gifts: boolean; free: boolean; giftList: GiftRow[]; pixOn: boolean; pixNome: string; pixChave: string; presentesTexto: string;
  freeTitulo: string; freeValores: string;
  programacao: ItemProgramacao[]; prog: boolean;
  gal: boolean; galFotos: string[]; rec: boolean;
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
  tema: "rose", corCustom: "#CE578B", fonte: "classica", negrito: false,
  szT: 1, overlay: false,
  acc: 0, abT: "Vem comemorar comigo!",
  abTx: "Estou muito feliz e quero compartilhar esse momento especial com as pessoas que eu amo. Conto com você!",
  paisOn: true,
  trajeOn: true, btnTx: "Confirmar presença", btnDest: 0, btnAcima: "",
  rodapeOn: true, rodapeTx: "Obrigada por fazer parte da minha história.",
  rsvp: true, maxComp: "2", rsvpOpts: [true, true, false, false, true, true], theme: 0,
  rsvpDataLimite: "10/11/2026", rsvpCorBotao: "#CE578B",
  rsvpMsgSim: MSG_CONFIRMA_PADRAO, rsvpMsgNao: MSG_RECUSA_PADRAO,
  gifts: true, free: true, listaModelo: "painel",
  giftList: GIFTS.map((g, index) => ({ id: `gift-demo-${index + 1}`, n: g.n, desc: g.desc, v: g.v })),
  pixOn: true, pixNome: "", pixChave: "", presentesTexto: "",
  freeTitulo: "Contribua com o valor que desejar", freeValores: "R$ 50 · R$ 100 · R$ 200",
  programacao: programacaoSugerida("QUINZE_ANOS"), prog: true,
  gal: true, galFotos: [], rec: true,
  recEyebrow: REC_PADRAO.eyebrow, recTitulo: REC_PADRAO.titulo,
  recConvite: REC_PADRAO.convite, recMural: REC_PADRAO.mural,
  animacoes: false,
  published: false, copied: false, pvMode: "celular",
};

type EditorUiState = Pick<State,
  "step" | "sv" | "showErr" | "foco" | "acc" | "theme" | "published" | "copied" | "pvMode"
>;

export function uiDoEstado(state: State): EditorUiState {
  return {
    step: state.step,
    sv: state.sv,
    showErr: state.showErr,
    foco: state.foco,
    acc: state.acc,
    theme: state.theme,
    published: state.published,
    copied: state.copied,
    pvMode: state.pvMode,
  };
}

/** A cor do botao de confirmar presenca e a do convite (ou uma escolhida a mao)? */
export function corBotaoEhDoConvite(document: EventEditorDocument): boolean {
  const doConvite = corDoConvite(document.appearance.theme, document.appearance.customColor);
  return document.rsvp.buttonColor.toLowerCase() === doConvite.toLowerCase();
}

/** View de compatibilidade da UI monolítica. É derivada do documento; nunca é
 * armazenada como uma segunda cópia editável. */
export function estadoDoDocumento(document: EventEditorDocument, ui: EditorUiState): State {
  const size = document.appearance.titleSize === "small" ? 0 : document.appearance.titleSize === "large" ? 2 : 1;
  const buttonIndex = Math.max(0, BTN_HREFS.indexOf(document.content.cta.href));
  return {
    ...ui,
    nome: document.basic.name,
    data: isoParaDDMM(document.schedule.date),
    hIni: document.schedule.time,
    pai: document.content.parents.father,
    mae: document.content.parents.mother,
    cep: document.location.zipCode,
    local: document.location.venue,
    endereco: document.location.address,
    cidade: document.location.city,
    uf: document.location.state,
    traje: document.content.dressCode.text,
    slug: document.basic.slug,
    capaFoto: document.cover.mobileImageUrl,
    capaFotoDesktop: document.cover.desktopImage.url,
    capaDoisFotos: document.cover.desktopImage.enabled,
    idade: document.cover.age,
    monograma: document.cover.monogram.enabled,
    monogramaFoto: document.cover.monogram.imageUrl,
    tema: document.appearance.theme,
    corCustom: document.appearance.customColor,
    fonte: document.appearance.font,
    negrito: document.appearance.bold,
    szT: size,
    overlay: document.appearance.overlay,
    abT: document.content.opening.title,
    abTx: document.content.opening.text,
    paisOn: document.content.parents.enabled,
    trajeOn: document.content.dressCode.enabled,
    btnTx: document.content.cta.label,
    btnDest: buttonIndex,
    btnAcima: document.content.cta.lead,
    rodapeOn: document.footer.enabled,
    rodapeTx: document.footer.text,
    rsvp: document.rsvp.enabled,
    maxComp: String(document.rsvp.maxCompanions),
    rsvpOpts: [document.rsvp.companionsEnabled, document.rsvp.requestCompanionNames, document.rsvp.requestPhone, document.rsvp.requestEmail, document.rsvp.requestDietaryRestrictions, document.rsvp.allowMessage],
    rsvpDataLimite: document.rsvp.deadline,
    rsvpCorBotao: document.rsvp.buttonColor,
    rsvpMsgSim: document.rsvp.confirmationMessage,
    rsvpMsgNao: document.rsvp.declineMessage,
    gifts: document.gifts.enabled,
    free: document.gifts.freeContribution.enabled,
    giftList: document.gifts.items.map((gift) => ({ id: gift.id, n: gift.title, desc: gift.description, v: gift.value, foto: gift.imageUrl || undefined, modo: gift.pricingMode, cotas: gift.quotas })),
    pixOn: document.pix.enabled,
    pixNome: document.pix.name,
    pixChave: document.pix.key,
    presentesTexto: document.gifts.introduction,
    freeTitulo: document.gifts.freeContribution.title,
    freeValores: document.gifts.freeContribution.suggestedValues,
    programacao: document.schedule.program.items.map((item) => ({ hora: item.time, titulo: item.title })),
    prog: document.schedule.program.enabled,
    gal: document.gallery.enabled,
    galFotos: document.gallery.imageUrls,
    rec: document.messages.enabled,
    recEyebrow: document.messages.eyebrow,
    recTitulo: document.messages.title,
    recConvite: document.messages.invitation,
    recMural: document.messages.wallTitle,
    listaModelo: document.gifts.listModel,
    animacoes: document.appearance.animations,
  };
}

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


function Toggle({ on, onClick, size = "sm", label }: { on: boolean; onClick: () => void; size?: "sm" | "lg"; label?: string }) {
  const w = size === "lg" ? 42 : 38;
  const h = size === "lg" ? 24 : 22;
  const knob = h - 5;
  const left = on ? (size === "lg" ? 20 : 18) : 3;
  return (
    <button type="button" role="switch" aria-label={label} aria-checked={on} onClick={onClick} style={{ width: w, height: h, background: on ? V : "#D5D5DC" }} className="relative shrink-0 cursor-pointer rounded-full transition-colors">
      <span style={{ top: 2.5, left, width: knob, height: knob }} className="absolute rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all" />
    </button>
  );
}

/**
 * Miniatura do formato da lista de presentes (Painel x Vitrine). Não é a prévia
 * — é o "desenho" do formato, para a escolha não ser às cegas: o Painel é um
 * cartão único (foto + linhas) e a Vitrine é uma grade de cards com foto.
 */
function MiniModeloLista({ modelo }: { modelo: "painel" | "vitrine" }) {
  const FOTO = "bg-[linear-gradient(140deg,#F7D8E4,#EFBACB)]";
  return (
    <div className="flex h-[74px] items-center justify-center border-b border-[#F0F0F3] bg-[#FBFAFC] p-2.5">
      {modelo === "painel" ? (
        <div className="flex h-full w-full max-w-[150px] overflow-hidden rounded-[7px] border border-[#ECECF0] bg-white">
          <div className={`h-full w-[38%] ${FOTO}`} />
          <div className="flex flex-1 flex-col justify-center gap-[5px] px-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-[3px] flex-1 rounded-full bg-[#E4E4EA]" />
                <div className="h-[3px] w-3 rounded-full bg-[#CDBDF6]" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid h-full w-full max-w-[150px] grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-[6px] border border-[#ECECF0] bg-white">
              <div className={`h-[56%] w-full ${FOTO}`} />
              <div className="flex flex-1 flex-col justify-center gap-[3px] px-1">
                <div className="h-[3px] w-full rounded-full bg-[#E4E4EA]" />
                <div className="h-[3px] w-2/3 rounded-full bg-[#CDBDF6]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

export function CriarConvite({
  plano = "BASICO",
  initialDocument,
  initialEventId = null,
  initialDraftVersion = 0,
  storageScope,
}: {
  plano?: Plan;
  initialDocument?: EventEditorDocument;
  initialEventId?: string | null;
  initialDraftVersion?: number;
  storageScope: string;
}) {
  const router = useRouter();
  const [editor, setEditor] = useState(() => {
    const document = initialDocument ?? withFreshGiftIds(documentoDoEditor(INICIAL));
    // "Cor do botao": o chip certo ja vem marcado ao reabrir o convite. Sem isto,
    // reabrir mostrava "usar a cor do convite" e apagava a cor escolhida a mao.
    return { document, ui: { ...uiDoEstado(INICIAL), theme: corBotaoEhDoConvite(document) ? 0 : 1 } };
  });
  const S = estadoDoDocumento(editor.document, editor.ui);
  const setS = (updater: State | ((current: State) => State)) => {
    setEditor((previous) => {
      const current = estadoDoDocumento(previous.document, previous.ui);
      const next = typeof updater === "function" ? updater(current) : updater;
      return { document: documentoDoEditor(next), ui: uiDoEstado(next) };
    });
  };
  // Persistencia: id do convite ja gravado (idempotente), link publico apos
  // publicar, erro da gravacao e estado "gravando".
  const [eventId, setEventIdState] = useState<string | null>(initialEventId);
  // Espelho síncrono do id. O state do React só chega no próximo render, e dois
  // saves podem partir no mesmo intervalo (o autosave por debounce e o clique em
  // "Salvar rascunho"): lendo do state, o segundo ainda enxerga o id antigo e a
  // recuperação roda duas vezes, criando DOIS convites. O ref fecha essa janela.
  const eventIdRef = useRef<string | null>(initialEventId);
  const setEventId = useCallback((id: string | null) => {
    eventIdRef.current = id;
    setEventIdState(id);
  }, []);
  // Fila de um só: o save em curso, para o próximo esperar em vez de correr junto.
  const filaGravacao = useRef<Promise<SalvarDocumentoResult> | null>(null);
  const [draftVersion, setDraftVersion] = useState(initialDraftVersion);
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
  const [fotoGiftErro, setFotoGiftErro] = useState("");
  const [galEnviando, setGalEnviando] = useState(false);
  const [galErro, setGalErro] = useState("");
  // Convite novo (sem id) abre na tela de modelo; reabrir um convite vai direto
  // para o editor.
  const [escolhendoModelo, setEscolhendoModelo] = useState(!initialEventId);
  // Popup do limite de convites do plano (o save volta com kind "limit").
  const [limitePlano, setLimitePlano] = useState(false);
  /** Direito de trocar o crédito do rodapé pela marca própria (planos pagos). */
  const podeMarcaPropria = planoPermite(plano, "whiteLabel");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cepRequestRef = useRef<AbortController | null>(null);
  // AUTOSAVE (rascunho): refs pra salvar sem fechar sobre estado velho.
  const salvarRef = useRef<() => Promise<void>>(async () => {});
  const dadosRef = useRef("");
  const lastSavedRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const versionRef = useRef(initialDraftVersion);
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
    setFotoGiftErro("");
    try {
      const url = await enviarUpload(file);
      setS((s) => ({
        ...s,
        giftList: s.giftList.map((x, j) => (j === i ? { ...x, foto: url } : x)),
      }));
    } catch (e) {
      // Engolir o erro fazia a foto "não funcionar" sem dizer por quê — era só
      // o arquivo grande demais ou num formato que não aceitamos.
      setFotoGiftErro(e instanceof Error ? e.message : "Não consegui enviar a foto. Tente de novo.");
    } finally {
      setSubindoFoto(null);
    }
  }
  const onFocoCampo = (e: React.FocusEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    const alvo = (e.target as HTMLElement).closest("[data-foco]");
    const sec = alvo?.getAttribute("data-foco");
    if (sec) setFoco(sec);
  };

  // Galeria: várias fotos de uma vez. Cada upload entra no fim do álbum e já
  // aparece na prévia (a galeria e o carrossel do convite leem daqui).
  async function subirFotosGaleria(files: File[]) {
    if (!files.length) return;
    setGalErro("");
    setGalEnviando(true);
    try {
      for (const file of files.slice(0, MAX_FOTOS_GALERIA)) {
        const url = await enviarUpload(file);
        setS((s) =>
          s.galFotos.length >= MAX_FOTOS_GALERIA ? s : { ...s, galFotos: [...s.galFotos, url], gal: true },
        );
      }
    } catch (e) {
      setGalErro(e instanceof Error ? e.message : "Não consegui enviar a foto. Tente de novo.");
    } finally {
      setGalEnviando(false);
    }
  }

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
    cepRequestRef.current?.abort();
    const controller = new AbortController();
    cepRequestRef.current = controller;
    const fieldsAtRequest = { endereco: S.endereco, cidade: S.cidade, uf: S.uf };
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });
      const d = await r.json();
      if (!d.erro && cepRequestRef.current === controller) {
        const rua = [d.logradouro, d.bairro].filter(Boolean).join(", ");
        setS((current) => ({
          ...current,
          cep: mask,
          endereco: current.endereco === fieldsAtRequest.endereco ? rua || current.endereco : current.endereco,
          cidade: current.cidade === fieldsAtRequest.cidade ? d.localidade || current.cidade : current.cidade,
          uf: current.uf === fieldsAtRequest.uf ? d.uf || current.uf : current.uf,
        }));
      }
    } catch {
      /* offline / CEP inválido — segue com preenchimento manual */
    } finally {
      if (cepRequestRef.current === controller) {
        cepRequestRef.current = null;
        setCepLoading(false);
      }
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

  const linkPublico = pubInfo?.url ?? eventPublicUrl(S.slug, ROOT_DOMAIN);
  const hostPublico = pubInfo?.host ?? `${S.slug}.${ROOT_DOMAIN}`;

  const copyLink = () => {
    navigator.clipboard?.writeText(linkPublico).catch(() => {});
    setS((s) => ({ ...s, copied: true }));
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setS((s) => ({ ...s, copied: false })), 1500);
  };

  // O `eventId` pode vir do ponteiro do localStorage, que NÃO é validado contra
  // o servidor (ver o efeito de RESUME). Se o convite foi apagado, esse id está
  // morto e o servidor responde `not_found` — e, sem tratar, o ponteiro morto
  // sobrevive e TODO save seguinte falha igual, sem saída pelo produto. Aqui a
  // primeira falha desse tipo joga o id fora e regrava como convite NOVO, para
  // que o trabalho em tela nunca fique sem destino.
  // Os saves são SERIALIZADOS numa fila de um só: se dois partem juntos, o
  // segundo espera o primeiro e já enxerga o id (e a versão) que ele gravou —
  // vira UPDATE, e não um segundo convite.
  const salvarComRecuperacao = (documento: EventEditorDocument): Promise<SalvarDocumentoResult> => {
    const anterior = filaGravacao.current;
    const atual = (async () => {
      if (anterior) await anterior.catch(() => {});
      const r = await salvarDocumentoConvite({
        id: eventIdRef.current ?? undefined,
        expectedVersion: versionRef.current,
        document: documento,
      });
      if (r.ok) {
        setEventId(r.id);
        versionRef.current = r.version;
        return r;
      }
      // CONFLITO: o banco está numa versão diferente da que mandamos. Antes
      // isso parava o editor com "Este convite foi alterado em outra aba.
      // Recarregue para continuar." — e recarregar não resolvia, porque a
      // versão velha voltava do navegador. Como quem edita é UMA pessoa no seu
      // próprio convite, o que está na tela é a verdade: adotamos a versão do
      // servidor e regravamos UMA vez. Se conflitar de novo (aí sim há outra
      // aba escrevendo), a mensagem aparece e mandar de novo seria briga.
      if (r.kind === "conflict") {
        versionRef.current = r.currentVersion;
        const denovo = await salvarDocumentoConvite({
          id: eventIdRef.current ?? undefined,
          expectedVersion: r.currentVersion,
          document: documento,
        });
        if (denovo.ok) {
          setEventId(denovo.id);
          versionRef.current = denovo.version;
        }
        return denovo;
      }
      const morto = eventIdRef.current;
      if (r.kind !== "not_found" || !morto) return r;
      esquecerRascunhoLocal(morto, storageScope);
      setEventId(null);
      versionRef.current = 0;
      const novo = await salvarDocumentoConvite({ id: undefined, expectedVersion: 0, document: documento });
      if (novo.ok) {
        setEventId(novo.id);
        versionRef.current = novo.version;
      }
      return novo;
    })();
    filaGravacao.current = atual;
    return atual;
  };

  // Salva o documento canônico e, ao publicar, cria um snapshot imutável.
  const enviar = (publicar: boolean) => {
    // Antes de publicar, o link precisa estar válido — está no passo final.
    if (publicar && !slugOk) {
      setS((s) => ({ ...s, step: STEP_NAMES.length, showErr: true }));
      return;
    }
    setErroPub(null);
    iniciarGravacao(async () => {
      const saved = await salvarComRecuperacao(editor.document);
      if (!saved.ok) {
        setErroPub(saved.error);
        if (saved.kind === "conflict") setS((state) => ({ ...state, sv: "erro" }));
        return;
      }
      versionRef.current = saved.version;
      setDraftVersion(saved.version);
      setEventId(saved.id);
      lastSavedRef.current = dadosRef.current;
      if (publicar) {
        const published = await publicarDocumentoConvite({ id: saved.id, expectedDraftVersion: saved.version });
        if (!published.ok) {
          setErroPub(published.error);
          return;
        }
        setPubInfo({ host: published.host, url: published.url });
        setS((s) => ({ ...s, published: true }));
        try {
          localStorage.removeItem(localDraftKey(saved.id, storageScope));
          localStorage.removeItem(localDraftKey(null, storageScope));
          localStorage.removeItem(activeDraftPointerKey(storageScope));
        } catch {}
      } else {
        setS((s) => ({ ...s, sv: "salvo" }));
      }
    });
  };

  // ── AUTOSAVE do rascunho ──────────────────────────────────────────────────
  // "Impressão digital" do conteúdo: muda a cada alteração real do convite.
  const dadosStr = JSON.stringify(editor.document);

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
        const r = await salvarComRecuperacao(editor.document);
        if (r.ok) {
          salvouOk = true;
          setSalvarErro("");
          setEventId(r.id);
          versionRef.current = r.version;
          setDraftVersion(r.version);
          lastSavedRef.current = snapshot;
          setS((s) => ({ ...s, sv: "salvo" }));
        } else {
          // Estourou o limite do plano: em vez de uma linha vermelha que a
          // pessoa não entende, o popup explica o que libera (pedido do João).
          if (r.kind === "limit") setLimitePlano(true);
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
      const pointedEventId = initialEventId ?? localStorage.getItem(activeDraftPointerKey(storageScope));
      const raw = localStorage.getItem(localDraftKey(pointedEventId, storageScope));
      if (raw) {
        const saved = JSON.parse(raw) as {
          document?: EventEditorDocument;
          ui?: Partial<EditorUiState>;
          S?: Partial<State>;
          eventId?: string | null;
          draftVersion?: number;
        };
        const versionCompatible = !initialEventId || saved.eventId === initialEventId && saved.draftVersion === initialDraftVersion;
        if (saved.document && versionCompatible) {
          setEditor((current) => ({
            document: saved.document!,
            ui: { ...current.ui, ...saved.ui, sv: "salvo", showErr: false },
          }));
        } else if (saved?.S && versionCompatible) {
          setS((state) => ({ ...state, ...saved.S, sv: "salvo", showErr: false }));
        }
        if (saved?.eventId) setEventId(saved.eventId);
        // A versão NUNCA sai do navegador quando o servidor carregou o convite
        // — era daí que vinha o "alterado em outra aba" sem outra aba nenhuma.
        const versao = versaoInicialDoRascunho({ initialEventId, initialDraftVersion, salvo: saved });
        versionRef.current = versao;
        setDraftVersion(versao);
      }
    } catch {}
    restauradoRef.current = true;
  }, [initialDraftVersion, initialEventId, setEventId, storageScope]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Guarda o rascunho no navegador a cada alteração (após restaurar; nunca o demo intocado).
  useEffect(() => {
    if (!restauradoRef.current) return;
    if (dadosStr === dadosInicialRef.current) return;
    try {
      const key = localDraftKey(eventId, storageScope);
      localStorage.setItem(key, JSON.stringify({ document: editor.document, ui: editor.ui, eventId, draftVersion }));
      if (eventId) {
        localStorage.setItem(activeDraftPointerKey(storageScope), eventId);
        localStorage.removeItem(localDraftKey(null, storageScope));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosStr, S.step, eventId, draftVersion, storageScope]);

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
    { name: "Galeria revisada", ok: S.gal, note: "opcional" },
    { name: "Recados configurados", ok: S.rec, note: "opcional" },
  ];

  const svText =
    S.sv === "salvo"
      ? "Alterações salvas"
      : S.sv === "erro"
        ? salvarErro || "Não foi possível salvar"
        : "Salvando…";
  const svColor = S.sv === "salvo" ? "#34A177" : S.sv === "erro" ? "#E11D48" : V;

  // Convite NOVO começa pela escolha do modelo — que hoje é um só, e a tela diz
  // isso na cara em vez de fingir uma vitrine (pedido do João, 17/08).
  if (escolhendoModelo) {
    return <EscolherModelo nome={S.nome} onComecar={() => setEscolhendoModelo(false)} />;
  }

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
                <div className="mb-1 text-[13.5px] font-bold">Tamanho das letras</div>
                <div className="mb-3 text-[12px] text-[#6e6e76]">Aumenta ou diminui o nome da capa e os títulos do convite inteiro — sempre ajustado no celular e no computador.</div>
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
                  <Paletas value={S.tema} onChange={(k) => upd({ tema: k })} />
                  <CorPersonalizada ativo={S.tema === "custom"} cor={S.corCustom} onPick={(hex) => upd({ tema: "custom", corCustom: hex })} />
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
                                <Toggle label="Mostrar pais" on={S.paisOn} onClick={() => upd({ paisOn: !S.paisOn })} />
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
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-[13.5px] font-bold">Mostrar rodapé</div>
                                  <div className="mt-0.5 text-[12px] text-[#A6A6AE]">Exibe o fecho do convite abaixo do conteúdo.</div>
                                </div>
                                <Toggle on={S.rodapeOn} onClick={() => upd({ rodapeOn: !S.rodapeOn })} />
                              </div>
                              {S.rodapeOn && (
                                <>
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
                                </>
                              )}
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
                  <Toggle label="Ativar RSVP" on={S.rsvp} onClick={() => upd({ rsvp: !S.rsvp })} size="lg" />
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
                    <Toggle label="Ativar presentes" on={S.gifts} onClick={() => upd({ gifts: !S.gifts })} size="lg" />
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
                                className={`overflow-hidden rounded-xl border text-left transition-colors ${ativo ? "border-[#7C3AED] bg-[#F6F3FE]" : "border-[#E4E4EA] bg-white hover:bg-[#FAFAFC]"} ${m.trava ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                              >
                                {/* Miniatura do formato: dá pra ESCOLHER VENDO, sem
                                    ter que adivinhar pelo nome. */}
                                <MiniModeloLista modelo={m.k} />
                                <div className="p-3">
                                  <div className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#17171B]">
                                    {m.nome}
                                    {m.trava && <span className="text-[11px]">🔒</span>}
                                  </div>
                                  <div className="mt-0.5 text-[11.5px] text-[#6e6e76]">{m.desc}</div>
                                </div>
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
                                onClick={() => upd({ giftList: [...S.giftList, { id: crypto.randomUUID(), n: s.n, desc: s.desc, v: s.v }] })}
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
                          <div key={g.id} className="rounded-2xl border border-[#ECECF0] bg-white p-3 shadow-[0_1px_4px_rgba(23,23,27,0.03)]">
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
                              {fotoGiftErro && subindoFoto === null && (
                                <span className="text-[11.5px] text-[#E11D48]">{fotoGiftErro}</span>
                              )}
                              <span className="text-[11px] text-[#A6A6AE]">JPG, PNG ou WebP · até 6 MB</span>
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
                          onClick={() => upd({ giftList: [...S.giftList, { id: crypto.randomUUID(), n: "", desc: "", v: "" }] })}
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
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[13.5px] font-bold">Contribuição com valor livre</div>
                            <div className="mt-0.5 text-[12px] text-[#6e6e76]">Entra como um item no fim da lista: o convidado escolhe quanto quer dar e paga por Pix.</div>
                          </div>
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
                              <div className="mt-1 text-[11.5px] text-[#A6A6AE]">Viram botões de um toque no convite. Até quatro — ex.: <span className="font-semibold">50 · 100 · 200</span>. O convidado sempre pode digitar outro valor.</div>
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
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-[18px] font-bold tracking-[-0.02em]">Galeria e recados</div>
                    <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">As fotos da festa e os recados dos convidados.</div>
                  </div>
                  {/* As duas páginas moram no mesmo passo: estes botões dizem QUAL
                      delas a prévia mostra (antes só mudava ao clicar num campo,
                      e o mural parecia não existir). */}
                  <div className="flex gap-1.5">
                    {([["galeria", "Ver: galeria"], ["recados", "Ver: recados"]] as const).map(([f, l]) => {
                      const on = S.foco === f;
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFoco(f)}
                          className={`cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                            on ? "border-[#7C3AED] bg-[#F6F3FE] text-[#6D28D9]" : "border-[#E4E4EA] bg-white text-[#6e6e76] hover:bg-[#FAFAFC]"
                          }`}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div data-foco="galeria" className={cardCls}>
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className="text-[14.5px] font-bold">Galeria de fotos</div>
                    <Toggle label="Ativar galeria" on={S.gal} onClick={() => upd({ gal: !S.gal })} />
                  </div>
                  {S.gal && (
                    <>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                        {S.galFotos.map((url, i) => (
                          <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-[10px] border border-[#ECECF0]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                            {i === 0 && (
                              <span className="absolute left-1.5 top-1.5 rounded-full bg-[#7C3AED] px-[7px] py-0.5 text-[9px] font-bold text-white">Destaque</span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="flex gap-0.5">
                                <button
                                  type="button"
                                  aria-label="Mover para trás"
                                  disabled={i === 0}
                                  onClick={() => upd({ galFotos: moverItem(S.galFotos, i, i - 1) })}
                                  className="cursor-pointer px-1 text-[11px] leading-none text-white disabled:opacity-30"
                                >
                                  ◀
                                </button>
                                <button
                                  type="button"
                                  aria-label="Mover para frente"
                                  disabled={i === S.galFotos.length - 1}
                                  onClick={() => upd({ galFotos: moverItem(S.galFotos, i, i + 1) })}
                                  className="cursor-pointer px-1 text-[11px] leading-none text-white disabled:opacity-30"
                                >
                                  ▶
                                </button>
                              </div>
                              <button
                                type="button"
                                aria-label={`Remover foto ${i + 1}`}
                                onClick={() => upd({ galFotos: S.galFotos.filter((_, j) => j !== i) })}
                                className="cursor-pointer px-1 text-[12px] leading-none text-white hover:text-[#FF9BB8]"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                        {S.galFotos.length < MAX_FOTOS_GALERIA && (
                          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed border-[#D5D5DC] bg-[#FBFBFC] text-[#A6A6AE] hover:border-[#7C3AED] hover:text-[#7C3AED]">
                            <span className="text-[22px] leading-none">{galEnviando ? "…" : "+"}</span>
                            <span className="px-1 text-center text-[10.5px] font-semibold">{galEnviando ? "Enviando" : "Adicionar"}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              disabled={galEnviando}
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                e.target.value = "";
                                void subirFotosGaleria(files);
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <div className="mt-2.5 text-[12px] text-[#A6A6AE]">
                        {S.galFotos.length} de {MAX_FOTOS_GALERIA} fotos · a primeira é o destaque · use ◀ ▶ para trocar a ordem
                      </div>
                      {galErro && <div className="mt-1.5 text-[12px] text-[#E11D48]">{galErro}</div>}
                      {S.galFotos.length === 0 && (
                        <div className="mt-2 rounded-xl border border-dashed border-[#E4E4EA] bg-[#FAFAFC] px-4 py-3 text-[12.5px] text-[#6e6e76]">
                          Sem fotos, o convite mostra “As fotos chegam em breve.” na galeria.
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div data-foco="recados" className={cardCls}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="text-[14.5px] font-bold">Mural de recados</div>
                    <Toggle on={S.rec} onClick={() => upd({ rec: !S.rec })} />
                  </div>
                  <div className="mb-1 text-[12.5px] text-[#6e6e76]">
                    Uma página onde os convidados escrevem um carinho — e leem o que os outros escreveram.
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
                      {/* Aqui existia uma lista de TRÊS recados inventados
                          ("Tio Marcos", "Vô Antônio") com selo "Aguardando
                          aprovação" e botões Aprovar/Ocultar que só mexiam em
                          estado local. Ninguém tinha escrito nada — o convite
                          nem estava publicado —, e a fila fingida passava a
                          ideia de que havia algo pendente. Some, e no lugar
                          fica a única coisa que o profissional precisa saber
                          agora: o que acontece depois que ele publicar. */}
                      <div className="flex items-start gap-3 rounded-[13px] border border-[#ECECF0] bg-[#F8F7FB] px-4 py-3.5">
                        <span className="grid size-9 flex-none place-items-center rounded-[11px] bg-[#EDE9FE] text-[#7C3AED]">
                          <Ic d={IC.mail} size={17} stroke="#7C3AED" width={2} />
                        </span>
                        <div className="min-w-0 flex-1 text-[12.5px] leading-snug text-[#6e6e76]">
                          Você ainda não recebeu recados. Depois de publicar, cada recado
                          enviado por um convidado aparece direto no mural do convite, e o
                          total fica visível na tela do convite, em <span className="font-semibold text-[#17171b]">Meus convites</span>.
                        </div>
                      </div>
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
                    <span className="whitespace-nowrap pr-3 text-[13px] text-[#8b8b93]">.{ROOT_DOMAIN}</span>
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
                {/* Rodapé do convite: quem assina publica com a PRÓPRIA marca;
                    no grátis fica a nossa, e o cadeado explica o que muda. */}
                <div className={cardCls}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold">Marca no rodapé do convite</div>
                      <div className="mt-1 text-[12.5px] leading-snug text-[#6e6e76]">
                        {podeMarcaPropria
                          ? "O convite sai com a sua marca — o crédito “Feito com seuconviteia” não aparece."
                          : "Hoje o rodapé mostra “Feito com seuconviteia”. Nos planos pagos, ele mostra a sua marca."}
                      </div>
                    </div>
                    {podeMarcaPropria ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(52,161,119,0.12)] px-3 py-1.5 text-[12px] font-semibold text-[#2E8A66]">
                        <Ic d={IC.check} size={12} stroke="#2E8A66" width={2.6} /> Sua marca
                      </span>
                    ) : (
                      <BotaoBloqueado
                        label="Usar a minha marca"
                        titulo="Sua marca no rodapé do convite"
                        descricao="Tira o “Feito com seuconviteia” do rodapé e coloca o nome do seu estúdio no lugar. O convite fica com a cara do seu trabalho, não da plataforma."
                        motivo="plano"
                        planoNecessario="CLASSICO"
                        planoAtual={plano}
                        ganhos={[
                          "Sua marca no rodapé de todos os convites",
                          "Convites ilimitados na mesma conta",
                          "Baixar a lista de convidados em planilha",
                          "Taxa menor nos presentes",
                        ]}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ===================== PREVIEW COLUMN ===================== */}
          {/* Prévia = SITE REAL (mesmos componentes do publicado), reagindo ao
              editor, dentro da moldura do aparelho. Segue o passo: capa/home,
              evento, presentes, galeria. */}
          <div className="scv lg:sticky lg:top-0">
            <div className={`${cardCls} p-4`}>
              <EditorPreview
                document={editor.document}
                page={paginaDaPrevia(S.step, S.foco, {
                  rsvp: S.rsvp,
                  presentes: S.gifts,
                  galeria: S.gal,
                  recados: S.rec,
                }) as EditorPreviewPage}
                focus={S.foco}
                host={hostPublico}
                device={S.pvMode === "celular" ? "mobile" : "desktop"}
                onDeviceChange={(device) => upd({ pvMode: device === "mobile" ? "celular" : "desktop" })}
              />
              <div className="mt-3 text-center text-[11.5px] text-[#A6A6AE]">A prévia é o site de verdade · {hostPublico}</div>
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

      {/* Limite de convites do plano — explica em vez de só recusar o save. */}
      <RecursoBloqueado
        aberto={limitePlano}
        onFechar={() => setLimitePlano(false)}
        titulo="Você já usou os convites do seu plano"
        descricao={`O plano ${rotuloPlano(plano)} inclui 1 convite. Para tocar mais de uma festa ao mesmo tempo — ou fazer convite para clientes o ano inteiro — é preciso um plano com convites ilimitados.`}
        motivo="plano"
        planoNecessario="CLASSICO"
        planoAtual={plano}
        ganhos={[
          "Convites ilimitados na mesma conta",
          "Sua marca no lugar da nossa no rodapé",
          "Baixar a lista de convidados em planilha",
          "Taxa menor nos presentes",
        ]}
      />
    </div>
  );
}
