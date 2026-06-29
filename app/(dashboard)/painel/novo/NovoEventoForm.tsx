"use client";

// Fluxo de criacao de evento (client). Secoes: tipo -> modelo -> dados ->
// personalizacao -> revisao. Submete via `useActionState` -> server action
// `criarEvento` (que valida com Zod, gera o subdominio unico e publica).
import { useActionState, useState } from "react";
import Link from "next/link";
import { criarEvento, type NovoEventoState } from "../../actions";
import { eventPublicUrl, slugify } from "@/lib/tenant";

type TemplateOpt = {
  id: string;
  name: string;
  nicho: string;
  accent: string;
};

const TIPOS = [
  { value: "CASAMENTO", label: "Casamento" },
  { value: "QUINZE_ANOS", label: "15 anos" },
  { value: "SESSENTA_ANOS", label: "60 anos" },
  { value: "BODAS", label: "Bodas" },
  { value: "ANIVERSARIO", label: "Aniversario" },
] as const;

const INITIAL: NovoEventoState = {};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/20";

function SectionError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-red-700">{msg}</p>;
}

function StepHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid size-7 place-items-center rounded-full bg-lilas text-sm font-semibold text-violeta">
        {n}
      </span>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
    </div>
  );
}

export default function NovoEventoForm({
  templates,
  rootDomain,
}: {
  templates: TemplateOpt[];
  rootDomain: string;
}) {
  const [state, formAction, pending] = useActionState(criarEvento, INITIAL);

  const [type, setType] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [accent, setAccent] = useState<string>("#6D28D9");
  const [title, setTitle] = useState<string>("");

  const filtered = templates.filter((t) => t.nicho === type);

  function onTypeChange(value: string) {
    setType(value);
    const opts = templates.filter((t) => t.nicho === value);
    if (opts.length === 1) {
      setTemplateId(opts[0].id);
      setAccent(opts[0].accent);
    } else {
      setTemplateId("");
    }
  }

  function onTemplateChange(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) setAccent(t.accent);
  }

  const previewSlug = slugify(title) || "evento";
  const previewUrl = eventPublicUrl(previewSlug, rootDomain);
  const canSubmit = Boolean(type && templateId && title.trim());

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Criar evento
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
                  onChange={() => onTypeChange(t.value)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
          <SectionError msg={state.fieldErrors?.type} />
        </section>

        {/* 2 — Modelo */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead n={2} title="Modelo" />
          {!type ? (
            <p className="text-sm text-texto-suave">
              Escolha o tipo de evento para ver os modelos disponiveis.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-texto-suave">
              Nenhum modelo disponivel para esse tipo ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                    templateId === t.id
                      ? "border-violeta bg-lilas"
                      : "border-black/10 bg-white hover:border-violeta/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="templateId"
                    value={t.id}
                    checked={templateId === t.id}
                    onChange={() => onTemplateChange(t.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className="size-5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.accent }}
                  />
                  <span className="text-sm font-medium text-ink">{t.name}</span>
                </label>
              ))}
            </div>
          )}
          <SectionError msg={state.fieldErrors?.templateId} />
        </section>

        {/* 3 — Dados */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead n={3} title="Dados do evento" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium text-ink">
                Titulo
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Ex.: Casamento de Ana e Leo"
              />
              <SectionError msg={state.fieldErrors?.title} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="eventDate" className="text-sm font-medium text-ink">
                Data do evento
              </label>
              <input
                id="eventDate"
                name="eventDate"
                type="date"
                required
                className={inputClass}
              />
              <SectionError msg={state.fieldErrors?.eventDate} />
            </div>
          </div>
        </section>

        {/* 4 — Personalizacao */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <StepHead n={4} title="Personalizacao" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label
                  htmlFor="accent"
                  className="text-sm font-medium text-ink"
                >
                  Cor de destaque
                </label>
                <p className="text-xs text-texto-suave">
                  Acento principal do site.
                </p>
              </div>
              <input
                id="accent"
                name="accent"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-lg border border-black/10 bg-white"
              />
            </div>
            <SectionError msg={state.fieldErrors?.accent} />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="welcomeMessage"
                className="text-sm font-medium text-ink"
              >
                Mensagem de boas-vindas{" "}
                <span className="font-normal text-texto-suave">(opcional)</span>
              </label>
              <textarea
                id="welcomeMessage"
                name="welcomeMessage"
                rows={3}
                maxLength={500}
                className={inputClass}
                placeholder="Uma frase de convite para a capa do site."
              />
              <SectionError msg={state.fieldErrors?.welcomeMessage} />
            </div>
          </div>
        </section>

        {/* 5 — Revisao + publicar */}
        <section className="rounded-2xl border border-violeta/20 bg-lilas/40 p-5">
          <StepHead n={5} title="Revisao" />
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-texto-suave">Tipo</dt>
              <dd className="font-medium text-ink">
                {TIPOS.find((t) => t.value === type)?.label ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-texto-suave">Modelo</dt>
              <dd className="font-medium text-ink">
                {templates.find((t) => t.id === templateId)?.name ?? "—"}
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
            {pending ? "Publicando…" : "Publicar evento"}
          </button>
        </section>
      </form>
    </main>
  );
}
