"use client";

// O painel visual da tela de entrar: um slide a cada 6s, com legenda.
//
// Por que ele existe: a porta de entrada era um cartão sozinho no meio de um
// fundo vazio — e cartão centralizado é a cara de todo login gerado por IA. Aqui
// a metade esquerda mostra O QUE a pessoa vai construir, com as três coisas que
// o convite entrega de verdade: contagem regressiva, confirmação de presença e
// presente no Pix. Nada de promessa que o produto não cumpre.
//
// As imagens são as do PRÓPRIO modelo (`public/templates-demo/quinze-anos`), que
// o produto já serve na galeria — não banco de imagem de terceiro, e nenhuma
// foto de pessoa real. Como as três são fundos abstratos (bokeh rosé), sozinhas
// elas não diferenciariam um slide do outro: por isso cada slide carrega, por
// cima, uma PEÇA DE VIDRO com o que a legenda está prometendo, montada em
// markup. É o que faz a vitrine mostrar o produto, e não um degradê.
//
// Sem framer-motion de propósito: o repo não tem a dependência, e dois elementos
// aninhados resolvem — o de fora faz a troca (opacidade, 1,2s) e o de dentro o
// deslize lento da imagem (transform, 7s). Só `opacity`/`transform`, que a GPU
// compõe sem reflow. `prefers-reduced-motion` desliga a troca automática: fica o
// primeiro slide parado, e os pontinhos continuam navegáveis.
import Image from "next/image";
import { useEffect, useState } from "react";

/** Vidro sobre o bokeh: a moldura comum das três provas. */
function Vidro({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[292px] rounded-[20px] border border-white/15 bg-white/10 p-4 shadow-[0_40px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      {children}
    </div>
  );
}

function Contagem() {
  return (
    <Vidro>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
        Faltam
      </p>
      <div className="mt-2.5 flex gap-2">
        {[
          ["128", "dias"],
          ["06", "horas"],
          ["24", "min"],
        ].map(([n, r]) => (
          <div
            key={r}
            className="flex-1 rounded-[13px] bg-black/25 py-2.5 text-center ring-1 ring-inset ring-white/10"
          >
            <div className="font-display text-[22px] font-semibold leading-none text-white">{n}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/55">{r}</div>
          </div>
        ))}
      </div>
    </Vidro>
  );
}

function Confirmacoes() {
  return (
    <Vidro>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
          Confirmados
        </p>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] font-semibold text-white">
          12
        </span>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {[
          ["Ana Beatriz", "+ 2 acompanhantes"],
          ["Rodrigo Alves", "sozinho"],
        ].map(([nome, extra]) => (
          <li
            key={nome}
            className="flex items-center gap-2.5 rounded-[13px] bg-black/25 px-3 py-2 ring-1 ring-inset ring-white/10"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-emerald-200">
              <i className="bi bi-check2 text-[13px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-white">
              {nome}
            </span>
            <span className="shrink-0 text-[11px] text-white/55">{extra}</span>
          </li>
        ))}
      </ul>
    </Vidro>
  );
}

function Presente() {
  return (
    <Vidro>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
        Presente recebido
      </p>
      <div className="mt-2.5 flex items-center gap-3 rounded-[13px] bg-black/25 px-3 py-3 ring-1 ring-inset ring-white/10">
        <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-white/15 text-white">
          <i className="bi bi-gift text-[16px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-white">Jantar dos sonhos</div>
          <div className="text-[11px] text-white/55">Pix confirmado · agora</div>
        </div>
        <div className="font-display text-[17px] font-semibold text-white">R$ 150</div>
      </div>
    </Vidro>
  );
}

const SLIDES = [
  {
    src: "/templates-demo/quinze-anos/capa-desktop.jpg",
    titulo: "A capa, com o tempo correndo",
    texto: "A foto dela em tela cheia e a contagem regressiva até a festa.",
    Prova: Contagem,
  },
  {
    src: "/templates-demo/quinze-anos/g1.jpg",
    titulo: "Quem vai, você já sabe",
    texto: "O convidado confirma pelo celular e a lista chega pronta no painel.",
    Prova: Confirmacoes,
  },
  {
    src: "/templates-demo/quinze-anos/capa.jpg",
    titulo: "Presente no Pix",
    texto: "Ele paga pelo banco dele e a confirmação vem sozinha, sem você cobrar.",
    Prova: Presente,
  },
];

const TROCA_MS = 6000;

export function Vitrine() {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setAtual((i) => (i + 1) % SLIDES.length), TROCA_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative hidden overflow-hidden bg-[#2b0f1f] lg:block">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== atual}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
            i === atual ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`absolute inset-0 transition-transform duration-[7000ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
              i === atual ? "scale-100" : "scale-[1.07]"
            }`}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              // Só renderiza a partir de 1024px (o painel é `hidden lg:block`),
              // então abaixo disso o navegador não deve baixar imagem nenhuma.
              sizes="(min-width: 1024px) 55vw, 1px"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        </div>
      ))}

      {/* Véu LEVE: o suficiente para o texto ter contraste em qualquer slide (um
          modelo claro pode entrar amanhã) sem apagar o bokeh — véu pesado
          transformava a vitrine num retângulo preto. O de baixo é só um pé de
          sombra, onde mora a legenda. */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3d1226]/45 via-transparent to-[#3b1a78]/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/30" />

      <div className="relative flex h-full flex-col justify-between p-9 xl:p-11">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-9 place-items-center rounded-[11px] text-[13px] font-bold text-white"
            style={{ background: "var(--grad-faisca)" }}
            aria-hidden
          >
            sc
          </span>
          <span className="text-[13.5px] font-semibold tracking-tight text-white/90">
            seuconvite
          </span>
        </div>

        {/* A prova, no meio: é ela que muda de assunto de verdade entre um slide
            e outro. Fica acima da legenda, com `relative` para vencer o véu. */}
        <div className="relative flex-1 py-8">
          {SLIDES.map(({ src, Prova }, i) => (
            <div
              key={src}
              aria-hidden={i !== atual}
              className={`absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
                i === atual
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-4 opacity-0"
              }`}
            >
              <Prova />
            </div>
          ))}
        </div>

        <div>
          {/* `min-h` fixa a altura das duas linhas: sem isso, a legenda de três
              linhas empurrava os pontinhos a cada troca. */}
          <div className="relative min-h-[104px]">
            {SLIDES.map((slide, i) => (
              <div
                key={slide.src}
                aria-hidden={i !== atual}
                className={`transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
                  i === atual
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none absolute inset-x-0 top-0 translate-y-3 opacity-0"
                }`}
              >
                <h2 className="font-display text-[27px] font-semibold leading-[1.15] tracking-tight text-white xl:text-[29px]">
                  {slide.titulo}
                </h2>
                <p className="mt-2 max-w-[380px] text-[14px] leading-relaxed text-white/75">
                  {slide.texto}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-1">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ver: ${slide.titulo}`}
                aria-current={i === atual}
                // Alvo de toque de 44px sem engordar o desenho: a área vive no
                // padding, o pontinho é o filho de 6px.
                className="group grid h-11 w-7 cursor-pointer place-items-center"
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    i === atual
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/45 group-hover:bg-white/80"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
