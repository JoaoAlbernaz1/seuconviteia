"use client";

// Slider de imagens da tela de entrar — a metade esquerda da referencia que o
// dono mandou: uma foto por vez, troca sozinha a cada 4s, com os pontinhos
// embaixo no centro.
//
// O MESMO movimento da referencia (framer-motion: entra de `x: 50` com opacidade
// 0, sai para `x: -50`, 0,8s), feito em CSS: a referencia traria quatro
// dependencias novas (framer-motion, radix, cva, lucide) para este projeto, que
// nao usa nenhuma delas — e o que se ve na tela e igual. So `opacity` e
// `transform`, que a GPU compoe sem reflow.
//
// `prefers-reduced-motion` para a troca automatica (fica a primeira foto) e
// desliga o deslize; os pontinhos continuam navegaveis por clique e teclado.
import Image from "next/image";
import { useEffect, useState } from "react";

export function SliderImagens({
  imagens,
  intervalo = 4000,
}: {
  imagens: string[];
  /** ms entre as trocas automaticas. */
  intervalo?: number;
}) {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setAtual((i) => (i + 1) % imagens.length), intervalo);
    return () => clearInterval(timer);
  }, [imagens.length, intervalo]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-scv-soft">
      {imagens.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== atual}
          className={`absolute inset-0 transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
            i === atual
              ? "translate-x-0 opacity-100"
              : // Quem JA passou sai para a esquerda; quem ainda vem espera na
                // direita — e o mesmo vai-e-vem do `exit`/`initial` da referencia.
                `opacity-0 ${i < atual ? "-translate-x-12" : "translate-x-12"}`
          }`}
        >
          <Image
            src={src}
            alt=""
            fill
            // Só existe a partir de 1024px (o pai é `hidden lg:block`): abaixo
            // disso o navegador não deve baixar foto nenhuma.
            sizes="(min-width: 1024px) 50vw, 1px"
            priority={i === 0}
            className="object-cover"
          />
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {imagens.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setAtual(i)}
            aria-label={`Ver a foto ${i + 1} de ${imagens.length}`}
            aria-current={i === atual}
            // O ponto visível continua de 8px (como na referência), mas a área
            // de toque vai a 44px pelo `after` — sem isso, no celular/tablet o
            // alvo tem um terço do mínimo acessível.
            className={`relative size-2 cursor-pointer rounded-full transition-colors duration-300 after:absolute after:-inset-[18px] after:content-[''] ${
              i === atual ? "bg-white" : "bg-white/50 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
