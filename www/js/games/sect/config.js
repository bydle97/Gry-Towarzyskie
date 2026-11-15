/**
 * Konfiguracja gry "Sekta": role, liczby i teksty pomocnicze.
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

/** Identyfikatory ról używane w stanie gry. */
export const ROLE_IDS = Object.freeze({
  villager: 'villager',
  sect: 'sect',
  doctor: 'doctor',
  detective: 'detective',
});

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
    icon: '🕯️',
    get name() {
      return t('games.sect.roles.sect.name');
    },
    get revealText() {
      return t('games.sect.roles.sect.reveal');
    },
  }),
  [ROLE_IDS.doctor]: Object.freeze({
    id: ROLE_IDS.doctor,
    icon: '💉',
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
});

/** Kolejność ról w podglądzie i w opisie składu. */
export const ROLE_ORDER = Object.freeze([
  ROLE_IDS.sect,
  ROLE_IDS.doctor,
  ROLE_IDS.detective,
  ROLE_IDS.villager,
]);

/**
 * Liczba sekciarzy zależnie od liczby grających:
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
 * Skład ról dla podanej liczby grających (lekarz i śledczy zawsze po jednym).
 * @param {number} playerCount
 * @returns {{sect: number, doctor: number, detective: number, villager: number}}
 */
export function getLineup(playerCount) {
  const sect = getSectCount(playerCount);
  const doctor = 1;
  const detective = 1;

  return {
    sect,
    doctor,
    detective,
    villager: Math.max(0, playerCount - sect - doctor - detective),
  };
}

/**
 * Opis składu do podglądu na ekranie przygotowania,
 * np. "2 sekciarzy, 1 lekarz, 1 śledczy, 3 mieszkańców".
 * @param {{sect: number, doctor: number, detective: number, villager: number}} lineup
 * @returns {string}
 */
export function formatLineup(lineup) {
  return [
    tPlural('games.sect.lineup.sect', lineup.sect),
    tPlural('games.sect.lineup.doctor', lineup.doctor),
    tPlural('games.sect.lineup.detective', lineup.detective),
    tPlural('games.sect.lineup.villager', lineup.villager),
  ].join(', ');
}
