"use client";

// Perfil do profissional (mockup DARK): avatar, nome, assinatura nos sites
// (brandName), e-mail (login, não editável) e troca de senha opcional.
// Submete via `useActionState` -> `atualizarPerfil` (action existente).
import { useActionState, useId, useState } from "react";
import Image from "next/image";
import { atualizarPerfil, type PerfilState } from "../../actions";
import { EscolherFoto, useEnvio } from "../_ui/Uploads";
import {
  BTN_CARD,
  BTN_PRIMARIO,
  CARD,
  COLUNA_ESTREITA,
  INPUT,
  LABEL,
  SUB,
  TITULO,
} from "../_ui/estilos";

const INITIAL: PerfilState = {};

export type PerfilInitial = {
  name: string;
  email: string;
  brandName: string;
  avatarUrl: string;
};

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

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function PerfilForm({ initial }: { initial: PerfilInitial }) {
  const [state, formAction, pending] = useActionState(atualizarPerfil, INITIAL);
  const uid = useId();
  const [nome, setNome] = useState(initial.name);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const { enviando, erro, enviarUma } = useEnvio();

  return (
    <div className={`${COLUNA_ESTREITA} scv-fade py-11 pb-20`}>
      <h1 className={`${TITULO} text-[30px]`}>Meu perfil</h1>
      <p className={`mt-2 ${SUB}`}>Como você aparece nos sites que cria.</p>

      <form action={formAction} className={`${CARD} mt-6 flex flex-col gap-5 p-6 sm:p-7`}>
        <input type="hidden" name="avatarUrl" value={avatarUrl} />

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full text-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg,#0EA5A6,#6D28D9)" }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="64px" unoptimized className="object-cover" />
            ) : (
              iniciais(nome)
            )}
          </span>
          <div className="flex items-center gap-2.5">
            <EscolherFoto
              enviando={enviando}
              onFile={(files) => enviarUma(files[0], setAvatarUrl)}
              className={BTN_CARD}
            >
              {enviando ? "Enviando…" : avatarUrl ? "Trocar foto" : "Adicionar foto"}
            </EscolherFoto>
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="text-[12.5px] font-semibold text-red-600 hover:underline"
              >
                Remover
              </button>
            ) : null}
          </div>
        </div>
        {erro ? <p className="text-xs text-red-600">{erro}</p> : null}

        <label className="block" htmlFor={`${uid}-name`}>
          <span className={LABEL}>Seu nome</span>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={INPUT}
            placeholder="Seu nome ou do estúdio"
          />
          <Erro msg={state.fieldErrors?.name} />
        </label>

        <label className="block" htmlFor={`${uid}-brand`}>
          <span className={LABEL}>
            Assinatura nos sites{" "}
            <span className="font-normal text-scv-faint">(opcional)</span>
          </span>
          <input
            id={`${uid}-brand`}
            name="brandName"
            type="text"
            defaultValue={initial.brandName}
            className={INPUT}
            placeholder="Ex.: Ateliê Encanto"
          />
          <span className="mt-1.5 block text-xs text-scv-faint">
            Aparece no rodapé dos seus sites no plano Premium (marca própria).
          </span>
          <Erro msg={state.fieldErrors?.brandName} />
        </label>

        <label className="block" htmlFor={`${uid}-email`}>
          <span className={LABEL}>E-mail</span>
          <input
            id={`${uid}-email`}
            type="email"
            value={initial.email}
            disabled
            className={`${INPUT} cursor-not-allowed opacity-60`}
          />
          <span className="mt-1.5 block text-xs text-scv-faint">
            É o seu login — não dá para trocar por aqui.
          </span>
        </label>

        <label className="block" htmlFor={`${uid}-senha`}>
          <span className={LABEL}>
            Nova senha <span className="font-normal text-scv-faint">(opcional)</span>
          </span>
          <input
            id={`${uid}-senha`}
            name="novaSenha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className={INPUT}
            placeholder="Deixe em branco para manter a atual"
          />
          <Erro msg={state.fieldErrors?.novaSenha} />
        </label>

        {state.error ? (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg bg-teal/10 px-3 py-2 text-sm text-scv-teal"
          >
            <i className="bi bi-check-circle" aria-hidden /> Perfil salvo!
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className={`${BTN_PRIMARIO} self-start px-7`}
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </div>
  );
}
