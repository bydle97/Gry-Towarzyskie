/**
 * Pule treści losowanych bez powtórzeń w obrębie sesji aplikacji.
 *
 * Pula jest TYLKO W PAMIĘCI SESJI: przetrwa wiele partii i zmiany listy graczy,
 * ale zniknie po odświeżeniu strony lub zamknięciu aplikacji. Nic nie trafia do
 * localStorage, sessionStorage, IndexedDB ani na dysk.
 *
 * Losujemy pojedynczo — przy każdym wywołaniu drawNext() wybieramy jeden element
 * spośród jeszcze niewykorzystanych w danej puli, zamiast tasować całą listę na
 * starcie partii. Dzięki temu kolejna partia w tej samej sesji nie powtarza
 * elementów użytych wcześniej, dopóki pula się nie wyczerpie.
 *
 * Klucz elementu podaje gra przez getKey(): dla pytań to id, dla haseł i kategorii
 * sam tekst. Klucze muszą być unikalne w obrębie jednej puli.
 */
import { shuffle } from './random.js';

/**
 * Stan jednej puli.
 * @typedef {Object} PoolState
 * @property {Set<string>} used klucze elementów już wylosowanych w tej sesji
 * @property {string|null} lastKey klucz ostatnio wylosowanego elementu
 */

/** @type {Map<string, PoolState>} */
const pools = new Map();

/**
 * Zwraca stan puli, tworząc go przy pierwszym użyciu.
 * @param {string} poolId
 * @returns {PoolState}
 */
function getPool(poolId) {
  let pool = pools.get(poolId);

  if (!pool) {
    pool = { used: new Set(), lastKey: null };
    pools.set(poolId, pool);
  }

  return pool;
}

/**
 * Klucz elementu jako tekst (Set porównuje wartości, więc typ musi być stały).
 * @param {T} item
 * @param {(item: T) => string} getKey
 * @returns {string}
 * @template T
 */
function keyOf(item, getKey) {
  return String(getKey(item));
}

/**
 * Losuje jeden element spośród jeszcze niewykorzystanych w danej puli i zapamiętuje
 * jego klucz jako użyty.
 *
 * Gdy wszystkie elementy są już użyte, pula zaczyna się od nowa — bez komunikatu
 * dla użytkownika. Pierwszy element po resecie nie jest jednak identyczny z ostatnio
 * wylosowanym (o ile pula ma więcej niż jeden element).
 *
 * @param {string} poolId identyfikator puli, np. "guess-number"
 * @param {ReadonlyArray<T>} items cała lista treści (stała, nie jest modyfikowana)
 * @param {(item: T) => string} getKey unikalny klucz elementu (id albo tekst)
 * @returns {T | null} wylosowany element albo null, gdy lista jest pusta
 * @template T
 */
export function drawNext(poolId, items, getKey) {
  if (items.length === 0) {
    return null;
  }

  const pool = getPool(poolId);
  let candidates = items.filter((item) => !pool.used.has(keyOf(item, getKey)));

  if (candidates.length === 0) {
    pool.used.clear();
    candidates =
      items.length > 1 && pool.lastKey !== null
        ? items.filter((item) => keyOf(item, getKey) !== pool.lastKey)
        : [...items];
  }

  // Zabezpieczenie na wypadek zduplikowanych kluczy: zawsze coś zwracamy.
  if (candidates.length === 0) {
    candidates = [...items];
  }

  // shuffle() z core/random.js to równomierne losowanie (Fisher–Yates),
  // więc pierwszy element przetasowanej kopii jest losowy z rozkładem jednostajnym.
  const picked = shuffle(candidates)[0];
  const key = keyOf(picked, getKey);

  pool.used.add(key);
  pool.lastKey = key;

  return picked;
}

/**
 * Czy w puli jest jeszcze element inny niż bieżący?
 * Gry używają tego do wyłączenia przycisku „Inne …” z opisem „Brak innych”.
 * @param {string} poolId
 * @param {ReadonlyArray<T>} items
 * @param {(item: T) => string} getKey
 * @param {string|null} currentKey klucz bieżącego elementu
 * @returns {boolean}
 * @template T
 */
export function hasOther(poolId, items, getKey, currentKey) {
  const current = currentKey === null || currentKey === undefined ? null : String(currentKey);
  const pool = getPool(poolId);

  return items.some((item) => {
    const key = keyOf(item, getKey);
    return key !== current && !pool.used.has(key);
  });
}

/**
 * Losuje inny element niż bieżący. Bieżący zostaje oznaczony jako użyty, więc
 * odrzucona treść nie wróci przed najbliższym resetem puli.
 *
 * @param {string} poolId
 * @param {ReadonlyArray<T>} items
 * @param {(item: T) => string} getKey
 * @param {string|null} currentKey klucz elementu, który chcemy zastąpić
 * @returns {T | null} nowy element albo null, gdy nie ma innej niewykorzystanej pozycji
 * @template T
 */
export function redraw(poolId, items, getKey, currentKey) {
  if (items.length === 0) {
    return null;
  }

  const current = currentKey === null || currentKey === undefined ? null : String(currentKey);
  const pool = getPool(poolId);

  if (current !== null) {
    pool.used.add(current);
  }

  const candidates = items.filter((item) => {
    const key = keyOf(item, getKey);
    return key !== current && !pool.used.has(key);
  });

  if (candidates.length === 0) {
    return null;
  }

  const picked = shuffle(candidates)[0];
  const key = keyOf(picked, getKey);

  pool.used.add(key);
  pool.lastKey = key;

  return picked;
}

