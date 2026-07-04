// Primitivas EDITORIAIS do template Fashion Editorial (15 anos). SERVER-safe,
// presentacionais, escopadas a ESTE template (prefixo qfe-). NAO reusa
// Card/SectionHeading de components/evt nem _base/secoes — este template tem o
// SEU proprio corpo. Vocabulario visual: capa de revista de moda — CAPS display,
// filetes finos, indices numerados (01/02), cantos retos, composicao assimetrica.
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Flourish } from "@/components/evt/icons";
import { Reveal } from "@/components/evt/Reveal";
import type { ProgramacaoItem } from "@/lib/convite";

// Ritmo/medidas consistentes do template.
export const QFE_PAD = "px-[clamp(1.25rem,5vw,3rem)]";
export const QFE_RHYTHM = "py-[clamp(3.5rem,8vw,6.5rem)]";
export const QFE_WRAP = "mx-auto w-full max-w-[1160px]";

/**
 * Kicker editorial — rotulo caixa-alta com numero de indice (01 —) e filete que
 * atravessa a largura. E a "linha de secao" da revista.
 */
export function Kicker({
  index,
  children,
  align = "left",
  tone = "rosa",
}: {
  index?: number;
  children: ReactNode;
  align?: "left" | "center";
  tone?: "rosa" | "ink";
}) {
  const label = (
    <span className="whitespace-nowrap font-evt-util text-[clamp(0.6rem,1.5vw,0.72rem)] font-medium uppercase tracking-[0.34em]">
      {index != null && (
        <span className="text-evt-ink-soft">{String(index).padStart(2, "0")} — </span>
      )}
      <span className={tone === "rosa" ? "text-evt-rosa-ink" : "text-evt-ink"}>{children}</span>
    </span>
  );
  if (align === "center") {
    return (
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-[var(--line)]" aria-hidden />
        {label}
        <span className="h-px flex-1 bg-[var(--line)]" aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-5">
      {label}
      <span className="h-px flex-1 bg-[var(--line)]" aria-hidden />
    </div>
  );
}

/**
 * Titulo editorial — display CAPS marcante (a assinatura tipografica deste
 * template; o Glamour usa cursiva, aqui e sempre versal forte).
 */
export function MagTitle({
  children,
  className = "",
  size = "lg",
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const clamp =
    size === "xl"
      ? "text-[clamp(2.8rem,9vw,6rem)]"
      : size === "lg"
        ? "text-[clamp(2.3rem,6.5vw,4.4rem)]"
        : size === "md"
          ? "text-[clamp(1.8rem,4.5vw,2.9rem)]"
          : "text-[clamp(1.4rem,3.6vw,2.1rem)]";
  return (
    <h2
      className={`font-evt-display uppercase leading-[0.9] tracking-[-0.008em] text-evt-ink ${clamp} ${className}`}
    >
      {children}
    </h2>
  );
}

/**
 * Foto editorial — moldura reta com filete interno (cara de pagina de revista).
 * Fallback: gradiente do tema + filigrana (nunca quebra sem imagem/URL externa).
 */
export function EditorialPhoto({
  src,
  alt,
  ratio = "aspect-[4/5]",
  sizes = "(max-width: 768px) 100vw, 50vw",
  className = "",
  priority = false,
}: {
  src?: string;
  alt: string;
  ratio?: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative ${ratio} w-full overflow-hidden ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]">
          <Flourish className="h-5 w-24 text-evt-rosa" />
        </div>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[var(--line)]"
      />
    </div>
  );
}

/**
 * Programacao em BLOCOS modernos — grade de cartoes com indice numerado (01),
 * hora e titulo. Filete de 1px separa os blocos (cara de tabela editorial).
 * Compartilhado por Home e Evento deste template (mesmo visual nos dois).
 */
export function ProgramacaoBlocos({ itens }: { itens: ProgramacaoItem[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-[2px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
      {itens.map((p, i) => (
        <Reveal key={`${p.hora}-${p.titulo}-${i}`} delay={(i % 3) * 80}>
          <div className="flex h-full flex-col gap-4 bg-evt-ivory/85 p-[clamp(1.4rem,3.5vw,2rem)]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-evt-display text-[clamp(1.6rem,4vw,2.2rem)] leading-none text-evt-rosa/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-evt-util text-[0.66rem] uppercase tracking-[0.24em] text-evt-rosa-ink">
                {p.hora}
              </span>
            </div>
            <p className="font-evt-display uppercase leading-[1.02] tracking-[0.005em] text-evt-ink text-[clamp(1.15rem,3vw,1.6rem)]">
              {p.titulo}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/**
 * Botao/label editorial (link) — pilula de contorno, caixa-alta, seta que avanca.
 * Rotas internas do site usam <Link> (soft nav + prefetch); URL externa (Maps)
 * cai em <a target>. Micro-hover e reset sob reduced-motion (bloco qfe- abaixo).
 */
export function EditorialLink({
  href,
  children,
  target,
  rel,
}: {
  href: string;
  children: ReactNode;
  target?: string;
  rel?: string;
}) {
  const cls =
    "qfe-link group inline-flex min-h-[50px] items-center gap-3 rounded-full border border-[var(--line)] bg-evt-ivory/70 px-7 py-3 font-evt-util text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-evt-ink backdrop-blur-sm transition-[transform,border-color,color] duration-300 hover:-translate-y-0.5 hover:border-evt-rosa-ink hover:text-evt-rosa-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white";
  const inner = (
    <>
      {children}
      <span aria-hidden className="qfe-arrow transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </>
  );
  const externo = target === "_blank" || /^https?:\/\//i.test(href);
  if (externo) {
    return (
      <a href={href} target={target} rel={rel ?? "noreferrer"} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/** Reset de micro-animacoes deste template sob prefers-reduced-motion. */
export function QfeMotionReset() {
  return (
    <style>{`
      @media (prefers-reduced-motion: reduce) {
        .qfe-link, .qfe-arrow { transition: none !important; }
        .qfe-link:hover { transform: none !important; }
        .qfe-link:hover .qfe-arrow { transform: none !important; }
      }
    `}</style>
  );
}
