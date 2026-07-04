// CAPA — Aniversário Tropical Festa. Server component, animação 100% CSS scoped
// (prefixo `tf-`). Clima VIBRANTE: fundo em gradiente multi-tom derivado dos tokens
// (--ev-*), formas orgânicas (blobs + folhas via clip-path) flutuando, confete e
// foto integrada num anel colorido. Nome e IDADE grandes; data/local logo no topo.
// Themeável por qualquer paleta (nada de hex de marca). Reduced-motion: estático.
import Image from "next/image";

type Confete = { top: string; left: string; size: number; cor: string; delay: string; dur: string };

// Confete espalhado — cores só de tokens/branco (funciona em qualquer paleta).
const CONFETE: Confete[] = [
  { top: "12%", left: "8%", size: 14, cor: "rgba(255,255,255,0.9)", delay: "0s", dur: "6s" },
  { top: "22%", left: "88%", size: 18, cor: "var(--ev-rose)", delay: "0.8s", dur: "7s" },
  { top: "68%", left: "6%", size: 12, cor: "var(--ev-blush)", delay: "1.4s", dur: "6.5s" },
  { top: "78%", left: "82%", size: 16, cor: "rgba(255,255,255,0.75)", delay: "0.4s", dur: "7.5s" },
  { top: "40%", left: "4%", size: 9, cor: "var(--ev-framboesa-bright)", delay: "1s", dur: "5.5s" },
  { top: "16%", left: "60%", size: 10, cor: "rgba(255,255,255,0.85)", delay: "1.8s", dur: "6.2s" },
  { top: "85%", left: "40%", size: 13, cor: "var(--ev-rose)", delay: "0.2s", dur: "7.2s" },
  { top: "50%", left: "92%", size: 11, cor: "var(--ev-blush)", delay: "1.2s", dur: "6.8s" },
];

export function CapaTropical({
  nome,
  idade,
  kicker,
  data,
  horario,
  local,
  fotoUrl,
  fotoDesktopUrl,
}: {
  nome: string;
  idade?: number;
  kicker: string;
  data: string;
  horario?: string;
  local?: string;
  fotoUrl?: string;
  fotoDesktopUrl?: string;
}) {
  const foto = fotoUrl || fotoDesktopUrl || "";
  const inicial = nome.trim().charAt(0).toUpperCase() || "•";

  return (
    <section
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 90% at 14% 8%, color-mix(in srgb, var(--ev-framboesa-bright) 88%, white) 0%, transparent 52%)," +
          "radial-gradient(115% 90% at 88% 16%, color-mix(in srgb, var(--ev-rose) 82%, white) 0%, transparent 50%)," +
          "radial-gradient(140% 110% at 50% 128%, var(--ev-framboesa-deep) 0%, transparent 62%)," +
          "linear-gradient(158deg, var(--ev-rosa) 0%, var(--ev-framboesa) 54%, var(--ev-framboesa-deep) 100%)",
      }}
    >
      {/* ── Formas orgânicas de fundo (blobs + folhas), flutuando ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Blob quente no canto */}
        <span
          className="tf-drift absolute -left-[14%] -top-[10%] h-[46vw] w-[46vw] max-h-[420px] max-w-[420px] opacity-40 blur-[2px]"
          style={{
            background: "radial-gradient(circle at 40% 40%, color-mix(in srgb, var(--ev-rose) 75%, white), transparent 70%)",
            borderRadius: "58% 42% 44% 56% / 55% 48% 52% 45%",
          }}
        />
        {/* Blob framboesa embaixo */}
        <span
          className="tf-drift absolute -bottom-[16%] -right-[12%] h-[52vw] w-[52vw] max-h-[480px] max-w-[480px] opacity-45 blur-[2px]"
          style={{
            animationDelay: "1.2s",
            background: "radial-gradient(circle at 60% 40%, color-mix(in srgb, var(--ev-framboesa-bright) 80%, white), transparent 72%)",
            borderRadius: "42% 58% 60% 40% / 50% 42% 58% 50%",
          }}
        />
        {/* Folha tropical — clip-path, canto superior direito */}
        <span
          className="tf-sway absolute right-[3%] top-[6%] h-[24vw] w-[13vw] max-h-[220px] max-w-[120px] opacity-25"
          style={{
            background: "linear-gradient(150deg, rgba(255,255,255,0.85), color-mix(in srgb, var(--ev-rose) 60%, white))",
            clipPath: "polygon(50% 0%, 78% 22%, 66% 62%, 50% 100%, 34% 62%, 22% 22%)",
          }}
        />
        {/* Folha tropical — canto inferior esquerdo */}
        <span
          className="tf-sway absolute bottom-[8%] left-[4%] h-[20vw] w-[11vw] max-h-[190px] max-w-[104px] opacity-20"
          style={{
            animationDelay: "0.9s",
            background: "linear-gradient(150deg, rgba(255,255,255,0.8), color-mix(in srgb, var(--ev-blush) 70%, white))",
            clipPath: "polygon(50% 0%, 76% 24%, 64% 60%, 50% 100%, 36% 60%, 24% 24%)",
          }}
        />
        {/* Confete */}
        {CONFETE.map((c, i) => (
          <span
            key={i}
            className="tf-float absolute rounded-full"
            style={{
              top: c.top,
              left: c.left,
              width: c.size,
              height: c.size,
              background: c.cor,
              animationDelay: c.delay,
              animationDuration: c.dur,
              boxShadow: "0 4px 10px -4px rgba(0,0,0,0.25)",
            }}
          />
        ))}
      </div>

      {/* ── Conteúdo ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-[860px] flex-col items-center gap-[clamp(1.1rem,3.4vw,1.9rem)] px-[clamp(1.5rem,6vw,3rem)] py-[clamp(4rem,9vw,6.5rem)] text-center">
        {/* Foto no anel colorido */}
        <div className="tf-pop relative" style={{ animationDelay: "0.05s" }}>
          <span
            aria-hidden
            className="tf-spin absolute -inset-[9px] rounded-full opacity-90"
            style={{
              background:
                "conic-gradient(from 0deg, var(--ev-rose), rgba(255,255,255,0.95), var(--ev-framboesa-bright), var(--ev-blush), var(--ev-rose))",
            }}
          />
          <span aria-hidden className="absolute -inset-[2px] rounded-full bg-white/70" />
          <div className="relative aspect-square w-[clamp(8.5rem,32vw,12rem)] overflow-hidden rounded-full shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
            {foto ? (
              <Image
                src={foto}
                alt={`Foto de ${nome}`}
                fill
                priority
                sizes="(max-width: 768px) 40vw, 12rem"
                className="object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: "linear-gradient(150deg, var(--ev-rose), var(--ev-framboesa))" }}
              >
                <span className="font-evt-script text-[clamp(3rem,10vw,4.5rem)] leading-none text-white/95">
                  {inicial}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Eyebrow */}
        <p
          className="tf-pop rounded-full bg-white/15 px-4 py-1.5 font-evt-util text-[0.66rem] uppercase tracking-[0.34em] text-white/95 backdrop-blur-sm"
          style={{ animationDelay: "0.14s" }}
        >
          {kicker}
        </p>

        {/* Nome — grande, cursiva */}
        <h1
          className="tf-pop font-evt-script leading-[0.92] text-[clamp(3.2rem,14vw,7.5rem)] text-white [text-shadow:0_10px_34px_rgba(0,0,0,0.28)]"
          style={{ animationDelay: "0.2s" }}
        >
          {nome}
        </h1>

        {/* Idade — destaque grande */}
        {idade != null && (
          <p
            className="tf-pop inline-flex items-baseline gap-2 rounded-full border border-white/40 bg-white/15 px-6 py-2 font-evt-display text-[clamp(1.4rem,5vw,2.1rem)] uppercase tracking-[0.12em] text-white backdrop-blur-sm"
            style={{ animationDelay: "0.28s" }}
          >
            <span className="text-[1.5em] font-semibold leading-none tabular-nums">{idade}</span>
            <span>anos</span>
          </p>
        )}

        {/* Data / horário — logo no início */}
        <p
          className="tf-pop font-evt-util text-[0.9rem] uppercase tracking-[0.26em] text-white [text-shadow:0_4px_14px_rgba(0,0,0,0.25)]"
          style={{ animationDelay: "0.36s" }}
        >
          {data}
          {horario ? ` · ${horario}` : ""}
        </p>

        {/* Local */}
        {local && (
          <p
            className="tf-pop font-evt-body text-[1.1rem] text-white/90 [text-shadow:0_4px_14px_rgba(0,0,0,0.25)]"
            style={{ animationDelay: "0.44s" }}
          >
            {local}
          </p>
        )}
      </div>

      {/* Onda orgânica que emenda com as seções claras */}
      <span
        aria-hidden
        className="absolute inset-x-[-12%] -bottom-px z-[5] h-[11vw] max-h-[120px] bg-evt-ivory"
        style={{ borderRadius: "100% 100% 0 0 / 100% 100% 0 0" }}
      />

      <style>{`
        @keyframes tfPop { from { opacity: 0; transform: translateY(22px) scale(0.96); } to { opacity: 1; transform: none; } }
        @keyframes tfFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
        @keyframes tfDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(10px,-14px) scale(1.05); } }
        @keyframes tfSway { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
        @keyframes tfSpin { to { transform: rotate(360deg); } }
        .tf-pop { opacity: 0; animation: tfPop 0.95s cubic-bezier(0.16,1,0.3,1) both; }
        .tf-float { animation: tfFloat 6.5s ease-in-out infinite; }
        .tf-drift { animation: tfDrift 12s ease-in-out infinite; }
        .tf-sway { animation: tfSway 7s ease-in-out infinite; transform-origin: 50% 0%; }
        .tf-spin { animation: tfSpin 18s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tf-pop, .tf-float, .tf-drift, .tf-sway, .tf-spin {
            opacity: 1 !important; animation: none !important; transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
