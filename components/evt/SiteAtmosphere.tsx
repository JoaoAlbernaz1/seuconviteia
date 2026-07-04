import { Particles } from "@/components/evt/Particles";

/**
 * SiteAtmosphere — atmosfera global do site: a foto da capa BEM clarinha (blur
 * leve) + particulas, fixas atras de tudo (z-[-1]). As paginas usam superficies
 * translucidas para a foto/particulas aparecerem suavemente (clima do convite).
 *
 * `fotoUrl` = foto de fundo (a mesma da capa). `particleColors` re-tinge as
 * faiscas por tema (default = trio do festa). `dark` = clima escuro (template
 * noite): fundo grafite + foto bem discreta, para o corpo escuro do template.
 */
export function SiteAtmosphere({
  fotoUrl,
  particleColors,
  dark = false,
}: {
  fotoUrl?: string;
  particleColors?: string[];
  dark?: boolean;
}) {
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-[-1] overflow-hidden ${dark ? "bg-[#100C07]" : "bg-white"}`}
        aria-hidden
      >
        {fotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoUrl}
            alt=""
            className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 object-cover object-[50%_16%]"
            style={
              dark
                ? { filter: "blur(70px) grayscale(0.35) brightness(0.45)", opacity: 0.2 }
                : { filter: "blur(60px) grayscale(0.12) sepia(0.06)", opacity: 0.25 }
            }
          />
        )}
        {dark ? (
          <div className="absolute inset-0 bg-gradient-to-b from-[#120D08]/85 via-[#0C0906]/88 to-[#070503]/92" />
        ) : (
          <>
            <div className="absolute inset-0 bg-evt-rosa/[0.05] mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/78 to-white/88" />
          </>
        )}
      </div>
      <Particles className="z-[-1]" colors={particleColors} />
    </>
  );
}
