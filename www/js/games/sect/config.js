/**
 * Konfiguracja gry "Wampir" (historyczne id: sect): role, liczby i teksty pomocnicze.
 *
 * Wszystkie liczby i nazwy ról trzymamy w jednym miejscu — reszta gry (silnik,
 * interfejs, scenariusz mistrza gry) czyta je stąd, więc zmiana balansu to
 * edycja tego pliku. Nazwy i opisy ról pochodzą z tłumaczeń (gettery).
 */
import { t, tPlural } from '../../core/i18n.js';

/** Minimalna liczba grających (bez mistrza gry). */
export const MIN_PLAYERS = 5;

/** Maksymalna liczba grających. */
export const MAX_PLAYERS = 20;

/** Domyślny czas dyskusji w dzień (w sekundach) — licznik można włączyć lub pominąć. */
export const DISCUSSION_SECONDS = 180;

/**
 * Identyfikatory ról używane w stanie gry. Są HISTORYCZNE (z czasów „Sekty”)
 * i celowo się nie zmieniają: sect = wampir, doctor = znachor, detective = łowca,
 * villager = mieszkaniec. Widoczne nazwy pochodzą z tłumaczeń games.sect.roles.*.
 */
export const ROLE_IDS = Object.freeze({
  villager: 'villager',
  sect: 'sect',
  doctor: 'doctor',
  detective: 'detective',
  // Nowe role (bez historycznych nazw): uczeń znachora i komendant.
  apprentice: 'apprentice',
  commander: 'commander',
});

/** Od ilu grających komendant jest domyślnie włączony. */
export const COMMANDER_DEFAULT_MIN_PLAYERS = 7;

/** Od ilu grających uczeń jest domyślnie włączony (wymaga znachora). */
export const APPRENTICE_DEFAULT_MIN_PLAYERS = 8;

/**
 * Role: nazwa, ikona i jedno zdanie o mocy (pokazywane graczowi przy sprawdzaniu).
 */
export const ROLES = Object.freeze({
  [ROLE_IDS.villager]: Object.freeze({
    id: ROLE_IDS.villager,
    icon: '🧑',
    get name() {
      return t('games.sect.roles.villager.name');
    },
    get revealText() {
      return t('games.sect.roles.villager.reveal');
    },
  }),
  [ROLE_IDS.sect]: Object.freeze({
    id: ROLE_IDS.sect,
    icon: '🧛',
    get name() {
      return t('games.sect.roles.sect.name');
    },
    get revealText() {
      return t('games.sect.roles.sect.reveal');
    },
  }),
  [ROLE_IDS.doctor]: Object.freeze({
    id: ROLE_IDS.doctor,
    icon: '🌿',
    get name() {
      return t('games.sect.roles.doctor.name');
    },
    get revealText() {
      return t('games.sect.roles.doctor.reveal');
    },
  }),
  [ROLE_IDS.detective]: Object.freeze({
    id: ROLE_IDS.detective,
    icon: '🔍',
    get name() {
      return t('games.sect.roles.detective.name');
    },
    get revealText() {
      return t('games.sect.roles.detective.reveal');
    },
  }),
  [ROLE_IDS.apprentice]: Object.freeze({
    id: ROLE_IDS.apprentice,
    icon: '🎓',
    get name() {
      return t('games.sect.roles.apprentice.name');
    },
    get revealText() {
      return t('games.sect.roles.apprentice.reveal');
    },
  }),
  [ROLE_IDS.commander]: Object.freeze({
    id: ROLE_IDS.commander,
    icon: '⭐',
    get name() {
      return t('games.sect.roles.commander.name');
    },
    get revealText() {
      return t('games.sect.roles.commander.reveal');
    },
  }),
});

/** Kolejność ról w podglądzie i w opisie składu. */
export const ROLE_ORDER = Object.freeze([
  ROLE_IDS.sect,
  ROLE_IDS.doctor,
  ROLE_IDS.apprentice,
  ROLE_IDS.detective,
  ROLE_IDS.commander,
  ROLE_IDS.villager,
]);

/**
 * Liczba wampirów zależnie od liczby grających:
 * 5–7 → 1, 8–11 → 2, 12–15 → 3, 16–20 → 4.
 * @param {number} playerCount
 * @returns {number}
 */
export function getSectCount(playerCount) {
  if (playerCount >= 16) {
    return 4;
  }
  if (playerCount >= 12) {
    return 3;
  }
  if (playerCount >= 8) {
    return 2;
  }
  return 1;
}

/**
 * Domyślne role dodatkowe dla liczby grających (mistrz gry może je zmienić
 * przełącznikami na ekranie przygotowania).
 * @param {number} playerCount
 * @returns {{commander: boolean, apprentice: boolean}}
 */
export function getDefaultOptionalRoles(playerCount) {
  return {
    commander: playerCount >= COMMANDER_DEFAULT_MIN_PLAYERS,
    apprentice: playerCount >= APPRENTICE_DEFAULT_MIN_PLAYERS,
  };
}

/**
 * Ile ról „po stronie dobra” wymaga skład (znachor, łowca i włączone role dodatkowe).
 * @param {{commander?: boolean, apprentice?: boolean}} options
 * @returns {number}
 */
function countSpecialRoles(options) {
  return 2 + (options.apprentice ? 1 : 0) + (options.commander ? 1 : 0);
}

/**
 * Czy rolę dodatkową można włączyć: skład ról specjalnych nie może przekroczyć
 * liczby grających bez wampirów, a uczeń wymaga znachora (znachor jest zawsze).
 * @param {number} playerCount
 * @param {{commander?: boolean, apprentice?: boolean}} options bieżące przełączniki
 * @param {'commander'|'apprentice'} roleKey rola, którą chcemy włączyć
 * @returns {boolean}
 */
export function canEnableOptionalRole(playerCount, options, roleKey) {
  const withRole = { ...options, [roleKey]: true };
  return countSpecialRoles(withRole) <= playerCount - getSectCount(playerCount);
}

/**
 * Normalizuje przełączniki ról dodatkowych: wyłącza te, które się nie mieszczą
 * w składzie (najpierw ucznia, potem komendanta).
 * @param {number} playerCount
 * @param {{commander?: boolean, apprentice?: boolean}} [options]
 * @returns {{commander: boolean, apprentice: boolean}}
 */
export function normalizeOptionalRoles(playerCount, options = getDefaultOptionalRoles(playerCount)) {
  const result = { commander: options.commander === true, apprentice: options.apprentice === true };
  const free = playerCount - getSectCount(playerCount);

  if (countSpecialRoles(result) > free) {
    result.apprentice = false;
  }
  if (countSpecialRoles(result) > free) {
    result.commander = false;
  }

  return result;
}

/**
 * Skład ról dla podanej liczby grających (znachor i łowca zawsze po jednym,
 * uczeń i komendant według przełączników, reszta to mieszkańcy).
 * @param {number} playerCount
 * @param {{commander?: boolean, apprentice?: boolean}} [options] domyślnie wg liczby graczy
 * @returns {{sect: number, doctor: number, apprentice: number, detective: number, commander: number, villager: number}}
 */
export function getLineup(playerCount, options = getDefaultOptionalRoles(playerCount)) {
  const optional = normalizeOptionalRoles(playerCount, options);
  const sect = getSectCount(playerCount);
  const doctor = 1;
  const detective = 1;
  const apprentice = optional.apprentice ? 1 : 0;
  const commander = optional.commander ? 1 : 0;

  return {
    sect,
    doctor,
    apprentice,
    detective,
    commander,
    villager: Math.max(0, playerCount - sect - doctor - detective - apprentice - commander),
  };
}

/**
 * Opis składu do podglądu na ekranie przygotowania,
 * np. "2 wampiry, 1 znachor, 1 uczeń, 1 łowca, 1 komendant, 2 mieszkańców".
 * Role z liczbą 0 (uczeń, komendant) są pomijane.
 * @param {ReturnType<typeof getLineup>} lineup
 * @returns {string}
 */
export function formatLineup(lineup) {
  return [
    tPlural('games.sect.lineup.sect', lineup.sect),
    tPlural('games.sect.lineup.doctor', lineup.doctor),
    lineup.apprentice > 0 ? tPlural('games.sect.lineup.apprentice', lineup.apprentice) : null,
    tPlural('games.sect.lineup.detective', lineup.detective),
    lineup.commander > 0 ? tPlural('games.sect.lineup.commander', lineup.commander) : null,
    tPlural('games.sect.lineup.villager', lineup.villager),
  ]
    .filter(Boolean)
    .join(', ');
}
