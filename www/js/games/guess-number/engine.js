/**
 * Silnik gry "Na oko" — czyste funkcje bez DOM i bez stanu modułu.
 *
 * Gracz ma stały identyfikator (id) nadany przy starcie partii. Wpisy typów,
 * kolejność tury i ranking posługują się WYŁĄCZNIE identyfikatorem gracza:
 *
 *   guesses[]    { playerId, value }                     typy w bieżącej rundzie
 *   order[]      playerId                                kolejność typowania
 *   ranking[]    { playerId, value, distance }           ranking po odpowiedzi
 *   totals       Map<playerId, number>                   suma punktów partii
 *   roundScores  Map<playerId, {points, place, exact}>   punkty jednej rundy
 *
 * Pozycja w tablicy (indeks) nigdy nie jest tożsamością gracza — kolejność tury
 * jest permutacją identyfikatorów, a nie indeksów. Wszystkie funkcje zwracają
 * nowe tablice i nowe mapy i nie modyfikują argumentów.
 */
import { shuffle } from '../../core/random.js';

/** Bonus za trafienie dokładnie w odpowiedź (odległość 0) — dla każdego takiego gracza. */
export const EXACT_HIT_BONUS = 2;

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

/**
 * Miejsca w rundzie metodą sportową: osoby z TAKĄ SAMĄ odległością mają to samo
 * miejsce, a kolejne miejsce „przeskakuje” (np. 1., 1., 3., 3., 5.).
 * Ranking jest już posortowany po odległości, więc wystarczy jedno przejście.
 * @param {ReadonlyArray<{playerId: string, distance: number}>} ranking
 * @returns {Map<string, number>} mapa playerId → miejsce
 */
export function computePlaces(ranking) {
  const places = new Map();
  let previousDistance = null;
  let previousPlace = 0;

  ranking.forEach((entry, index) => {
    const place = entry.distance === previousDistance ? previousPlace : index + 1;

    places.set(entry.playerId, place);
    previousDistance = entry.distance;
    previousPlace = place;
  });

  return places;
}

/**
 * Punkty za miejsce przy N graczach: N − miejsce + 1.
 * Najlepsze miejsce dostaje N punktów, najgorsze zawsze 1 punkt.
 * @param {number} place
 * @param {number} playerCount
 * @returns {number}
 */
export function pointsForPlace(place, playerCount) {
  return playerCount - place + 1;
}

/**
 * Punkty całej rundy — mapa playerId → { points, place, exact }.
 * Do punktów za miejsce dochodzi EXACT_HIT_BONUS, gdy odległość wynosi 0.
 * @param {ReadonlyArray<{playerId: string, value: number, distance: number}>} ranking
 * @param {number} playerCount
 * @returns {Map<string, {points: number, place: number, exact: boolean}>}
 */
export function scoreRound(ranking, playerCount) {
  const places = computePlaces(ranking);
  const scores = new Map();

  for (const entry of ranking) {
    const place = places.get(entry.playerId);
    const exact = entry.distance === 0;

    scores.set(entry.playerId, {
      points: pointsForPlace(place, playerCount) + (exact ? EXACT_HIT_BONUS : 0),
      place,
      exact,
    });
  }

  return scores;
}

/**
 * Nowa mapa sum punktów: dotychczasowe sumy + punkty rundy (bez mutacji wejścia).
 * @param {ReadonlyMap<string, number>} totals
 * @param {ReadonlyMap<string, {points: number}>} roundScores
 * @returns {Map<string, number>}
 */
export function addToTotals(totals, roundScores) {
  const next = new Map(totals);

  for (const [playerId, score] of roundScores) {
    next.set(playerId, (next.get(playerId) ?? 0) + score.points);
  }

  return next;
}

/**
 * Tabela po rozegranych rundach: suma malejąco, przy remisie kolejność z listy
 * graczy. Remisy sumy dostają wspólne miejsce (metoda sportowa).
 * @param {ReadonlyMap<string, number>} totals
 * @param {ReadonlyArray<{id: string, name: string}>} players
 * @returns {Array<{playerId: string, total: number, place: number}>}
 */
export function computeStandings(totals, players) {
  const orderIndex = new Map(players.map((player, index) => [player.id, index]));
  const rows = players
    .map((player) => ({ playerId: player.id, total: totals.get(player.id) ?? 0 }))
    .sort(
      (first, second) =>
        second.total - first.total ||
        orderIndex.get(first.playerId) - orderIndex.get(second.playerId),
    );

  let previousTotal = null;
  let previousPlace = 0;

  return rows.map((row, index) => {
    const place = row.total === previousTotal ? previousPlace : index + 1;

    previousTotal = row.total;
    previousPlace = place;

    return { playerId: row.playerId, total: row.total, place };
  });
}

/**
 * Id zwycięzców: wszyscy na 1. miejscu (przy równej sumie zwycięzców jest kilku).
 * @param {ReadonlyArray<{playerId: string, place: number}>} standings
 * @returns {string[]}
 */
export function getWinners(standings) {
  return standings.filter((entry) => entry.place === 1).map((entry) => entry.playerId);
}
