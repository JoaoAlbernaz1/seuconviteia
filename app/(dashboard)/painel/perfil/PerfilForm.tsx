"use client";

// Formulario de PERFIL do profissional: foto (avatar), nome, marca (white-label)
// e troca de senha opcional. Submete via `useActionState` -> `atualizarPerfil`.
import { useActionState, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { atualizarPerfil, type PerfilState } from "../../actions";

const INITIAL: PerfilState = {};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/20";

const submitClass =
  "mt-2 w-full rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export type PerfilInitial = {
  name: string;
  email: string;
  brandName: string;
  avatarUrl: string;
};

/** Iniciais do nome (até 2 letras) para o avatar sem foto. */
function iniciais(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
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

function AvatarUploader({
  nome,
  initialUrl,
}: {
  nome: string;
  initialUrl: string;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
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
    <div className="flex items-center gap-4">
      <input type="hidden" name="avatarUrl" value={url} />

      <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-lilas text-xl font-semibold text-violeta ring-1 ring-black/5">
        {url ? (
          <Image src={url} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          iniciais(nome)
        )}
      </span>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <label
            htmlFor={inputId}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-ink transition hover:border-violeta/40 ${
              enviando ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <i className="bi bi-camera" aria-hidden />
            {enviando ? "Enviando…" : url ? "Trocar foto" : "Adicionar foto"}
          </label>
          {url ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Remover
            </button>
          ) : null}
        </div>
        <input
          id={inputId}
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          disabled={enviando}
          className="sr-only"
        />
        <p className="text-xs text-texto-suave">Quadrada, ~400×400px. JPG, PNG ou WebP.</p>
        {erro ? <p className="text-xs text-red-700">{erro}</p> : null}
      </div>
    </div>
  );
}

export function PerfilForm({ initial }: { initial: PerfilInitial }) {
  const [state, formAction, pending] = useActionState(atualizarPerfil, INITIAL);
  const uid = useId();
  const [nome, setNome] = useState(initial.name);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Meu perfil
        </h1>
        <Link
          href="/painel"
          className="text-sm font-medium text-texto-suave hover:text-ink"
        >
          ← Voltar
        </Link>
      </div>

      <form action={formAction} className="mt-8 flex flex-col gap-6">
        {/* Foto */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <AvatarUploader nome={nome} initialUrl={initial.avatarUrl} />
        </section>

        {/* Dados */}
        <section className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-name`} className="text-sm font-medium text-ink">
              Nome
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
              placeholder="Seu nome ou do estúdio"
            />
            {state.fieldErrors?.name ? (
              <p className="text-xs text-red-700">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${uid}-brand`}
              className="text-sm font-medium text-ink"
            >
              Marca / estúdio{" "}
              <span className="font-normal text-texto-suave">(opcional)</span>
            </label>
            <input
              id={`${uid}-brand`}
              name="brandName"
              type="text"
              defaultValue={initial.brandName}
              className={inputClass}
              placeholder="Ex.: Ateliê Encanto"
            />
            <p className="text-xs text-texto-suave">
              Aparece como crédito no rodapé dos sites que você publica.
            </p>
            {state.fieldErrors?.brandName ? (
              <p className="text-xs text-red-700">{state.fieldErrors.brandName}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-email`} className="text-sm font-medium text-ink">
              E-mail
            </label>
            <input
              id={`${uid}-email`}
              type="email"
              value={initial.email}
              disabled
              className={`${inputClass} cursor-not-allowed bg-nevoa text-texto-suave`}
            />
            <p className="text-xs text-texto-suave">
              É o seu login — não é editável por aqui.
            </p>
          </div>
        </section>

        {/* Senha */}
        <section className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${uid}-senha`}
              className="text-sm font-medium text-ink"
            >
              Nova senha{" "}
              <span className="font-normal text-texto-suave">(opcional)</span>
            </label>
            <input
              id={`${uid}-senha`}
              name="novaSenha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className={inputClass}
              placeholder="Deixe em branco para manter a atual"
            />
            {state.fieldErrors?.novaSenha ? (
              <p className="text-xs text-red-700">{state.fieldErrors.novaSenha}</p>
            ) : null}
          </div>
        </section>

        {state.error ? (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          >
            <i className="bi bi-check-circle" aria-hidden /> Perfil salvo!
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={submitClass}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </button>
      </form>
    </main>
  );
}
