"use client";

// "Baixar a lista (.csv)" — o extra da tela de Convidados para quem assina.
//
// Quem está no plano grátis vê o MESMO lugar, com cadeado e o popup explicando o
// que ganha (pedido do João, 17/08: a tela tem que ser diferente para quem tem
// plano melhor, sem esconder que a opção existe).
//
// O arquivo sai do próprio navegador: a lista já veio renderizada, então não há
// motivo para uma rota nova só para montar o CSV.
import { BotaoBloqueado } from "@/components/plano/RecursoBloqueado";
import type { Plan } from "@/lib/plans";

export type LinhaConvidado = {
  nome: string;
  status: string;
  acompanhantes: number;
  /** Recado/observação que o convidado deixou ao confirmar. */
  recado?: string | null;
  /** Quando confirmou (dd/mm/aaaa). */
  quando: string;
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmou",
  PENDING: "Aguardando",
  DECLINED: "Não vai",
};

/** Uma célula de CSV segura (aspas dobradas, campo entre aspas). */
function celula(valor: string | number | null | undefined): string {
  return `"${String(valor ?? "").replaceAll('"', '""')}"`;
}

const BTN =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-[11px] border border-scv-line bg-scv-card px-4 py-2.5 text-[13px] font-semibold text-scv-ink transition-colors hover:border-scv-dash hover:bg-scv-field";

export function BaixarConvidados({
  convidados,
  nomeEvento,
  plano,
  liberado,
}: {
  convidados: LinhaConvidado[];
  nomeEvento: string;
  plano: Plan;
  liberado: boolean;
}) {
  if (!liberado) {
    return (
      <BotaoBloqueado
        label="Baixar lista (.csv)"
        className={BTN}
        titulo="Baixar a lista de convidados"
        descricao="Salva todo mundo num arquivo de planilha: nome, se confirmou, quantos acompanhantes, o recado que deixou e a data da resposta. Serve para levar impresso no dia, montar as mesas ou passar para o buffet."
        motivo="plano"
        planoNecessario="CLASSICO"
        planoAtual={plano}
        ganhos={[
          "Baixar a lista em planilha quando quiser",
          "Convites ilimitados na mesma conta",
          "Sua marca no lugar da nossa no rodapé",
          "Taxa menor nos presentes",
        ]}
      />
    );
  }

  const baixar = () => {
    const cabecalho = ["Nome", "Status", "Acompanhantes", "Recado", "Respondeu em"];
    const linhas = convidados.map((g) =>
      [g.nome, STATUS_LABEL[g.status] ?? g.status, g.acompanhantes, g.recado, g.quando]
        .map(celula)
        .join(";"),
    );
    // BOM na frente: sem ele o Excel abre os acentos errados.
    const csv = `﻿${[cabecalho.map(celula).join(";"), ...linhas].join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `convidados-${nomeEvento.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "convite"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={baixar} className={BTN}>
      <i className="bi bi-download text-[12px]" aria-hidden />
      Baixar lista (.csv)
    </button>
  );
}
