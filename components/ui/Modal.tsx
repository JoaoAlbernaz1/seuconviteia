"use client";

// Modal — dialogo centrado, claro/premium. Overlay escuro translucido,
// fecha no ESC e no clique fora, trava o scroll do body enquanto aberto.
import { useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type ModalSize = "md" | "lg" | "xl";

const SIZES: Record<ModalSize, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
};

export function Modal({ open, onClose, title, children, footer, size = "md", className }: ModalProps) {
  // ESC fecha + trava scroll do body enquanto o modal estiver aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ui-ink/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "w-full bg-ui-surface rounded-ui-xl ui-shadow-lg flex flex-col max-h-[90vh] overflow-hidden",
          SIZES[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title != null && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-ui-line">
            <h2 className="font-display text-lg text-ui-ink leading-snug">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="ui-ring -mr-1 shrink-0 rounded-ui-sm p-1 text-ui-ink-faint transition hover:text-ui-ink hover:bg-ui-bg-warm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto">{children}</div>

        {footer != null && (
          <div className="px-6 py-4 border-t border-ui-line bg-ui-surface-2/60">{footer}</div>
        )}
      </div>
    </div>
  );
}
