// Marca d'agua do PREVIEW: aparece em todo site de evento ainda NAO comprado
// (`Event.purchased = false`). Cobre o SITE INTEIRO (ladrilho diagonal repetido)
// para deixar claro que e uma previa e desencorajar uso sem pagar — mais o selo-CTA
// no canto que leva a criar o proprio. Some quando o evento e comprado (valor
// unico). Server component; o overlay e `pointer-events-none` (nao bloqueia cliques).

const PLATAFORMA_URL =
  process.env.NEXT_PUBLIC_PLATAFORMA_URL ?? "https://seuconviteia.com";

// Ladrilho SVG (texto diagonal repetido). Encodado p/ data URI.
const WATERMARK_TILE = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="280"><text x="16" y="160" transform="rotate(-28 210 140)" font-family="Jost, Helvetica, sans-serif" font-size="27" font-weight="600" letter-spacing="5" fill="#0f172a" fill-opacity="0.11">PRÉVIA · seuconviteia</text></svg>`,
);

export function MarcaDagua() {
  return (
    <>
      {/* Marca d'agua ladrilhada sobre o site inteiro (acima do conteudo e da nav). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${WATERMARK_TILE}")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Selo-CTA no canto: leva a criar o proprio. */}
      <a
        href={PLATAFORMA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pré-visualização — feito com seuconviteia. Crie o seu."
        className="group fixed bottom-4 right-4 z-[101] flex items-center gap-2 rounded-full border border-white/15 bg-[#160C12]/90 px-3.5 py-2 text-white shadow-lg backdrop-blur-md transition hover:bg-[#160C12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <span aria-hidden className="text-[0.7rem] text-white/80">
          ✦
        </span>
        <span className="font-evt-util text-[0.6rem] uppercase leading-tight tracking-[0.18em]">
          <span className="block text-white/70">Prévia · feito com</span>
          <span className="block font-semibold text-white">
            seuconvite<span className="text-[#f0a]">ia</span>
          </span>
        </span>
        <span
          aria-hidden
          className="ml-1 hidden border-l border-white/20 pl-2 font-evt-util text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-white/90 transition-colors group-hover:text-white sm:inline"
        >
          Crie o seu →
        </span>
      </a>
    </>
  );
}
