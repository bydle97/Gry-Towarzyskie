/**
 * Api przekazywane grom w funkcji mount(container, players, api).
 *
 * Zawiera wyłącznie:
 *  - shuffleRoles(roleList, playerCount) — losowanie ról (core/random.js),
 *  - exit() — zakończenie gry i powrót do ekranu szczegółów gry.
 *
 * Wspólne elementy interfejsu (np. components/team-setup.js, components/content-status.js)
 * oraz tłumaczenia (core/i18n.js) gry importują bezpośrednio.
 */
import { dealRoles } from './random.js';

/**
 * Tworzy api jednej rozgrywki.
 * @param {{onExit: () => void}} options
 * @returns {Pick<import('./game-contract.js').GameApi, 'shuffleRoles' | 'exit'>}
 */
export function createGameApi({ onExit }) {
  return Object.freeze({
    shuffleRoles(roleList, playerCount) {
      return dealRoles(roleList, playerCount);
    },
    exit() {
      onExit();
    },
  });
}
