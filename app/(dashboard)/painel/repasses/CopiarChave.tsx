"use client";

// A chave Pix do repasse, pronta para colar no app do banco.
//
// Campo (e não parágrafo) porque chave Pix aleatória tem 32 caracteres e o
// operador precisa conseguir selecionar tudo com um toque quando o clipboard do
// navegador não deixa copiar. Um clique seleciona; o botão copia.
import { useState } from "react";

export function CopiarChave({ chave }: { chave: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem clipboard: o campo continua selecionável na mão */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={chave}
        aria-label="Chave Pix do resgate"
        onFocus={(e) => e.currentTarget.select()}
        onClick={(e) => e.currentTarget.select()}
        className="min-h-[40px] w-full rounded-[10px] border border-scv-line bg-scv-field px-3 font-mono text-[12.5px] text-scv-ink outline-none focus:border-violeta focus:ring-2 focus:ring-violeta/15"
      />
      <button
        type="button"
        onClick={copiar}
        className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] border border-scv-line bg-scv-card px-3 text-[12.5px] font-semibold text-scv-ink transition-colors hover:bg-scv-field"
      >
        <i className={`bi ${copiado ? "bi-check2" : "bi-clipboard"}`} aria-hidden />
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
