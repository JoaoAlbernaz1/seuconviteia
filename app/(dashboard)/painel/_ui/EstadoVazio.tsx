import Link from "next/link";

const PASSOS = ["Tema", "Informações", "Lista", "Convite"] as const;

/** Conta nova, nenhum evento. A tela precisa convidar, nao parecer quebrada. */
export function EstadoVazio() {
  return (
    <div className="mt-8 rounded-[24px] border border-scv-line bg-scv-card px-6 py-16 text-center">
      <h2 className="font-display text-[26px] font-semibold tracking-tight text-scv-ink">
        Seu primeiro site de evento está a 4 passos daqui.
      </h2>
      <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-relaxed text-scv-muted">
        Escolha um tema, adicione os detalhes e convide seus convidados. É simples,
        rápido e encantador.
      </p>

      <Link
        href="/painel/novo"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-violeta px-6 py-3 text-[14px] font-semibold text-white transition hover:brightness-110"
      >
        Criar meu primeiro evento
      </Link>

      <ol className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {PASSOS.map((passo, i) => (
          <li key={passo} className="flex items-center gap-2 text-[12px] text-scv-muted">
            <span className="grid size-[22px] place-items-center rounded-full bg-cinza text-[11px] font-semibold text-preto">
              {i + 1}
            </span>
            {passo}
          </li>
        ))}
      </ol>
    </div>
  );
}
