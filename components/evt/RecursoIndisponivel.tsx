import { Button } from "@/components/evt/Button";

/**
 * RecursoIndisponivel — estado calmo, no estilo `.evt`, para quando uma pagina
 * interna (RSVP / recados / galeria) NAO esta liberada pelo plano do evento.
 * Renderiza DENTRO do chrome do convite (nav/atmosfera/rodape ficam no layout),
 * por isso e um `<main>` leve e tematizado — nao o `<SiteIndisponivel>` cheio.
 */
export function RecursoIndisponivel({
  titulo = "Página indisponível",
  texto = "Esta página não está disponível neste convite.",
}: {
  titulo?: string;
  texto?: string;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-transparent px-[clamp(1.25rem,5vw,2rem)] py-[clamp(6rem,14vw,10rem)] text-center">
      <div className="mx-auto max-w-[540px]">
        <span className="flex items-center justify-center gap-3 text-evt-rosa" aria-hidden>
          <span className="h-px w-12 bg-evt-rosa/50" />
          <span className="rotate-45 text-[0.5rem]">◆</span>
          <span className="h-px w-12 bg-evt-rosa/50" />
        </span>

        <h1 className="mt-8 font-evt-display text-[clamp(2rem,6vw,2.8rem)] tracking-[0.02em] text-evt-rosa-ink">
          {titulo}
        </h1>
        <p className="mt-5 font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
          {texto}
        </p>

        <div className="mt-9 flex justify-center">
          <Button href="/" variant="ghost">
            Voltar ao início
          </Button>
        </div>
      </div>
    </main>
  );
}
