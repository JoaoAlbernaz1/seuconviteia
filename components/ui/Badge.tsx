import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export type BadgeTone =
  | "publicado"
  | "rascunho"
  | "premium"
  | "novo"
  | "em-breve"
  | "selecionado"
  | "neutro";

const TONES: Record<BadgeTone, string> = {
  publicado: "bg-ui-success-soft text-ui-success",
  rascunho: "bg-ui-champagne-soft text-ui-champagne",
  premium: "bg-ui-rose-soft text-ui-rose-ink",
  novo: "bg-ui-rose-soft text-ui-rose",
  "em-breve": "bg-ui-bg-warm text-ui-ink-faint",
  selecionado: "bg-ui-rose text-white",
  neutro: "bg-ui-surface-2 text-ui-ink-soft",
};

export function Badge({
  tone = "neutro",
  children,
  className,
}: {
  tone?: BadgeTone;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
