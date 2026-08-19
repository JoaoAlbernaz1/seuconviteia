"use client";

// Tela "Lista de presentes" (painel do dono) — layout de duas colunas inspirado
// no fluxo do Wedy, mas na marca do painel (tokens scv-*, roxo, Fraunces):
//
//  ESQUERDA (cartão fixo): capa com a mensagem de boas-vindas + atalhos
//   (Adicionar / Recebidos / Divulgar) + recebimento por Pix (chave/QR) e como a
//   lista aparece no site (Painel × Vitrine).
//  DIREITA: os presentes em linhas COMPACTAS (foto, nome, valor) que expandem
//   para os detalhes (descrição, foto, cotas) — some a "bagunça" do form antigo.
//
// Envio: um único <form> chama `salvarPresentes`. TODOS os campos que viajam
// (Pix, texto, modelo e os 6 arrays gift_*) ficam em <input hidden> SEMPRE
// montados — recolher/expandir é só visual, então os arrays nunca desalinham.
import Link from "next/link";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { salvarPresentes, type AcaoEventoState } from "../../acoes";
import { textosDoNicho } from "@/lib/textos";
import { presentesSugeridos } from "@/lib/sugestoes";
import { EscolherFoto, enviarUpload, useEnvio } from "../../_ui/Uploads";
import { BTN_PRIMARIO, BTN_VOLTAR, CARD, INPUT, SUB, TITULO } from "../../_ui/estilos";
import { TopoCartao } from "../../_ui/TopoCartao";

type GiftModo = "FIXO" | "COTAS";
type Linha = {
  id: number;
  titulo: string;
  descricao: string;
  valor: string;
  foto: string;
  modo: GiftModo;
  cotas?: number;
  aberto: boolean;
};
type ListaModelo = "painel" | "vitrine";

/** "150,00" -> número; ignora pontos de milhar. */
function parseBRL(v: string): number {
  return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
}
function fmtBRL(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

/** Frase curtinha do modo, pra mostrar embaixo do nome (linha compacta). */
function metaDoModo(l: Linha): string {
  const v = parseBRL(l.valor);
  if (l.modo === "COTAS" && l.cotas && v > 0) {
    return `${l.cotas} cotas de R$ ${fmtBRL(v / l.cotas)}`;
  }
  if (v > 0) return `Valor único · R$ ${fmtBRL(v)}`;
  return "Valor livre — o convidado escolhe";
}

export function PresentesCliente({
  eventId,
  voltar,
  host,
  tipo,
  podeVitrine,
  taxaDoPlano,
  listaModeloInicial,
  pixNomeInicial,
  pixChaveInicial,
  pixQrUrlInicial,
  carteiraAtiva,
  presentesTextoInicial,
  giftsIniciais,
}: {
  eventId: string;
  voltar: string;
  host: string;
  tipo: string;
  podeVitrine: boolean;
  /** Taxa do plano da conta, ja formatada (ex.: "3,4%"). */
  taxaDoPlano: string;
  listaModeloInicial: ListaModelo;
  pixNomeInicial: string;
  pixChaveInicial: string;
  pixQrUrlInicial: string;
  carteiraAtiva: boolean;
  presentesTextoInicial: string;
  giftsIniciais: {
    titulo: string;
    descricao: string;
    foto: string;
    modo: GiftModo;
    cotas?: number;
    valor: string;
  }[];
}) {
  // Espelhos do form (o save espera os campos SEMPRE presentes); a edição da
  // chave saiu daqui — o recebimento agora é pela CARTEIRA (tela Recebimentos).
  const [pixNome] = useState(pixNomeInicial);
  const [pixChave] = useState(pixChaveInicial);
  const [pixQrUrl] = useState(pixQrUrlInicial);
  const [presentesTexto, setPresentesTexto] = useState(presentesTextoInicial);
  const [listaModelo, setListaModelo] = useState<ListaModelo>(
    listaModeloInicial === "vitrine" && podeVitrine ? "vitrine" : "painel",
  );
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    (giftsIniciais.length
      ? giftsIniciais
      : [{ titulo: "", descricao: "", foto: "", modo: "FIXO" as const, cotas: undefined, valor: "" }]
    ).map((g, i) => ({ id: i, aberto: false, ...g })),
  );
  const proxId = useRef(linhas.length);
  const [subindoFoto, setSubindoFoto] = useState<number | null>(null);
  const [editandoBoas, setEditandoBoas] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);

  const [state, formAction, pending] = useActionState<AcaoEventoState, FormData>(
    salvarPresentes,
    {},
  );
  const { erro } = useEnvio();

  function atualizar(id: number, patch: Partial<Linha>) {
    setLinhas((xs) => xs.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function remover(id: number) {
    setLinhas((xs) => (xs.length > 1 ? xs.filter((l) => l.id !== id) : xs));
  }
  function adicionar() {
    const id = proxId.current++;
    setLinhas((xs) => [
      ...xs,
      { id, titulo: "", descricao: "", valor: "", foto: "", modo: "FIXO", aberto: true },
    ]);
    setTimeout(() => listaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 60);
  }
  /** Adiciona UM presente-modelo (card da grade) à lista, já preenchido. */
  function adicionarModelo(p: { titulo: string; descricao: string; valor: string; foto?: string }) {
    setLinhas((xs) => [
      ...xs.filter((l) => l.titulo.trim() || l.valor.trim()),
      {
        id: proxId.current++,
        titulo: p.titulo,
        descricao: p.descricao,
        valor: p.valor,
        foto: p.foto ?? "",
        modo: "FIXO" as const,
        aberto: false,
      },
    ]);
    setTimeout(() => listaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 60);
  }
  function sugerirItens() {
    setLinhas(
      presentesSugeridos(tipo).map((p) => ({
        id: proxId.current++,
        titulo: p.titulo,
        descricao: p.descricao,
        valor: p.valor,
        foto: p.foto ?? "",
        modo: "FIXO" as const,
        aberto: false,
      })),
    );
  }
  const [gerandoFoto, setGerandoFoto] = useState<number | null>(null);
  /** Gera/escolhe uma foto pro presente a partir do TÍTULO (IA se configurada;
      senão foto temática do catálogo — ver /api/gerar-foto). */
  async function gerarFotoGift(id: number, titulo: string) {
    if (!titulo.trim()) return;
    setGerandoFoto(id);
    try {
      const r = await fetch("/api/gerar-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo }),
      });
      const data = (await r.json()) as { url?: string };
      if (data.url) atualizar(id, { foto: data.url });
    } catch {
      /* segue sem a foto */
    } finally {
      setGerandoFoto(null);
    }
  }
  async function subirFotoGift(id: number, file: File) {
    setSubindoFoto(id);
    try {
      atualizar(id, { foto: await enviarUpload(file) });
    } catch {
      /* segue sem a foto */
    } finally {
      setSubindoFoto(null);
    }
  }
  function copiarLink() {
    const url = `${typeof window !== "undefined" ? window.location.protocol : "https:"}//${host}/presentes`;
    void navigator.clipboard?.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    });
  }

  const nPresentes = linhas.filter((l) => l.titulo.trim()).length;
  const linkSite = `//${host}/presentes`;

  // Atalho reutilizável (tiles da esquerda).
  const tile =
    "flex flex-col items-start gap-2 rounded-[15px] p-3.5 text-left transition-colors";

  return (
    <form action={formAction} className={`mx-auto w-full max-w-[1120px] scv-fade px-4 py-9 pb-24 sm:px-7`}>
      {/* Campos que SEMPRE viajam (recolher é só visual) */}
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="voltar" value={voltar} />
      <input type="hidden" name="pixNome" value={pixNome} />
      <input type="hidden" name="pixChave" value={pixChave} />
      <input type="hidden" name="pixQrUrl" value={pixQrUrl} />
      <input type="hidden" name="presentesTexto" value={presentesTexto} />
      <input type="hidden" name="listaModelo" value={listaModelo} />

      {/* CABEÇALHO */}
      <div className="flex flex-wrap items-center gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div className="flex-1">
          <h1 className={TITULO}>Lista de presentes</h1>
          <p className={`mt-1 ${SUB}`}>
            Convidados presenteiam por Pix — o dinheiro cai na sua carteira e você resgata quando quiser.
          </p>
        </div>
        <a
          href={linkSite}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-[11px] border border-scv-line bg-scv-card px-4 py-2.5 text-[13px] font-semibold text-scv-ink transition-colors hover:border-scv-dash hover:bg-scv-field sm:inline-flex"
        >
          Ver no site <i className="bi bi-box-arrow-up-right text-[12px]" aria-hidden />
        </a>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[358px_minmax(0,1fr)] lg:gap-7">
        {/* ================= COLUNA ESQUERDA — painel de controle ================= */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px]">
          <div className={`${CARD} overflow-hidden`}>
            <TopoCartao
              icone="bi-gift"
              chapeu="Sua lista de presentes"
              titulo="Presentes"
              acao={
                <button
                  type="button"
                  onClick={() => setEditandoBoas((v) => !v)}
                  aria-label={editandoBoas ? "Pronto" : "Editar mensagem"}
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-scv-line bg-scv-card text-scv-violet transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field"
                >
                  <i className={`bi ${editandoBoas ? "bi-check-lg" : "bi-pencil"} text-[13px]`} aria-hidden />
                </button>
              }
            />
            {/* A mensagem que o convidado lê, em texto de verdade. Antes ela
                vivia dentro da capa em degradê, branca sobre roxo e cortada em
                duas linhas — bonita de longe, ilegível de perto. */}
            {!editandoBoas && (
              <p className="border-b border-scv-line px-4 py-3 text-[13px] leading-relaxed text-scv-muted sm:px-5">
                {presentesTexto?.trim() || "Escreva um recadinho para quem quiser presentear."}
              </p>
            )}

            <div className="flex flex-col gap-4 p-4">
              {editandoBoas && (
                <div className="rounded-[13px] bg-scv-soft p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-scv-ink">Mensagem de boas-vindas</span>
                    <button
                      type="button"
                      onClick={() => setPresentesTexto(textosDoNicho(tipo).teaserPresentes)}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-scv-violet transition hover:brightness-110"
                    >
                      <i className="bi bi-stars" aria-hidden /> Sugerir
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={presentesTexto}
                    onChange={(e) => setPresentesTexto(e.target.value)}
                    placeholder="Sua presença é o maior presente. Mas se quiser me mimar…"
                    className={`${INPUT} resize-y text-[13px] leading-relaxed`}
                  />
                </div>
              )}

              {/* ATALHOS */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={adicionar}
                  className={`${tile} bg-violeta text-white hover:brightness-110`}
                >
                  <i className="bi bi-plus-circle text-[18px]" aria-hidden />
                  <span className="text-[12px] font-semibold leading-tight">Adicionar<br />presente</span>
                </button>
                <Link
                  href={`/painel/${eventId}/cofre`}
                  className={`${tile} bg-scv-soft text-scv-ink hover:bg-scv-field`}
                >
                  <i className="bi bi-heart text-[18px] text-scv-violet" aria-hidden />
                  <span className="text-[12px] font-semibold leading-tight">Presentes<br />recebidos</span>
                </Link>
                <button
                  type="button"
                  onClick={copiarLink}
                  className={`${tile} bg-scv-soft text-scv-ink hover:bg-scv-field`}
                >
                  <i className={`bi ${copiado ? "bi-check-lg text-scv-teal" : "bi-share text-scv-violet"} text-[18px]`} aria-hidden />
                  <span className="text-[12px] font-semibold leading-tight">
                    {copiado ? "Link\ncopiado!" : "Divulgar\np/ convidados"}
                  </span>
                </button>
              </div>

              {/* RECEBIMENTO — o dinheiro entra pela plataforma e cai na CARTEIRA */}
              <div className="rounded-[15px] border border-scv-line p-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-[11px] ${
                      carteiraAtiva ? "bg-scv-teal/10 text-scv-teal" : "bg-scv-lilac text-scv-violet"
                    }`}
                  >
                    <i className={`bi ${carteiraAtiva ? "bi-wallet2" : "bi-lock-fill"} text-[16px]`} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-scv-ink">
                      O dinheiro cai na sua carteira
                    </span>
                    <span className="block truncate text-[12px] text-scv-muted">
                      {carteiraAtiva
                        ? "Carteira ativa — resgate quando quiser."
                        : "Ative a carteira para poder resgatar."}
                    </span>
                  </span>
                </div>
                <a
                  href={`/painel/${eventId}/cofre`}
                  className="mt-3 block w-full rounded-[11px] border border-scv-line bg-scv-card px-4 py-2.5 text-center text-[13px] font-semibold !text-scv-ink transition-colors hover:border-scv-dash hover:bg-scv-field"
                >
                  {carteiraAtiva ? "Ver recebimentos" : "Ativar carteira"}
                </a>
                <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-scv-faint">
                  <i className="bi bi-shield-check" aria-hidden />
                  Taxa de {taxaDoPlano} por presente recebido. Sua chave Pix nunca aparece no site.
                </p>
              </div>

              {/* MODELO da lista */}
              <div>
                <div className="mb-1.5 text-[12px] font-semibold text-scv-ink">Como aparece no site</div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { k: "painel", nome: "Painel", desc: "Foto + lista", trava: false },
                      { k: "vitrine", nome: "Vitrine", desc: "Cards estilo loja", trava: !podeVitrine },
                    ] as const
                  ).map((m) => {
                    const ativo = listaModelo === m.k;
                    return (
                      <button
                        key={m.k}
                        type="button"
                        disabled={m.trava}
                        onClick={() => !m.trava && setListaModelo(m.k)}
                        className={`rounded-[12px] border p-2.5 text-left transition-colors ${
                          ativo ? "border-violeta bg-scv-lilac/50" : "border-scv-line bg-scv-card hover:bg-scv-soft"
                        } ${m.trava ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center gap-1 text-[12.5px] font-semibold text-scv-ink">
                          {m.nome}
                          {m.trava && <i className="bi bi-lock-fill text-[10px]" aria-hidden />}
                        </div>
                        <div className="text-[11px] text-scv-muted">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
                {!podeVitrine && (
                  <p className="mt-1.5 text-[11px] text-scv-faint">A Vitrine está nos planos pagos.</p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ===================== COLUNA DIREITA — os presentes ===================== */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold tracking-[-0.01em] text-scv-ink">Seus presentes</h2>
              <span className="rounded-full bg-scv-lilac px-2 py-0.5 text-[11.5px] font-bold text-scv-violet">
                {nPresentes}
              </span>
            </div>
            <button
              type="button"
              onClick={sugerirItens}
              className="inline-flex items-center gap-1.5 rounded-full bg-scv-lilac px-3 py-1.5 text-[12px] font-semibold text-scv-violet transition hover:brightness-110"
            >
              <i className="bi bi-stars" aria-hidden /> Sugerir lista
            </button>
          </div>

          {/* MODELOS de presente (estilo Wedy): cards com foto + valor; um
              toque adiciona à lista já preenchido. Arte própria (sem stock). */}
          <div className="mb-4">
            <div className="mb-2 text-[12.5px] font-semibold text-scv-muted">
              Modelos prontos — toque para adicionar
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {presentesSugeridos(tipo).map((p) => (
                <button
                  key={p.titulo}
                  type="button"
                  onClick={() => adicionarModelo(p)}
                  className="group overflow-hidden rounded-[14px] border border-scv-line bg-scv-card text-left transition hover:border-violeta/50 hover:shadow-[0_14px_30px_-18px_rgba(109,40,217,0.35)]"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.foto ?? "/presentes-demo/festa.jpg"}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                    <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-scv-violet opacity-0 shadow transition-opacity group-hover:opacity-100">
                      <i className="bi bi-plus-lg text-[13px]" aria-hidden />
                    </span>
                  </div>
                  <div className="p-2.5">
                    <div className="truncate text-[12.5px] font-semibold text-scv-ink">{p.titulo}</div>
                    <div className="mt-0.5 text-[11.5px] font-semibold text-scv-violet">R$ {p.valor}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div ref={listaRef} className="flex flex-col gap-2.5">
            {linhas.map((l) => (
              <div
                key={l.id}
                className={`rounded-[14px] border bg-scv-card transition-colors ${
                  l.aberto ? "border-violeta/40" : "border-scv-line hover:border-scv-dash"
                }`}
              >
                {/* 6 campos SEMPRE presentes (arrays alinhados) */}
                <input type="hidden" name="gift_titulo" value={l.titulo} />
                <input type="hidden" name="gift_descricao" value={l.descricao} />
                <input type="hidden" name="gift_valor" value={l.valor} />
                <input type="hidden" name="gift_foto" value={l.foto} />
                <input type="hidden" name="gift_modo" value={l.modo} />
                <input type="hidden" name="gift_cotas" value={l.modo === "COTAS" ? String(l.cotas ?? "") : ""} />

                {/* LINHA COMPACTA */}
                <div className="flex items-center gap-3 p-2.5">
                  {l.foto ? (
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-[11px] ring-1 ring-scv-line">
                      <Image src={l.foto} alt="" fill unoptimized className="object-cover" />
                    </div>
                  ) : (
                    <div className="grid size-12 shrink-0 place-items-center rounded-[11px] bg-scv-soft text-scv-faint">
                      <i className="bi bi-gift text-[17px]" aria-hidden />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <input
                      value={l.titulo}
                      onChange={(e) => atualizar(l.id, { titulo: e.target.value })}
                      placeholder="Nome do presente"
                      maxLength={140}
                      className="w-full bg-transparent text-[14px] font-semibold text-scv-ink outline-none placeholder:font-normal placeholder:text-scv-faint"
                    />
                    <div className="mt-0.5 truncate text-[11.5px] text-scv-muted">{metaDoModo(l)}</div>
                  </div>

                  <div className="relative w-[104px] shrink-0">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-scv-faint">R$</span>
                    <input
                      value={l.valor}
                      onChange={(e) => atualizar(l.id, { valor: e.target.value })}
                      placeholder="0,00"
                      inputMode="decimal"
                      className={`${INPUT} py-2 pl-7 text-right text-[13.5px]`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => atualizar(l.id, { aberto: !l.aberto })}
                    aria-label="Mais opções"
                    className={`grid size-9 shrink-0 place-items-center rounded-[10px] border border-scv-line text-scv-muted transition hover:border-scv-dash hover:text-scv-ink ${l.aberto ? "bg-scv-soft" : ""}`}
                  >
                    <i className={`bi bi-sliders text-[14px]`} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(l.id)}
                    disabled={linhas.length <= 1}
                    aria-label="Remover"
                    className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-scv-line text-scv-faint transition hover:border-scv-dash hover:text-red-600 disabled:opacity-40"
                  >
                    <i className="bi bi-trash text-[14px]" aria-hidden />
                  </button>
                </div>

                {/* DETALHES (expande) */}
                {l.aberto && (
                  <div className="flex flex-col gap-3 border-t border-scv-line p-3.5">
                    <input
                      value={l.descricao}
                      onChange={(e) => atualizar(l.id, { descricao: e.target.value })}
                      placeholder="Descrição (opcional) — ex.: “o momento mais esperado”"
                      maxLength={240}
                      className={`${INPUT} text-[13px]`}
                    />

                    <div className="flex flex-wrap items-center gap-2.5">
                      <EscolherFoto
                        enviando={subindoFoto === l.id}
                        onFile={(files) => subirFotoGift(l.id, files[0])}
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-scv-line bg-scv-soft px-3 py-1.5 text-[12px] font-semibold text-scv-violet transition hover:border-violeta"
                      >
                        <i className="bi bi-image" aria-hidden />
                        {subindoFoto === l.id ? "Enviando…" : l.foto ? "Trocar foto" : "Adicionar foto"}
                      </EscolherFoto>
                      <button
                        type="button"
                        onClick={() => gerarFotoGift(l.id, l.titulo)}
                        disabled={gerandoFoto === l.id || !l.titulo.trim()}
                        title="Cria uma imagem para este presente a partir do nome"
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-scv-line bg-scv-soft px-3 py-1.5 text-[12px] font-semibold text-scv-violet transition hover:border-violeta disabled:opacity-50"
                      >
                        <i className="bi bi-stars" aria-hidden />
                        {gerandoFoto === l.id ? "Gerando…" : "Gerar imagem"}
                      </button>
                      {l.foto && (
                        <button
                          type="button"
                          onClick={() => atualizar(l.id, { foto: "" })}
                          className="text-[11.5px] font-semibold text-scv-faint transition hover:text-red-600"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>

                    {/* Cobrança: valor único × cotas */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="inline-flex overflow-hidden rounded-[10px] border border-scv-line">
                        <button
                          type="button"
                          onClick={() => atualizar(l.id, { modo: "FIXO" })}
                          className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                            l.modo !== "COTAS" ? "bg-violeta text-white" : "bg-scv-card text-scv-muted hover:bg-scv-soft"
                          }`}
                        >
                          Valor único
                        </button>
                        <button
                          type="button"
                          onClick={() => atualizar(l.id, { modo: "COTAS", cotas: l.cotas ?? 10 })}
                          className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                            l.modo === "COTAS" ? "bg-violeta text-white" : "bg-scv-card text-scv-muted hover:bg-scv-soft"
                          }`}
                        >
                          Em cotas
                        </button>
                      </div>
                      {l.modo === "COTAS" ? (
                        <label className="flex items-center gap-1.5 text-[12px] text-scv-muted">
                          dividir em
                          <input
                            type="number"
                            min={2}
                            max={200}
                            value={l.cotas ?? 10}
                            onChange={(e) =>
                              atualizar(l.id, {
                                cotas: Math.max(2, Math.min(200, parseInt(e.target.value, 10) || 2)),
                              })
                            }
                            className="w-[58px] rounded-[8px] border border-scv-line px-2 py-1 text-center text-[12.5px] font-semibold"
                          />
                          cotas
                        </label>
                      ) : (
                        <span className="text-[11px] text-scv-faint">
                          {parseBRL(l.valor) > 0 ? "O convidado paga o valor cheio" : "Sem valor: o convidado escolhe quanto dar"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={adicionar}
            className="mt-3 w-full rounded-[12px] border border-dashed border-scv-dash py-2.5 text-[13px] font-semibold text-scv-muted transition hover:border-violeta hover:text-scv-violet"
          >
            <i className="bi bi-plus-lg mr-1" aria-hidden /> Adicionar presente
          </button>

          {(erro || state.error) && (
            <p role="alert" className="mt-3 text-sm text-red-600">{erro || state.error}</p>
          )}

          <div className="mt-5 flex items-center justify-end gap-3 border-t border-scv-line pt-4">
            <Link href={voltar} className="text-[13.5px] font-semibold text-scv-muted transition hover:text-scv-ink">
              Cancelar
            </Link>
            <button type="submit" disabled={pending} className={BTN_PRIMARIO}>
              {pending ? "Salvando…" : "Salvar lista"}
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
