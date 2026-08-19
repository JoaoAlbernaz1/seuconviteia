"use client";

// O miolo da tela de liberar: as quatro frases + UMA acao, e o Pix quando ela
// for a acao escolhida.
//
// Duas portas, nunca as duas ao mesmo tempo: quem tem liberacao incluida no
// plano ve so a gratuita (mostrar o Pix ao lado seria vender o que ela ja
// pagou); quem nao tem ve so o Pix. Ao voltar `{ ok: true }` de qualquer uma
// das duas, a pessoa vai direto para o editor.
//
// A mecanica do Pix (QR + copia-e-cola + "Copiado!") e a mesma do modal de
// presentear do site — aqui vestida com os tokens do painel.
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { comprarPasseEdicao, usarPasseIncluido } from "./acoes";
import { edicaoJaLiberada } from "./status";
import { BTN_GHOST, BTN_PRIMARIO } from "../../_ui/estilos";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (cents: number) => brl.format(cents / 100);

/** De quanto em quanto tempo a tela do Pix pergunta se a janela ja abriu. */
const CHECAR_MS = 5000;

export function LiberarCliente({
  eventId,
  precoCents,
  horas,
  temIncluido,
  incluidosRestantes,
  encerrado,
  foraDoAr,
}: {
  eventId: string;
  precoCents: number;
  horas: number;
  /** Sobra liberacao incluida no plano para ESTE convite. */
  temIncluido: boolean;
  incluidosRestantes: number;
  /** A festa ja passou: nao ha o que liberar (nem o que vender). */
  encerrado: boolean;
  /** O dono tirou o site do ar — a frase da garantia muda. */
  foraDoAr: boolean;
}) {
  const router = useRouter();
  const [pix, setPix] = useState<{ code: string; qr: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pendente, start] = useTransition();

  const preco = fmt(precoCents);
  const editor = `/painel/criar?id=${eventId}`;

  // Enquanto o QR esta na tela, pergunta de tempos em tempos se a janela abriu
  // — quem abre e o webhook, depois de reconsultar o pagamento. Sem isto, a
  // linha "a edicao abre sozinha" seria mentira. Nao pergunta com a aba
  // escondida: tela esquecida aberta nao precisa custar consulta.
  useEffect(() => {
    if (!pix) return;
    let vivo = true;
    const t = setInterval(async () => {
      if (document.hidden) return;
      const aberta = await edicaoJaLiberada(eventId);
      if (vivo && aberta) router.push(editor);
    }, CHECAR_MS);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [pix, eventId, editor, router]);

  function usarDoPlano() {
    setErro(null);
    start(async () => {
      const r = await usarPasseIncluido(eventId);
      if (r.ok) router.push(editor);
      else setErro(r.erro);
    });
  }

  function gerarPix() {
    setErro(null);
    start(async () => {
      const r = await comprarPasseEdicao(eventId);
      if (r.ok) setPix({ code: r.pixCode, qr: r.pixQrUrl });
      else setErro(r.erro);
    });
  }

  /**
   * Depois de uma recusa: pergunta ao servidor como as coisas estao AGORA. Se a
   * janela ja abriu (a outra aba, o clique duplo), vai para o editor; se nao,
   * recarrega a tela, que pode ter mudado de assunto.
   */
  function reconferir() {
    setErro(null);
    start(async () => {
      if (await edicaoJaLiberada(eventId)) router.push(editor);
      else router.refresh();
    });
  }

  async function copiar() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* clipboard indisponivel: o codigo continua na tela para copiar na mao */
    }
  }

  // A festa ja passou: as duas actions recusariam com esta mesma frase. Dizer
  // antes do clique evita o botao que so serve para dar erro.
  if (encerrado) {
    return (
      <div className="border-t border-scv-line px-4 py-5 sm:px-5">
        <p className="text-[14px] leading-relaxed text-scv-text2">
          Esta festa já passou. Crie um convite novo para a próxima.
        </p>
        <Link href="/painel/criar" className={`${BTN_GHOST} mt-4 inline-block`}>
          Criar um convite novo
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t border-scv-line px-4 py-5 sm:px-5">
      {pix ? (
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-scv-muted">
            Pague {preco} no Pix
          </p>

          <div className="mt-3.5 flex flex-col items-center gap-3.5 rounded-[16px] border border-scv-line bg-scv-field p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
            <div className="relative size-[200px] shrink-0 overflow-hidden rounded-[12px] bg-white ring-1 ring-black/5 sm:size-[168px]">
              <Image
                src={pix.qr}
                alt="QR Code do Pix para liberar a edição"
                fill
                sizes="200px"
                className="object-contain p-1.5"
                unoptimized
              />
            </div>

            <div className="w-full min-w-0">
              <p className="text-[13px] font-semibold text-scv-ink">
                Aponte a câmera do seu banco — ou copie o código.
              </p>
              <p
                className="mt-2 max-w-full truncate rounded-[10px] border border-scv-line bg-scv-card px-3 py-2.5 font-mono text-[12px] text-scv-muted"
                title={pix.code}
              >
                {pix.code}
              </p>
              <button
                type="button"
                onClick={copiar}
                className={`${BTN_GHOST} mt-2.5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 sm:w-auto`}
              >
                <i className={`bi ${copiado ? "bi-check2" : "bi-clipboard"}`} aria-hidden />
                {copiado ? "Copiado!" : "Copiar código Pix"}
              </button>
              <span aria-live="polite" className="sr-only">
                {copiado ? "Código Pix copiado" : ""}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5">
            <span className="relative mt-[5px] flex size-2 shrink-0">
              <span className="absolute inline-flex size-full rounded-full bg-scv-teal/60 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-scv-teal" />
            </span>
            <p className="text-[13.5px] leading-relaxed text-scv-text2">
              Assim que o Pix cair, a edição abre sozinha — pode deixar esta tela aberta.
            </p>
          </div>

          <p className="mt-3 text-[12.5px] leading-relaxed text-scv-muted">
            {foraDoAr
              ? "Seu site está fora do ar agora — liberar a edição não o coloca de volta."
              : "O site atual continua no ar até você publicar as alterações."}{" "}
            A liberação vale {horas} horas a partir do pagamento.
          </p>

          {erro ? <Erro texto={erro} /> : null}
        </div>
      ) : (
        <div>
          <ul className="flex flex-col gap-3">
            <Linha icone="bi-pencil">
              <b className="font-semibold text-scv-ink">O que abre:</b> textos, data, local, capa,
              template, cores e as seções do site.
            </Linha>
            <Linha icone="bi-shield-check">
              {foraDoAr ? (
                <>
                  <b className="font-semibold text-scv-ink">Seu site está fora do ar agora</b> —
                  liberar a edição não o coloca de volta.
                </>
              ) : (
                <>
                  <b className="font-semibold text-scv-ink">O site atual continua no ar</b> até você
                  publicar as alterações.
                </>
              )}
            </Linha>
            <Linha icone="bi-clock">
              <b className="font-semibold text-scv-ink">Vale {horas} horas</b>
              {temIncluido ? ", a partir de agora." : ", a partir do pagamento."}
            </Linha>
            <Linha icone="bi-tag">
              {temIncluido ? (
                <>
                  <b className="font-semibold text-scv-ink">Já está no seu plano</b>, sem cobrança
                  nenhuma.
                </>
              ) : (
                <>
                  <b className="font-semibold text-scv-ink">Compra única</b>, sem assinatura e sem
                  renovação.
                </>
              )}
            </Linha>
          </ul>

          {/* A letra miuda some quando ha recusa: dizer "ainda restam 2" logo
              acima de "voce ja usou as liberacoes" e a tela discutindo consigo
              mesma. Quem resolve o descompasso e o "Atualizar esta tela". */}
          <div className="mt-5">
            {temIncluido ? (
              <>
                <button
                  type="button"
                  onClick={usarDoPlano}
                  disabled={pendente}
                  className={`${BTN_PRIMARIO} w-full sm:w-auto`}
                >
                  {pendente ? "Liberando…" : "Usar a liberação do meu plano"}
                </button>
                <p hidden={!!erro} className="mt-2.5 text-[12.5px] text-scv-muted">
                  {incluidosRestantes <= 1
                    ? "É a última liberação incluída neste convite."
                    : `Depois desta, ainda ${
                        incluidosRestantes - 1 === 1
                          ? "resta 1 liberação incluída"
                          : `restam ${incluidosRestantes - 1} liberações incluídas`
                      } neste convite.`}
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={gerarPix}
                  disabled={pendente}
                  className={`${BTN_PRIMARIO} w-full sm:w-auto`}
                >
                  {pendente ? "Gerando Pix…" : `Liberar por ${preco} no Pix`}
                </button>
                <p hidden={!!erro} className="mt-2.5 text-[12.5px] text-scv-muted">
                  Pagamento por Pix. O código aparece aqui mesmo.
                </p>
              </>
            )}
          </div>

          {erro ? (
            <>
              <Erro texto={erro} />
              {/* A recusa pode ter nascido de uma tela velha (a janela abriu em
                  outra aba, a cota acabou de ser usada). Recarregar do servidor
                  responde tudo isso — e leva ao editor se ja estiver liberada. */}
              <button
                type="button"
                onClick={reconferir}
                disabled={pendente}
                className={`${BTN_GHOST} mt-2.5`}
              >
                Atualizar esta tela
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Uma das quatro frases: icone discreto + texto que pode ser lido de relance. */
function Linha({ icone, children }: { icone: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <i className={`bi ${icone} mt-[3px] shrink-0 text-[14px] text-scv-violet`} aria-hidden />
      <span className="text-[13.5px] leading-relaxed text-scv-text2">{children}</span>
    </li>
  );
}

/** Recusa do servidor, com a frase que ele mandou (nao inventamos outra). */
function Erro({ texto }: { texto: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13.5px] leading-relaxed text-red-700"
    >
      {texto}
    </p>
  );
}
