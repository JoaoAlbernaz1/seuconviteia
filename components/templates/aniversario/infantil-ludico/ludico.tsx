// Kit LÚDICO do template Aniversário Infantil — peças próprias (NÃO vem de
// _base/secoes). Server-safe: ícones arredondados, confetti/bolhas de fundo
// (círculos CSS derivados dos tokens --ev-*), keyframes scoped `ail-` com reset
// de reduced-motion. Tudo tinge sozinho pela paleta do evento, então funciona em
// qualquer preset. Usado por Home/Evento/Presentes/Galeria deste template.

// ── Ritmo / medidas (o "grid" próprio do template) ───────────────────────────
export const AIL_PAD = "px-[clamp(1.25rem,5vw,2rem)]";
export const AIL_WRAP = "mx-auto w-full max-w-[1080px]";
export const AIL_RHYTHM = "py-[clamp(3.75rem,9vw,6.5rem)]";

// ── Keyframes + classes de animação (scoped, com reset de reduced-motion) ─────
export const AIL_KEYFRAMES = `
@keyframes ailBob { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-9px) rotate(10deg); } }
@keyframes ailFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
@keyframes ailWiggle { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
@keyframes ailPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes ailPop { from { opacity: 0; transform: scale(0.86); } to { opacity: 1; transform: scale(1); } }
.ail-bob { animation: ailBob 4.6s ease-in-out infinite; }
.ail-float-a { animation: ailFloat 7s ease-in-out infinite; }
.ail-float-b { animation: ailFloat 9s ease-in-out infinite 0.5s; }
.ail-float-c { animation: ailFloat 8s ease-in-out infinite 0.9s; }
.ail-wiggle { animation: ailWiggle 3.6s ease-in-out infinite; transform-origin: center; }
.ail-pulse { animation: ailPulse 2.2s ease-in-out infinite; }
.ail-pop { animation: ailPop 0.7s cubic-bezier(0.34,1.56,0.64,1) both; }
@media (prefers-reduced-motion: reduce) {
  .ail-root [class*="ail-"] { animation: none !important; }
}
`;

/** Injeta os keyframes uma vez por página (renderizar dentro do `.ail-root`). */
export function AilStyle() {
  return <style>{AIL_KEYFRAMES}</style>;
}

// ── Confetti de fundo — pontinhos/quadradinhos arredondados, cores da paleta ──
type Dot = { top: string; left: string; size: string; cor: string; raio: string; delay: string };

const CONFETTI: Dot[] = [
  { top: "12%", left: "8%", size: "0.8rem", cor: "var(--ev-framboesa)", raio: "9999px", delay: "0s" },
  { top: "20%", left: "90%", size: "0.65rem", cor: "var(--ev-rose)", raio: "0.3rem", delay: "0.5s" },
  { top: "68%", left: "6%", size: "0.7rem", cor: "var(--ev-framboesa-bright)", raio: "9999px", delay: "0.9s" },
  { top: "82%", left: "88%", size: "0.85rem", cor: "var(--ev-rosa)", raio: "0.3rem", delay: "0.3s" },
  { top: "40%", left: "95%", size: "0.55rem", cor: "var(--ev-framboesa)", raio: "9999px", delay: "1.1s" },
  { top: "88%", left: "44%", size: "0.6rem", cor: "var(--ev-rose)", raio: "9999px", delay: "0.7s" },
  { top: "6%", left: "52%", size: "0.5rem", cor: "var(--ev-framboesa-bright)", raio: "9999px", delay: "0.2s" },
  { top: "52%", left: "3%", size: "0.6rem", cor: "var(--ev-rosa)", raio: "0.3rem", delay: "1.3s" },
];

/**
 * Camada decorativa de confetti flutuante para o fundo de uma seção. Discreta
 * (SEM poluir): opacidade baixa, poucos pontos. `pointer-events-none`.
 */
export function ConfettiBg({ className = "", opacidade = 0.5 }: { className?: string; opacidade?: number }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {CONFETTI.map((d, i) => (
        <span
          key={i}
          className="ail-bob absolute block"
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            background: d.cor,
            opacity: opacidade,
            borderRadius: d.raio,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}

/** Bolhas arredondadas de canto — decoram cartões grandes (blush/rose translúcidos). */
export function BolhasCanto() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full"
        style={{ background: "color-mix(in srgb, var(--ev-rose) 45%, transparent)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-[1.75rem]"
        style={{ background: "color-mix(in srgb, var(--ev-framboesa-bright) 20%, transparent)" }}
      />
    </>
  );
}

// ── Ícones inline (rounded, currentColor) — amigáveis e claros ────────────────
type IconProps = { className?: string };

export function CalIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}
export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
export function PinIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M12 21c4.5-4.2 6.75-7.65 6.75-10.35A6.75 6.75 0 0 0 5.25 10.65C5.25 13.35 7.5 16.8 12 21Z" />
      <circle cx="12" cy="10.5" r="2.5" />
    </svg>
  );
}
export function HeartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M12 20s-7.5-4.35-7.5-9.75A4.25 4.25 0 0 1 12 6.9a4.25 4.25 0 0 1 7.5 3.35C19.5 15.65 12 20 12 20Z" />
    </svg>
  );
}
export function GiftIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <rect x="3.5" y="10" width="17" height="10.5" rx="2.5" />
      <path d="M3.5 13.5h17M12 10v10.5" />
      <path d="M12 10s-1-4-3.5-4a2 2 0 0 0 0 4H12Zm0 0s1-4 3.5-4a2 2 0 0 1 0 4H12Z" />
    </svg>
  );
}
export function ChatIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M20 12a7.5 7.5 0 0 1-10.7 6.78L4 20l1.22-4.3A7.5 7.5 0 1 1 20 12Z" />
      <path d="M9 11h6M9 14h4" />
    </svg>
  );
}
export function StarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden focusable={false}>
      <path d="M12 3.2l2.35 4.9 5.4.72-3.95 3.72.98 5.36L12 15.98 7.22 17.9l.98-5.36L4.25 8.82l5.4-.72L12 3.2Z" />
    </svg>
  );
}
export function CakeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M4 20.5h16M5 20.5v-6a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 14.5v6" />
      <path d="M4.5 16.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0" />
      <path d="M12 8.5V6M8.5 8.5V6.5M15.5 8.5V6.5" />
      <circle cx="12" cy="4.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function BalloonIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M12 3.5a5.5 6.5 0 0 1 5.5 6.5c0 3.6-2.8 6-5.5 6s-5.5-2.4-5.5-6A5.5 6.5 0 0 1 12 3.5Z" />
      <path d="M12 16v1.5M11 17.5h2l-1 3-1-3Z" />
    </svg>
  );
}
export function MusicIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  );
}
export function SmileIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14c.9 1.4 2.1 2 3.5 2s2.6-.6 3.5-2" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </svg>
  );
}
export function CameraIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M4 8.5h3l1.5-2h7L17 8.5h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}
