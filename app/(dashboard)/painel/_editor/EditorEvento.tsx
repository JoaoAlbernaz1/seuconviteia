"use client";

// Editor de evento (referência: mockup do João) — 3 painéis: NAV LATERAL por
// seção (Conteúdo do site + Recursos do plano) · FORMULÁRIO da seção ativa ·
// PREVIEW AO VIVO (phone, tematizado pela paleta) que reflete as edições na hora.
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
import {
  programacaoSugerida,
  presentesSugeridos,
  DICA_FOTO_CAPA,
  DICA_FOTO_ALBUM,
  DICA_FOTO_PRESENTES,
  DICA_TITULO,
  DICA_MENSAGEM,
} from "@/lib/sugestoes";
import { acentoDoTema, gradienteDoTema } from "@/lib/temas";
import { recursosDoPlano, rotuloPlano, type Plan, type Recurso } from "@/lib/plans";
import { TIPO_LABEL } from "@/lib/painelUi";

export type PaletaOpt = { key: string; label: string; dots: string[] };

export type EventoFormInitial = {
  eventId?: string;
  type?: string;
  tema?: string;
  title?: string;
  date?: string;
  time?: string;
  mensagem?: string;
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
  { value: "CASAMENTO", label: "Casamento" },
  { value: "QUINZE_ANOS", label: "15 anos" },
  { value: "SESSENTA_ANOS", label: "60 anos" },
  { value: "BODAS", label: "Bodas" },
  { value: "ANIVERSARIO", label: "Aniversário" },
] as const;

const INITIAL_STATE: NovoEventoState = {};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/15";

const CONTEUDO = [
  { key: "info", label: "Informações", icon: "bi-info-circle" },
  { key: "capa", label: "Convite & capa", icon: "bi-image" },
  { key: "evento", label: "Página do evento", icon: "bi-geo-alt" },
  { key: "presentes", label: "Lista de presentes", icon: "bi-gift" },
] as const;

const RECURSOS_SEC: { key: string; label: string; icon: string; recurso: Recurso }[] =
  [
    { key: "rsvp", label: "Confirmar presença", icon: "bi-check2-circle", recurso: "rsvp" },
    { key: "recados", label: "Mural de recados", icon: "bi-chat-heart", recurso: "recados" },
    { key: "album", label: "Álbum de fotos", icon: "bi-images", recurso: "galeria" },
    { key: "dominio", label: "Domínio próprio", icon: "bi-globe2", recurso: "dominioProprio" },
  ];

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
  mensagem: "info",
  tema: "capa",
  fotoUrl: "capa",
  local: "evento",
  endereco: "evento",
  traje: "evento",
  pixNome: "presentes",
  pixChave: "presentes",
  presentesFotoUrl: "presentes",
};
/** Ordem de prioridade ao revelar a seção do primeiro campo com erro. */
const ORDEM_CAMPOS = [
  "title",
  "type",
  "date",
  "time",
  "mensagem",
  "tema",
  "fotoUrl",
  "local",
  "endereco",
  "traje",
  "pixNome",
  "pixChave",
  "presentesFotoUrl",
] as const;

/** Plano que libera cada recurso (para o rótulo de upgrade). */
function planoQueLibera(recurso: Recurso): Plan {
  if (recurso === "rsvp") return "BASICO";
  if (recurso === "recados" || recurso === "galeria") return "CLASSICO";
  return "PREMIUM";
}

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

function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label="Ver dica"
        aria-expanded={open}
        className="grid size-[1.15rem] place-items-center rounded-full border border-violeta/40 bg-lilas/50 text-[0.7rem] leading-none text-violeta transition hover:bg-lilas"
      >
        <i className="bi bi-info-lg" aria-hidden />
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-1.5 w-[min(17rem,72vw)] rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-normal leading-snug text-texto-suave shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)]"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  hint,
  children,
  error,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-ink">
        <span>
          {label}{" "}
          {optional ? <span className="font-normal text-texto-suave">(opcional)</span> : null}
        </span>
        {hint ? <InfoHint text={hint} /> : null}
      </label>
      {children}
      <SectionError msg={error} />
    </div>
  );
}

function SugerirBtn({
  onClick,
  temTipo,
  children,
}: {
  onClick: () => void;
  temTipo: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!temTipo}
      title={temTipo ? undefined : "Escolha o tipo de evento primeiro"}
      className="inline-flex items-center gap-1.5 rounded-full border border-violeta/30 bg-lilas/50 px-2.5 py-1 text-xs font-semibold text-violeta transition hover:bg-lilas disabled:cursor-not-allowed disabled:opacity-50"
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

/** Uploader de uma foto (controlado) — hidden `name`; chama onChange para o preview. */
function FotoUploader({
  name,
  value,
  onChange,
  legenda = "JPG, PNG ou WebP (até 6MB).",
}: {
  name: string;
  value: string;
  onChange: (url: string) => void;
  legenda?: string;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | undefined>();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(undefined);
    setEnviando(true);
    try {
      onChange(await enviarUpload(file));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className="flex items-start gap-3">
          <Image
            src={value}
            alt="Prévia"
            width={120}
            height={160}
            unoptimized
            className="h-36 w-28 rounded-lg object-cover ring-1 ring-black/10"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Remover
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center rounded-lg border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-ink transition hover:border-violeta/40 ${
            enviando ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {enviando ? "Enviando…" : value ? "Trocar foto" : "Escolher foto"}
        </label>
        <input
          id={inputId}
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          disabled={enviando}
          className="sr-only"
        />
        <span className="text-xs text-texto-suave">{legenda}</span>
      </div>
      <SectionError msg={erro} />
    </div>
  );
}

/** Álbum (galeria): várias fotos -> hidden `fotos` repetidos. */
function AlbumUploader({ initialUrls }: { initialUrls?: string[] }) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(() => initialUrls ?? []);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | undefined>();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setErro(undefined);
    setEnviando(true);
    try {
      for (const file of files) {
        const u = await enviarUpload(file);
        setUrls((prev) => [...prev, u]);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {urls.map((u, i) => (
        <input key={`${u}-${i}`} type="hidden" name="fotos" value={u} />
      ))}
      {urls.length ? (
        <ul className="flex flex-wrap gap-2.5">
          {urls.map((u, i) => (
            <li key={`${u}-${i}`} className="relative">
              <Image
                src={u}
                alt={`Foto ${i + 1}`}
                width={80}
                height={80}
                unoptimized
                className="size-20 rounded-lg object-cover ring-1 ring-black/10"
              />
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-white text-xs text-red-600 shadow ring-1 ring-black/10 hover:bg-red-50"
                aria-label={`Remover foto ${i + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-3">
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center rounded-lg border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-ink transition hover:border-violeta/40 ${
            enviando ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {enviando ? "Enviando…" : "Adicionar fotos"}
        </label>
        <input
          id={inputId}
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onPick}
          disabled={enviando}
          className="sr-only"
        />
        {urls.length ? (
          <span className="text-xs text-texto-suave">
            {urls.length} foto{urls.length > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
      <SectionError msg={erro} />
    </div>
  );
}

/** Cabeçalho de seção (título + descrição + badge opcional). */
function SecaoHead({
  title,
  desc,
  badge,
}: {
  title: string;
  desc: string;
  badge?: { label: string; tone: "incl" | "plan" };
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5">
        <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
        {badge ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold ${
              badge.tone === "incl"
                ? "bg-teal/10 text-teal"
                : "bg-lilas text-violeta"
            }`}
          >
            {badge.label}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-texto-suave">{desc}</p>
    </div>
  );
}

/** Banner de upgrade (recurso fora do plano atual). */
function UpgradeBanner({ recurso }: { recurso: Recurso }) {
  const plano = rotuloPlano(planoQueLibera(recurso));
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violeta/20 bg-lilas/60 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-violeta" aria-hidden>
          <i className="bi bi-gem" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Recurso do plano {plano}</p>
          <p className="text-xs text-texto-suave">
            Faça upgrade para liberar isto nos sites dos seus clientes.
          </p>
        </div>
      </div>
      <Link
        href="/painel/plano"
        className="rounded-lg bg-gradient-to-r from-violeta to-teal px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-105"
      >
        Fazer upgrade
      </Link>
    </div>
  );
}

// ── Preview ao vivo (phone tematizado) ──────────────────────────────────────
function PreviewFone({
  host,
  type,
  tema,
  title,
  mensagem,
  dataHora,
  fotoUrl,
  recursos,
}: {
  host: string;
  type: string;
  tema: string;
  title: string;
  mensagem: string;
  dataHora: string;
  fotoUrl: string;
  recursos: ReturnType<typeof recursosDoPlano>;
}) {
  const accent = acentoDoTema(tema);
  const nicho = (type && TIPO_LABEL[type as keyof typeof TIPO_LABEL]) || "Evento";
  const msg =
    mensagem.trim() ||
    (type ? textosDoNicho(type).mensagemPadrao : "") ||
    "Sua mensagem de boas-vindas aparece aqui.";
  const capaStyle: React.CSSProperties = fotoUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.42), rgba(15,23,42,0.55)), url(${fotoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundImage: gradienteDoTema(tema) };

  const navItems = [
    "Início",
    recursos.rsvp ? "Presença" : null,
    recursos.recados ? "Recados" : null,
    "Presentes",
    recursos.galeria ? "Álbum" : null,
  ].filter(Boolean) as string[];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-texto-suave">
        <span className="relative grid size-2 place-items-center">
          <span className="absolute inline-flex size-2 rounded-full bg-teal/40" />
          <span className="inline-flex size-1.5 rounded-full bg-teal" />
        </span>
        Preview ao vivo
      </div>
      <div className="rounded-[2rem] bg-ink p-3 shadow-[0_30px_60px_-22px_rgba(15,23,42,0.5)]">
        <div className="overflow-hidden rounded-[1.4rem] bg-white">
          <div className="bg-nevoa py-1.5 text-center text-[0.62rem] text-texto-suave">
            {host}
          </div>
          <div
            className="flex h-56 flex-col items-center justify-center px-5 text-center text-white"
            style={capaStyle}
          >
            <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/90">
              {nicho}
            </span>
            <span className="mt-1.5 font-display text-3xl font-semibold italic leading-tight drop-shadow-sm">
              {title.trim() || "Nome do evento"}
            </span>
            <span className="mt-3 rounded-full bg-white/20 px-3.5 py-1 text-[0.66rem] font-semibold tracking-wide backdrop-blur-sm">
              {dataHora}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 border-b border-black/5 px-3 py-2 text-[0.58rem] font-medium text-texto-suave">
            {navItems.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <div className="px-5 py-5 text-center">
            <p className="line-clamp-4 text-xs leading-relaxed text-texto-suave">{msg}</p>
            {recursos.rsvp ? (
              <span
                className="mt-4 inline-block rounded-full px-5 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                Confirmar presença
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-texto-suave">
        Tudo que você edita aparece aqui na hora.
      </p>
    </div>
  );
}

/** Data ISO + hora -> "12.10.2026 · 20h30" (placeholder se vazio). */
function formatarDataHora(date: string, time: string): string {
  if (!date) return "Data a definir";
  const [a, m, d] = date.split("-");
  const dataStr = d && m && a ? `${d}.${m}.${a}` : date;
  const horaStr = time ? ` · ${time.replace(":", "h")}` : "";
  return `${dataStr}${horaStr}`;
}

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

  const [secao, setSecao] = useState<string>("info");

  const [type, setType] = useState(initial?.type ?? "");
  const [tema, setTema] = useState(initial?.tema ?? paletas[0]?.key ?? "rose");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "20:00");
  const [mensagem, setMensagem] = useState(initial?.mensagem ?? "");
  const [mensagemTocada, setMensagemTocada] = useState(Boolean(initial?.mensagem));
  const [fotoUrl, setFotoUrl] = useState(initial?.fotoUrl ?? "");
  const [presentesFotoUrl, setPresentesFotoUrl] = useState(
    initial?.presentesFotoUrl ?? "",
  );

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
    setSecao("evento");
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

  const recursos = useMemo(() => recursosDoPlano(plan), [plan]);
  const temTipo = Boolean(type);
  // Mínimos para publicar: tipo, paleta, nome e data. Manter a data aqui evita um
  // submit que só bateria no servidor (o browser não valida campo em seção oculta).
  const canSubmit = Boolean(type && tema && title.trim() && date);
  const isEdit = mode === "edit";
  // Edit: o endereço é fixo (subdomínio existente). Create: deriva do nome.
  const slugHost = isEdit ? subdomain || "evento" : slugify(title) || "evento";
  const host = `${slugHost}.${rootDomain.replace(/:\d+$/, "")}`;
  const dataHora = formatarDataHora(date, time);
  const publicado = status === "PUBLISHED";

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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-7">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/painel/eventos"
            aria-label="Voltar para eventos"
            className="grid size-9 place-items-center rounded-lg border border-black/10 bg-white text-ink transition hover:bg-nevoa"
          >
            <i className="bi bi-chevron-left" aria-hidden />
          </Link>
          <div>
            <p className="text-xs font-medium text-texto-suave">
              {isEdit ? "Editando evento" : "Novo evento"}
            </p>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                {title.trim() || (isEdit ? "Evento" : "Novo evento")}
              </h1>
              {isEdit ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[0.66rem] font-semibold ${
                    publicado ? "bg-teal/10 text-teal" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {publicado ? "No ar" : "Rascunho"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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
          {isEdit && initial?.eventId ? (
            <form action={publicado ? despublicarEvento : publicarEvento}>
              <input type="hidden" name="eventId" value={initial.eventId} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:bg-nevoa"
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
          <button
            type="submit"
            form={formId}
            disabled={pending || !canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violeta to-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violeta/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="bi bi-check2" aria-hidden />
            {pending
              ? isEdit
                ? "Salvando…"
                : "Criando…"
              : isEdit
                ? "Salvar alterações"
                : "Criar site"}
          </button>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {/* ── 3 painéis ── */}
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)_22rem]">
        {/* Nav lateral */}
        <nav className="rounded-2xl border border-black/5 bg-white p-2.5 shadow-sm lg:sticky lg:top-20">
          <p className="px-2.5 pb-1.5 pt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-texto-suave">
            Conteúdo do site
          </p>
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {CONTEUDO.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSecao(s.key)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium transition lg:w-full ${
                  secao === s.key
                    ? "bg-ink text-white"
                    : "text-texto-suave hover:bg-black/5 hover:text-ink"
                }`}
              >
                <i className={`bi ${s.icon}`} aria-hidden />
                <span className="whitespace-nowrap lg:whitespace-normal">{s.label}</span>
              </button>
            ))}
          </div>

          <p className="px-2.5 pb-1.5 pt-3.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-texto-suave">
            Recursos do plano
          </p>
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {RECURSOS_SEC.map((s) => {
              const incl = recursos[s.recurso];
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSecao(s.key)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium transition lg:w-full ${
                    secao === s.key
                      ? "bg-ink text-white"
                      : "text-texto-suave hover:bg-black/5 hover:text-ink"
                  }`}
                >
                  <i className={`bi ${s.icon}`} aria-hidden />
                  <span className="flex-1 whitespace-nowrap lg:whitespace-normal">
                    {s.label}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[0.55rem] font-semibold ${
                      secao === s.key
                        ? "bg-white/15 text-white"
                        : incl
                          ? "bg-teal/10 text-teal"
                          : "bg-lilas text-violeta"
                    }`}
                  >
                    {incl ? "Incluído" : rotuloPlano(planoQueLibera(s.recurso))}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Painel da seção (UM form, todas as seções montadas) */}
        <form
          id={formId}
          action={formAction}
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-7"
        >
          {isEdit && initial?.eventId ? (
            <input type="hidden" name="eventId" value={initial.eventId} />
          ) : null}

          {/* ── Informações ── */}
          <div hidden={secao !== "info"}>
            <SecaoHead
              title="Informações do evento"
              desc="O nome, o tipo e a data aparecem no site em tempo real — veja ao lado."
            />
            <div className="flex flex-col gap-5">
              <Field label="Nome do evento" htmlFor={`${uid}-title`} hint={DICA_TITULO} error={fieldErr?.title}>
                {/* Sem `required` nativo: o campo pode estar numa seção oculta e
                    o browser bloquearia o submit sem foco possível (erro só no
                    console). A validação é via Zod no servidor + botão desabilitado. */}
                <input
                  id={`${uid}-title`}
                  name="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Ex.: Ana & Léo"
                />
              </Field>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">Tipo de evento</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TIPOS.map((t) => (
                    <label
                      key={t.value}
                      className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition ${
                        type === t.value
                          ? "border-violeta bg-lilas text-violeta"
                          : "border-black/10 bg-white text-ink hover:border-violeta/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={t.value}
                        checked={type === t.value}
                        onChange={() => escolherTipo(t.value)}
                        className="sr-only"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
                <SectionError msg={fieldErr?.type} />
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

              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Endereço do site</p>
                <div className="flex items-center rounded-lg border border-dashed border-black/15 bg-nevoa/60 px-3.5 py-2.5 text-sm">
                  <span className="truncate font-medium text-violeta">{host}</span>
                </div>
                <p className="mt-1 text-xs text-texto-suave">
                  Gerado do nome do evento.{" "}
                  {isEdit ? "O endereço de um site publicado não muda." : ""}
                </p>
              </div>

              <Field
                label="Mensagem de boas-vindas"
                htmlFor={`${uid}-mensagem`}
                optional
                hint={DICA_MENSAGEM}
                error={fieldErr?.mensagem}
              >
                <div className="mb-1.5 flex justify-end">
                  <SugerirBtn onClick={sugerirMensagem} temTipo={temTipo}>
                    Sugerir texto
                  </SugerirBtn>
                </div>
                <textarea
                  id={`${uid}-mensagem`}
                  name="mensagem"
                  rows={4}
                  maxLength={2000}
                  value={mensagem}
                  onChange={(e) => {
                    setMensagem(e.target.value);
                    setMensagemTocada(true);
                  }}
                  className={inputClass}
                  placeholder="Escolha o tipo e toque em ✨ Sugerir texto — você pode editar depois."
                />
              </Field>
            </div>
          </div>

          {/* ── Convite & capa ── */}
          <div hidden={secao !== "capa"}>
            <SecaoHead
              title="Convite & capa"
              desc="A paleta de cores e a foto de capa definem o visual do site."
            />
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-2 text-sm font-medium text-ink">Paleta de cores</p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {paletas.map((p) => {
                    const selected = tema === p.key;
                    return (
                      <label
                        key={p.key}
                        className={`cursor-pointer rounded-xl border p-3 transition ${
                          selected ? "border-violeta ring-2 ring-violeta/25" : "border-black/10 hover:border-violeta/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="tema"
                          value={p.key}
                          checked={selected}
                          onChange={() => setTema(p.key)}
                          className="sr-only"
                        />
                        <span className="flex items-center gap-1.5">
                          {p.dots.map((c, i) => (
                            <span
                              key={i}
                              aria-hidden
                              className="size-5 rounded-full ring-1 ring-black/10"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </span>
                        <span className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-ink">{p.label}</span>
                          {selected ? <span className="text-xs font-semibold text-violeta">✓</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <SectionError msg={fieldErr?.tema} />
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
                  Foto de capa <InfoHint text={DICA_FOTO_CAPA} />
                </p>
                <FotoUploader name="fotoUrl" value={fotoUrl} onChange={setFotoUrl} />
                <SectionError msg={fieldErr?.fotoUrl} />
              </div>
            </div>
          </div>

          {/* ── Página do evento ── */}
          <div hidden={secao !== "evento"}>
            <SecaoHead
              title="Página do evento"
              desc="Quando e onde acontece, traje e a programação da festa."
            />
            <div className="flex flex-col gap-5">
              <Field label="Local / espaço" htmlFor={`${uid}-local`} optional error={fieldErr?.local}>
                <input
                  id={`${uid}-local`}
                  name="local"
                  type="text"
                  defaultValue={initial?.local}
                  className={inputClass}
                  placeholder="Ex.: Espaço Esplendor"
                />
              </Field>
              <Field
                label="Endereço"
                htmlFor={`${uid}-endereco`}
                optional
                hint="O mapa e o link do Google Maps são gerados a partir do endereço."
                error={fieldErr?.endereco}
              >
                <input
                  id={`${uid}-endereco`}
                  name="endereco"
                  type="text"
                  defaultValue={initial?.endereco}
                  className={inputClass}
                  placeholder="Ex.: Park Way, Brasília - DF"
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

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">Programação</p>
                  <SugerirBtn onClick={sugerirProgramacao} temTipo={temTipo}>
                    Sugerir
                  </SugerirBtn>
                </div>
                <div className="flex flex-col gap-2.5">
                  {programacao.map((row, i) => (
                    <div
                      key={row._id}
                      className="grid grid-cols-[5rem_1fr_2.25rem] items-center gap-2 sm:grid-cols-[6rem_1fr_2.25rem]"
                    >
                      <input
                        name="programacao_hora"
                        type="text"
                        value={row.hora}
                        onChange={(e) => setProgRow(row._id, "hora", e.target.value)}
                        className={`${inputClass} min-w-0 px-2.5 text-center`}
                        placeholder="20h30"
                        aria-label={`Horário do item ${i + 1}`}
                      />
                      <input
                        name="programacao_titulo"
                        type="text"
                        value={row.titulo}
                        onChange={(e) => setProgRow(row._id, "titulo", e.target.value)}
                        className={`${inputClass} min-w-0`}
                        placeholder="Recepção"
                        aria-label={`Descrição do item ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProgramacao((rows) =>
                            rows.length > 1 ? rows.filter((r) => r._id !== row._id) : rows,
                          )
                        }
                        className="grid size-9 place-items-center rounded-lg border border-black/10 text-texto-suave transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                        disabled={programacao.length <= 1}
                        aria-label={`Remover item ${i + 1}`}
                      >
                        <i className="bi bi-trash" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setProgramacao((rows) => [...rows, makeRow({ hora: "", titulo: "" })])}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violeta hover:underline"
                >
                  <i className="bi bi-plus-lg" aria-hidden /> Adicionar horário
                </button>
              </div>
            </div>
          </div>

          {/* ── Lista de presentes ── */}
          <div hidden={secao !== "presentes"}>
            <SecaoHead
              title="Lista de presentes (Pix)"
              desc="Foto ao lado da lista, chave Pix do recebedor e os presentes."
            />
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink">
                  Foto da lista <InfoHint text={DICA_FOTO_PRESENTES} />
                </p>
                <p className="mb-2 text-xs text-texto-suave">Se vazia, usa a foto de capa.</p>
                <FotoUploader
                  name="presentesFotoUrl"
                  value={presentesFotoUrl}
                  onChange={setPresentesFotoUrl}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do recebedor (Pix)" htmlFor={`${uid}-pixNome`} optional error={fieldErr?.pixNome}>
                  <input
                    id={`${uid}-pixNome`}
                    name="pixNome"
                    type="text"
                    defaultValue={initial?.pixNome}
                    className={inputClass}
                    placeholder="Ex.: Ana e Léo"
                  />
                </Field>
                <Field label="Chave Pix" htmlFor={`${uid}-pixChave`} optional error={fieldErr?.pixChave}>
                  <input
                    id={`${uid}-pixChave`}
                    name="pixChave"
                    type="text"
                    defaultValue={initial?.pixChave}
                    className={inputClass}
                    placeholder="e-mail, telefone ou chave aleatória"
                  />
                </Field>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">Presentes</p>
                  <SugerirBtn onClick={sugerirPresentes} temTipo={temTipo}>
                    Sugerir
                  </SugerirBtn>
                </div>
                <div className="flex flex-col gap-3">
                  {presentes.map((row, i) => (
                    <div key={row._id} className="rounded-xl border border-black/10 bg-white p-3">
                      <div className="grid grid-cols-[1fr_5.5rem_2.25rem] items-center gap-2">
                        <input
                          name="gift_titulo"
                          type="text"
                          value={row.titulo}
                          onChange={(e) => setPresenteRow(row._id, "titulo", e.target.value)}
                          className={`${inputClass} min-w-0`}
                          placeholder="Título (ex.: Cota da festa)"
                          aria-label={`Título do presente ${i + 1}`}
                        />
                        <input
                          name="gift_valor"
                          type="text"
                          inputMode="decimal"
                          value={row.valor}
                          onChange={(e) => setPresenteRow(row._id, "valor", e.target.value)}
                          className={`${inputClass} min-w-0 px-2.5`}
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
                          className="grid size-9 place-items-center rounded-lg border border-black/10 text-texto-suave transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
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
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violeta hover:underline"
                >
                  <i className="bi bi-plus-lg" aria-hidden /> Adicionar presente
                </button>
              </div>
            </div>
          </div>

          {/* ── Confirmar presença (RSVP) ── */}
          <div hidden={secao !== "rsvp"}>
            <SecaoHead
              title="Confirmar presença"
              desc="Os convidados confirmam presença direto no site."
              badge={
                recursos.rsvp
                  ? { label: "Incluído no plano", tone: "incl" }
                  : { label: rotuloPlano(planoQueLibera("rsvp")), tone: "plan" }
              }
            />
            {!recursos.rsvp ? <UpgradeBanner recurso="rsvp" /> : null}
            <ul className="flex flex-col gap-2.5 text-sm text-texto-suave">
              {[
                ["bi-check2-circle", "Botão “Confirmar presença” no site"],
                ["bi-people", "Convidados podem informar acompanhantes"],
                ["bi-chat-heart", "Recado opcional ao confirmar"],
              ].map(([icon, txt]) => (
                <li key={txt} className="flex items-center gap-3 rounded-xl border border-black/5 bg-nevoa/40 px-4 py-3">
                  <i className={`bi ${icon} text-teal`} aria-hidden />
                  {txt}
                </li>
              ))}
            </ul>
            <Link
              href="/painel/convidados"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violeta hover:underline"
            >
              Ver confirmações <i className="bi bi-arrow-right" aria-hidden />
            </Link>
          </div>

          {/* ── Mural de recados ── */}
          <div hidden={secao !== "recados"}>
            <SecaoHead
              title="Mural de recados"
              desc="Os convidados deixam mensagens de carinho no site."
              badge={
                recursos.recados
                  ? { label: "Incluído no plano", tone: "incl" }
                  : { label: rotuloPlano(planoQueLibera("recados")), tone: "plan" }
              }
            />
            {!recursos.recados ? <UpgradeBanner recurso="recados" /> : null}
            <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-nevoa/40 px-4 py-3 text-sm text-texto-suave">
              <i className="bi bi-chat-heart text-teal" aria-hidden />
              {recursos.recados
                ? "O mural de recados aparece no site do evento."
                : "Disponível a partir do plano Clássico."}
            </div>
          </div>

          {/* ── Álbum de fotos ── */}
          <div hidden={secao !== "album"}>
            <SecaoHead
              title="Álbum de fotos"
              desc="Fotos do ensaio para o carrossel e a galeria do site."
              badge={
                recursos.galeria
                  ? { label: "Incluído no plano", tone: "incl" }
                  : { label: rotuloPlano(planoQueLibera("galeria")), tone: "plan" }
              }
            />
            {!recursos.galeria ? <UpgradeBanner recurso="galeria" /> : null}
            <p className="mb-3 flex items-center gap-1.5 text-sm text-texto-suave">
              Deixe as fotos prontas aqui. <InfoHint text={DICA_FOTO_ALBUM} />
            </p>
            <AlbumUploader initialUrls={initial?.fotos} />
          </div>

          {/* ── Domínio próprio ── */}
          <div hidden={secao !== "dominio"}>
            <SecaoHead
              title="Domínio próprio"
              desc="Use um domínio próprio no lugar do subdomínio automático."
              badge={
                recursos.dominioProprio
                  ? { label: "Incluído no plano", tone: "incl" }
                  : { label: rotuloPlano(planoQueLibera("dominioProprio")), tone: "plan" }
              }
            />
            {!recursos.dominioProprio ? <UpgradeBanner recurso="dominioProprio" /> : null}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink" htmlFor={`${uid}-dominio`}>
                Domínio
              </label>
              <input
                id={`${uid}-dominio`}
                type="text"
                disabled={!recursos.dominioProprio}
                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-nevoa/60`}
                placeholder="festadamaria.com.br"
              />
              <p className="text-xs text-texto-suave">
                Configuração assistida — a gente ajuda a apontar o domínio.
              </p>
            </div>
          </div>
        </form>

        {/* Preview ao vivo */}
        <div className="lg:sticky lg:top-20">
          <PreviewFone
            host={host}
            type={type}
            tema={tema}
            title={title}
            mensagem={mensagem}
            dataHora={dataHora}
            fotoUrl={fotoUrl}
            recursos={recursos}
          />
        </div>
      </div>
    </main>
  );
}
