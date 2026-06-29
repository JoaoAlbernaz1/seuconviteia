/**
 * Contagem regressiva — logica pura e testavel (portada do festa-15-maria-clara).
 * Usada pelo `<Countdown>` do site do evento. Sem `Date.now()` aqui: recebe
 * `agora` por parametro, entao o componente injeta o relogio.
 */
export type Restante = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  chegou: boolean;
};

export function tempoRestante(alvo: Date, agora: Date): Restante {
  const ms = alvo.getTime() - agora.getTime();
  if (ms <= 0)
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, chegou: true };
  const s = Math.floor(ms / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
    chegou: false,
  };
}
