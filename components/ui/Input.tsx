import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/components/ui/cn";

// Props de layout compartilhados pelos três controles.
type CampoProps = {
  label?: string;
  helper?: string;
  error?: string;
};

// Classe base do controle (input/select/textarea).
function controle(error: string | undefined, extra?: string) {
  return cn(
    "ui-ring w-full bg-ui-surface border rounded-ui px-3.5 py-2.5 text-ui-ink",
    "placeholder:text-ui-ink-faint transition-colors duration-150",
    "disabled:opacity-55 disabled:cursor-not-allowed",
    error
      ? "border-ui-danger focus:border-ui-danger"
      : "border-ui-line focus:border-ui-rose",
    extra,
  );
}

/**
 * Envelope de campo: renderiza <label>, controle, helper e erro.
 * Envolve o controle no próprio <label> — associação acessível sem precisar de id.
 */
function Field({
  label,
  helper,
  error,
  className,
  children,
}: CampoProps & { className?: string; children: ReactNode }) {
  const semEnvelope = !label && !helper && !error;
  if (semEnvelope) return <>{children}</>;

  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ui-ink">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-ui-danger">{error}</span>
      ) : (
        helper && (
          <span className="mt-1.5 block text-xs text-ui-ink-faint">
            {helper}
          </span>
        )
      )}
    </label>
  );
}

export type InputProps = CampoProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof CampoProps>;

export function Input({
  label,
  helper,
  error,
  className,
  ...rest
}: InputProps) {
  return (
    <Field label={label} helper={helper} error={error} className={className}>
      <input className={controle(error)} aria-invalid={!!error || undefined} {...rest} />
    </Field>
  );
}

export type TextareaProps = CampoProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof CampoProps>;

export function Textarea({
  label,
  helper,
  error,
  className,
  rows = 4,
  ...rest
}: TextareaProps) {
  return (
    <Field label={label} helper={helper} error={error} className={className}>
      <textarea
        rows={rows}
        className={controle(error, "resize-y min-h-24")}
        aria-invalid={!!error || undefined}
        {...rest}
      />
    </Field>
  );
}

export type SelectProps = CampoProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, keyof CampoProps>;

export function Select({
  label,
  helper,
  error,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <Field label={label} helper={helper} error={error} className={className}>
      <div className="relative">
        <select
          className={controle(error, "appearance-none pr-10 cursor-pointer")}
          aria-invalid={!!error || undefined}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ui-ink-faint"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Field>
  );
}
