/**
 * Drobne funkcje formatujące teksty interfejsu.
 *
 * Zasada: liczby graczy podajemy BEZ odmiany (np. „Gracze: 2", „Zakres graczy: 2–10"),
 * żeby uniknąć błędnych form typu „2 graczy".
 */

/**
 * Zakres liczby graczy bez odmiany: „2–10" albo „4", gdy zakres jest jednoelementowy.
 * W etykiecie używaj razem z opisem, np. `Zakres graczy: ${formatPlayersRange(min, max)}`.
 * @param {number} minPlayers
 * @param {number} maxPlayers
 * @returns {string}
 */
export function formatPlayersRange(minPlayers, maxPlayers) {
  return minPlayers === maxPlayers ? `${minPlayers}` : `${minPlayers}–${maxPlayers}`;
}
