"use client";

// Upload de fotos do painel DARK — porta a mecanica ja provada do editor
// antigo (POST /api/upload autenticado, valida imagem <= 6MB) com o visual
// dos tokens scv. Cada tela compoe o layout; aqui ficam as pecas.
import { useId, useRef, useState } from "react";
import Image from "next/image";

export async function enviarUpload(file: File): Promise<string> {
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

/** Input de arquivo escondido + label estilizada. */
export function EscolherFoto({
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

/** Miniatura de foto com remover (usada no álbum). */
export function FotoComRemover({
  url,
  alt,
  onRemove,
}: {
  url: string;
  alt: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative aspect-square">
      <Image
        src={url}
        alt={alt}
        fill
        unoptimized
        className="rounded-xl object-cover ring-1 ring-white/10"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-scv-card text-xs text-red-400 shadow ring-1 ring-scv-line hover:text-red-300"
        aria-label={`Remover ${alt}`}
      >
        <i className="bi bi-x" aria-hidden />
      </button>
    </div>
  );
}

/** Hook com o estado de envio compartilhado pelas telas de foto. */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | undefined>();

  async function enviarUma(file: File, aplicar: (url: string) => void) {
    setErro(undefined);
    setEnviando(true);
    try {
      aplicar(await enviarUpload(file));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviarVarias(files: File[], aplicar: (url: string) => void) {
    setErro(undefined);
    setEnviando(true);
    try {
      for (const file of files) aplicar(await enviarUpload(file));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviando(false);
    }
  }

  return { enviando, erro, enviarUma, enviarVarias };
}
