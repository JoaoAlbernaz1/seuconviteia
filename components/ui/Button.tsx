import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/components/ui/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

// Props comuns aos dois modos (button / link).
type Base = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type ButtonAsButton = Base &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Base | "href"> & {
    href?: undefined;
  };

type ButtonAsLink = Base &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Base | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ui-rose text-white hover:bg-ui-rose-ink ui-shadow-rose active:scale-[.98]",
  secondary:
    "bg-ui-surface border border-ui-line text-ui-ink hover:border-ui-line-strong active:scale-[.98]",
  ghost: "bg-transparent text-ui-ink hover:bg-ui-rose-soft active:scale-[.98]",
  danger: "bg-ui-danger text-white hover:brightness-95 active:scale-[.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  );
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    iconRight,
    children,
    className,
    ...rest
  } = props;

  const cls = cn(
    "ui-ring inline-flex select-none items-center justify-center rounded-full font-medium",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-200",
    "disabled:pointer-events-none disabled:opacity-55",
    "aria-disabled:pointer-events-none aria-disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  const inner = (
    <>
      {loading ? <Spinner /> : icon}
      {children != null && <span>{children}</span>}
      {!loading && iconRight}
    </>
  );

  // Modo link (next/link) quando há href. `rest` já carrega o href.
  if (props.href !== undefined) {
    const anchorRest = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <Link
        className={cls}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        {...anchorRest}
      >
        {inner}
      </Link>
    );
  }

  // Modo button.
  const { disabled, type, ...buttonRest } =
    rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={type ?? "button"}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonRest}
    >
      {inner}
    </button>
  );
}
