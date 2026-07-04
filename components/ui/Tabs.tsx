"use client";

import { cn } from "@/components/ui/cn";

export type TabItem = { value: string; label: string };

/**
 * Abas underline simples. Aba ativa em tinta com filete rosé; inativa suave.
 */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-6 border-b border-ui-line",
        className,
      )}
    >
      {items.map((item) => {
        const ativo = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(item.value)}
            className={cn(
              "ui-ring relative -mb-px rounded-ui-sm px-1 pb-3 pt-2 text-sm font-medium",
              "transition-colors duration-150",
              ativo
                ? "text-ui-ink"
                : "text-ui-ink-soft hover:text-ui-ink",
            )}
          >
            {item.label}
            <span
              className={cn(
                "absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-opacity duration-200",
                ativo ? "bg-ui-rose opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Chips de filtro single-select. value = null renderiza "Todos" ativo.
 */
export function FilterChips({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}) {
  const opcoes: { value: string | null; label: string }[] = [
    { value: null, label: "Todos" },
    ...items,
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {opcoes.map((opcao) => {
        const ativo = opcao.value === value;
        return (
          <button
            key={opcao.value ?? "__todos__"}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(opcao.value)}
            className={cn(
              "ui-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150",
              ativo
                ? "bg-ui-rose text-white"
                : "bg-ui-surface border border-ui-line text-ui-ink-soft hover:border-ui-line-strong hover:text-ui-ink",
            )}
          >
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
}
