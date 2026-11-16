/**
 * Silnik gry "Na oko" — czyste funkcje bez DOM i bez stanu modułu.
 *
 * Gracz ma stały identyfikator (id) nadany przy starcie partii. Wpisy typów,
 * kolejność tury i ranking posługują się WYŁĄCZNIE identyfikatorem gracza:
 *
 *   guesses[]  { playerId, value }                     typy w bieżącej rundzie
 *   order[]    playerId                                kolejność typowania
 *   ranking[]  { playerId, value, distance }           ranking po odpowiedzi
 *
 * Pozycja w tablicy (indeks) nigdy nie jest tożsamością gracza — kolejność tury
 * jest permutacją identyfikatorów, a nie indeksów. Wszystkie funkcje zwracają
 * nowe tablice i nie modyfikują argumentów.
 */
import { shuffle } from '../../core/random.js';

/**
 * Nadaje graczom stałe identyfikatory na czas partii.
 * Sesja HUB-a przechowuje tylko imiona, więc id powstają przy starcie gry.
 * @param {ReadonlyArray<string>} playerNames
 * @returns {Array<{id: string, name: string}>}
 */
export function createPlayers(playerNames) {
  return playerNames.map((name, index) => ({ id: `p${index + 1}`, name }));
}

/**
 * Mapa id → imię — jedyne źródło nazw do wyświetlenia.
 * @param {ReadonlyArray<{id: string, name: string}>} players
 * @returns {Map<string, string>}
 */
export function createNameMap(players) {
  return new Map(players.map((player) => [player.id, player.name]));
}

/**
 * Kolejność pierwszej rundy: losowo przetasowane identyfikatory graczy.
 * @param {ReadonlyArray<string>} playerIds
 * @returns {string[]}
 */
export function createInitialOrder(playerIds) {
  return shuffle(playerIds);
}

/**
 * Identyfikator gracza, którego tura właśnie trwa.
 * @param {ReadonlyArray<string>} order
 * @param {number} turnIndex pozycja w kolejności tury (nie indeks w tablicy graczy)
 * @returns {string | null} id gracza albo null, gdy tura już się skończyła
 */
export function getCurrentPlayerId(order, turnIndex) {
  if (!Number.isInteger(turnIndex) || turnIndex < 0 || turnIndex >= order.length) {
    return null;
  }

  return order[turnIndex];
}

/**
 * Czy runda jest nietknięta, czyli „Inne pytanie” jest jeszcze dozwolone?
 * @param {ReadonlyArray<{playerId: string, value: number}>} guesses
 * @returns {boolean}
 */
export function canRedrawRound(guesses) {
  return guesses.length === 0;
}

/**
 * Czy gracz ma już typ w tej rundzie?
 * @param {ReadonlyArray<{playerId: string, value: number}>} guesses
 * @param {string} playerId
 * @returns {boolean}
 */
export function hasGuessed(guesses, playerId) {
  return guesses.some((guess) => guess.playerId === playerId);
}

/**
 * Dodaje wpis typu wskazanego gracza (nowa tablica, bez modyfikacji wejścia).
 * @param {ReadonlyArray<{playerId: string, value: number}>} guesses
 * @param {string} playerId
 * @param {number} value
 * @returns {Array<{playerId: string, value: number}>}
 */
export function addGuess(guesses, playerId, value) {
  return [...guesses, { playerId, value }];
}

/**
 * Ranking rundy: od najmniejszej odległości od prawidłowej odpowiedzi.
 * Przy równych odległościach decyduje dotychczasowa kolejność typowania,
 * więc remis zachowuje porządek rundy.
 * @param {ReadonlyArray<{playerId: string, value: number}>} guesses
 * @param {number} answer
 * @returns {Array<{playerId: string, value: number, distance: number}>}
 */
export function computeRanking(guesses, answer) {
  return guesses
    .map((guess, position) => ({
      playerId: guess.playerId,
      value: guess.value,
      distance: Math.abs(guess.value - answer),
      position,
    }))
    .sort((first, second) => first.distance - second.distance || first.position - second.position)
    .map(({ playerId, value, distance }) => ({ playerId, value, distance }));
}

/**
 * Kolejność następnej rundy z rankingu: najbliższy zaczyna. To nadal tablica id.
 * @param {ReadonlyArray<{playerId: string, value: number, distance: number}>} ranking
 * @returns {string[]}
 */
export function createOrderFromRanking(ranking) {
  return ranking.map((entry) => entry.playerId);
}
