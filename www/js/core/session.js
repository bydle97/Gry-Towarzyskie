/**
 * Stan sesji HUB-a — WYŁĄCZNIE w pamięci aplikacji.
 * Nic nie trafia do localStorage, sessionStorage, IndexedDB ani na dysk:
 * po odświeżeniu strony imiona i wybory znikają.
 */

/** Maksymalna długość imienia gracza (znaki). */
export const PLAYER_NAME_MAX_LENGTH = 20;

/** Minimalna długość imienia gracza po przycięciu spacji. */
export const PLAYER_NAME_MIN_LENGTH = 2;

const state = {
  /** @type {string[]} imiona graczy na czas sesji */
  playerNames: [],
};

/** @returns {string[]} kopia listy imion (bez referencji do stanu) */
export function getPlayerNames() {
  return [...state.playerNames];
}

/**
 * Zapisuje imiona w pamięci sesji (po normalizacji).
 * @param {string[]} names
 * @returns {string[]} zapisana kopia
 */
export function setPlayerNames(names) {
  state.playerNames = names.map(normalizePlayerName).filter((name) => name !== '');
  return getPlayerNames();
}

/** Czyści cały stan sesji (przydatne przy wyjściu z gry). */
export function clearSession() {
  state.playerNames = [];
}

/**
 * Przycina spacje, skleja wielokrotne spacje i ogranicza długość.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizePlayerName(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PLAYER_NAME_MAX_LENGTH);
}

/**
 * Waliduje listę imion graczy.
 * @param {string[]} names imiona już po normalizacji
 * @returns {string[]} komunikaty po polsku; pusta tablica = brak błędów
 */
export function validatePlayerNames(names) {
  if (names.length === 0) {
    return ['Najpierw wybierz liczbę graczy.'];
  }

  const errors = [];

  names.forEach((name, index) => {
    if (name === '') {
      errors.push(`Podaj imię dla gracza ${index + 1}.`);
    } else if (name.length < PLAYER_NAME_MIN_LENGTH) {
      errors.push(`Imię gracza ${index + 1} musi mieć co najmniej ${PLAYER_NAME_MIN_LENGTH} znaki.`);
    }
  });

  const seen = new Map();
  names.forEach((name, index) => {
    if (name === '') {
      return;
    }
    const key = name.toLocaleLowerCase('pl');
    if (seen.has(key)) {
      errors.push(`Imiona nie mogą się powtarzać (gracz ${seen.get(key) + 1} i ${index + 1}).`);
    } else {
      seen.set(key, index);
    }
  });

  return errors;
}
