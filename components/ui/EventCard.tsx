import { cn } from "@/components/ui/cn";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type EventCardProps = {
  capa?: React.ReactNode;
  nome: string;
  status: "rascunho" | "publicado";
  data: string;
  template: string;
  confirmacoes?: number;
  onEditar?: () => void;
  onVisualizar?: () => void;
  onCopiarLink?: () => void;
  className?: string;
};

function DotIcon() {
  return <span aria-hidden="true" className="text-ui-ink-faint">·</span>;
}

export function EventCard({
  capa,
  nome,
  status,
  data,
  template,
  confirmacoes,
  onEditar,
  onVisualizar,
  onCopiarLink,
  className,
}: EventCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-ui-xl border border-ui-line bg-ui-surface ui-shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:ui-shadow",
        className,
      )}
    >
      {/* Capa (aspect 16/10) com badge de status sobreposto */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {capa ?? (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ui-rose-soft via-ui-surface-2 to-ui-champagne-soft"
            aria-hidden="true"
          >
            <span className="font-display text-4xl italic text-ui-rose">{nome.charAt(0)}</span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge tone={status}>{status === "publicado" ? "Publicado" : "Rascunho"}</Badge>
        </div>
      </div>

      {/* Corpo */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="font-display text-xl leading-tight text-ui-ink">{nome}</h3>

        {/* Linha meta */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ui-ink-soft">
          <span>{template}</span>
          <DotIcon />
          <span>{data}</span>
          {typeof confirmacoes === "number" ? (
            <>
              <DotIcon />
              <span className="font-medium text-ui-ink">
                {confirmacoes} {confirmacoes === 1 ? "confirmação" : "confirmações"}
              </span>
            </>
          ) : null}
        </div>

        {/* Acoes */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Button variant="primary" size="sm" onClick={onEditar}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={onVisualizar}>
            Visualizar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopiarLink}
            className="ml-auto"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5L12.5 17"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Copiar link
          </Button>
        </div>
      </div>
    </div>
  );
}
