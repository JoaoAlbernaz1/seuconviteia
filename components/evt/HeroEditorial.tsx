// Capa do template EDITORIAL / REVISTA — 100% CSS, server component.
//  • DESKTOP -> foto à ESQUERDA (coluna cheia) + painel de papel à DIREITA com
//    masthead (kicker + NOME gigante serifado + filete + data/local).
//  • MOBILE  -> foto no topo + painel embaixo.
//  Themeável pelas vars --ev-* (papel = ivory, texto = ink, acento = rosa-ink),
//  então funciona em todas as paletas. Reduced-motion: tudo fica visível/estático.
export function HeroEditorial({
  nome,
  idade,
  kicker,
  data,
  horario,
  local,
  fotoUrl,
}: {
  nome: string;
  idade?: number;
  kicker: string;
  data: string;
  horario?: string;
  local?: string;
  fotoUrl?: string;
}) {
  const foto = fotoUrl ?? "";
  return (
    <section className="relative w-full overflow-hidden bg-evt-ivory text-evt-ink">
      <div className="grid min-h-[100svh] md:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
        {/* ── FOTO ── */}
        <div className="relative order-1 min-h-[46svh] overflow-hidden md:min-h-[100svh]">
          <div className="he-foto absolute inset-0" aria-hidden />
          {/* filete de acento na emenda (desktop) */}
          <span className="absolute inset-y-0 right-0 hidden w-px bg-[var(--line-rosa)] md:block" aria-hidden />
        </div>

        {/* ── PAINEL (papel) ── */}
        <div className="order-2 flex flex-col justify-center px-[clamp(1.5rem,6vw,5rem)] py-[clamp(2.75rem,7vw,6rem)] md:pt-[clamp(6rem,10vw,8rem)]">
          <p className="he-rise font-evt-util text-[0.7rem] uppercase tracking-[0.4em] text-evt-rosa-ink" style={{ animationDelay: "0.05s" }}>
            {kicker}
          </p>

          <h1
            className="he-rise mt-6 font-evt-display leading-[0.92] tracking-[-0.01em] text-evt-ink text-[clamp(3.1rem,10vw,7rem)]"
            style={{ animationDelay: "0.15s" }}
          >
            {nome}
          </h1>

          {idade != null && (
            <p className="he-rise mt-4 font-evt-util text-[0.82rem] uppercase tracking-[0.34em] text-evt-ink-soft" style={{ animationDelay: "0.24s" }}>
              {idade} anos
            </p>
          )}

          <span className="he-rise my-8 block h-px w-24 bg-evt-rosa-ink/45" style={{ animationDelay: "0.3s" }} aria-hidden />

          <div className="he-rise flex flex-col gap-1.5" style={{ animationDelay: "0.38s" }}>
            <p className="font-evt-body text-[1.15rem] text-evt-ink">
              {data}
              {horario ? <span className="text-evt-ink-soft"> · {horario}</span> : null}
            </p>
            {local && <p className="font-evt-body text-[1.05rem] text-evt-ink-soft">{local}</p>}
          </div>
        </div>
      </div>

      <style>{`
        .he-foto {
          background-image: url('${foto}');
          background-size: cover;
          background-position: 50% 38%;
          background-repeat: no-repeat;
          opacity: 0;
          animation: heFotoIn 1.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes heFotoIn { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
        @keyframes heRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .he-rise { opacity: 0; animation: heRise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .he-foto, .he-rise { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
