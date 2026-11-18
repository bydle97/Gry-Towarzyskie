/**
 * Stan sesji HUB-a — WYŁĄCZNIE w pamięci aplikacji.
 * Nic nie trafia do localStorage, sessionStorage, IndexedDB ani na dysk:
 * po odświeżeniu strony imiona i wybory znikają.
 */
import { t } from './i18n.js';

/** Maksymalna długość imienia gracza (znaki). */
export const PLAYER_NAME_MAX_LENGTH = 20;

const state = {
  /** @type {string[]} imiona graczy na czas sesji */
  playerNames: [],
};

/** @returns {string[]} kopia listy imion (bez referencji do stanu) */
export function getPlayerNames() {
  return [...state.playerNames];
}

/**
 * Dodaje gracza do listy sesji.
 * @param {string} rawName imię wpisane przez użytkownika (spacje są przycinane)
 * @returns {{ok: true, names: string[]} | {ok: false, error: string}}
 */
export function addPlayerName(rawName) {
  const name = preparePlayerName(rawName);
  const error = checkPlayerName(name, -1);

  if (error !== '') {
    return { ok: false, error };
  }

  state.playerNames.push(name);
  return { ok: true, names: getPlayerNames() };
}

/**
 * Zmienia imię gracza o podanym indeksie (indeks = pozycja na liście sesji).
 * @param {number} index
 * @param {string} rawName
 * @returns {{ok: true, names: string[]} | {ok: false, error: string}}
 */
export function updatePlayerName(index, rawName) {
  if (!Number.isInteger(index) || index < 0 || index >= state.playerNames.length) {
    return { ok: false, error: t('players.errors.notFound') };
  }

  const name = preparePlayerName(rawName);
  const error = checkPlayerName(name, index);

  if (error !== '') {
    return { ok: false, error };
  }

  state.playerNames[index] = name;
  return { ok: true, names: getPlayerNames() };
}

/**
 * Usuwa gracza o podanym indeksie.
 * @param {number} index
 * @returns {string[]} aktualna lista imion
 */
export function removePlayerName(index) {
  if (Number.isInteger(index) && index >= 0 && index < state.playerNames.length) {
    state.playerNames.splice(index, 1);
  }
  return getPlayerNames();
}

/**
 * Przycina spacje i skleja wielokrotne spacje. Celowo NIE obcina długości:
 * zbyt długie imię ma zwrócić błąd walidacji, a nie zostać po cichu skrócone.
 * @param {unknown} value
 * @returns {string}
 */
function preparePlayerName(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sprawdza imię pojedynczego gracza (puste / za długie / duplikat bez względu na wielkość liter).
 * @param {string} name imię po przygotowaniu
 * @param {number} excludeIndex indeks pomijany przy sprawdzaniu duplikatów (-1 = brak)
 * @returns {string} komunikat po polsku albo pusty tekst, gdy imię jest poprawne
 */
function checkPlayerName(name, excludeIndex) {
  if (name === '') {
    return t('players.errors.empty');
  }
  if (name.length > PLAYER_NAME_MAX_LENGTH) {
    return t('players.errors.tooLong', { max: PLAYER_NAME_MAX_LENGTH });
  }

  const key = name.normalize('NFC').toLocaleLowerCase('pl');
  const duplicate = state.playerNames.some(
    (existing, index) =>
      index !== excludeIndex && existing.normalize('NFC').toLocaleLowerCase('pl') === key,
  );

  if (duplicate) {
    return t('players.errors.duplicate', { name });
  }

  return '';
}

