/**
 * Konfiguracja gry "Sekta": role, liczby i teksty pomocnicze.
 *
 * Wszystkie liczby i nazwy ról trzymamy w jednym miejscu — reszta gry (silnik,
 * interfejs, scenariusz mistrza gry) czyta je stąd, więc zmiana balansu to
 * edycja tego pliku.
 */

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
    name: 'Mieszkaniec',
    icon: '🧑',
    revealText: 'Nie masz mocy. W dzień dyskutujesz i głosujesz razem z miasteczkiem.',
  }),
  [ROLE_IDS.sect]: Object.freeze({
    id: ROLE_IDS.sect,
    name: 'Sekciarz',
    icon: '🕯️',
    revealText:
      'Poznasz innych sekciarzy w pierwszą noc, gdy mistrz gry poprosi sektę o otwarcie oczu.',
  }),
  [ROLE_IDS.doctor]: Object.freeze({
    id: ROLE_IDS.doctor,
    name: 'Lekarz',
    icon: '💉',
    revealText:
      'Każdej nocy możesz ochronić jedną osobę (nie tę samą dwie noce z rzędu, możesz siebie).',
  }),
  [ROLE_IDS.detective]: Object.freeze({
    id: ROLE_IDS.detective,
    name: 'Śledczy',
    icon: '🔍',
    revealText: 'Każdej nocy możesz sprawdzić jedną osobę: czy jest sekciarzem.',
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

function formatRoleCount(count, singular, plural) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

/**
 * Opis składu do podglądu na ekranie przygotowania,
 * np. "2 sekciarzy, 1 lekarz, 1 śledczy, 3 mieszkańców".
 * @param {{sect: number, doctor: number, detective: number, villager: number}} lineup
 * @returns {string}
 */
export function formatLineup(lineup) {
  return [
    formatRoleCount(lineup.sect, 'sekciarz', 'sekciarzy'),
    formatRoleCount(lineup.doctor, 'lekarz', 'lekarzy'),
    formatRoleCount(lineup.detective, 'śledczy', 'śledczych'),
    formatRoleCount(lineup.villager, 'mieszkaniec', 'mieszkańców'),
  ].join(', ');
}
