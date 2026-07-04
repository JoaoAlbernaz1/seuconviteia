"use client";

import { cn } from "@/components/ui/cn";

export type DeviceMode = "desktop" | "tablet" | "mobile";

type DevicePreviewProps = {
  mode: DeviceMode;
  onModeChange: (mode: DeviceMode) => void;
  children?: React.ReactNode;
  className?: string;
};

const OPCOES: { mode: DeviceMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: "desktop",
    label: "Computador",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 20h6M12 16.5V20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    mode: "tablet",
    label: "Tablet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <rect x="5" y="2.5" width="14" height="19" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    mode: "mobile",
    label: "Celular",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <rect x="7" y="2.5" width="10" height="19" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

// Larguras da moldura por dispositivo (transicao suave entre elas).
const LARGURA: Record<DeviceMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export function DevicePreview({ mode, onModeChange, children, className }: DevicePreviewProps) {
  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      {/* Segmented toggle */}
      <div
        role="tablist"
        aria-label="Tamanho da tela"
        className="inline-flex items-center gap-1 rounded-ui-lg border border-ui-line bg-ui-surface p-1 ui-shadow-sm"
      >
        {OPCOES.map((op) => {
          const ativo = op.mode === mode;
          return (
            <button
              key={op.mode}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => onModeChange(op.mode)}
              className={cn(
                "ui-ring inline-flex items-center gap-2 rounded-ui px-3 py-1.5 text-sm font-medium transition-colors",
                ativo
                  ? "bg-ui-rose-soft text-ui-rose-ink"
                  : "text-ui-ink-soft hover:bg-ui-bg-warm hover:text-ui-ink",
              )}
            >
              {op.icon}
              <span className="hidden sm:inline">{op.label}</span>
            </button>
          );
        })}
      </div>

      {/* Moldura centralizada, largura anima por modo */}
      <div className="flex w-full justify-center">
        <div
          className={cn(
            "w-full overflow-hidden rounded-ui-xl border border-ui-line bg-ui-surface ui-shadow transition-[max-width] duration-500 ease-out",
            mode === "desktop" && "max-w-5xl",
          )}
          style={mode === "desktop" ? undefined : { maxWidth: LARGURA[mode] }}
        >
          {/* Barrinha superior estilo janela */}
          <div className="flex items-center gap-1.5 border-b border-ui-line bg-ui-surface-2 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ui-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-ui-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-ui-line-strong" />
          </div>
          <div className="bg-ui-bg">{children}</div>
        </div>
      </div>
    </div>
  );
}
