"use client";

// Formulario RICO de criacao/edicao de evento (client). Preenche tudo que a
// template "festa" usa: tipo, PALETA (visual), dados+horario, local, programacao,
// presentes (Pix + lista) e foto de capa. Submete via `useActionState` para a
// server action recebida em `action` (que valida com Zod e persiste).
//
// REUSABILIDADE: e apresentacional e parametrizado por `action` + `initial` +
// `mode`, entao a Fatia 3b (editor) reusa o mesmo componente passando a action de
// edicao e os valores atuais. Nada aqui assume "create".
import { useActionState, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { NovoEventoState } from "../../actions";
import { eventPublicUrl, slugify } from "@/lib/tenant";
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

/** Uma paleta para o seletor visual (montada no servidor a partir de TEMAS). */
export type PaletaOpt = {
  key: string;
  label: string;
  /** ~4 cores da paleta, da mais forte para a mais clara/escura (swatch). */
  dots: string[];
};

/** Valores iniciais (modo "edit" preenche; "create" deixa vazio). */
export type EventoFormInitial = {
  /** Id do evento (modo "edit") — viaja como hidden field e e revalidado no servidor. */
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
  /** Foto ao lado da lista de presentes (modo "edit"). */
  presentesFotoUrl?: string;
  /** Album (galeria) — URLs ja salvas (modo "edit"). */
  fotos?: string[];
};

type FormAction = (
  prev: NovoEventoState,
  formData: FormData,
) => Promise<NovoEventoState>;

const TIPOS = [
  { value: "CASAMENTO", label: "Casamento" },
  { value: "QUINZE_ANOS", label: "15 anos" },
  { value: "SESSENTA_ANOS", label: "60 anos" },
  { value: "BODAS", label: "Bodas" },
  { value: "ANIVERSARIO", label: "Aniversario" },
] as const;

const INITIAL_STATE: NovoEventoState = {};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/20";

/** Linha de programacao/presente no estado local (com id estavel p/ a key). */
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

function StepHead({
  n,
  title,
  hint,
  info,
}: {
  n: number;
  title: string;
  /** Frase curta de contexto, abaixo do titulo. */
  hint?: string;
  /** Dica longa (dimensoes etc.) — vai para o "!" ao lado do titulo. */
  info?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-lilas text-sm font-semibold text-violeta">
        {n}
      </span>
      <div>
        <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold text-ink">
          {title}
          {info ? <InfoHint text={info} /> : null}
        </h2>
        {hint ? <p className="text-xs text-texto-suave">{hint}</p> : null}
      </div>
    </div>
  );
}

/**
 * InfoHint — botaozinho "!" que revela uma dica (dimensoes, como escrever) num
 * balao ao clicar. Tira o texto de ajuda da frente, deixando o form mais limpo.
 */
function InfoHint({ text, rotulo = "Ver dica" }: { text: string; rotulo?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label={rotulo}
        aria-expanded={open}
        className="grid size-[1.15rem] place-items-center rounded-full border border-violeta/40 bg-lilas/50 text-[0.7rem] leading-none text-violeta transition hover:bg-lilas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violeta/30"
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
  /** Dica de preenchimento — vai para o "!" ao lado do rotulo (nao polui o form). */
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-ink">
        <span>
          {label}{" "}
          {optional ? (
            <span className="font-normal text-texto-suave">(opcional)</span>
          ) : null}
        </span>
        {hint ? <InfoHint text={hint} /> : null}
      </label>
      {children}
      <SectionError msg={error} />
    </div>
  );
}

/**
 * Botao "✨ Sugerir" — preenche um campo/lista com uma sugestao pronta do nicho.
 * Quando nao ha tipo de evento escolhido, fica desabilitado com a dica de
 * escolher o tipo antes (as sugestoes dependem do nicho).
 */
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
      title={temTipo ? undefined : "Escolha o tipo de evento primeiro"}
      className="inline-flex items-center gap-1.5 rounded-full border border-violeta/30 bg-lilas/50 px-2.5 py-1 text-xs font-semibold text-violeta transition hover:bg-lilas disabled:cursor-not-allowed disabled:opacity-50"
    >
      <i className="bi bi-stars" aria-hidden /> {children}
    </button>
  );
}

/** Envia uma imagem para `/api/upload` e devolve a URL publica salva. */
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
  if (!url) throw new Error("Resposta invalida do upload.");
  return url;
}

/**
 * Foto de capa: input de arquivo -> upload -> preview + remover. A URL resultante
 * vai num hidden `name="fotoUrl"`. Falha de upload nao trava o form (a capa e
 * opcional; o site tem fallback sem foto).
 */
function FotoCapaUploader({
  initialUrl,
  name = "fotoUrl",
}: {
  initialUrl?: string;
  /** Nome do hidden field submetido (reusavel: capa, foto dos presentes...). */
  name?: string;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | undefined>();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(undefined);
    setEnviando(true);
    try {
      setUrl(await enviarUpload(file));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Valor submetido: a URL salva. */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="flex items-start gap-3">
          <Image
            src={url}
            alt="Previa da foto de capa"
            width={120}
            height={160}
            unoptimized
            className="h-40 w-30 rounded-lg object-cover ring-1 ring-black/10"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
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
          {enviando ? "Enviando…" : url ? "Trocar foto" : "Escolher foto"}
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
        <span className="text-xs text-texto-suave">JPG, PNG ou WebP (ate 6MB).</span>
      </div>

      <SectionError msg={erro} />
    </div>
  );
}

/**
 * Album (galeria): adiciona varias fotos (upload por arquivo) e mostra os
 * thumbnails com remover. Cada URL vira um hidden `name="fotos"` (repetido) —
 * a action faz `getAll("fotos")`.
 */
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
      // Sequencial: simples e mantem a ordem de selecao.
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
                alt={`Foto ${i + 1} do album`}
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

export default function EventoForm({
  paletas,
  rootDomain,
  action,
  mode = "create",
  initial,
}: {
  paletas: PaletaOpt[];
  rootDomain: string;
  action: FormAction;
  mode?: "create" | "edit";
  initial?: EventoFormInitial;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const uid = useId();

  const [type, setType] = useState(initial?.type ?? "");
  const [tema, setTema] = useState(initial?.tema ?? paletas[0]?.key ?? "rose");
  const [title, setTitle] = useState(initial?.title ?? "");

  // Mensagem de boas-vindas: controlada, com TEXTO PRONTO por nicho. Ao escolher
  // o tipo, pre-preenche com o padrao do nicho — ate o profissional editar.
  const [mensagem, setMensagem] = useState(initial?.mensagem ?? "");
  const [mensagemTocada, setMensagemTocada] = useState(Boolean(initial?.mensagem));

  function escolherTipo(value: string) {
    setType(value);
    if (!mensagemTocada) setMensagem(textosDoNicho(value).mensagemPadrao);
  }

  const [programacao, setProgramacao] = useState<Row<{ hora: string; titulo: string }>[]>(
    () =>
      (initial?.programacao ?? [{ hora: "", titulo: "" }]).map((p) =>
        makeRow(p),
      ),
  );
  const [presentes, setPresentes] = useState<
    Row<{ titulo: string; descricao: string; valor: string }>[]
  >(() =>
    (initial?.presentes ?? [{ titulo: "", descricao: "", valor: "" }]).map((p) =>
      makeRow({
        titulo: p.titulo ?? "",
        descricao: p.descricao ?? "",
        valor: p.valor ?? "",
      }),
    ),
  );

  // ✨ Sugestoes por nicho (preenchem o campo/lista; o profissional ajusta).
  function sugerirMensagem() {
    if (!type) return;
    setMensagem(textosDoNicho(type).mensagemPadrao);
    setMensagemTocada(true);
  }
  function sugerirProgramacao() {
    if (!type) return;
    setProgramacao(programacaoSugerida(type).map((i) => makeRow(i)));
  }
  function sugerirPresentes() {
    if (!type) return;
    setPresentes(
      presentesSugeridos(type).map((p) =>
        makeRow({ titulo: p.titulo, descricao: p.descricao, valor: p.valor }),
      ),
    );
  }

  // Edicao das linhas (CONTROLADAS: value + onChange no estado). Antes eram
  // `defaultValue` (nao-controladas), o que "bugava" ao sugerir/adicionar/remover.
  function setProgRow(id: string, campo: "hora" | "titulo", valor: string) {
    setProgramacao((rows) =>
      rows.map((r) => (r._id === id ? { ...r, [campo]: valor } : r)),
    );
  }
  function setPresenteRow(
    id: string,
    campo: "titulo" | "descricao" | "valor",
    valor: string,
  ) {
    setPresentes((rows) =>
      rows.map((r) => (r._id === id ? { ...r, [campo]: valor } : r)),
    );
  }

  const previewSlug = slugify(title) || "evento";
  const previewUrl = eventPublicUrl(previewSlug, rootDomain);
  const canSubmit = Boolean(type && tema && title.trim());
  const temTipo = Boolean(type);

  const isEdit = mode === "edit";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">
          {isEdit ? "Editar evento" : "Criar evento"}
        </h1>
        <Link
          href="/painel"
          className="text-sm font-medium text-texto-suave hover:text-ink"
        >
          ← Voltar
        </Link>
      </div>

      <form action={formAction} className="mt-8 flex flex-col gap-6">
        {/* Id do evento (modo edit) — revalidado no servidor; nunca confiado cru. */}
        {initial?.eventId ? (
          <input type="hidden" name="eventId" value={initial.eventId} />
        ) : null}

        {/* 1 — Tipo */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead n={1} title="Tipo de evento" />
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
          <SectionError msg={state.fieldErrors?.type} />
        </section>

        {/* 2 — Paleta (headline) */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead
            n={2}
            title="Paleta de cores"
            hint="Define o visual do site do evento. Voce pode trocar depois."
          />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {paletas.map((p) => {
              const selected = tema === p.key;
              return (
                <label
                  key={p.key}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    selected
                      ? "border-violeta ring-2 ring-violeta/25"
                      : "border-black/10 hover:border-violeta/40"
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
                        className="size-6 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                  <span className="mt-2.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      {p.label}
                    </span>
                    {selected ? (
                      <span className="text-xs font-semibold text-violeta">
                        ✓
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
          <SectionError msg={state.fieldErrors?.tema} />
        </section>

        {/* 3 — Dados */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead n={3} title="Dados do evento" />
          <div className="flex flex-col gap-4">
            <Field
              label="Titulo"
              htmlFor={`${uid}-title`}
              hint={DICA_TITULO}
              error={state.fieldErrors?.title}
            >
              <input
                id={`${uid}-title`}
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Ex.: Ana & Léo"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Data"
                htmlFor={`${uid}-date`}
                error={state.fieldErrors?.date}
              >
                <input
                  id={`${uid}-date`}
                  name="date"
                  type="date"
                  required
                  defaultValue={initial?.date}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Horario"
                htmlFor={`${uid}-time`}
                error={state.fieldErrors?.time}
              >
                <input
                  id={`${uid}-time`}
                  name="time"
                  type="time"
                  defaultValue={initial?.time ?? "20:00"}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Mensagem de boas-vindas"
              htmlFor={`${uid}-mensagem`}
              optional
              hint={DICA_MENSAGEM}
              error={state.fieldErrors?.mensagem}
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
                placeholder="Escolha o tipo de evento e toque em ✨ Sugerir texto — você pode editar depois."
              />
            </Field>
          </div>
        </section>

        {/* 4 — Local */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead
            n={4}
            title="Local"
            hint="O mapa e o link do Google Maps sao gerados a partir do endereco."
          />
          <div className="flex flex-col gap-4">
            <Field
              label="Local / espaco"
              htmlFor={`${uid}-local`}
              optional
              error={state.fieldErrors?.local}
            >
              <input
                id={`${uid}-local`}
                name="local"
                type="text"
                defaultValue={initial?.local}
                className={inputClass}
                placeholder="Ex.: Espaco Esplendor"
              />
            </Field>
            <Field
              label="Endereco"
              htmlFor={`${uid}-endereco`}
              optional
              error={state.fieldErrors?.endereco}
            >
              <input
                id={`${uid}-endereco`}
                name="endereco"
                type="text"
                defaultValue={initial?.endereco}
                className={inputClass}
                placeholder="Ex.: Park Way, Brasilia - DF"
              />
            </Field>
            <Field
              label="Traje"
              htmlFor={`${uid}-traje`}
              optional
              error={state.fieldErrors?.traje}
            >
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
        </section>

        {/* 5 — Programacao */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead
            n={5}
            title="Programação"
            hint="Os horários da festa, em ordem. Opcional — toque em ✨ para começar com a programação típica do tipo escolhido."
          />
          <div className="mb-3">
            <SugerirBtn onClick={sugerirProgramacao} temTipo={temTipo}>
              Sugerir programação
            </SugerirBtn>
          </div>
          {/* GRID (colunas fixas: hora | titulo | remover) — nao vaza pra fora do
              bloco como o flex com w-full vazava. `min-w-0` deixa as colunas
              encolherem dentro do card em telas estreitas. */}
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
                      rows.length > 1
                        ? rows.filter((r) => r._id !== row._id)
                        : rows,
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
            onClick={() =>
              setProgramacao((rows) => [
                ...rows,
                makeRow({ hora: "", titulo: "" }),
              ])
            }
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violeta hover:underline"
          >
            <i className="bi bi-plus-lg" aria-hidden /> Adicionar horário
          </button>
        </section>

        {/* 6 — Presentes */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead
            n={6}
            title="Presentes"
            hint="Foto ao lado da lista, chave Pix do recebedor e uma lista de sugestões. Tudo opcional."
          />

          {/* Foto que aparece ao lado da lista (como na festa da Maria). */}
          <div className="mb-5">
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <span>Foto da lista de presentes</span>
              <InfoHint text={DICA_FOTO_PRESENTES} />
            </p>
            <p className="-mt-0.5 mb-2 text-xs leading-snug text-texto-suave">
              Se vazia, usa a foto de capa.
            </p>
            <FotoCapaUploader
              name="presentesFotoUrl"
              initialUrl={initial?.presentesFotoUrl}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nome do recebedor (Pix)"
              htmlFor={`${uid}-pixNome`}
              optional
              error={state.fieldErrors?.pixNome}
            >
              <input
                id={`${uid}-pixNome`}
                name="pixNome"
                type="text"
                defaultValue={initial?.pixNome}
                className={inputClass}
                placeholder="Ex.: Ana e Leo"
              />
            </Field>
            <Field
              label="Chave Pix"
              htmlFor={`${uid}-pixChave`}
              optional
              error={state.fieldErrors?.pixChave}
            >
              <input
                id={`${uid}-pixChave`}
                name="pixChave"
                type="text"
                defaultValue={initial?.pixChave}
                className={inputClass}
                placeholder="email, telefone ou chave aleatoria"
              />
            </Field>
          </div>

          <div className="mb-2 mt-5 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink">Lista de presentes</p>
            <SugerirBtn onClick={sugerirPresentes} temTipo={temTipo}>
              Sugerir presentes
            </SugerirBtn>
          </div>
          <div className="flex flex-col gap-3">
            {presentes.map((row, i) => (
              <div
                key={row._id}
                className="rounded-xl border border-black/10 bg-white p-3"
              >
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
                        rows.length > 1
                          ? rows.filter((r) => r._id !== row._id)
                          : rows,
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
              setPresentes((rows) => [
                ...rows,
                makeRow({ titulo: "", descricao: "", valor: "" }),
              ])
            }
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violeta hover:underline"
          >
            <i className="bi bi-plus-lg" aria-hidden /> Adicionar presente
          </button>
        </section>

        {/* 7 — Foto de capa */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead
            n={7}
            title="Foto de capa"
            hint="A imagem principal do site (capa). Opcional — há um fallback sem foto."
            info={DICA_FOTO_CAPA}
          />
          <FotoCapaUploader initialUrl={initial?.fotoUrl} />
          <SectionError msg={state.fieldErrors?.fotoUrl} />
        </section>

        {/* 8 — Album (galeria) — UPSELL */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-lilas text-sm font-semibold text-violeta">
              8
            </span>
            <div>
              <h2 className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold text-ink">
                Álbum (galeria)
                <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-teal">
                  Clássico+
                </span>
                <InfoHint text={DICA_FOTO_ALBUM} />
              </h2>
              <p className="text-xs text-texto-suave">
                Fotos do ensaio para o carrossel e a galeria. A galeria aparece
                no site a partir do plano Clássico — deixe tudo pronto aqui.
              </p>
            </div>
          </div>
          <AlbumUploader initialUrls={initial?.fotos} />
        </section>

        {/* 9 — Revisao + criar (prévia) */}
        <section className="rounded-2xl border border-violeta/20 bg-lilas/40 p-5">
          <StepHead n={9} title="Revisão" />
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-texto-suave">Tipo</dt>
              <dd className="font-medium text-ink">
                {TIPOS.find((t) => t.value === type)?.label ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-texto-suave">Paleta</dt>
              <dd className="font-medium text-ink">
                {paletas.find((p) => p.key === tema)?.label ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-texto-suave">Link do site</dt>
              <dd className="break-all text-right font-medium text-violeta">
                {title.trim() ? previewUrl : "—"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 flex items-start gap-2 rounded-lg bg-lilas/50 px-3 py-2 text-xs text-texto-suave">
            <i className="bi bi-check-circle mt-0.5 text-violeta" aria-hidden />
            <span>
              Publicar está <strong>incluído no seu plano</strong> — sem cobrança
              por site. Os recursos da festa liberam conforme o seu plano.
            </span>
          </p>

          {state.error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="mt-5 w-full rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? isEdit
                ? "Salvando…"
                : "Publicando…"
              : isEdit
                ? "Salvar alterações"
                : "Publicar evento"}
          </button>
        </section>
      </form>
    </main>
  );
}
