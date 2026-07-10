import { cn } from "@/components/ui/cn";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type TemplateCardProps = {
  preview?: React.ReactNode;
  nome: string;
  ocasiao: string;
  descricao: string;
  tags: string[];
  planoBadge?: React.ReactNode;
  selecionado?: boolean;
  onVisualizar?: () => void;
  onEscolher?: () => void;
  className?: string;
};

export function TemplateCard({
  preview,
  nome,
  ocasiao,
  descricao,
  tags,
  planoBadge,
  selecionado,
  onVisualizar,
  onEscolher,
  className,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-ui-xl border bg-ui-surface transition-all duration-300",
        selecionado
          ? "border-ui-rose ui-shadow-rose ring-2 ring-ui-rose"
          : "border-ui-line ui-shadow-sm hover:-translate-y-0.5 hover:ui-shadow",
        className,
      )}
    >
      {/* Area de preview (aspect 4/3, cantos arredondados no topo) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {preview ?? (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ui-champagne-soft via-ui-surface-2 to-ui-rose-soft"
            aria-hidden="true"
          >
            <span className="font-display text-3xl italic text-ui-rose">{nome.charAt(0)}</span>
          </div>
        )}

        {/* Badge de plano sobreposto */}
        {planoBadge ? <div className="absolute left-3 top-3">{planoBadge}</div> : null}

        {/* Selecionado */}
        {selecionado ? (
          <div className="absolute right-3 top-3">
            <Badge tone="selecionado">Selecionado</Badge>
          </div>
        ) : null}
      </div>

      {/* Corpo */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ui-ink-faint">
          {ocasiao}
        </p>
        <h3 className="font-display text-xl leading-tight text-ui-ink">{nome}</h3>
        <p className="text-sm leading-relaxed text-ui-ink-soft">{descricao}</p>

        {/* Chips de tags */}
        {tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-ui-bg-warm px-2.5 py-0.5 text-[0.7rem] font-medium text-ui-ink-soft"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {/* Rodape com acoes */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={onVisualizar} className="flex-1">
            Visualizar
          </Button>
          <Button variant="primary" size="sm" onClick={onEscolher} className="flex-1">
            Escolher
          </Button>
        </div>
      </div>
    </div>
  );
}
