// Fundo das telas de confirmacao (replica FIEL do ConviteBackground do festa):
// foto dela BEM CLARINHA (opacity baixa) + tinta rosa + veu marfim sobre branco.
// As cores vem das vars (--ivory/--plum) herdadas do wrapper que envolve o uso —
// no port multi-tenant a `PALETA` do RsvpConvite/Obrigada aponta essas vars para
// os tokens do preset do evento (--ev-*), entao o fundo re-tinge por tema.
// z-0 (acima do bg branco do body, atras do conteudo z-10 e das particulas z-5).
export function ConviteBackground({ foto }: { foto?: string }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[var(--ivory)]">
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto}
          alt=""
          className="h-full w-full object-cover object-[50%_30%]"
          style={{ filter: "grayscale(0.12) sepia(0.1) contrast(0.96)", opacity: 0.36 }}
        />
      )}
      {/* Tinta rosa p/ harmonizar a foto com o tema */}
      <div className="absolute inset-0 bg-[var(--plum)]/10 mix-blend-multiply" />
      {/* Veu marfim reforcado — mantem o formulario 100% legivel */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--ivory)]/88 via-[var(--ivory)]/84 to-[var(--ivory)]/94" />
    </div>
  );
}
