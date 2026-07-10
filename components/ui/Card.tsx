// Card — container premium do design system claro (ui-*).
// Sem padding embutido: o consumidor decide o respiro interno via className.
// - href  → renderiza <Link> (next/link)
// - onClick sem href → <button>
// - as    → sobrescreve o elemento (fallback quando nao ha href/onClick)
import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type CardVariant = "default" | "premium" | "clickable" | "selected";

// Base comum a todas as variantes.
const BASE = "rounded-ui-lg border";

const VARIANTS: Record<CardVariant, string> = {
  default: "bg-ui-surface border-ui-line ui-shadow-sm",
  premium: "bg-ui-surface-2 border-ui-champagne/40 ui-shadow",
  clickable:
    "bg-ui-surface border-ui-line ui-shadow-sm cursor-pointer transition " +
    "hover:-translate-y-0.5 hover:[box-shadow:var(--ui-shadow)] hover:border-ui-line-strong",
  selected: "bg-ui-surface border-ui-rose ring-2 ring-ui-rose/40 ui-shadow-sm",
};

export type CardProps = {
  variant?: CardVariant;
  href?: string;
  onClick?: () => void;
  as?: ElementType;
  children?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "onClick">;

export function Card({
  variant = "default",
  href,
  onClick,
  as,
  children,
  className,
  ...rest
}: CardProps) {
  const classes = cn(BASE, VARIANTS[variant], className);

  // Link tem prioridade quando ha href.
  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick} {...(rest as Record<string, unknown>)}>
        {children}
      </Link>
    );
  }

  // onClick sem href → botao acessivel (a menos que `as` force outro elemento).
  if (onClick && !as) {
    return (
      <button type="button" onClick={onClick} className={cn("text-left w-full", classes)} {...(rest as Record<string, unknown>)}>
        {children}
      </button>
    );
  }

  const Comp = as ?? "div";
  return (
    <Comp onClick={onClick} className={classes} {...rest}>
      {children}
    </Comp>
  );
}
