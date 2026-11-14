/**
 * Wspólne api przekazywane grom w funkcji mount(container, players, api).
 * Jedno miejsce, w którym HUB składa komponenty dla gier — gry nie importują
 * modułów HUB-a bezpośrednio.
 *
 * Dostępne teraz:
 *  - shuffleRoles(roleList, playerCount) — losowanie ról (core/random.js),
 *  - exit() — zakończenie gry i powrót do ekranu szczegółów gry.
 *
 * Komponenty passPhone / holdToReveal / timer z kontraktu dołączą razem ze
 * wspólnymi komponentami w js/components/ (KROK 5) — żadna gra ich jeszcze nie używa.
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
