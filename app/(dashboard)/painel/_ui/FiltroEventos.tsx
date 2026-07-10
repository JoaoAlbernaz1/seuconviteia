"use client";
import { useMemo, useState } from "react";
import { filtrarEOrdenar, type FiltroStatus, type Ordenacao } from "@/lib/filtroEventos";
import { CardEvento, type ItemPainel } from "./CardEvento";

/**
 * So liga os controles: a logica de busca/filtro/ordenacao vive em
 * `lib/filtroEventos.ts`, que e puro e testado.
 *
 * Filtra no CLIENTE, sobre a lista ja carregada. Nao ha query nova: a pagina e
 * force-dynamic e ja traz todos os eventos do profissional. Paginacao no
 * servidor seria resolver um problema que ninguem tem.
 *
 * Este componente DESENHA a grade em vez de receber um render prop. A primeira
 * versao recebia `children: (visiveis) => ReactNode` e quebrava em runtime com
 * "Functions are not valid as a child of Client Components": funcao nao
 * atravessa a fronteira Server -> Client. tsc, testes e build passaram; so o
 * navegador reprovou.
 */

const STATUS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "NO_AR", rotulo: "No ar" },
  { valor: "RASCUNHO", rotulo: "Em preparação" },
  { valor: "EXPIRADO", rotulo: "Expirado" },
];

const ORDENS: { valor: Ordenacao; rotulo: string }[] = [
  { valor: "RECENTES", rotulo: "Mais recentes" },
  { valor: "PROXIMOS", rotulo: "Data do evento" },
  { valor: "ALFABETICA", rotulo: "Ordem alfabética" },
];

export function FiltroEventos({ itens }: { itens: ItemPainel[] }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("TODOS");
  const [ordem, setOrdem] = useState<Ordenacao>("RECENTES");

  const visiveis = useMemo(
    () => filtrarEOrdenar(itens, busca, status, ordem),
    [itens, busca, status, ordem],
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar evento…"
          aria-label="Buscar evento pelo nome"
          className="min-w-[220px] flex-1 rounded-full border border-scv-line bg-scv-field px-4 py-2.5 text-[13.5px] text-scv-ink outline-none transition focus-visible:border-violeta"
        />

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por status">
          {STATUS.map((s) => (
            <button
              key={s.valor}
              type="button"
              onClick={() => setStatus(s.valor)}
              aria-pressed={status === s.valor}
              className={`cursor-pointer rounded-full px-3.5 py-2 text-[12.5px] font-medium transition ${
                status === s.valor
                  ? "bg-preto text-white"
                  : "bg-scv-soft text-scv-muted hover:text-scv-ink"
              }`}
            >
              {s.rotulo}
            </button>
          ))}
        </div>

        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as Ordenacao)}
          aria-label="Ordenar eventos"
          className="cursor-pointer rounded-full border border-scv-line bg-scv-card px-3.5 py-2.5 text-[12.5px] text-scv-ink"
        >
          {ORDENS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </div>

      {visiveis.length === 0 ? (
        <p className="mt-10 text-center text-[14px] text-scv-muted">
          Nenhum evento encontrado com esses filtros.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((item) => (
            <CardEvento key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
