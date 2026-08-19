// Topo de cartão do painel: chapéu + título (e, se precisar, uma ação à direita).
//
// Ele existe porque SEIS telas repetiam o mesmo bloco em DEGRADÊ roxo→rosa —
// aquilo que o João chama de "cara de IA". Além do visual, o degradê custava
// caro: texto branco sobre roxo saturado, ícone a 35% de opacidade e um
// cabeçalho que gritava mais alto que o conteúdo da própria tela.
//
// Aqui é plano: o título é o título, e quem chama a atenção é o que a pessoa
// veio fazer. Uma peça só para todas as telas — a próxima nasce certa em vez de
// copiada.
import type { ReactNode } from "react";

export function TopoCartao({
  icone,
  chapeu,
  titulo,
  acao,
}: {
  /** Classe do Bootstrap Icons, ex.: "bi-camera". */
  icone: string;
  /** Linha de cima, pequena. */
  chapeu: string;
  titulo: string;
  /** Botão ou link opcional, alinhado à direita. */
  acao?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-scv-line px-4 py-3.5 sm:px-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-scv-lilac text-scv-violet">
        <i className={`bi ${icone} text-[18px]`} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-scv-faint">
          {chapeu}
        </div>
        <div className="mt-0.5 font-display text-[19px] font-semibold leading-tight text-scv-ink">
          {titulo}
        </div>
      </div>
      {acao}
    </div>
  );
}
