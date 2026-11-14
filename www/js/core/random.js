/**
 * Funkcje losujące — bez zależności i bez zapisywania stanu.
 * Wszystkie działają na kopiach, więc nie modyfikują przekazanych tablic.
 */

/**
 * Tasuje kopię tablicy algorytmem Fishera–Yatesa.
 * @template T
 * @param {ReadonlyArray<T>} items
 * @returns {T[]} nowa, przetasowana tablica
 */
export function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporary = result[index];
    result[index] = result[randomIndex];
    result[randomIndex] = temporary;
  }

  return result;
}

/**
 * Losuje role: tasuje kopię listy ról i zwraca dokładnie `count` pozycji.
 * To implementacja funkcji `shuffleRoles` z kontraktu gry (js/core/game-contract.js).
 * @param {ReadonlyArray<string>} roleList
 * @param {number} count
 * @returns {string[]}
 */
export function dealRoles(roleList, count) {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('Liczba ról musi być liczbą całkowitą większą lub równą 0.');
  }
  if (count > roleList.length) {
    throw new Error(`Za mało ról: potrzeba ${count}, a podano ${roleList.length}.`);
  }
  return shuffle(roleList).slice(0, count);
}
