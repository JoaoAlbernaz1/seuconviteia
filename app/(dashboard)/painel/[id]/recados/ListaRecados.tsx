"use client";

// A lista de recados com as duas acoes de moderacao.
//
// Duas decisoes que valem por toda a tela:
//
// 1) ESCONDER e reversivel, APAGAR nao e. Por isso as duas nao podem ter o
//    mesmo peso: esconder e um botao de contorno (neutro), apagar e um texto
//    apagado que so vira vermelho quando armado. O vermelho aqui e o unico da
//    tela — se ele estivesse tambem no "esconder", perderia o significado.
//
// 2) A confirmacao e em DOIS TOQUES INLINE, como `ExcluirEvento` e
//    `ListaConvites` — nunca `window.confirm`. O dialog do navegador tem a cara
//    do sistema (nao do painel), nao cabe o nome do recado e, no celular,
//    aparece colado no topo, longe do dedo. So UMA linha fica armada por vez, e
//    ela se desarma sozinha em 6s: confirmacao esquecida na tela e uma armadilha
//    esperando o dedo errado.
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EstadoConvite } from "@/lib/estadoConvite";
import { esconderRecado, excluirRecado, mostrarRecado } from "../../acoes";
import { BTN_CARD } from "../../_ui/estilos";

export type RecadoLinha = {
  id: string;
  nome: string;
  mensagem: string;
  visivel: boolean;
  /** Ja formatado no servidor (fuso de Brasilia). */
  quando: string;
};

/** Alvo de toque de 44px sem engordar o desenho do botao. */
const TOQUE = "min-h-[44px] inline-flex items-center gap-1.5";

export function ListaRecados({
  eventId,
  recados,
  noAr,
  estado,
}: {
  eventId: string;
  recados: RecadoLinha[];
  /** O site esta respondendo agora? Decide se o selo pode dizer "No site". */
  noAr: boolean;
  estado: EstadoConvite;
}) {
  const router = useRouter();
  const [armado, setArmado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  // Desarma sozinho se o segundo toque nao vier.
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(null), 6000);
    return () => clearTimeout(t);
  }, [armado]);

  function alternar(r: RecadoLinha) {
    setArmado(null);
    setOcupado(r.id);
    iniciar(async () => {
      if (r.visivel) await esconderRecado(r.id, eventId);
      else await mostrarRecado(r.id, eventId);
      router.refresh();
      setOcupado(null);
    });
  }

  function apagar(id: string) {
    setOcupado(id);
    iniciar(async () => {
      await excluirRecado(id, eventId);
      setArmado(null);
      router.refresh();
      setOcupado(null);
    });
  }

  if (recados.length === 0) {
    // Vazio no padrao do painel (tracejado + circulo lilas). O texto segue o
    // estado: mandar "compartilhe o link" a quem esta fora do ar seria mandar a
    // pessoa divulgar uma pagina que nao abre.
    return (
      <div className="p-4 sm:p-5">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-scv-dash/70 bg-scv-field py-10 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-scv-lilac text-scv-violet">
            <i className="bi bi-chat-heart text-lg" aria-hidden />
          </span>
          <p className="max-w-[280px] text-[13px] leading-relaxed text-scv-muted">
            {estado === "encerrada"
              ? "Ninguém deixou recado neste convite."
              : estado === "no-ar"
                ? "Ainda não chegou nenhum recado. Compartilhe o link do site e eles aparecem aqui na hora."
                : "Ainda não chegou nenhum recado. O mural começa a receber quando o convite estiver no ar."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul>
      {recados.map((r) => {
        const confirmando = armado === r.id;
        const trabalhando = ocupado === r.id;
        return (
          <li
            key={r.id}
            /* O escondido fica REBAIXADO (fundo cinza), nao borrado: opacidade
               baixa jogaria o texto para 3:1 e o recado que a pessoa precisa
               reler antes de apagar seria justamente o ilegivel. */
            className={`border-t border-scv-line px-4 py-4 sm:px-5 ${
              r.visivel ? "" : "bg-scv-soft"
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <p
                className={`text-[14.5px] font-semibold ${
                  r.visivel ? "text-scv-ink" : "text-scv-text2"
                }`}
              >
                {r.nome}
              </p>
              <p className="text-[11.5px] text-scv-muted">{r.quando}</p>
              {/* Selo de estado: cor + PALAVRA, nunca so cor. E o mesmo par de
                  pilulas da tela de Recursos. */}
              {r.visivel ? (
                <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-scv-teal/10 px-2.5 py-1 text-[11px] font-semibold text-scv-teal-ink">
                  <i className="bi bi-check2" aria-hidden />
                  {noAr ? "No site" : "Visível"}
                </span>
              ) : (
                <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-scv-card px-2.5 py-1 text-[11px] font-semibold text-scv-muted">
                  <i className="bi bi-eye-slash" aria-hidden />
                  Oculto
                </span>
              )}
            </div>

            {/* `whitespace-pre-wrap break-words`: recado vem digitado no celular,
                com quebras e com palavra colada de 60 caracteres. Sem isso, uma
                URL sem espaco esticava a linha e o painel inteiro ganhava
                rolagem lateral em 390px. */}
            <p
              className={`mt-1.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed ${
                r.visivel ? "text-scv-text2" : "text-scv-muted"
              }`}
            >
              {r.mensagem}
            </p>

            {confirmando ? (
              <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
                <span className="text-[12.5px] text-red-700">
                  Apagar o recado de <strong>{r.nome}</strong>? Não tem volta.
                </span>
                <button
                  type="button"
                  onClick={() => apagar(r.id)}
                  disabled={trabalhando}
                  className={`${TOQUE} cursor-pointer rounded-[10px] bg-red-600 px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {trabalhando ? "Apagando…" : "Confirmar exclusão"}
                </button>
                <button
                  type="button"
                  onClick={() => setArmado(null)}
                  disabled={trabalhando}
                  className={`${TOQUE} cursor-pointer px-1 text-[12.5px] font-semibold text-scv-muted transition-colors duration-200 hover:text-scv-ink disabled:opacity-60`}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => alternar(r)}
                  disabled={trabalhando}
                  className={`${BTN_CARD} ${TOQUE} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <i className={`bi ${r.visivel ? "bi-eye-slash" : "bi-eye"}`} aria-hidden />
                  {trabalhando
                    ? "Salvando…"
                    : r.visivel
                      ? "Esconder do site"
                      : "Mostrar no site"}
                </button>
                <button
                  type="button"
                  onClick={() => setArmado(r.id)}
                  disabled={trabalhando}
                  /* `scv-muted` (4,6:1) e nao `scv-faint` (2,6:1): "Apagar" e
                     um comando, e comando ilegivel vira clique no escuro. Ele
                     continua mais leve que o botao de contorno ao lado — a
                     hierarquia vem do PESO, nao de apagar o texto. Na linha
                     rebaixada sobe para `text2`, porque sobre `scv-soft` o
                     muted cai para 4,2:1. */
                  className={`${TOQUE} cursor-pointer text-[12.5px] font-medium ${
                    r.visivel ? "text-scv-muted" : "text-scv-text2"
                  } transition-colors duration-200 hover:text-red-600 disabled:opacity-60`}
                >
                  <i className="bi bi-trash3" aria-hidden />
                  Apagar
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
