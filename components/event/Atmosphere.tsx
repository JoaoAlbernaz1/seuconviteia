import { coresParticulas } from "@/lib/cor";
import { Particles } from "./Particles";

/**
 * Atmosfera global do site do evento (atras de tudo, z-[-1]): um fundo ivory com
 * um wash radial suave da cor do evento + o campo de particulas tematizado.
 *
 * Mesma ideia do `SiteAtmosphere` do festa (foto desbotada + particulas), mas
 * aqui — multi-tenant, sem foto garantida — usamos um wash da cor do evento no
 * lugar do retrato. As secoes do corpo usam superficies translucidas, entao a
 * atmosfera "vaza" por todo o site.
 *
 * Server Component: calcula as cores a partir do accent e passa pro canvas.
 */
export function Atmosphere({ accent }: { accent: string }) {
  const cores = coresParticulas(accent);
  return (
    <>
      <div className="cv-atmos" aria-hidden />
      <Particles cores={cores} className="z-[-1]" />
    </>
  );
}
