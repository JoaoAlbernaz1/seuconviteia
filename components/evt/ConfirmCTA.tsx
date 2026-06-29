import Link from "next/link";
import { ArrowRight } from "@/components/evt/icons";

/**
 * ConfirmCTA — o botao "Confirmar presenca" como CTA hero: gradiente (framboesa
 * do tema), brilho que respira (`.cta-confirmar` no globals), brilho deslizante
 * (sheen) + lift no hover, e setinha que avanca. A moldura (filete + linha) fica
 * na pagina que o usa, pra nao parecer "do nada".
 */
export function ConfirmCTA({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/confirmar"
      className={`cta-confirmar group relative inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full px-10 py-4 font-evt-util text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white ${className}`}
    >
      <span className="relative z-10">Confirmar presença</span>
      <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
      {/* sheen — brilho que desliza no hover (clipado no formato da pilula) */}
      <span className="cta-shine pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-full" aria-hidden />
    </Link>
  );
}
