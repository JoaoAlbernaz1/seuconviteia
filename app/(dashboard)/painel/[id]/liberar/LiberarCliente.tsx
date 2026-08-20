"use client";

// O miolo da tela de liberar: o que a liberacao abre, quanto custa e UMA acao —
// e o Pix quando ela for a acao escolhida.
//
// Duas portas, nunca as duas ao mesmo tempo: quem tem liberacao incluida no
// plano ve so a gratuita (mostrar o Pix ao lado seria vender o que ela ja
// pagou); quem nao tem ve so o Pix. Ao voltar `{ ok: true }` de qualquer uma das
// duas, a pessoa vai direto para o editor.
//
// O PRECO vive fora do botao, na area de decisao: escondido no rotulo, o valor
// so era descoberto na hora do clique. A mecanica do Pix (QR + copia-e-cola +
// "Copiado!") e a mesma do modal de presentear do site — aqui vestida com os
// tokens do painel.
import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RECUSA_FESTA_PASSOU } from "@/lib/edicao";
import { comprarPasseEdicao, usarPasseIncluido } from "./acoes";
import { edicaoJaLiberada } from "./status";
import { BTN_GHOST, BTN_PRIMARIO, PILL_NO_AR } from "../../_ui/estilos";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (cents: number) => brl.format(cents / 100);

/**
 * O ritmo do "ja caiu?" enquanto o QR esta na tela.
 *
 * Rapido nos primeiros minutos (e quando a pessoa esta com o app do banco
 * aberto), calmo depois, e com TETO: a 12 consultas por minuto, uma aba visivel
 * esquecida das 18h as 8h passava de 10 mil consultas por uma compra de R$
 * 19,90. Passado o teto a tela para de perguntar sozinha e passa a bola para o
 * botao "Ja paguei".
 */
const CHECAR_RAPIDO_MS = 5_000;
const CHECAR_LENTO_MS = 15_000;
const RAPIDO_ATE_MS = 2 * 60_000;
const PARAR_APOS_MS = 20 * 60_000;

export function LiberarCliente({
  eventId,
  titulo,
  precoCents,
  horas,
  temIncluido,
  incluidosRestantes,
  encerrado,
  foraDoAr,
  pixNoConvite,
}: {
  eventId: string;
  /** Nome do convite: no Pix a capa pode ter saido da tela (celular). */
  titulo: string;
  precoCents: number;
  horas: number;
  /** Sobra liberacao incluida no plano para ESTE convite. */
  temIncluido: boolean;
  incluidosRestantes: number;
  /** A festa ja passou: nao ha o que liberar (nem o que vender). */
  encerrado: boolean;
  /** O dono tirou o site do ar — a frase da garantia muda. */
  foraDoAr: boolean;
  /** O convite mostra uma chave Pix hoje: existe conserto de graça a apontar. */
  pixNoConvite: boolean;
}) {
  const router = useRouter();
  const [pix, setPix] = useState<{ code: string; qr: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pollParado, setPollParado] = useState(false);
  const [pendente, start] = useTransition();
  const cabecalhoPix = useRef<HTMLHeadingElement>(null);

  const preco = fmt(precoCents);
  const editor = `/painel/criar?id=${eventId}`;

  // O botao que estava em foco some quando o QR entra: sem isto o foco cai no
  // <body> e quem navega por teclado ou leitor de tela nao fica sabendo que a
  // tela inteira mudou de assunto.
  useEffect(() => {
    if (pix) cabecalhoPix.current?.focus();
  }, [pix]);

  // Enquanto o QR esta na tela, pergunta de tempos em tempos se a janela abriu
  // — quem abre e o webhook, depois de reconsultar o pagamento. Sem isto, a
  // linha "a edicao abre sozinha" seria mentira.
  useEffect(() => {
    if (!pix) return;
    let vivo = true;
    let conferindo = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();

    function agendar() {
      if (!vivo) return;
      const decorrido = Date.now() - inicio;
      if (decorrido >= PARAR_APOS_MS) {
        setPollParado(true);
        return;
      }
      timer = setTimeout(tick, decorrido < RAPIDO_ATE_MS ? CHECAR_RAPIDO_MS : CHECAR_LENTO_MS);
    }

    async function conferir() {
      if (!vivo || conferindo) return;
      conferindo = true;
      let aberta = false;
      try {
        aberta = await edicaoJaLiberada(eventId);
      } catch {
        // Rede caiu: nao e resposta "nao liberou", e sim "nao sei". O proximo
        // agendamento pergunta de novo, e o botao "Ja paguei" continua de pe.
      }
      conferindo = false;
      if (!vivo) return;
      // Liberou: a tela vai embora, entao nao reagenda nada.
      if (aberta) {
        router.push(editor);
        return;
      }
      agendar();
    }

    // Reagendar no fim de CADA consulta (em vez de `setInterval`) e o que impede
    // as chamadas de empilharem quando uma resposta demora mais que o intervalo.
    function tick() {
      // Aba escondida nao consulta — mas o ciclo continua vivo.
      if (document.hidden) {
        agendar();
        return;
      }
      void conferir();
    }

    // Voltar para a aba e o momento EXATO em que a pessoa pagou no celular:
    // conferir na hora evita os segundos de "sera que deu certo?".
    function aoVoltar() {
      if (!vivo || document.hidden) return;
      if (timer) clearTimeout(timer);
      void conferir();
    }

    document.addEventListener("visibilitychange", aoVoltar);
    agendar();
    return () => {
      vivo = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [pix, eventId, editor, router]);

  function usarDoPlano() {
    setErro(null);
    start(async () => {
      const r = await usarPasseIncluido(eventId);
      if (r.ok) {
        router.push(editor);
        return;
      }
      setErro(r.erro);
      // A recusa aqui MATA este caminho (cota estourada, assinatura vencida).
      // Sem recarregar, o botao que acabou de falhar continuaria de pe e o
      // caminho que funciona — o Pix — ficaria escondido. O servidor volta com
      // ele; se a janela ja tiver aberto, a propria pagina manda para o editor.
      router.refresh();
    });
  }

  function gerarPix() {
    setErro(null);
    start(async () => {
      const r = await comprarPasseEdicao(eventId);
      if (r.ok) {
        setPix({ code: r.pixCode, qr: r.pixQrUrl });
        return;
      }
      setErro(r.erro);
      // Recusa aqui costuma ser tela velha (a janela abriu em outra aba, a festa
      // encerrou): recarregar troca a tela pelo que e verdade agora.
      router.refresh();
    });
  }

  /**
   * "Ja paguei — conferir agora": pergunta ao servidor como as coisas estao
   * AGORA. Se a janela abriu, vai para o editor; se nao, recarrega a tela.
   *
   * E a saida de emergencia do estado do Pix: sem ela, quem PAGOU e caiu num
   * poll morto (sessao vencida, rede que voltou depois do teto) ficaria olhando
   * um QR para sempre.
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
      /* clipboard indisponivel: o codigo continua na tela, selecionavel */
    }
  }

  // A festa ja passou: as duas actions recusariam com esta mesma frase. Dizer
  // antes do clique evita o botao que so serve para dar erro.
  if (encerrado) {
    return (
      <div className="border-t border-scv-line px-4 py-5 sm:px-5">
        <p className="text-[14px] leading-relaxed text-scv-text2">{RECUSA_FESTA_PASSOU}</p>
        <Link href="/painel/criar" className={`${BTN_GHOST} mt-4 inline-block`}>
          Criar um convite novo
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t border-scv-line px-4 py-5 sm:px-5">
      {/* A `key` faz a troca opcoes -> Pix reaparecer com o fade do painel, em
          vez de o cartao inteiro pular de conteudo. `scv-fade` e opacidade e
          respeita `prefers-reduced-motion` (globals.css). */}
      <div key={pix ? "pix" : "opcoes"} className="scv-fade">
        {pix ? (
          <div>
            <h2
              ref={cabecalhoPix}
              tabIndex={-1}
              className="font-display text-[19px] font-semibold leading-tight text-scv-ink outline-none"
            >
              Pague {preco} no Pix
            </h2>
            {/* A ancora do que esta sendo pago: no celular a capa ja saiu da
                tela quando o QR aparece. */}
            <p className="mt-1 text-[12.5px] text-scv-muted">
              Liberando: <strong className="font-semibold text-scv-ink">{titulo}</strong>
            </p>

            <div className="mt-4 flex flex-col items-center gap-4 rounded-[16px] border border-scv-line bg-scv-field p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
              {/* O `pixQrUrl` pode voltar vazio do provedor (`qr_code_base64` e
                  `ticket_url` ausentes) — e `<Image src="">` quebra a tela
                  justo onde a cobranca JA existe. Sem QR, o copia-e-cola sozinho
                  e caminho completo. */}
              {pix.qr ? (
                <div className="relative size-[200px] shrink-0 overflow-hidden rounded-[12px] bg-white ring-1 ring-black/5">
                  <Image
                    src={pix.qr}
                    alt="QR Code do Pix para liberar a edição"
                    fill
                    sizes="200px"
                    className="object-contain p-1.5"
                    unoptimized
                  />
                </div>
              ) : null}

              <div className="w-full min-w-0">
                <p className="text-[13.5px] font-semibold text-scv-ink">
                  {pix.qr
                    ? "Aponte a câmera do seu banco — ou copie o código."
                    : "Copie o código e cole no app do seu banco."}
                </p>
                {/* Campo (e nao paragrafo cortado): o codigo Pix inteiro precisa
                    dar para selecionar e copiar na mao quando o clipboard do
                    navegador nao deixa. Um toque seleciona tudo. */}
                <label htmlFor="pix-codigo" className="sr-only">
                  Código Pix copia e cola
                </label>
                <input
                  id="pix-codigo"
                  readOnly
                  value={pix.code}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  className="mt-2 min-h-[44px] w-full rounded-[10px] border border-scv-line bg-scv-card px-3 font-mono text-[12px] text-scv-muted outline-none focus:border-violeta focus:ring-2 focus:ring-violeta/15"
                />
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

            <div
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl bg-scv-teal/10 px-3.5 py-3 text-[13.5px] text-scv-teal-ink"
            >
              <div className="flex items-center gap-2.5 font-semibold">
                <span className="size-2 shrink-0 rounded-full bg-scv-teal-ink" />
                {pollParado ? "Já pagou? Toque para conferir" : "Aguardando pagamento"}
              </div>
              <p className="mt-1 text-scv-text2">
                {pollParado
                  ? "Esta tela está aberta há um tempo, então parei de conferir sozinho."
                  : "Assim que o Pix cair, a edição abre sozinha."}
              </p>
            </div>

            <button
              type="button"
              onClick={reconferir}
              disabled={pendente}
              className={`${BTN_GHOST} mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
            >
              {pendente ? "Conferindo…" : "Já paguei — conferir agora"}
            </button>

            <Garantias horas={horas} foraDoAr={foraDoAr} className="mt-5" />
          </div>
        ) : (
          <div>
            <Garantias horas={horas} foraDoAr={foraDoAr} incluido={temIncluido} comOQueAbre />

            {/* A recusa vem ANTES da decisao porque e ela que explica por que a
                decisao mudou de cara ("a cota acabou" -> agora e o Pix). Depois
                dela a tela ja se recarregou, entao o que esta logo abaixo e o
                caminho que funciona, e nao o botao que acabou de falhar. */}
            {erro ? <Erro texto={erro} /> : null}

            {/* A decisao: quanto custa (ou que ja esta pago) ao lado do botao.
                Separada da lista por uma linha, porque ler e decidir sao dois
                momentos. */}
            <div className="mt-6 flex flex-col gap-3 border-t border-scv-line pt-5 sm:flex-row sm:items-end sm:justify-between">
              {temIncluido ? (
                <>
                  {/* Some quando ha recusa: "ainda restam 2" logo acima de "voce
                      ja usou as liberacoes" e a tela discutindo consigo mesma. */}
                  <div hidden={!!erro}>
                    <span className={`${PILL_NO_AR} inline-block`}>Incluído no seu plano</span>
                    <p className="mt-2 text-[12.5px] text-scv-muted">
                      {incluidosRestantes <= 1
                        ? "Esta é a última liberação incluída neste convite."
                        : `Depois desta, ainda ${
                            incluidosRestantes - 1 === 1
                              ? "resta 1 liberação"
                              : `restam ${incluidosRestantes - 1} liberações`
                          } neste convite.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={usarDoPlano}
                    disabled={pendente}
                    className={`${BTN_PRIMARIO} w-full sm:w-auto sm:whitespace-nowrap`}
                  >
                    {pendente ? "Liberando…" : "Usar minha liberação incluída"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-scv-muted">
                      Passe de edição
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <strong className="font-display text-[28px] font-semibold leading-none text-scv-ink">
                        {preco}
                      </strong>
                      <span className="text-[12.5px] text-scv-muted">
                        · {horas} horas · Pix
                      </span>
                    </div>
                  </div>
                  {/* "Gerar Pix de R$ 19,90" e nao "Liberar por R$ 19,90": o
                      rotulo antigo prometia que a edicao abria no clique, e ela
                      so abre quando o Pix cai. */}
                  <button
                    type="button"
                    onClick={gerarPix}
                    disabled={pendente}
                    className={`${BTN_PRIMARIO} w-full sm:w-auto`}
                  >
                    {pendente ? "Gerando Pix…" : `Gerar Pix de ${preco}`}
                  </button>
                </>
              )}
            </div>

            {/* O caminho GRÁTIS, dito na única tela onde se paga.
                Vem DEPOIS da decisão de propósito: acima dela roubaria a atenção
                de quem precisa liberar o site inteiro; escondido, deixaria
                alguém pagar R$ 19,90 (ou gastar a liberação do plano) por aquilo
                que decidimos não vender — consertar a chave que manda o dinheiro
                do convidado para um estranho.
                `!text-` E `!underline` pelo mesmo motivo documentado em
                `ListaConvites`: regra de `a` fora das @layer vence utility. */}
            {pixNoConvite ? (
              <div className="mt-5 border-t border-scv-line pt-4">
                <p className="text-[12.5px] leading-relaxed text-scv-muted">
                  Só a chave Pix do convite está errada? Isso se conserta de graça, sem
                  passe e sem gastar liberação do plano.
                </p>
                <Link
                  href={`/painel/${eventId}/cofre`}
                  className="-mb-2 inline-flex min-h-[44px] items-center text-[12.5px] font-semibold !text-scv-ink !underline underline-offset-4 transition-colors hover:!text-scv-muted"
                >
                  Corrigir a chave Pix em Recebimentos
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * O que a liberacao entrega, em frases curtas de UMA linha.
 *
 * Duas colunas no desktop e uma no celular: em coluna unica larga, quatro frases
 * viravam um paredao de texto — e nada aqui e letra miuda, e o corpo da tela.
 * No estado do Pix a primeira frase sai (o que abre ja foi lido antes do clique)
 * e as tres que restam continuam no MESMO peso: quem esta pagando e justamente
 * quem precisa das garantias legiveis.
 *
 * A ULTIMA linha muda com o caminho. "Compra unica, sem assinatura e sem
 * renovacao" existe para tirar o medo de mensalidade de quem VAI PAGAR; dita a
 * quem esta usando a liberacao do plano, ela fala de uma compra que nao existe.
 * O desenho e o peso sao os mesmos — muda a frase, que precisa ser verdade nos
 * dois estados.
 */
function Garantias({
  horas,
  foraDoAr,
  incluido = false,
  comOQueAbre = false,
  className = "",
}: {
  horas: number;
  foraDoAr: boolean;
  /** A liberacao vem da cota do plano (nao ha compra). */
  incluido?: boolean;
  comOQueAbre?: boolean;
  className?: string;
}) {
  return (
    <ul className={`grid gap-x-6 gap-y-3 sm:grid-cols-2 ${className}`}>
      {comOQueAbre ? (
        <Linha icone="bi-pencil">
          <b className="font-semibold text-scv-ink">Edição completa:</b> textos, data, local, capa,
          template, cores e seções.
        </Linha>
      ) : null}
      <Linha icone="bi-shield-check">
        {foraDoAr ? (
          <>
            <b className="font-semibold text-scv-ink">Seu site está fora do ar agora</b> — liberar a
            edição não o coloca de volta.
          </>
        ) : (
          <>
            <b className="font-semibold text-scv-ink">O site atual continua no ar</b> até você
            publicar.
          </>
        )}
      </Linha>
      <Linha icone="bi-clock">
        <b className="font-semibold text-scv-ink">Acesso por {horas} horas.</b>
      </Linha>
      <Linha icone="bi-tag">
        {incluido ? (
          <>
            <b className="font-semibold text-scv-ink">Sem cobrança:</b> não consome nada além da
            liberação do seu plano.
          </>
        ) : (
          <>
            <b className="font-semibold text-scv-ink">Compra única</b>, sem assinatura e sem
            renovação.
          </>
        )}
      </Linha>
    </ul>
  );
}

/** Uma das frases: icone discreto + texto que pode ser lido de relance. */
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
