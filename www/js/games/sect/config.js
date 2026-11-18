/**
 * Konfiguracja gry "Wampir" (historyczne id: sect): role, liczby i teksty pomocnicze.
 *
 * Wszystkie liczby i nazwy ról trzymamy w jednym miejscu — reszta gry (silnik,
 * interfejs, scenariusz mistrza gry) czyta je stąd, więc zmiana balansu to
 * edycja tego pliku. Nazwy i opisy ról pochodzą z tłumaczeń (gettery).
 */
import { t } from '../../core/i18n.js';

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
  // Hrabia — wampir, którego łowca widzi jako niewinnego; sługa — człowiek po stronie wampirów.
  count: 'count',
  servant: 'servant',
  // Wiedźma — dwie jednorazowe mikstury: uleczenie ofiary wampirów i otrucie.
  witch: 'witch',
});

/**
 * KONFIGURACJA RÓL jednej partii (wybierana na ekranie „Role w tej grze”):
 *   { vampires: liczba, znachor, lowca, uczen, komendant, hrabia, sluga, wiedzma }
 * Pola logiczne mówią, czy rola gra. Mieszkańcy to reszta grających.
 * Hrabia zajmie jedno miejsce z puli wampirów (nie dodaje osoby).
 *
 * Klucze konfiguracji są po polsku (tak jak w opisie gry), a identyfikatory ról
 * w stanie gry — historyczne/angielskie (ROLE_IDS). Mapowanie niżej.
 */
export const ROLE_CONFIG_KEYS = Object.freeze([
  'znachor',
  'uczen',
  'lowca',
  'komendant',
  'hrabia',
  'sluga',
  'wiedzma',
]);

/**
 * Role, które są już zaimplementowane (pokazywane na ekranie wyboru i rozdawane),
 * w kolejności listy „Role w tej grze”: najpierw strona wampirów, potem mieszkańców.
 */
export const ACTIVE_ROLE_CONFIG_KEYS = Object.freeze([
  'hrabia',
  'sluga',
  'znachor',
  'uczen',
  'wiedzma',
  'lowca',
  'komendant',
]);

/** Klucz konfiguracji → identyfikator roli w stanie gry (tylko role aktywne). */
export const ROLE_ID_BY_CONFIG_KEY = Object.freeze({
  hrabia: 'count',
  sluga: 'servant',
  znachor: 'doctor',
  uczen: 'apprentice',
  wiedzma: 'witch',
  lowca: 'detective',
  komendant: 'commander',
});

/**
 * Od ilu grających rola jest domyślnie włączona (null = zawsze).
 * Uczeń wymaga też znachora, hrabia — co najmniej 2 wampirów.
 */
export const ROLE_DEFAULT_MIN_PLAYERS = Object.freeze({
  znachor: null,
  lowca: null,
  komendant: 7,
  uczen: 8,
  hrabia: 10,
  sluga: 10,
  wiedzma: 12,
});

/** Najmniejsza liczba wampirów w partii. */
export const MIN_VAMPIRES = 1;

/** Od ilu wampirów może grać hrabia (jest jednym z nich). */
export const COUNT_MIN_VAMPIRES = 2;

/** Ostrzeżenie: wampirów więcej niż ta część grających. */
export const VAMPIRES_WARNING_SHARE = 1 / 3;

/** Ostrzeżenie: mniej zwykłych mieszkańców niż ta liczba. */
export const MIN_VILLAGERS_WARNING = 2;

/**
 * Role: nazwa, ikona, pełny opis mocy (pokazywany graczowi przy sprawdzaniu roli
 * i pod przyciskiem „i” na ekranie wyboru ról) oraz jednozdaniowe podsumowanie
 * (lista „Role w tej grze”).
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
    get summary() {
      return t('games.sect.roles.villager.summary');
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
    get summary() {
      return t('games.sect.roles.sect.summary');
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
    get summary() {
      return t('games.sect.roles.doctor.summary');
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
    get summary() {
      return t('games.sect.roles.detective.summary');
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
    get summary() {
      return t('games.sect.roles.apprentice.summary');
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
    get summary() {
      return t('games.sect.roles.commander.summary');
    },
  }),
  [ROLE_IDS.count]: Object.freeze({
    id: ROLE_IDS.count,
    icon: '🦇',
    get name() {
      return t('games.sect.roles.count.name');
    },
    /** Nazwa na liście „Role w tej grze” (przełącznik). */
    get setupName() {
      return t('games.sect.roles.count.setupName');
    },
    /** Nazwa przy odsłonięciu roli zmarłej osoby (poranek, głosowanie, koniec gry). */
    get revealName() {
      return t('games.sect.roles.count.revealName');
    },
    get revealText() {
      return t('games.sect.roles.count.reveal');
    },
    get summary() {
      return t('games.sect.roles.count.summary');
    },
  }),
  [ROLE_IDS.servant]: Object.freeze({
    id: ROLE_IDS.servant,
    icon: '🗝️',
    get name() {
      return t('games.sect.roles.servant.name');
    },
    get revealText() {
      return t('games.sect.roles.servant.reveal');
    },
    get summary() {
      return t('games.sect.roles.servant.summary');
    },
  }),
  [ROLE_IDS.witch]: Object.freeze({
    id: ROLE_IDS.witch,
    icon: '🧙',
    get name() {
      return t('games.sect.roles.witch.name');
    },
    get revealText() {
      return t('games.sect.roles.witch.reveal');
    },
    get summary() {
      return t('games.sect.roles.witch.summary');
    },
  }),
});

/**
 * Nazwa roli przy jej odsłonięciu (zmarła osoba): dla hrabiego „Hrabia (wampir)”,
 * dla pozostałych zwykła nazwa.
 * @param {string} roleId
 * @returns {string}
 */
export function getRoleRevealName(roleId) {
  const role = ROLES[roleId];
  return role ? (role.revealName ?? role.name) : '—';
}

/** Kolejność ról w podglądzie i w opisie składu. */
export const ROLE_ORDER = Object.freeze([
  ROLE_IDS.sect,
  ROLE_IDS.count,
  ROLE_IDS.servant,
  ROLE_IDS.doctor,
  ROLE_IDS.apprentice,
  ROLE_IDS.witch,
  ROLE_IDS.detective,
  ROLE_IDS.commander,
  ROLE_IDS.villager,
]);

/**
 * Domyślna liczba wampirów zależnie od liczby grających:
 * 5–7 → 1, 8–11 → 2, 12–15 → 3, 16–20 → 4.
 * @param {number} playerCount
 * @returns {number}
 */
export function getDefaultVampireCount(playerCount) {
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
 * Domyślna konfiguracja ról dla liczby grających: liczba wampirów według progów,
 * role aktywne włączone od swoich progów (ROLE_DEFAULT_MIN_PLAYERS), role jeszcze
 * nieaktywne (hrabia, sługa, wiedźma) wyłączone. Uczeń tylko razem ze znachorem,
 * hrabia tylko przy co najmniej 2 wampirach.
 * @param {number} playerCount
 * @returns {{vampires: number, znachor: boolean, lowca: boolean, uczen: boolean,
 *   komendant: boolean, hrabia: boolean, sluga: boolean, wiedzma: boolean}}
 */
export function defaultRoleConfig(playerCount) {
  const config = { vampires: getDefaultVampireCount(playerCount) };

  for (const key of ROLE_CONFIG_KEYS) {
    const minPlayers = ROLE_DEFAULT_MIN_PLAYERS[key];
    const active = ACTIVE_ROLE_CONFIG_KEYS.includes(key);
    config[key] = active && (minPlayers === null || playerCount >= minPlayers);
  }

  if (!config.znachor) {
    config.uczen = false;
  }
  if (config.vampires < COUNT_MIN_VAMPIRES) {
    config.hrabia = false;
  }

  return config;
}
