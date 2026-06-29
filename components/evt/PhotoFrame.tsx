import Image from "next/image";
import { Flourish } from "@/components/evt/icons";

/**
 * PhotoFrame — moldura fina e clara ao redor de uma foto (next/image): filete
 * suave (line) + leve halo no hover. Sem `src`, mostra um empty-state elegante
 * (blush suave + filigrana) para a galeria parecer pronta antes das fotos reais.
 *
 * `ratio` controla o aspecto (Tailwind aspect-*). `priority` p/ acima da dobra.
 */
export function PhotoFrame({
  src,
  alt = "",
  ratio = "aspect-[4/5]",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
  className = "",
}: {
  src?: string;
  alt?: string;
  ratio?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <figure
      className={`group relative overflow-hidden rounded-[var(--radius-card)] ${ratio} ${className}`}
    >
      {/* Filete fino claro por cima da borda. */}
      <span
        className="pointer-events-none absolute inset-0 z-10 rounded-[var(--radius-card)] ring-1 ring-inset ring-[var(--line)]"
        aria-hidden
      />

      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        // Empty-state claro — blush muito suave + filigrana rosa.
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]">
          <Flourish className="h-5 w-28 text-evt-rosa" />
          <span className="font-evt-util text-[0.58rem] uppercase tracking-[0.28em] text-evt-ink-soft/80">
            Em breve
          </span>
        </div>
      )}
    </figure>
  );
}
