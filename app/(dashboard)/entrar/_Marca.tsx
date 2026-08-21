// Peças de marca da tela de entrar: a assinatura, o traço luminoso e o ícone do
// Google. Ficam num arquivo só para a página continuar legível.

/** "seuconvite" + "uma marca Orivya". Pequena de propósito — o brief pede. */
export function Assinatura({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="text-[17px] font-semibold leading-none tracking-[-0.02em] text-white">
        seuconvite
      </div>
      <div className="mt-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/40">
        uma marca Orivya
      </div>
    </div>
  );
}

/**
 * O ÚNICO detalhe gráfico da tela (o brief pede um, e só um): duas curvas —
 * violeta e rosa — atravessando o alto da área visual.
 *
 * `vectorEffect` mantém a linha com a MESMA espessura em qualquer tamanho de
 * tela: sem isso o `preserveAspectRatio="none"`, que estica o traço para
 * acompanhar a coluna, engordaria a curva no desktop grande e sumiria com ela no
 * notebook.
 */
export function Curvas({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 400"
      preserveAspectRatio="none"
      aria-hidden
      className={className}
    >
      <path
        d="M-40 250 C 140 120, 300 300, 660 80"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
        opacity="0.55"
      />
      <path
        d="M-40 300 C 160 190, 320 350, 660 150"
        fill="none"
        stroke="#FF2D8D"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
        opacity="0.4"
      />
    </svg>
  );
}

/**
 * O "G" oficial do Google, nas quatro cores.
 *
 * Inline, e não um ícone de fonte: a marca do Google tem regras de uso, e o
 * glifo monocromático de biblioteca não é o logo oficial. Também não é ícone de
 * pacote novo — este SVG é o mesmo que o Google publica para o botão.
 */
export function IconeGoogle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.57z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.55-2.03-6.46-4.75H1.7v2.98A11.5 11.5 0 0 0 12 23.5z"
      />
      <path
        fill="#FBBC05"
        d="M5.54 14.17a6.9 6.9 0 0 1 0-4.34V6.85H1.7a11.5 11.5 0 0 0 0 10.3l3.84-2.98z"
      />
      <path
        fill="#EA4335"
        d="M12 5.08c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.63 15.11.5 12 .5A11.5 11.5 0 0 0 1.7 6.85l3.84 2.98C6.45 7.11 9 5.08 12 5.08z"
      />
    </svg>
  );
}
