// Tela "Convidados" (mockup DARK) — lista manual para acompanhar quem confirmou.
// Server-only (forms nativos com server actions): carrega o evento do dono (404
// se não for) e lista os convidados por data de criação. Ownership já garantida
// por `carregarEventoDono` antes da query dos convidados.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { carregarEventoDono, voltarDe } from "../_carregar";
import { adicionarConvidado, removerConvidado } from "../../acoes";
import {
  BTN_FORTE,
  BTN_PRIMARIO,
  BTN_VOLTAR,
  CARD,
  COLUNA_ESTREITA,
  INPUT,
  SUB,
  TITULO,
} from "../../_ui/estilos";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmou", cls: "bg-teal/10 text-scv-teal" },
  PENDING: { label: "Aguardando", cls: "bg-scv-warn-bg text-scv-warn-ink" },
  DECLINED: { label: "Não vai", cls: "bg-scv-soft text-scv-faint" },
};

/** Iniciais para o avatar (1ª + última palavra do nome). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default async function ConvidadosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await carregarEventoDono(id);
  const voltar = voltarDe(sp, `/painel/${event.id}`);

  const convidados = await prisma.guest.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className={`${COLUNA_ESTREITA} scv-fade py-9 pb-20`}>
      <div className="flex items-center gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div>
          <h1 className={TITULO}>Convidados</h1>
          <p className={`mt-1 ${SUB}`}>
            Adicione nomes para acompanhar quem confirmou.
          </p>
        </div>
      </div>

      <div className={`${CARD} mt-8 p-5 sm:p-6`}>
        <form action={adicionarConvidado} className="flex items-center gap-2.5">
          <input type="hidden" name="eventId" value={event.id} />
          <input
            name="name"
            placeholder="Nome do convidado"
            required
            maxLength={140}
            className={`${INPUT} flex-1`}
          />
          <button type="submit" className={BTN_FORTE}>
            Adicionar
          </button>
        </form>

        <ul className="mt-5 flex flex-col gap-1.5">
          {convidados.length === 0 ? (
            <li className="rounded-xl border border-dashed border-scv-line px-4 py-8 text-center text-[13px] text-scv-muted">
              Ninguém na lista ainda. Adicione o primeiro nome aí em cima.
            </li>
          ) : (
            convidados.map((g) => {
              const chip = STATUS[g.status] ?? STATUS.PENDING;
              return (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-xl border border-scv-line bg-scv-soft/40 px-3.5 py-2.5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-scv-lilac text-[12px] font-bold text-scv-violet">
                    {iniciais(g.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-scv-ink">
                    {g.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${chip.cls}`}
                  >
                    {chip.label}
                  </span>
                  <form action={removerConvidado}>
                    <input type="hidden" name="guestId" value={g.id} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <button
                      type="submit"
                      aria-label={`Remover ${g.name}`}
                      className="grid size-7 place-items-center rounded-full text-scv-faint transition hover:text-red-400"
                    >
                      <i className="bi bi-x text-lg" aria-hidden />
                    </button>
                  </form>
                </li>
              );
            })
          )}
        </ul>

        <p className="mt-4 border-t border-scv-line pt-4 text-[12.5px] leading-relaxed text-scv-faint">
          Você também pode simplesmente compartilhar o link — quem abrir o site
          consegue confirmar sozinho.
        </p>
      </div>

      <Link
        href={voltar}
        className={`${BTN_PRIMARIO} mt-6 block w-full text-center`}
      >
        Pronto, voltar
      </Link>
    </div>
  );
}
