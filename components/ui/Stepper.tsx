// Stepper — progresso horizontal do fluxo de criacao (6 etapas).
// Bolinhas numeradas (feito=rose+check, atual=anel rose, futuro=linha),
// conectores preenchidos ate a etapa atual. Passos feitos sao clicaveis
// quando `onStepClick` e passado.
import { cn } from "@/components/ui/cn";

export type StepperStep = { label: string };

export type StepperProps = {
  steps: StepperStep[];
  current: number;
  onStepClick?: (index: number) => void;
  className?: string;
};

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn("flex items-start", className)}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done && !!onStepClick;
        const isLast = i === steps.length - 1;

        const dot = (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition",
              done && "bg-ui-rose text-white",
              active && "border-2 border-ui-rose text-ui-rose bg-ui-surface",
              !done && !active && "border border-ui-line text-ui-ink-faint bg-ui-surface",
            )}
          >
            {done ? <Check /> : i + 1}
          </span>
        );

        return (
          <li key={i} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              {/* conector esquerdo (some no primeiro) */}
              {i > 0 && (
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    i <= current ? "bg-ui-rose" : "bg-ui-line",
                  )}
                />
              )}
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(i)}
                  className="ui-ring rounded-full"
                  aria-label={step.label}
                >
                  {dot}
                </button>
              ) : (
                dot
              )}
              {/* conector direito (some no ultimo) */}
              {!isLast && (
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    i < current ? "bg-ui-rose" : "bg-ui-line",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "mt-2 max-w-[7rem] text-center text-xs leading-tight",
                active ? "text-ui-ink font-medium" : done ? "text-ui-ink-soft" : "text-ui-ink-faint",
                "hidden sm:block",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Nota de uso: no mobile os labels ficam ocultos (sm:block) e so as bolinhas +
// conectores aparecem, mantendo o Stepper compacto.
