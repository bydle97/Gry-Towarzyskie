/**
 * Drobne funkcje formatujące teksty interfejsu (odmiana po polsku).
 */

/**
 * "1 gracz", "4 graczy".
 * @param {number} count
 * @returns {string}
 */
export function formatPlayersCount(count) {
  return count === 1 ? '1 gracz' : `${count} graczy`;
}

/**
 * "1 gracz", "4 graczy" albo "3–8 graczy", gdy zakres jest szerszy.
 * @param {number} minPlayers
 * @param {number} maxPlayers
 * @returns {string}
 */
export function formatPlayersRange(minPlayers, maxPlayers) {
  if (minPlayers === maxPlayers) {
    return formatPlayersCount(minPlayers);
  }
  return `${minPlayers}–${maxPlayers} graczy`;
}
