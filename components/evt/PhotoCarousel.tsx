"use client";

/**
 * PhotoCarousel — carrossel coverflow (Swiper) das fotos do ensaio. Slides
 * retrato, autoplay suave, arrasto; paginacao rosa/framboesa do tema.
 *
 * ROBUSTEZ: o `loop` coverflow do Swiper precisa de slides suficientes pra
 * preencher os DOIS lados do slide central; com poucas fotos apareciam BURACOS
 * ao arrastar. Aqui repetimos o array ate um minimo seguro (a repeticao some no
 * loop infinito) e tratamos o caso de 1 foto sem carrossel.
 */
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

const CSS = `
  .evt-swiper { padding-bottom: 52px; }
  .evt-swiper .swiper-slide { width: 270px; }
  @media (min-width: 768px) { .evt-swiper .swiper-slide { width: 330px; } }
  .evt-swiper .swiper-pagination-bullet { background: var(--ev-rosa); opacity: 0.4; }
  .evt-swiper .swiper-pagination-bullet-active { background: var(--ev-framboesa); opacity: 1; }
  .swiper-3d .swiper-slide-shadow-left,
  .swiper-3d .swiper-slide-shadow-right { background-image: none; }
`;

function Foto({ src, n }: { src: string; n: number }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-card)] shadow-[0_36px_70px_-44px_rgba(46,26,32,0.6)]">
      <Image
        src={src}
        alt={`Ensaio — foto ${n}`}
        fill
        sizes="(max-width: 768px) 270px, 330px"
        className="object-cover"
      />
      <span className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] ring-1 ring-inset ring-black/10" />
    </div>
  );
}

// Minimo de slides p/ o loop coverflow nao deixar buraco (cobre telas largas,
// que mostram ~4 slides ao mesmo tempo).
const MIN_SLIDES = 9;

export function PhotoCarousel({ fotos }: { fotos: string[] }) {
  if (fotos.length === 0) return null;

  // 1 foto: loop/autoplay com um unico slide buga — mostra centralizada, sem carrossel.
  if (fotos.length === 1) {
    return (
      <div className="flex w-full justify-center px-6">
        <div className="w-[270px] md:w-[330px]">
          <Foto src={fotos[0]} n={1} />
        </div>
      </div>
    );
  }

  const slides =
    fotos.length >= MIN_SLIDES
      ? fotos
      : Array.from({ length: Math.ceil(MIN_SLIDES / fotos.length) }, () => fotos).flat();

  return (
    <div className="w-full">
      <style>{CSS}</style>
      <Swiper
        className="evt-swiper"
        spaceBetween={36}
        effect="coverflow"
        grabCursor
        centeredSlides
        loop
        slidesPerView="auto"
        autoplay={{ delay: 2400, disableOnInteraction: false }}
        coverflowEffect={{ rotate: 0, stretch: 0, depth: 120, modifier: 2.4, slideShadows: false }}
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Autoplay, Pagination]}
      >
        {slides.map((src, i) => (
          <SwiperSlide key={`${src}-${i}`}>
            <Foto src={src} n={(i % fotos.length) + 1} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
