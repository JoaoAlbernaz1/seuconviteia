"use client";

// Botão "Copiar link" reutilizável (celebração + acompanhar): copia a URL
// pública do evento para a área de transferência e vira "Copiado ✓" por 1,8s.
import { useState } from "react";

export function CopiarLink({
  url,
  className = "",
  idleLabel = "Copiar link",
}: {
  /** URL completa a copiar. */
  url: string;
  /** Classes do botão (o layout decide o visual). */
  className?: string;
  /** Rótulo em repouso. */
  idleLabel?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Clipboard indisponível (contexto inseguro/permissão) — ignora em silêncio.
    }
  }

  return (
    <button type="button" onClick={copiar} className={className}>
      {copiado ? "Copiado ✓" : idleLabel}
    </button>
  );
}
