// Marca d'agua do PREVIEW: aparece em todo site de evento ainda NAO comprado
// (`Event.purchased = false`). Selinho fixo, discreto mas presente — marca que e
// uma previa e convida a criar o proprio. Some quando o evento e comprado (valor
// unico). Server component (so um link).
//
// `criarUrl` aponta para a landing da plataforma (cadastro). Em dev cai no root.

const PLATAFORMA_URL =
  process.env.NEXT_PUBLIC_PLATAFORMA_URL ?? "https://seuconviteia.com";

export function MarcaDagua() {
  return (
    <a
      href={PLATAFORMA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pré-visualização — feito com seuconviteia. Crie o seu."
      className="group fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border border-white/15 bg-[#160C12]/85 px-3.5 py-2 text-white shadow-lg backdrop-blur-md transition hover:bg-[#160C12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
  );
}
