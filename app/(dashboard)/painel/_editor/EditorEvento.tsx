"use client";

// Editor de evento v2 (referência FIEL: mockup "Painel Editor" aprovado pelo João).
//
// Estrutura: NAV FIXA DE 5 ITENS (Informações · Estilo · Textos · Fotos ·
// Recursos do site) · painel central da seção ativa · PREVIEW AO VIVO em moldura
// de celular/computador ("o que você vê é o que publica"). Recursos/upsells
// moram numa TELA ÚNICA (cards com toggle; bloqueado = cadeado + badge do plano;
// upgrade num banner único). A configuração da lista de presentes (Pix + itens)
// abre pelo link "Configurar" do card — não é item de navegação.
//
// É UM ÚNICO <form>: todas as seções ficam montadas (escondidas quando inativas)
// para que TODOS os campos sejam submetidos juntos. Reusado por criar e editar
// (mode), postando para criarEvento/editarEvento. Os campos que alimentam o
// preview são controlados; o resto pode ser não-controlado.
import { useActionState, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { EventStatus } from "@prisma/client";
import {
  criarEvento,
  editarEvento,
  publicarEvento,
  despublicarEvento,
  type NovoEventoState,
} from "../../actions";
import { slugify } from "@/lib/tenant";
import { textosDoNicho } from "@/lib/textos";
import { programacaoSugerida, presentesSugeridos } from "@/lib/sugestoes";
import { varsDoTema } from "@/lib/temas";
import { FONTES, FONTE_PADRAO, varsDaFonte } from "@/lib/fontes";
import { planoPermite, rotuloPlano, type Plan, type Recurso } from "@/lib/plans";
import {
  RECURSOS_SITE,
  lerToggles,
  type RecursoSite,
  type TogglesSite,
} from "@/lib/recursos";
import { tempoRestante } from "@/lib/countdown";
import { TIPO_LABEL } from "@/lib/painelUi";

export type PaletaOpt = { key: string; label: string; dots: string[] };

export type EventoFormInitial = {
  eventId?: string;
  type?: string;
  tema?: string;
  fontes?: string;
  recursos?: Partial<TogglesSite>;
  title?: string;
  date?: string;
  time?: string;
  mensagem?: string;
  presentesTexto?: string;
  local?: string;
  endereco?: string;
  traje?: string;
  programacao?: { hora: string; titulo: string }[];
  presentes?: { titulo: string; descricao?: string; valor?: string }[];
  pixNome?: string;
  pixChave?: string;
  fotoUrl?: string;
  presentesFotoUrl?: string;
  fotos?: string[];
};

const TIPOS = [
  { value: "QUINZE_ANOS", label: "15 anos" },
  { value: "CASAMENTO", label: "Casamento" },
  { value: "BODAS", label: "Bodas" },
  { value: "SESSENTA_ANOS", label: "60 anos" },
  { value: "ANIVERSARIO", label: "Aniversário" },
] as const;

const INITIAL_STATE: NovoEventoState = {};

const inputClass =
  "w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/15";

/** Os 5 itens fixos da navegação do editor (numerados, na ordem do mockup). */
const SECOES = [
  { key: "info", label: "Informações" },
  { key: "estilo", label: "Estilo" },
  { key: "textos", label: "Textos" },
  { key: "fotos", label: "Fotos" },
  { key: "recursos", label: "Recursos do site" },
] as const;

/**
 * A qual seção pertence cada campo com erro de validação. Como é UM só form com
 * todas as seções montadas (escondidas quando inativas), um erro pode cair numa
 * seção que o usuário não está vendo — revelamos essa seção para a mensagem
 * aparecer (senão o "Criar site" parecia não fazer nada).
 */
const SECAO_DO_CAMPO: Record<string, string> = {
  title: "info",
  type: "info",
  date: "info",
  time: "info",
  local: "info",
  endereco: "info",
  traje: "info",
  tema: "estilo",
  fontes: "estilo",
  mensagem: "textos",
  presentesTexto: "textos",
  fotoUrl: "fotos",
  presentesFotoUrl: "fotos",
  pixNome: "presentes",
  pixChave: "presentes",
};
/** Ordem de prioridade ao revelar a seção do primeiro campo com erro. */
const ORDEM_CAMPOS = [
  "title",
  "type",
  "date",
  "time",
  "local",
  "endereco",
  "traje",
  "tema",
  "fontes",
  "mensagem",
  "presentesTexto",
  "fotoUrl",
  "presentesFotoUrl",
  "pixNome",
  "pixChave",
] as const;

/** Plano que libera cada recurso gateado (para badges e para o modal). */
function planoQueLibera(recurso: Recurso): Plan {
  if (recurso === "rsvp") return "BASICO";
  if (recurso === "recados" || recurso === "galeria") return "CLASSICO";
  return "PREMIUM";
}

/** Texto do modal de recurso bloqueado (copy do mockup). */
const BLOQUEADO_DESC: Partial<Record<RecursoSite, string>> = {
  recados:
    "Um mural onde os convidados deixam mensagens de carinho — e o anfitrião guarda para sempre.",
  galeria:
    "Um álbum elegante no site, com visualização em tela cheia direto do celular.",
};

/** Galeria de templates (v1: só o Clássico pronto; os demais são vitrine). */
const TEMPLATES_GALERIA = [
  {
    id: "classico",
    nome: "Clássico",
    desc: "Capa cinematográfica, seções claras e elegantes.",
    tag: "Elegante",
    pronto: true,
  },
  { id: "editorial", nome: "Editorial", desc: "Tipografia grande, ar de revista.", tag: "Sofisticado", pronto: false },
  { id: "boho", nome: "Boho", desc: "Arcos, texturas suaves e clima de jardim.", tag: "Romântico", pronto: false },
  { id: "noite", nome: "Noite", desc: "Escuro, brilhos e energia de balada.", tag: "Festivo", pronto: false },
  { id: "minimal", nome: "Minimal", desc: "Quase só tipografia. Puro respiro.", tag: "Clean", pronto: false },
  { id: "jardim", nome: "Jardim", desc: "Botânico, leve e ensolarado.", tag: "Natural", pronto: false },
] as const;

/** Linha repetível com id estável para a key do React. */
type Row<T> = T & { _id: string };
let rowSeq = 0;
function makeRow<T>(data: T): Row<T> {
  rowSeq += 1;
  return { ...data, _id: `r${rowSeq}` };
}

function SectionError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-red-700">{msg}</p>;
}

/** Campo com rótulo + linha de ajuda em linguagem humana (padrão do mockup). */
function Field({
  label,
  htmlFor,
  optional,
  help,
  children,
  error,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  help?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={htmlFor} className="mb-1.5 text-[0.8rem] font-semibold text-ink/80">
        {label}{" "}
        {optional ? <span className="font-normal text-texto-suave">(opcional)</span> : null}
      </label>
      {children}
      {help ? <span className="mt-1.5 text-xs text-texto-suave">{help}</span> : null}
      <SectionError msg={error} />
    </div>
  );
}

function SugerirBtn({
  onClick,
  temTipo,
  children = "Sugerir",
}: {
  onClick: () => void;
  temTipo: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!temTipo}
      title={temTipo ? undefined : "Escolha o tipo de festa primeiro"}
      className="inline-flex items-center gap-1.5 rounded-[9px] bg-lilas px-3 py-2 text-xs font-semibold text-violeta transition hover:brightness-97 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <i className="bi bi-stars" aria-hidden /> {children}
    </button>
  );
}

async function enviarUpload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : "Falha no upload.";
    throw new Error(msg);
  }
  const url =
    data && typeof data === "object" && "url" in data
      ? String((data as { url: unknown }).url)
      : "";
  if (!url) throw new Error("Resposta inválida do upload.");
  return url;
}

/** Input de arquivo escondido + label estilizada (reusado pelos uploaders). */
function EscolherFoto({
  onFile,
  enviando,
  multiple,
  className,
  children,
}: {
  onFile: (files: File[]) => void;
  enviando: boolean;
  multiple?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <label
        htmlFor={inputId}
        className={`${className} ${enviando ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
      >
        {children}
      </label>
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        disabled={enviando}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFile(files);
          if (fileRef.current) fileRef.current.value = "";
        }}
        className="sr-only"
      />
    </>
  );
}

/** Cabeçalho de card de seção (título Sora + descrição curta). */
function CardHead({
  title,
  desc,
  acao,
}: {
  title: string;
  desc: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-[0.8rem] text-texto-suave">{desc}</p>
      </div>
      {acao}
    </div>
  );
}

/** Card branco padrão do editor. */
function CardSecao({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      {children}
    </div>
  );
}

/** Interruptor liga/desliga (tela Recursos do site). */
function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-[23px] w-10 shrink-0 rounded-full transition-colors ${
        on ? "bg-teal" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-[3px] size-[17px] rounded-full bg-white shadow transition-[left] ${
          on ? "left-[20px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

// ── Preview ao vivo — moldura iPhone / MacBook + mini-site tematizado ─────────

/** Data "2026-12-12" -> "12 . 12 . 2026" (pontilhada como no site). */
function dataPontilhada(date: string): string {
  const [a, m, d] = date.split("-");
  return d && m && a ? `${d} . ${m} . ${a}` : "Data a definir";
}

function PreviewSite({
  host,
  device,
  type,
  tema,
  fontes,
  title,
  mensagem,
  presentesTexto,
  date,
  time,
  fotoUrl,
  programacao,
  ativos,
}: {
  host: string;
  device: "phone" | "desktop";
  type: string;
  tema: string;
  fontes: string;
  title: string;
  mensagem: string;
  presentesTexto: string;
  date: string;
  time: string;
  fotoUrl: string;
  programacao: { hora: string; titulo: string }[];
  ativos: TogglesSite;
}) {
  const isPhone = device === "phone";
  const dupla = FONTES[fontes] ?? FONTES[FONTE_PADRAO];
  const caps = dupla.caps
    ? { textTransform: "uppercase" as const, letterSpacing: "0.12em" }
    : undefined;

  const nome = title.trim() || "Nome do evento";
  const nicho = (type && TIPO_LABEL[type as keyof typeof TIPO_LABEL]) || "Evento";
  const msg =
    mensagem.trim() ||
    (type ? textosDoNicho(type).mensagemPadrao : "") ||
    "Sua mensagem de boas-vindas aparece aqui.";
  const msgPresentes =
    presentesTexto.trim() ||
    "O maior presente é ter você comemorando comigo. Mas, se quiser deixar um carinho a mais, separei algumas ideias.";

  // Contagem calculada da data real (parse no fuso de Brasília, como o site).
  const restante = useMemo(() => {
    if (!date) return null;
    const alvo = new Date(`${date}T${time || "20:00"}:00-03:00`);
    if (Number.isNaN(alvo.getTime())) return null;
    return tempoRestante(alvo, new Date());
  }, [date, time]);

  const capaStyle: React.CSSProperties = fotoUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.35), rgba(15,23,42,0.2) 40%, rgba(15,23,42,0.5)), url(${fotoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }
    : {
        backgroundImage:
          "radial-gradient(130% 90% at 50% 0%, color-mix(in srgb, var(--ev-rosa) 38%, transparent), transparent 62%), linear-gradient(180deg, var(--ev-ink) 0%, var(--ev-framboesa-deep) 70%, var(--ev-ink) 100%)",
      };

  const progItens = programacao.filter((p) => p.hora.trim() || p.titulo.trim());

  // Miniatura do site — tematizada pelas MESMAS vars do site real (paleta +
  // dupla de fontes), num wrapper próprio para o preview.
  const site = (
    <div
      style={{
        ...varsDoTema(tema),
        ...varsDaFonte(fontes),
        background: "var(--ev-ivory)",
        fontFamily: "var(--ev-font-body)",
        ...(isPhone ? null : { width: "161%", transform: "scale(0.62)", transformOrigin: "top left" }),
      }}
    >
      {/* capa */}
      <div
        className="relative flex min-h-[250px] flex-col items-center justify-center gap-1 px-4 py-7 text-center"
        style={capaStyle}
      >
        <span
          className="relative text-[10px] tracking-[0.3em] text-white/85"
          style={{ fontFamily: "var(--ev-font-util)" }}
        >
          {date ? dataPontilhada(date) : "Data a definir"}
        </span>
        <span
          className="relative leading-[1.05] text-white [text-shadow:0_4px_22px_rgba(0,0,0,0.35)]"
          style={{
            fontFamily: "var(--ev-font-script)",
            fontSize: `${Math.round(42 * dupla.scriptScale + 10)}px`,
            ...caps,
          }}
        >
          {nome}
        </span>
        <span
          className="relative mt-1 text-[11px] uppercase tracking-[0.42em]"
          style={{ fontFamily: "var(--ev-font-display)", color: "var(--ev-rose)" }}
        >
          {nicho}
        </span>
        {ativos.contador && restante && !restante.chegou ? (
          <div className="relative mt-3.5 flex gap-2">
            {(
              [
                [restante.dias, "dias"],
                [restante.horas, "horas"],
                [restante.minutos, "min"],
              ] as const
            ).map(([n, lbl]) => (
              <span
                key={lbl}
                className="min-w-11 rounded-[9px] border border-white/25 bg-white/10 px-1.5 py-1.5 text-center text-sm leading-tight text-white"
                style={{ fontFamily: "var(--ev-font-util)" }}
              >
                {String(n).padStart(2, "0")}
                <br />
                <b className="text-[8.5px] font-medium uppercase tracking-[0.12em] text-white/75">
                  {lbl}
                </b>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* boas-vindas */}
      <div className="px-5 py-6 text-center">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.26em]"
          style={{ fontFamily: "var(--ev-font-util)", color: "var(--ev-rosa-ink)" }}
        >
          Bem-vindos
        </span>
        <p
          className="mx-auto mt-2 max-w-60 text-[13px] italic leading-relaxed"
          style={{ color: "var(--ev-ink-soft)" }}
        >
          {msg}
        </p>
      </div>

      {/* programação */}
      {ativos.programacao && progItens.length > 0 ? (
        <div
          className="border-y px-5 py-6 text-center"
          style={{ background: "#fff", borderColor: "var(--line)" }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.26em]"
            style={{ fontFamily: "var(--ev-font-util)", color: "var(--ev-rosa-ink)" }}
          >
            Programação
          </span>
          <div className="mx-auto mt-3.5 flex max-w-[250px] flex-col gap-2 text-left">
            {progItens.map((p, i) => (
              <div
                key={i}
                className="flex items-baseline gap-3 rounded-[9px] px-3 py-1.5 text-[13px]"
                style={{ background: "var(--ev-blush-soft)", color: "var(--ev-ink-soft)" }}
              >
                <b
                  className="min-w-11 shrink-0 font-semibold"
                  style={{ color: "var(--ev-rosa-ink)" }}
                >
                  {p.hora || "—"}
                </b>
                <span>{p.titulo}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* presentes */}
      {ativos.presentes ? (
        <div className="px-5 py-6 text-center">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.26em]"
            style={{ fontFamily: "var(--ev-font-util)", color: "var(--ev-rosa-ink)" }}
          >
            Lista de presentes
          </span>
          <p
            className="mx-auto mt-2 max-w-60 text-[13px] italic leading-relaxed"
            style={{ color: "var(--ev-ink-soft)" }}
          >
            {msgPresentes}
          </p>
          <span
            className="mt-3 inline-block rounded-full px-5 py-2 text-[11px] font-semibold text-white"
            style={{ background: "var(--ev-framboesa-deep)", fontFamily: "var(--ev-font-util)" }}
          >
            Presentear via Pix
          </span>
        </div>
      ) : null}

      {/* rsvp */}
      {ativos.rsvp ? (
        <div
          className="mx-5 mb-6 rounded-2xl p-5 text-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, var(--ev-ink), var(--ev-framboesa-deep))",
          }}
        >
          <span
            className="block text-white"
            style={{
              fontFamily: "var(--ev-font-script)",
              fontSize: `${Math.round(20 * dupla.scriptScale + 7)}px`,
              ...caps,
            }}
          >
            Você vem?
          </span>
          <span
            className="mt-2.5 inline-block rounded-full bg-white px-5 py-2 text-[11px] font-bold"
            style={{ color: "var(--ev-framboesa-deep)", fontFamily: "var(--ev-font-util)" }}
          >
            Confirmar presença
          </span>
        </div>
      ) : null}

      {/* rodapé */}
      <div
        className="border-t px-4 py-3.5 text-center text-[10px] tracking-[0.14em]"
        style={{ borderColor: "var(--line)", color: "var(--ev-ink-soft)" }}
      >
        {nome}
        {date ? ` · ${dataPontilhada(date)}` : ""}
      </div>
    </div>
  );

  if (isPhone) {
    return (
      <div
        className="relative rounded-[46px] p-2.5"
        style={{
          background: "linear-gradient(145deg,#4a4a52,#1c1c21)",
          boxShadow:
            "inset 0 0 0 2px #6b6b74, inset 0 0 0 3.5px #26262c, 0 28px 56px -24px rgba(15,23,42,0.6)",
        }}
      >
        <div className="relative overflow-hidden rounded-[37px] bg-black">
          {/* status bar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[6] flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <svg width="17" height="11" viewBox="0 0 18 11" fill="#fff" aria-hidden>
                <rect x="0" y="7" width="3" height="4" rx="1" />
                <rect x="5" y="5" width="3" height="6" rx="1" />
                <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
                <rect x="15" y="0" width="3" height="11" rx="1" />
              </svg>
              <svg width="15" height="11" viewBox="0 0 16 12" fill="#fff" aria-hidden>
                <path d="M1.4 4.4a9.3 9.3 0 0 1 13.2 0l-1.6 1.6a7 7 0 0 0-10 0z" />
                <path d="M4.2 7.2a5.4 5.4 0 0 1 7.6 0L10.2 8.8a3.1 3.1 0 0 0-4.4 0z" />
                <circle cx="8" cy="10.4" r="1.3" />
              </svg>
              <svg width="24" height="11" viewBox="0 0 25 11" aria-hidden>
                <rect x="0.5" y="0.5" width="20" height="10" rx="3" fill="none" stroke="#fff" strokeOpacity=".45" />
                <rect x="2" y="2" width="14" height="7" rx="1.5" fill="#fff" />
                <rect x="22" y="3.5" width="1.6" height="4" rx=".8" fill="#fff" opacity=".45" />
              </svg>
            </span>
          </div>
          {/* dynamic island */}
          <div className="absolute left-1/2 top-[9px] z-[7] h-[26px] w-[88px] -translate-x-1/2 rounded-2xl bg-black shadow-[inset_0_0_4px_rgba(255,255,255,0.07)]" />
          <div className="h-[560px] overflow-auto [scrollbar-width:none]">{site}</div>
          {/* home indicator */}
          <div className="pointer-events-none absolute bottom-[7px] left-1/2 z-[7] h-1 w-24 -translate-x-1/2 rounded-full bg-white/90" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative rounded-t-[18px] rounded-b-[4px] p-3 pb-[18px]"
        style={{
          background: "linear-gradient(180deg,#17181c,#0c0d10)",
          boxShadow: "inset 0 0 0 1.5px #2e2f36",
        }}
      >
        <div className="relative overflow-hidden rounded-[5px] bg-white">
          {/* barra do navegador */}
          <div className="flex items-center gap-2 border-b border-[#d7dde6] bg-[#e9edf3] px-2.5 py-1.5">
            <span className="flex shrink-0 gap-[5px]" aria-hidden>
              <span className="block size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="block size-2.5 rounded-full bg-[#febc2e]" />
              <span className="block size-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="flex flex-1 items-center justify-center gap-1 truncate rounded-[7px] border border-[#d7dde6] bg-white px-2.5 py-1 text-[9.5px] text-texto-suave">
              <i className="bi bi-lock-fill text-[8px]" aria-hidden /> {host}
            </span>
            <span className="w-6 shrink-0" />
          </div>
          <div className="h-[330px] overflow-hidden">{site}</div>
        </div>
      </div>
      {/* base do notebook */}
      <div className="relative -mx-5 h-4 rounded-b-2xl rounded-t-[2px] bg-gradient-to-b from-[#eceef1] to-[#9ca3af] shadow-[0_20px_36px_-16px_rgba(15,23,42,0.55)]">
        <div className="absolute left-1/2 top-0 h-[7px] w-24 -translate-x-1/2 rounded-b-[10px] bg-[#c3c9d2]" />
      </div>
    </div>
  );
}

// ── Modais ────────────────────────────────────────────────────────────────────

function ModalGaleriaTemplates({
  tema,
  fontes,
  nome,
  dataLabel,
  onClose,
}: {
  tema: string;
  fontes: string;
  nome: string;
  dataLabel: string;
  onClose: () => void;
}) {
  const dupla = FONTES[fontes] ?? FONTES[FONTE_PADRAO];
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm sm:p-7"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Escolha o template"
        className="max-h-[88vh] w-full max-w-[980px] overflow-auto rounded-[22px] bg-nevoa p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Escolha o template
            </h2>
            <p className="mt-2 text-sm text-texto-suave">
              Trocar de template não apaga nada — textos, fotos e cores continuam.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-black/10 bg-white text-ink transition hover:bg-white/70"
          >
            <i className="bi bi-x-lg text-sm" aria-hidden />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES_GALERIA.map((g) => (
            <div
              key={g.id}
              className={`overflow-hidden rounded-2xl border border-black/5 bg-white ${
                g.pronto ? "shadow-[0_16px_36px_-24px_rgba(109,40,217,0.45)]" : ""
              }`}
            >
              <div
                className="relative flex h-[130px] flex-col items-center justify-center gap-0.5"
                style={{
                  ...varsDoTema(tema),
                  ...varsDaFonte(fontes),
                  backgroundImage:
                    "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--ev-rosa) 33%, transparent), transparent 60%), linear-gradient(180deg, var(--ev-ink), var(--ev-framboesa-deep))",
                  ...(g.pronto ? null : { filter: "saturate(0.55) brightness(0.92)" }),
                }}
              >
                <span
                  className="text-[8px] tracking-[0.28em] text-white/80"
                  style={{ fontFamily: "var(--ev-font-util)" }}
                >
                  {dataLabel}
                </span>
                <span
                  className="text-white"
                  style={{
                    fontFamily: "var(--ev-font-script)",
                    fontSize: `${Math.round(26 * dupla.scriptScale + 8)}px`,
                    ...(dupla.caps
                      ? { textTransform: "uppercase" as const, letterSpacing: "0.12em" }
                      : null),
                  }}
                >
                  {nome}
                </span>
                {!g.pronto ? (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-ink/55 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-white backdrop-blur-sm">
                    Em breve
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-semibold text-ink">
                    {g.nome}
                  </span>
                  <span className="rounded-full bg-violeta/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-violeta">
                    {g.tag}
                  </span>
                </div>
                <p className="mt-1 text-xs text-texto-suave">{g.desc}</p>
                {g.pronto ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full rounded-[9px] border border-teal/25 bg-teal/10 py-2 text-xs font-semibold text-teal"
                  >
                    Em uso <i className="bi bi-check-lg" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-3 w-full cursor-not-allowed rounded-[9px] border border-black/10 bg-white py-2 text-xs font-semibold text-texto-suave"
                  >
                    Em breve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalRecursoBloqueado({
  recurso,
  onClose,
}: {
  recurso: RecursoSite;
  onClose: () => void;
}) {
  const def = RECURSOS_SITE.find((d) => d.key === recurso);
  if (!def || def.gate === null) return null;
  const plano = rotuloPlano(planoQueLibera(def.gate));
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={def.titulo}
        className="w-full max-w-[420px] rounded-[20px] bg-white p-7 text-center shadow-[0_40px_80px_-30px_rgba(15,23,42,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="inline-flex size-[52px] items-center justify-center rounded-2xl bg-lilas text-violeta">
          <i className="bi bi-lock text-xl" aria-hidden />
        </span>
        <h3 className="mt-4 font-display text-[1.35rem] font-semibold text-ink">
          {def.titulo}
        </h3>
        <p className="mx-auto mt-2.5 max-w-80 text-sm leading-relaxed text-texto-suave">
          {BLOQUEADO_DESC[recurso] ?? def.descricao}
        </p>
        <div className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-teal/10 px-3.5 py-1.5 text-xs font-semibold text-teal">
          Incluído no plano {plano}
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/painel/plano"
            className="rounded-xl bg-gradient-to-r from-violeta to-teal px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-violeta/25 transition hover:brightness-105"
          >
            Ver planos
          </Link>
          <span className="text-xs text-texto-suave">
            O upgrade é da sua conta e vale para todos os seus eventos.
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Editor ────────────────────────────────────────────────────────────────────

export default function EditorEvento({
  paletas,
  rootDomain,
  mode,
  plan,
  initial,
  status,
  publicUrl,
  subdomain,
}: {
  paletas: PaletaOpt[];
  rootDomain: string;
  mode: "create" | "edit";
  plan: Plan;
  initial?: EventoFormInitial;
  status?: EventStatus;
  publicUrl?: string;
  /** Subdomínio FIXO (modo edit): o endereço de um evento existente não muda. */
  subdomain?: string;
}) {
  const action = mode === "edit" ? editarEvento : criarEvento;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const uid = useId();
  const formId = `editor-${uid}`;

  // "presentes" é a tela de configuração da lista (fora da nav; abre pelo
  // "Configurar" do card na tela Recursos do site).
  const [secao, setSecao] = useState<string>("info");
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState<RecursoSite | null>(null);

  const [type, setType] = useState(initial?.type ?? "");
  const [tema, setTema] = useState(initial?.tema ?? paletas[0]?.key ?? "rose");
  const [fontes, setFontes] = useState(initial?.fontes ?? FONTE_PADRAO);
  const [toggles, setToggles] = useState<TogglesSite>(() => ({
    ...lerToggles(undefined),
    ...initial?.recursos,
  }));
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "20:00");
  const [mensagem, setMensagem] = useState(initial?.mensagem ?? "");
  const [mensagemTocada, setMensagemTocada] = useState(Boolean(initial?.mensagem));
  const [presentesTexto, setPresentesTexto] = useState(initial?.presentesTexto ?? "");
  const [fotoUrl, setFotoUrl] = useState(initial?.fotoUrl ?? "");
  const [presentesFotoUrl, setPresentesFotoUrl] = useState(
    initial?.presentesFotoUrl ?? "",
  );
  const [fotos, setFotos] = useState<string[]>(() => initial?.fotos ?? []);

  const [programacao, setProgramacao] = useState<Row<{ hora: string; titulo: string }>[]>(
    () =>
      (initial?.programacao ?? [{ hora: "", titulo: "" }]).map((p) => makeRow(p)),
  );
  const [presentes, setPresentes] = useState<
    Row<{ titulo: string; descricao: string; valor: string }>[]
  >(() =>
    (initial?.presentes ?? [{ titulo: "", descricao: "", valor: "" }]).map((p) =>
      makeRow({ titulo: p.titulo ?? "", descricao: p.descricao ?? "", valor: p.valor ?? "" }),
    ),
  );

  // Uploads
  const [enviandoCapa, setEnviandoCapa] = useState(false);
  const [enviandoAlbum, setEnviandoAlbum] = useState(false);
  const [enviandoLista, setEnviandoLista] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | undefined>();

  async function subirUma(
    file: File,
    setUrl: (u: string) => void,
    setBusy: (b: boolean) => void,
  ) {
    setErroUpload(undefined);
    setBusy(true);
    try {
      setUrl(await enviarUpload(file));
    } catch (err) {
      setErroUpload(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }
  async function subirAlbum(files: File[]) {
    setErroUpload(undefined);
    setEnviandoAlbum(true);
    try {
      for (const file of files) {
        const u = await enviarUpload(file);
        setFotos((prev) => [...prev, u]);
      }
    } catch (err) {
      setErroUpload(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviandoAlbum(false);
    }
  }

  function escolherTipo(value: string) {
    setType(value);
    if (!mensagemTocada) setMensagem(textosDoNicho(value).mensagemPadrao);
  }
  function sugerirMensagem() {
    if (!type) return;
    setMensagem(textosDoNicho(type).mensagemPadrao);
    setMensagemTocada(true);
  }
  function sugerirProgramacao() {
    if (!type) return;
    setProgramacao(programacaoSugerida(type).map((i) => makeRow(i)));
  }
  function sugerirPresentesTexto() {
    if (!type) return;
    setPresentesTexto(textosDoNicho(type).teaserPresentes);
  }
  function sugerirPresentes() {
    if (!type) return;
    setPresentes(
      presentesSugeridos(type).map((p) =>
        makeRow({ titulo: p.titulo, descricao: p.descricao, valor: p.valor }),
      ),
    );
  }
  function setProgRow(id: string, campo: "hora" | "titulo", valor: string) {
    setProgramacao((rows) => rows.map((r) => (r._id === id ? { ...r, [campo]: valor } : r)));
  }
  function setPresenteRow(id: string, campo: "titulo" | "descricao" | "valor", valor: string) {
    setPresentes((rows) => rows.map((r) => (r._id === id ? { ...r, [campo]: valor } : r)));
  }

  const temTipo = Boolean(type);
  // Mínimos para publicar: tipo, paleta, nome e data. Manter a data aqui evita um
  // submit que só bateria no servidor (o browser não valida campo em seção oculta).
  const canSubmit = Boolean(type && tema && title.trim() && date);
  const isEdit = mode === "edit";
  // Edit: o endereço é fixo (subdomínio existente). Create: deriva do nome.
  const slugHost = isEdit ? subdomain || "evento" : slugify(title) || "evento";
  const host = `${slugHost}.${rootDomain.replace(/:\d+$/, "")}`;
  const publicado = status === "PUBLISHED";
  const tipoLabel = (type && TIPO_LABEL[type as keyof typeof TIPO_LABEL]) || "";

  // Recurso liberado pelo plano / ativo no site (plano ∩ toggle) — o preview e a
  // tela de recursos leem daqui.
  const liberado = (r: RecursoSite) => {
    const def = RECURSOS_SITE.find((d) => d.key === r);
    return !def?.gate || planoPermite(plan, def.gate);
  };
  const ativos = useMemo(() => {
    const out = { ...toggles };
    for (const def of RECURSOS_SITE) {
      out[def.key] = toggles[def.key] && (!def.gate || planoPermite(plan, def.gate));
    }
    return out;
  }, [toggles, plan]);

  const bloqueados = RECURSOS_SITE.filter((d) => d.gate && !planoPermite(plan, d.gate));

  const fieldErr = state.fieldErrors;

  // Se o servidor devolveu erro de validação, revela a seção do primeiro campo
  // com erro para a mensagem ficar visível (evita o submit "silencioso" quando o
  // campo está numa seção oculta). Padrão "ajustar estado durante o render" do
  // React (sem effect) — o `state` só muda a cada resposta da action (submit).
  const [statePrevio, setStatePrevio] = useState(state);
  if (state !== statePrevio) {
    setStatePrevio(state);
    if (fieldErr) {
      const campo = ORDEM_CAMPOS.find(
        (k) => (fieldErr as Record<string, string | undefined>)[k],
      );
      if (campo) setSecao(SECAO_DO_CAMPO[campo]);
    }
  }

  const dupla = FONTES[fontes] ?? FONTES[FONTE_PADRAO];
  const nomePreview = title.trim() || "Nome do evento";
  const dataLabel = date ? dataPontilhada(date) : "O grande dia";

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-7">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/painel/eventos"
            aria-label="Voltar para eventos"
            className="grid size-9 place-items-center rounded-[10px] border border-black/10 bg-white text-ink transition hover:bg-nevoa"
          >
            <i className="bi bi-chevron-left" aria-hidden />
          </Link>
          <div>
            <p className="text-[11px] font-medium text-texto-suave">
              {isEdit ? "Editando evento" : "Novo evento"}
            </p>
            <h1 className="font-display text-xl font-semibold leading-tight text-ink">
              {title.trim() || (isEdit ? "Evento" : "Novo evento")}
              {tipoLabel ? (
                <span className="text-texto-suave"> — {tipoLabel}</span>
              ) : null}
            </h1>
          </div>
          {isEdit ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                publicado ? "bg-teal/10 text-teal" : "bg-amber-100 text-amber-700"
              }`}
            >
              {publicado ? "No ar" : "Rascunho"}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isEdit && publicUrl ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:bg-nevoa"
            >
              <i className="bi bi-eye" aria-hidden />
              <span className="hidden sm:inline">Pré-visualizar</span>
            </a>
          ) : null}
          <button
            type="submit"
            form={formId}
            disabled={pending || !canSubmit}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isEdit
                ? "border border-black/10 bg-white text-ink hover:bg-nevoa"
                : "bg-gradient-to-r from-violeta to-teal text-white shadow-sm shadow-violeta/20 hover:brightness-105"
            }`}
          >
            {pending
              ? isEdit
                ? "Salvando…"
                : "Criando…"
              : isEdit
                ? "Salvar"
                : "Criar site"}
          </button>
          {isEdit && initial?.eventId ? (
            <form action={publicado ? despublicarEvento : publicarEvento}>
              <input type="hidden" name="eventId" value={initial.eventId} />
              <button
                type="submit"
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  publicado
                    ? "border border-black/10 bg-white text-ink hover:bg-nevoa"
                    : "bg-gradient-to-r from-violeta to-teal text-white shadow-sm shadow-violeta/20 hover:brightness-105"
                }`}
              >
                <i
                  className={`bi ${publicado ? "bi-eye-slash" : "bi-rocket-takeoff"}`}
                  aria-hidden
                />
                <span className="hidden sm:inline">
                  {publicado ? "Despublicar" : "Publicar"}
                </span>
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {/* ── 3 painéis ── */}
      <div className="mt-5 grid items-start gap-[18px] lg:grid-cols-[12.25rem_minmax(0,1fr)_21rem]">
        {/* Nav — 5 itens fixos */}
        <nav className="rounded-2xl border border-black/5 bg-white p-2 shadow-sm lg:sticky lg:top-20">
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SECOES.map((s, i) => {
              const ativo = secao === s.key || (s.key === "recursos" && secao === "presentes");
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSecao(s.key)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left text-[0.84rem] font-medium transition lg:w-full ${
                    ativo ? "bg-ink text-white" : "text-texto-suave hover:bg-black/5 hover:text-ink"
                  }`}
                >
                  <span
                    className={`grid size-[22px] shrink-0 place-items-center rounded-[7px] text-[11px] font-bold ${
                      ativo ? "bg-white/16 text-white" : "bg-nevoa text-texto-suave"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 whitespace-nowrap lg:whitespace-normal">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mx-1.5 mb-1.5 mt-2.5 hidden rounded-[11px] bg-nevoa px-3 py-2.5 text-[11.5px] leading-relaxed text-texto-suave lg:block">
            Tudo que você muda aparece na hora no site ao lado.
          </div>
        </nav>

        {/* Painel da seção (UM form, todas as seções montadas) */}
        <form id={formId} action={formAction} className="min-w-0">
          {isEdit && initial?.eventId ? (
            <input type="hidden" name="eventId" value={initial.eventId} />
          ) : null}
          <input type="hidden" name="fontes" value={fontes} />
          {RECURSOS_SITE.map((d) => (
            <input
              key={d.key}
              type="hidden"
              name={`rec_${d.key}`}
              value={toggles[d.key] ? "on" : "off"}
            />
          ))}
          {fotos.map((u, i) => (
            <input key={`${u}-${i}`} type="hidden" name="fotos" value={u} />
          ))}
          <input type="hidden" name="fotoUrl" value={fotoUrl} />
          <input type="hidden" name="presentesFotoUrl" value={presentesFotoUrl} />

          {/* ── 1 · Informações ── */}
          <div hidden={secao !== "info"}>
            <CardSecao>
              <CardHead
                title="Informações do evento"
                desc="O básico sobre a festa — nome, quando e onde."
              />
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Nome do evento"
                    htmlFor={`${uid}-title`}
                    help="É o nome que aparece grande na capa."
                    error={fieldErr?.title}
                  >
                    {/* Sem `required` nativo: o campo pode estar numa seção oculta e
                        o browser bloquearia o submit sem foco possível. A validação
                        é via Zod no servidor + botão desabilitado. */}
                    <input
                      id={`${uid}-title`}
                      name="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClass}
                      placeholder="Ex.: Maria Clara"
                    />
                  </Field>
                  <Field
                    label="Tipo de festa"
                    htmlFor={`${uid}-type`}
                    help="Usamos isso para sugerir textos prontos."
                    error={fieldErr?.type}
                  >
                    <select
                      id={`${uid}-type`}
                      name="type"
                      value={type}
                      onChange={(e) => escolherTipo(e.target.value)}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="" disabled>
                        Escolha o tipo
                      </option>
                      {TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Data" htmlFor={`${uid}-date`} error={fieldErr?.date}>
                    <input
                      id={`${uid}-date`}
                      name="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Horário" htmlFor={`${uid}-time`} error={fieldErr?.time}>
                    <input
                      id={`${uid}-time`}
                      name="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Local" htmlFor={`${uid}-local`} optional error={fieldErr?.local}>
                    <input
                      id={`${uid}-local`}
                      name="local"
                      type="text"
                      defaultValue={initial?.local}
                      className={inputClass}
                      placeholder="Ex.: Buffet Jardim das Flores"
                    />
                  </Field>
                  <Field label="Traje" htmlFor={`${uid}-traje`} optional error={fieldErr?.traje}>
                    <input
                      id={`${uid}-traje`}
                      name="traje"
                      type="text"
                      defaultValue={initial?.traje}
                      className={inputClass}
                      placeholder="Ex.: Esporte fino"
                    />
                  </Field>
                </div>

                <Field
                  label="Endereço"
                  htmlFor={`${uid}-endereco`}
                  optional
                  help="Os convidados veem o endereço com um mapa no site."
                  error={fieldErr?.endereco}
                >
                  <input
                    id={`${uid}-endereco`}
                    name="endereco"
                    type="text"
                    defaultValue={initial?.endereco}
                    className={inputClass}
                    placeholder="Ex.: Av. das Palmeiras, 900 — Campinas, SP"
                  />
                </Field>

                <div>
                  <p className="mb-1.5 text-[0.8rem] font-semibold text-ink/80">
                    Endereço do site
                  </p>
                  <div className="flex items-center rounded-[10px] border border-dashed border-black/15 bg-nevoa/60 px-3.5 py-2.5 text-sm">
                    <span className="truncate font-medium text-violeta">{host}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-texto-suave">
                    Gerado do nome do evento.{" "}
                    {isEdit ? "O endereço de um site publicado não muda." : ""}
                  </p>
                </div>
              </div>
            </CardSecao>
          </div>

          {/* ── 2 · Estilo ── */}
          <div hidden={secao !== "estilo"} className="flex flex-col gap-4">
            <CardSecao>
              <CardHead
                title="Template"
                desc="O desenho do site. Trocar não apaga nada do que você preencheu."
                acao={
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="shrink-0 whitespace-nowrap rounded-[10px] border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-nevoa"
                  >
                    Trocar template
                  </button>
                }
              />
              <div className="flex items-center gap-3.5 rounded-[13px] border border-black/10 p-3">
                <div
                  className="flex h-[76px] w-[120px] shrink-0 items-center justify-center rounded-[9px]"
                  style={{
                    ...varsDoTema(tema),
                    ...varsDaFonte(fontes),
                    backgroundImage:
                      "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--ev-rosa) 33%, transparent), transparent 60%), linear-gradient(180deg, var(--ev-ink), var(--ev-framboesa-deep))",
                  }}
                >
                  <span
                    className="px-2 text-center leading-tight text-white"
                    style={{
                      fontFamily: "var(--ev-font-script)",
                      fontSize: `${Math.round(19 * dupla.scriptScale + 6)}px`,
                      ...(dupla.caps
                        ? { textTransform: "uppercase" as const, letterSpacing: "0.1em" }
                        : null),
                    }}
                  >
                    {nomePreview}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-display text-base font-semibold text-ink">Clássico</p>
                  <p className="mt-0.5 text-xs text-texto-suave">
                    Capa cinematográfica com foto, seções claras e elegantes.
                  </p>
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-teal/12 px-2.5 py-1 text-[10.5px] font-bold text-teal">
                  Em uso
                </span>
              </div>
            </CardSecao>

            <CardSecao>
              <CardHead
                title="Paleta de cores"
                desc="Clique e veja o site inteiro mudar de cor."
              />
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {paletas.map((p) => {
                  const sel = tema === p.key;
                  return (
                    <label
                      key={p.key}
                      className={`relative flex cursor-pointer flex-col items-start gap-2 rounded-[13px] p-3.5 text-left transition ${
                        sel
                          ? "border-2 border-violeta bg-[#FBFAFF] shadow-[0_10px_24px_-16px_rgba(109,40,217,0.5)]"
                          : "border border-black/10 bg-white hover:border-violeta/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tema"
                        value={p.key}
                        checked={sel}
                        onChange={() => setTema(p.key)}
                        className="sr-only"
                      />
                      <span className="flex gap-1.5">
                        {p.dots.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            aria-hidden
                            className="size-[17px] rounded-full border-[1.5px] border-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </span>
                      <span className="text-[0.8rem] font-semibold text-ink">{p.label}</span>
                      {sel ? (
                        <span className="absolute right-2.5 top-2.5 grid size-[19px] place-items-center rounded-full bg-violeta text-white">
                          <i className="bi bi-check text-xs" aria-hidden />
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
              <SectionError msg={fieldErr?.tema} />
            </CardSecao>

            <CardSecao>
              <CardHead
                title="Estilo das letras"
                desc="Cada opção mostra o nome do seu evento. Escolher troca as letras do site todo, combinadas."
              />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {Object.values(FONTES).map((f) => {
                  const sel = fontes === f.key;
                  return (
                    <label
                      key={f.key}
                      className={`relative flex cursor-pointer flex-col items-start rounded-[13px] p-4 pb-3 text-left transition ${
                        sel
                          ? "border-2 border-violeta bg-[#FBFAFF] shadow-[0_10px_24px_-16px_rgba(109,40,217,0.5)]"
                          : "border border-black/10 bg-white hover:border-violeta/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="fontes-visual"
                        value={f.key}
                        checked={sel}
                        onChange={() => setFontes(f.key)}
                        className="sr-only"
                      />
                      <span
                        className="leading-tight text-ink"
                        style={{
                          fontFamily: f.vars["--ev-font-script"],
                          fontSize: `${Math.round(30 * f.scriptScale + 10)}px`,
                          ...(f.caps
                            ? {
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.14em",
                                fontWeight: 500,
                              }
                            : null),
                        }}
                      >
                        {nomePreview}
                      </span>
                      <span
                        className="mt-1 text-xs text-texto-suave"
                        style={{ fontFamily: f.vars["--ev-font-body"] }}
                      >
                        Títulos e textos combinados
                      </span>
                      <span className="mt-2.5 flex w-full items-center justify-between">
                        <span className="text-xs font-semibold text-ink">{f.label}</span>
                        {sel ? (
                          <span className="grid size-[19px] place-items-center rounded-full bg-violeta text-white">
                            <i className="bi bi-check text-xs" aria-hidden />
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
              <SectionError msg={fieldErr?.fontes} />
            </CardSecao>
          </div>

          {/* ── 3 · Textos ── */}
          <div hidden={secao !== "textos"} className="flex flex-col gap-4">
            <CardSecao>
              <CardHead
                title="Mensagem de boas-vindas"
                desc="O primeiro texto que os convidados leem. Sem inspiração? Toque em Sugerir."
                acao={<SugerirBtn onClick={sugerirMensagem} temTipo={temTipo} />}
              />
              <textarea
                id={`${uid}-mensagem`}
                name="mensagem"
                rows={3}
                maxLength={2000}
                value={mensagem}
                onChange={(e) => {
                  setMensagem(e.target.value);
                  setMensagemTocada(true);
                }}
                className={`${inputClass} resize-y leading-relaxed`}
                placeholder="Escolha o tipo de festa e toque em Sugerir — você pode editar depois."
              />
              <SectionError msg={fieldErr?.mensagem} />
            </CardSecao>

            <CardSecao>
              <CardHead
                title="Programação"
                desc="A linha do tempo da festa, hora a hora."
                acao={<SugerirBtn onClick={sugerirProgramacao} temTipo={temTipo} />}
              />
              <div className="flex flex-col gap-2">
                {programacao.map((row, i) => (
                  <div key={row._id} className="flex gap-2">
                    <input
                      name="programacao_hora"
                      type="text"
                      value={row.hora}
                      onChange={(e) => setProgRow(row._id, "hora", e.target.value)}
                      className={`${inputClass} w-[84px] shrink-0 px-2.5 text-center`}
                      placeholder="20h30"
                      aria-label={`Horário do item ${i + 1}`}
                    />
                    <input
                      name="programacao_titulo"
                      type="text"
                      value={row.titulo}
                      onChange={(e) => setProgRow(row._id, "titulo", e.target.value)}
                      className={`${inputClass} min-w-0 flex-1`}
                      placeholder="Recepção dos convidados"
                      aria-label={`Descrição do item ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProgramacao((rows) =>
                          rows.length > 1 ? rows.filter((r) => r._id !== row._id) : rows,
                        )
                      }
                      className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-black/10 text-texto-suave transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                      disabled={programacao.length <= 1}
                      aria-label={`Remover item ${i + 1}`}
                    >
                      <i className="bi bi-trash" aria-hidden />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setProgramacao((rows) => [...rows, makeRow({ hora: "", titulo: "" })])}
                  className="self-start rounded-[10px] border border-dashed border-black/20 px-3.5 py-2 text-xs font-semibold text-texto-suave transition hover:border-violeta/40 hover:text-violeta"
                >
                  + Adicionar horário
                </button>
              </div>
            </CardSecao>

            <CardSecao>
              <CardHead
                title="Texto da lista de presentes"
                desc="Um convite gentil para quem quiser presentear."
                acao={<SugerirBtn onClick={sugerirPresentesTexto} temTipo={temTipo} />}
              />
              <textarea
                name="presentesTexto"
                rows={2}
                maxLength={500}
                value={presentesTexto}
                onChange={(e) => setPresentesTexto(e.target.value)}
                className={`${inputClass} resize-y leading-relaxed`}
                placeholder="Ex.: Sua presença é o meu presente — mas se quiser me mimar, escolha um carinho da lista."
              />
              <SectionError msg={fieldErr?.presentesTexto} />
            </CardSecao>
          </div>

          {/* ── 4 · Fotos ── */}
          <div hidden={secao !== "fotos"} className="flex flex-col gap-4">
            <CardSecao>
              <CardHead
                title="Foto de capa"
                desc="Uma foto na vertical, bem iluminada — ela vira o fundo da capa do site."
              />
              <div className="flex flex-wrap items-stretch gap-4">
                <div
                  className="relative flex h-[200px] w-[150px] shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl"
                  style={
                    fotoUrl
                      ? undefined
                      : {
                          ...varsDoTema(tema),
                          backgroundImage:
                            "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--ev-rosa) 40%, transparent), transparent 60%), linear-gradient(180deg, var(--ev-ink), var(--ev-framboesa-deep))",
                        }
                  }
                >
                  {fotoUrl ? (
                    <Image
                      src={fotoUrl}
                      alt="Foto de capa"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <>
                      <i className="bi bi-image text-2xl text-white/85" aria-hidden />
                      <span className="px-3 text-center text-[11px] font-medium text-white/85">
                        Sem foto ainda
                      </span>
                    </>
                  )}
                </div>
                <div className="flex min-w-40 flex-1 flex-col justify-center gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <EscolherFoto
                      enviando={enviandoCapa}
                      onFile={(files) => subirUma(files[0], setFotoUrl, setEnviandoCapa)}
                      className="inline-flex items-center rounded-[10px] bg-gradient-to-r from-violeta to-teal px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-violeta/20 transition hover:brightness-105"
                    >
                      {enviandoCapa ? "Enviando…" : fotoUrl ? "Trocar foto" : "Enviar foto"}
                    </EscolherFoto>
                    {fotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setFotoUrl("")}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>
                  <span className="text-xs leading-relaxed text-texto-suave">
                    Funciona melhor com fotos em pé (retrato), como as de celular.
                    <br />
                    JPG, PNG ou WebP, até 6MB.
                  </span>
                </div>
              </div>
              <SectionError msg={fieldErr?.fotoUrl} />
            </CardSecao>

            <CardSecao>
              <CardHead
                title="Álbum"
                desc="As fotos que aparecem na galeria do site. Pode enviar várias de uma vez."
              />
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {fotos.map((u, i) => (
                  <div key={`${u}-${i}`} className="group relative aspect-square">
                    <Image
                      src={u}
                      alt={`Foto ${i + 1} do álbum`}
                      fill
                      unoptimized
                      className="rounded-xl object-cover ring-1 ring-black/10"
                    />
                    <button
                      type="button"
                      onClick={() => setFotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-white text-xs text-red-600 shadow ring-1 ring-black/10 hover:bg-red-50"
                      aria-label={`Remover foto ${i + 1}`}
                    >
                      <i className="bi bi-x" aria-hidden />
                    </button>
                  </div>
                ))}
                <EscolherFoto
                  enviando={enviandoAlbum}
                  multiple
                  onFile={subirAlbum}
                  className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-black/20 text-xs font-semibold text-texto-suave transition hover:border-violeta/40 hover:text-violeta"
                >
                  {enviandoAlbum ? "Enviando…" : "+ Adicionar"}
                </EscolherFoto>
              </div>
              {!planoPermite(plan, "galeria") ? (
                <p className="mt-3 text-xs text-texto-suave">
                  <i className="bi bi-lock mr-1" aria-hidden />
                  A galeria aparece no site a partir do plano{" "}
                  {rotuloPlano(planoQueLibera("galeria"))} — as fotos ficam guardadas aqui.
                </p>
              ) : null}
            </CardSecao>

            <CardSecao>
              <CardHead
                title="Foto da lista de presentes"
                desc="Aparece ao lado da lista. Uma foto sorrindo funciona super bem."
              />
              <div className="flex items-center gap-3.5">
                <div
                  className="relative flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-full"
                  style={
                    presentesFotoUrl
                      ? undefined
                      : {
                          ...varsDoTema(tema),
                          backgroundImage:
                            "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--ev-rosa) 40%, transparent), transparent 60%), linear-gradient(180deg, var(--ev-ink), var(--ev-framboesa-deep))",
                        }
                  }
                >
                  {presentesFotoUrl ? (
                    <Image
                      src={presentesFotoUrl}
                      alt="Foto da lista de presentes"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <i className="bi bi-image text-lg text-white/85" aria-hidden />
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <EscolherFoto
                    enviando={enviandoLista}
                    onFile={(files) =>
                      subirUma(files[0], setPresentesFotoUrl, setEnviandoLista)
                    }
                    className="inline-flex items-center rounded-[10px] border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-nevoa"
                  >
                    {enviandoLista
                      ? "Enviando…"
                      : presentesFotoUrl
                        ? "Trocar foto"
                        : "Escolher foto"}
                  </EscolherFoto>
                  {presentesFotoUrl ? (
                    <button
                      type="button"
                      onClick={() => setPresentesFotoUrl("")}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  ) : (
                    <span className="text-xs text-texto-suave">Se vazia, usa a capa.</span>
                  )}
                </div>
              </div>
              <SectionError msg={fieldErr?.presentesFotoUrl} />
            </CardSecao>

            <SectionError msg={erroUpload} />
          </div>

          {/* ── 5 · Recursos do site ── */}
          <div hidden={secao !== "recursos"} className="flex flex-col gap-3.5">
            {bloqueados.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-violeta/15 bg-lilas px-4 py-3.5">
                <span
                  className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-turquesa via-teal to-violeta text-white"
                  aria-hidden
                >
                  <i className="bi bi-stars text-sm" />
                </span>
                <div className="min-w-[220px] flex-1">
                  <p className="text-[0.84rem] font-semibold text-ink">
                    Seu plano: {rotuloPlano(plan)} · O{" "}
                    {rotuloPlano(planoQueLibera("recados"))} desbloqueia mural de recados
                    e galeria
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-texto-suave">
                    O upgrade é da sua conta e vale para todos os seus eventos.
                  </p>
                </div>
                <Link
                  href="/painel/plano"
                  className="whitespace-nowrap rounded-[10px] border border-violeta/30 bg-white px-4 py-2 text-xs font-semibold text-violeta transition hover:bg-white/70"
                >
                  Ver planos
                </Link>
              </div>
            ) : null}

            <div className="grid gap-3.5 sm:grid-cols-2">
              {RECURSOS_SITE.map((d) => {
                const travado = !liberado(d.key);
                const on = toggles[d.key];
                const icone: Record<RecursoSite, string> = {
                  rsvp: "bi-check2-circle",
                  presentes: "bi-gift",
                  contador: "bi-clock-history",
                  programacao: "bi-calendar4-event",
                  recados: "bi-chat-heart",
                  galeria: "bi-images",
                };
                if (travado) {
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setLockOpen(d.key)}
                      className="rounded-2xl border border-black/5 bg-white p-4.5 text-left shadow-sm transition hover:border-violeta/25"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-nevoa text-texto-suave">
                          <i className={`bi ${icone[d.key]} text-base`} aria-hidden />
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violeta/8 px-2.5 py-1 text-[10.5px] font-bold text-violeta">
                          <i className="bi bi-lock" aria-hidden />
                          {d.gate ? rotuloPlano(planoQueLibera(d.gate)) : ""}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-ink">{d.titulo}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-texto-suave">
                        {d.descricao}
                      </p>
                    </button>
                  );
                }
                return (
                  <div
                    key={d.key}
                    className="rounded-2xl border border-black/5 bg-white p-4.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <span
                        className={`grid size-[38px] shrink-0 place-items-center rounded-[11px] ${
                          on ? "bg-teal/10 text-teal" : "bg-nevoa text-texto-suave"
                        }`}
                      >
                        <i className={`bi ${icone[d.key]} text-base`} aria-hidden />
                      </span>
                      <Toggle
                        on={on}
                        label={`${d.titulo}: ${on ? "ligado" : "desligado"}`}
                        onChange={() =>
                          setToggles((t) => ({ ...t, [d.key]: !t[d.key] }))
                        }
                      />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink">{d.titulo}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-texto-suave">
                      {d.descricao}
                    </p>
                    {d.temConfig && on ? (
                      <button
                        type="button"
                        onClick={() => setSecao("presentes")}
                        className="mt-3 text-xs font-semibold text-violeta hover:underline"
                      >
                        Configurar <i className="bi bi-arrow-right" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="mx-1 text-[11.5px] text-texto-suave">
              Desligou um recurso? Ele some do site na hora — é só olhar ao lado.
            </p>
          </div>

          {/* ── Configuração da lista de presentes (abre pelo card "Configurar") ── */}
          <div hidden={secao !== "presentes"}>
            <CardSecao>
              <button
                type="button"
                onClick={() => setSecao("recursos")}
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-texto-suave transition hover:text-ink"
              >
                <i className="bi bi-chevron-left" aria-hidden /> Recursos do site
              </button>
              <CardHead
                title="Lista de presentes"
                desc="A chave Pix de quem recebe e os presentes que aparecem no site."
                acao={<SugerirBtn onClick={sugerirPresentes} temTipo={temTipo} />}
              />
              <div className="flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Nome de quem recebe"
                    htmlFor={`${uid}-pixNome`}
                    optional
                    error={fieldErr?.pixNome}
                  >
                    <input
                      id={`${uid}-pixNome`}
                      name="pixNome"
                      type="text"
                      defaultValue={initial?.pixNome}
                      className={inputClass}
                      placeholder="Ex.: Maria Clara"
                    />
                  </Field>
                  <Field
                    label="Chave Pix"
                    htmlFor={`${uid}-pixChave`}
                    optional
                    help="E-mail, telefone ou chave aleatória."
                    error={fieldErr?.pixChave}
                  >
                    <input
                      id={`${uid}-pixChave`}
                      name="pixChave"
                      type="text"
                      defaultValue={initial?.pixChave}
                      className={inputClass}
                      placeholder="chave@exemplo.com"
                    />
                  </Field>
                </div>

                <div>
                  <p className="mb-2 text-[0.8rem] font-semibold text-ink/80">Presentes</p>
                  <div className="flex flex-col gap-2.5">
                    {presentes.map((row, i) => (
                      <div
                        key={row._id}
                        className="rounded-[13px] border border-black/10 bg-white p-3"
                      >
                        <div className="flex gap-2">
                          <input
                            name="gift_titulo"
                            type="text"
                            value={row.titulo}
                            onChange={(e) => setPresenteRow(row._id, "titulo", e.target.value)}
                            className={`${inputClass} min-w-0 flex-1`}
                            placeholder="Título (ex.: Cota da festa)"
                            aria-label={`Título do presente ${i + 1}`}
                          />
                          <input
                            name="gift_valor"
                            type="text"
                            inputMode="decimal"
                            value={row.valor}
                            onChange={(e) => setPresenteRow(row._id, "valor", e.target.value)}
                            className={`${inputClass} w-24 shrink-0 px-2.5`}
                            placeholder="150,00"
                            aria-label={`Valor do presente ${i + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPresentes((rows) =>
                                rows.length > 1 ? rows.filter((r) => r._id !== row._id) : rows,
                              )
                            }
                            className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-black/10 text-texto-suave transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                            disabled={presentes.length <= 1}
                            aria-label={`Remover presente ${i + 1}`}
                          >
                            <i className="bi bi-trash" aria-hidden />
                          </button>
                        </div>
                        <input
                          name="gift_descricao"
                          type="text"
                          value={row.descricao}
                          onChange={(e) => setPresenteRow(row._id, "descricao", e.target.value)}
                          className={`${inputClass} mt-2`}
                          placeholder="Descrição (opcional)"
                          aria-label={`Descrição do presente ${i + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPresentes((rows) => [...rows, makeRow({ titulo: "", descricao: "", valor: "" })])
                    }
                    className="mt-3 rounded-[10px] border border-dashed border-black/20 px-3.5 py-2 text-xs font-semibold text-texto-suave transition hover:border-violeta/40 hover:text-violeta"
                  >
                    + Adicionar presente
                  </button>
                </div>
              </div>
            </CardSecao>
          </div>
        </form>

        {/* Preview ao vivo */}
        <div className="lg:sticky lg:top-20">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11.5px] font-semibold text-texto-suave">
              <span
                className="size-[7px] rounded-full bg-teal shadow-[0_0_0_3px_rgba(14,165,166,0.16)]"
                aria-hidden
              />
              O que você vê é o que publica
            </div>
            <div className="flex rounded-full border border-black/10 bg-white p-[3px]">
              {(
                [
                  ["phone", "Celular"],
                  ["desktop", "Computador"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDevice(key)}
                  className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                    device === key ? "bg-ink text-white" : "text-texto-suave"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <PreviewSite
            host={host}
            device={device}
            type={type}
            tema={tema}
            fontes={fontes}
            title={title}
            mensagem={mensagem}
            presentesTexto={presentesTexto}
            date={date}
            time={time}
            fotoUrl={fotoUrl}
            programacao={programacao}
            ativos={ativos}
          />
        </div>
      </div>

      {galleryOpen ? (
        <ModalGaleriaTemplates
          tema={tema}
          fontes={fontes}
          nome={nomePreview}
          dataLabel={dataLabel}
          onClose={() => setGalleryOpen(false)}
        />
      ) : null}
      {lockOpen ? (
        <ModalRecursoBloqueado recurso={lockOpen} onClose={() => setLockOpen(null)} />
      ) : null}
    </main>
  );
}
