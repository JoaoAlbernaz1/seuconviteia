// EmptyState — estado vazio elegante (sem sites/convidados/presentes/fotos/recados).
// Centralizado, muito respiro, texto no maximo confortavel.
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center px-6 py-16", className)}>
      {icon != null && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-ui-rose-soft text-ui-rose-ink text-2xl">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl text-ui-ink">{title}</h3>
      {description != null && (
        <p className="mt-2 max-w-sm text-ui-ink-soft leading-relaxed">{description}</p>
      )}
      {action != null && <div className="mt-6">{action}</div>}
    </div>
  );
}
