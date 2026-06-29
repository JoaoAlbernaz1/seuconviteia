// Icones inline (SVG, currentColor) usados pela HOME festa portada.
// Copia fiel do festa-15-maria-clara (components/icons.tsx) — so o que a home usa.

type IconProps = { className?: string };

export function ArrowRight({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Filigrana simetrica (laurel/folhas) com losango central — acento editorial.
export function Flourish({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      {/* losango central */}
      <path d="M48 8.5 51.5 12 48 15.5 44.5 12Z" />
      {/* hastes que partem do centro para os lados */}
      <path d="M44.5 12H14M81.5 12H51.5" />
      {/* folhas a esquerda */}
      <path d="M38 12c-3-.2-5.4-1.4-6.8-3.6M32 12c-2.6-.4-4.6-1.7-5.8-3.8M26 12c-2.4-.5-4.2-1.8-5.2-3.9" />
      <path d="M38 12c-3 .2-5.4 1.4-6.8 3.6M32 12c-2.6.4-4.6 1.7-5.8 3.8M26 12c-2.4.5-4.2 1.8-5.2 3.9" />
      {/* folhas a direita (espelhadas) */}
      <path d="M58 12c3-.2 5.4-1.4 6.8-3.6M64 12c2.6-.4 4.6-1.7 5.8-3.8M70 12c2.4-.5 4.2-1.8 5.2-3.9" />
      <path d="M58 12c3 .2 5.4 1.4 6.8 3.6M64 12c2.6.4 4.6 1.7 5.8 3.8M70 12c2.4.5 4.2 1.8 5.2 3.9" />
      {/* pontas com pequeno bulbo */}
      <circle cx="14" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="82" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
