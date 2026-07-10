// Abstracao de storage de arquivos (fotos de evento: capa + album).
//
// O painel faz upload via `app/api/upload` -> `getStorageProvider().salvar(file, dir)`.
//
// Selecao por ambiente (seam p/ producao):
//   - `BLOB_READ_WRITE_TOKEN` setado -> Vercel Blob (TODO: implementar com
//     `@vercel/blob` `put()`); ainda nao construido nesta fase.
//   - sem token (dev/local)          -> disco local em `public/uploads/<dir>/...`.
//
// As funcoes de disco usam APIs de Node; a rota de upload roda no runtime Node.

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SalvarResult {
  /** URL publica do arquivo salvo (ex.: "/uploads/eventos/<id>/<rand>.jpg"). */
  url: string;
}

export interface StorageProvider {
  /**
   * Salva `file` sob o diretorio logico `dir` e devolve sua URL publica.
   * @param dir caminho relativo (ex.: "eventos/<professionalId>").
   */
  salvar(file: File, dir: string): Promise<SalvarResult>;
}

/** Content-types de imagem aceitos -> extensao canonica. */
const EXT_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const EXTS_VALIDAS = new Set(["jpg", "jpeg", "png", "webp"]);

/**
 * Deriva uma extensao de imagem segura a partir do content-type; cai para a
 * extensao do nome do arquivo e, por fim, para "jpg". PURO (testavel).
 */
export function extDeImagem(
  contentType?: string | null,
  fileName?: string | null,
): string {
  const porTipo = contentType ? EXT_POR_TIPO[contentType.toLowerCase()] : undefined;
  if (porTipo) return porTipo;

  const m = fileName?.toLowerCase().match(/\.([a-z0-9]{1,5})$/);
  const ext = m?.[1];
  if (ext && EXTS_VALIDAS.has(ext)) return ext === "jpeg" ? "jpg" : ext;

  return "jpg";
}

/**
 * Reduz `dir` a um caminho relativo seguro: so `[a-z0-9/_-]`, sem barras nas
 * pontas. Como removemos o ponto, "../" nao sobrevive (sem path traversal). PURO.
 */
export function dirSeguro(dir: string): string {
  return dir
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

/** Storage em disco local — grava em `public/uploads/` (dev). */
class LocalDiskStorage implements StorageProvider {
  async salvar(file: File, dir: string): Promise<SalvarResult> {
    const safe = dirSeguro(dir);
    const nome = `${randomUUID()}.${extDeImagem(file.type, file.name)}`;
    const destDir = path.join(process.cwd(), "public", "uploads", safe);

    await mkdir(destDir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(destDir, nome), bytes);

    const rel = safe ? `${safe}/${nome}` : nome;
    return { url: `/uploads/${rel}` };
  }
}

/**
 * Storage em produção — Vercel Blob. Selecionado quando `BLOB_READ_WRITE_TOKEN`
 * está presente (setado pela Vercel quando um Blob store é conectado ao projeto).
 * O disco da Vercel é efêmero, então em produção a foto PRECISA ir para cá.
 */
class VercelBlobStorage implements StorageProvider {
  async salvar(file: File, dir: string): Promise<SalvarResult> {
    const { put } = await import("@vercel/blob");
    const safe = dirSeguro(dir);
    const nome = `${randomUUID()}.${extDeImagem(file.type, file.name)}`;
    const caminho = safe ? `${safe}/${nome}` : nome;
    // `addRandomSuffix: false` — o nome já é um UUID, não precisa de sufixo extra.
    const { url } = await put(caminho, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });
    return { url };
  }
}

/** Escolhe o provider conforme o ambiente. */
export function getStorageProvider(): StorageProvider {
  if (process.env.BLOB_READ_WRITE_TOKEN) return new VercelBlobStorage();
  return new LocalDiskStorage();
}
