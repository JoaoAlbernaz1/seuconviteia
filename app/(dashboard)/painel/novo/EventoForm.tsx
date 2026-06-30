"use client";

// Formulario RICO de criacao/edicao de evento (client). Preenche tudo que a
// template "festa" usa: tipo, PALETA (visual), dados+horario, local, programacao,
// presentes (Pix + lista) e foto de capa. Submete via `useActionState` para a
// server action recebida em `action` (que valida com Zod e persiste).
//
// REUSABILIDADE: e apresentacional e parametrizado por `action` + `initial` +
// `mode`, entao a Fatia 3b (editor) reusa o mesmo componente passando a action de
// edicao e os valores atuais. Nada aqui assume "create".
import { useActionState, useId, useState } from "react";
import Link from "next/link";
import type { NovoEventoState } from "../../actions";
import { eventPublicUrl, slugify } from "@/lib/tenant";

/** Uma paleta para o seletor visual (montada no servidor a partir de TEMAS). */
export type PaletaOpt = {
  key: string;
  label: string;
  /** ~4 cores da paleta, da mais forte para a mais clara/escura (swatch). */
  dots: string[];
};

/** Valores iniciais (modo "edit" preenche; "create" deixa vazio). */
export type EventoFormInitial = {
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
}: {
  n: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-lilas text-sm font-semibold text-violeta">
        {n}
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {hint ? <p className="text-xs text-texto-suave">{hint}</p> : null}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
  error,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}{" "}
        {optional ? (
          <span className="font-normal text-texto-suave">(opcional)</span>
        ) : null}
      </label>
      {children}
      <SectionError msg={error} />
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

  const previewSlug = slugify(title) || "evento";
  const previewUrl = eventPublicUrl(previewSlug, rootDomain);
  const canSubmit = Boolean(type && tema && title.trim());

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
                  onChange={() => setType(t.value)}
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
                placeholder="Ex.: Casamento de Ana e Leo"
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
              error={state.fieldErrors?.mensagem}
            >
              <textarea
                id={`${uid}-mensagem`}
                name="mensagem"
                rows={3}
                maxLength={2000}
                defaultValue={initial?.mensagem}
                className={inputClass}
                placeholder="Uma frase de convite para a capa do site."
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
            title="Programacao"
            hint="Os horarios da festa, em ordem. Opcional."
          />
          <div className="flex flex-col gap-2.5">
            {programacao.map((row, i) => (
              <div key={row._id} className="flex items-center gap-2">
                <input
                  name="programacao_hora"
                  type="text"
                  defaultValue={row.hora}
                  className={`${inputClass} w-28 shrink-0`}
                  placeholder="20h30"
                  aria-label={`Horario do item ${i + 1}`}
                />
                <input
                  name="programacao_titulo"
                  type="text"
                  defaultValue={row.titulo}
                  className={inputClass}
                  placeholder="Recepcao"
                  aria-label={`Descricao do item ${i + 1}`}
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
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-black/10 text-texto-suave transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                  disabled={programacao.length <= 1}
                  aria-label={`Remover item ${i + 1}`}
                >
                  ×
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
            className="mt-3 text-sm font-medium text-violeta hover:underline"
          >
            + Adicionar horario
          </button>
        </section>

        {/* 6 — Presentes */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead
            n={6}
            title="Presentes"
            hint="Chave Pix do recebedor e uma lista de sugestoes. Opcional."
          />
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

          <p className="mb-2 mt-5 text-sm font-medium text-ink">
            Lista de presentes
          </p>
          <div className="flex flex-col gap-3">
            {presentes.map((row, i) => (
              <div
                key={row._id}
                className="rounded-xl border border-black/10 bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    name="gift_titulo"
                    type="text"
                    defaultValue={row.titulo}
                    className={inputClass}
                    placeholder="Titulo do presente (ex.: Cota da festa)"
                    aria-label={`Titulo do presente ${i + 1}`}
                  />
                  <input
                    name="gift_valor"
                    type="text"
                    inputMode="decimal"
                    defaultValue={row.valor}
                    className={`${inputClass} w-28 shrink-0`}
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
                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-black/10 text-texto-suave transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                    disabled={presentes.length <= 1}
                    aria-label={`Remover presente ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
                <input
                  name="gift_descricao"
                  type="text"
                  defaultValue={row.descricao}
                  className={`${inputClass} mt-2`}
                  placeholder="Descricao (opcional)"
                  aria-label={`Descricao do presente ${i + 1}`}
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
            className="mt-3 text-sm font-medium text-violeta hover:underline"
          >
            + Adicionar presente
          </button>
        </section>

        {/* 7 — Foto de capa */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead n={7} title="Foto de capa" />
          <Field
            label="URL da foto de capa"
            htmlFor={`${uid}-fotoUrl`}
            optional
            error={state.fieldErrors?.fotoUrl}
          >
            <input
              id={`${uid}-fotoUrl`}
              name="fotoUrl"
              type="text"
              defaultValue={initial?.fotoUrl}
              className={inputClass}
              placeholder="https://... ou /exemplo/foto.jpg"
            />
          </Field>
          <p className="mt-2 text-xs text-texto-suave">
            Upload de fotos chega em breve.
          </p>
        </section>

        {/* 8 — Revisao + publicar */}
        <section className="rounded-2xl border border-violeta/20 bg-lilas/40 p-5">
          <StepHead n={8} title="Revisao" />
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
              <dt className="text-texto-suave">Endereco (aprox.)</dt>
              <dd className="break-all text-right font-medium text-violeta">
                {title.trim() ? previewUrl : "—"}
              </dd>
            </div>
          </dl>

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
            className="mt-5 w-full rounded-lg bg-violeta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violeta/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? isEdit
                ? "Salvando…"
                : "Publicando…"
              : isEdit
                ? "Salvar alteracoes"
                : "Publicar evento"}
          </button>
        </section>
      </form>
    </main>
  );
}
