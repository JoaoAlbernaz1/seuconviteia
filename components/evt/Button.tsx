import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  // Primario — framboesa preenchido (texto branco = AA), reservado p/ o CTA
  // principal. Hover: leve lift + sombra rosada mais funda. Press: recuo discreto.
  primary:
    "bg-evt-framboesa text-white hover:bg-evt-framboesa-deep shadow-[0_14px_34px_-20px_rgba(206,87,139,0.55)] hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-20px_rgba(206,87,139,0.65)] active:translate-y-0 active:scale-[0.98]",
  // Ghost — contorno rosa fino, preenche bem suave no hover; mesmo lift/press.
  ghost:
    "border border-[var(--line-rosa)] text-evt-rosa-ink hover:border-evt-rosa hover:bg-evt-rosa/[0.07] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
};

const BASE =
  "inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-3 font-evt-util text-[0.7rem] font-medium uppercase tracking-[0.24em] transition-[transform,background-color,box-shadow,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50";

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children" | "href"> & { href: string };

/**
 * Button — primario (framboesa preenchido) ou ghost (outline rosa). Renderiza
 * <Link> quando recebe `href`, senao <button>. Micro-hover + focus-visible.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", children, className = "" } = props;
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`.trim();

  if (props.href !== undefined) {
    const { variant: _v, children: _c, className: _cn, href, ...rest } = props;
    void _v; void _c; void _cn;
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, children: _c, className: _cn, href: _h, ...rest } = props;
  void _v; void _c; void _cn; void _h;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
