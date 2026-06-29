// Landing (placeholder da Fase 0). A landing completa chega na Fase 3.
export default function MarketingHome() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="mb-6 text-sm font-medium uppercase tracking-widest text-texto-suave">
        B2B SaaS
      </p>
      <h1 className="font-sans text-4xl font-bold tracking-tight text-ink sm:text-6xl">
        seuconvite<span className="text-gradient">ia</span>.com
      </h1>
      <p className="mt-5 max-w-md font-display text-lg text-texto-suave sm:text-xl">
        O seu site de convite em minutos.
      </p>
      <p className="mt-10 rounded-full bg-lilas px-4 py-1.5 text-xs font-medium text-violeta">
        Landing completa na Fase 3
      </p>
    </main>
  );
}
