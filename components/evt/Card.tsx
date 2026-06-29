import type { ComponentProps, ReactNode } from "react";

/**
 * Card — superficie editorial CLARA: fundo branco, hairline fina, raio do token,
 * sombra muito discreta. `interactive` adiciona micro-hover (lift + borda rosa).
 */
export function Card({
  children,
  interactive = false,
  className = "",
  ...rest
}: {
  children: ReactNode;
  interactive?: boolean;
  className?: string;
} & Omit<ComponentProps<"div">, "className" | "children">) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--line)] bg-white shadow-[0_22px_50px_-40px_rgba(46,26,32,0.35)] ${
        interactive
          ? "cursor-pointer transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-[var(--line-rosa)] hover:shadow-[0_30px_60px_-40px_rgba(184,61,107,0.3)]"
          : ""
      } ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
