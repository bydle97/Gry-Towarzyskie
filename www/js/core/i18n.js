/**
 * Rdzeń wielojęzyczności.
 *
 * - Teksty źródłowe są w języku polskim (DEFAULT_LANGUAGE).
 * - Pliki tłumaczeń leżą w www/locales/<kod>.json (płaskie klucze, np. „hub.title”).
 * - Tłumaczenia są pobierane przez fetch z cache: 'no-cache' i trzymane w pamięci
 *   przez całą sesję. Nic nie trafia na dysk poza kodem języka w localStorage.
 * - Brakujący klucz w wybranym języku jest zastępowany tekstem polskim,
 *   a ostrzeżenie w konsoli pojawia się tylko raz dla danego klucza.
 */
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  SUPPORTED_LANGUAGE_CODES,
  getLanguageInfo,
  isSupportedLanguage,
} from './languages.js';

/** Jedyny dozwolony wpis w localStorage — kod wybranego języka. */
const STORAGE_KEY = 'gt.lang';

/** @type {Map<string, Object<string, string>>} */
const messages = new Map();

/** @type {Set<(language: string) => void>} */
const listeners = new Set();

/** Klucze, dla których ostrzeżenie już się pojawiło (jeden raz na klucz). */
const warnedKeys = new Set();

/** @type {Map<string, Intl.PluralRules>} */
const pluralRules = new Map();

/** @type {Map<string, Intl.NumberFormat>} */
const numberFormats = new Map();

let currentLanguage = DEFAULT_LANGUAGE;
let initialized = false;

/**
 * Pobiera plik tłumaczeń dla języka.
 * @param {string} code
 * @returns {Promise<Object<string, string>>}
 */
async function loadLocale(code) {
  const url = new URL(`../../locales/${code}.json`, import.meta.url);
  const response = await fetch(url, { cache: 'no-cache' });

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać tłumaczeń (HTTP ${response.status}): ${url}`);
  }

  const data = await response.json();

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Plik tłumaczeń nie jest obiektem klucz–wartość: ${url}`);
  }

  return data;
}

/** Język zapisany przez użytkownika (jeśli poprawny). */
function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : null;
  } catch (error) {
    return null;
  }
}

/** Pierwszy obsługiwany język z preferencji przeglądarki. */
function detectNavigatorLanguage() {
  if (typeof navigator === 'undefined') {
    return null;
  }

  const tags =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      continue;
    }

    const base = tag.toLowerCase().split('-')[0];

    if (isSupportedLanguage(base)) {
      return base;
    }
  }

  return null;
}

/** Kolejność wyboru: zapisany kod → przeglądarka → „en”. */
function chooseInitialLanguage() {
  return readStoredLanguage() ?? detectNavigatorLanguage() ?? 'en';
}

/** Zapisuje wybór języka (jedyny dozwolony wpis w localStorage). */
function persistLanguage(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch (error) {
    // Prywatny tryb przeglądarki może blokować localStorage — gra działa dalej.
  }
}

/** Ustawia atrybuty dokumentu wynikające z języka. */
function applyDocumentLanguage() {
  if (typeof document === 'undefined') {
    return;
  }

  const info = getLanguageInfo(currentLanguage);
  document.documentElement.lang = info.code;
  document.documentElement.dir = info.dir;
  document.title = t('app.documentTitle');

  const description = document.querySelector('meta[name="description"]');

  if (description) {
    description.setAttribute('content', t('app.metaDescription'));
  }
}

/**
 * Pobiera tekst z tabeli języka.
 * @param {string} language
 * @param {string} key
 * @returns {string|undefined}
 */
function lookup(language, key) {
  const table = messages.get(language);

  if (!table || !Object.prototype.hasOwnProperty.call(table, key)) {
    return undefined;
  }

  return table[key];
}

/**
 * Ostrzega o brakującym kluczu tylko raz.
 * @param {string} language
 * @param {string} key
 * @param {boolean} [alsoSource]
 */
function warnMissingKey(language, key, alsoSource = false) {
  const warningKey = `${language}:${key}`;

  if (warnedKeys.has(warningKey)) {
    return;
  }

  warnedKeys.add(warningKey);

  if (alsoSource) {
    console.warn(
      `[i18n] Brak klucza "${key}" w językach "${language}" i "${DEFAULT_LANGUAGE}" — zwracam sam klucz.`,
    );
    return;
  }

  console.warn(
    `[i18n] Brak klucza "${key}" w języku "${language}" — użyto tekstu z "${DEFAULT_LANGUAGE}".`,
  );
}

/**
 * Podstawia parametry w postaci {name} do tekstu.
 * @param {string} template
 * @param {Object<string, unknown>} params
 * @returns {string}
 */
function interpolate(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

/**
 * Zwraca tłumaczenie klucza w bieżącym języku.
 * @param {string} key
 * @param {Object<string, unknown>} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  const primary = lookup(currentLanguage, key);

  if (primary !== undefined) {
    return interpolate(primary, params);
  }

  const fallback = lookup(DEFAULT_LANGUAGE, key);

  if (fallback !== undefined) {
    if (currentLanguage !== DEFAULT_LANGUAGE) {
      warnMissingKey(currentLanguage, key);
    }
    return interpolate(fallback, params);
  }

  warnMissingKey(currentLanguage, key, true);
  return key;
}

/**
 * Reguły liczby mnogiej dla języka (cache).
 * @param {string} language
 * @returns {Intl.PluralRules}
 */
function pluralRulesFor(language) {
  let rules = pluralRules.get(language);

  if (!rules) {
    rules = new Intl.PluralRules(language);
    pluralRules.set(language, rules);
  }

  return rules;
}

/**
 * Tłumaczenie z odmianą przez Intl.PluralRules.
 * Klucze: `<key>_one`, `<key>_few`, `<key>_many`, `<key>_other`.
 * Gdy brak formy dla kategorii, używane jest `_other`.
 * @param {string} key
 * @param {number} n
 * @param {Object<string, unknown>} [params]
 * @returns {string}
 */
export function tPlural(key, n, params = {}) {
  const category = pluralRulesFor(currentLanguage).select(n);
  const candidates = [`${key}_${category}`, `${key}_other`];

  for (const language of [currentLanguage, DEFAULT_LANGUAGE]) {
    for (const candidate of candidates) {
      const message = lookup(language, candidate);

      if (message !== undefined) {
        if (language !== currentLanguage) {
          warnMissingKey(currentLanguage, candidate);
        }
        return interpolate(message, { ...params, count: formatNumber(n) });
      }
    }
  }

  warnMissingKey(currentLanguage, `${key}_other`);
  return t(key, { ...params, count: formatNumber(n) });
}

/**
 * Formatuje liczbę zgodnie z bieżącym językiem (np. przecinek dziesiętny po polsku).
 * @param {number} value
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export function formatNumber(value, options = {}) {
  const cacheKey = `${currentLanguage}|${JSON.stringify(options)}`;
  let formatter = numberFormats.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.NumberFormat(currentLanguage, options);
    numberFormats.set(cacheKey, formatter);
  }

  return formatter.format(value);
}

/** @returns {string} kod bieżącego języka */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Zmienia język, ustawia atrybuty dokumentu i powiadamia słuchaczy.
 * @param {string} code
 * @returns {boolean} true, gdy język się zmienił
 */
export function setLanguage(code) {
  if (!isSupportedLanguage(code)) {
    return false;
  }

  if (code === currentLanguage) {
    applyDocumentLanguage();
    return false;
  }

  currentLanguage = code;
  persistLanguage(code);
  applyDocumentLanguage();

  for (const listener of [...listeners]) {
    try {
      listener(currentLanguage);
    } catch (error) {
      console.error('Błąd słuchacza zmiany języka:', error);
    }
  }

  return true;
}

/**
 * Rejestruje słuchacza zmiany języka.
 * @param {(language: string) => void} callback
 * @returns {() => void} funkcja wyrejestrowująca
 */
export function onLanguageChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Kontrola kompletności tłumaczeń względem języka źródłowego.
 * Dostępna w konsoli jako window.__i18nCheck().
 * @returns {Object<string, {missing: string[], extra: string[]}>}
 */
export function checkTranslations() {
  const source = messages.get(DEFAULT_LANGUAGE) ?? {};
  const sourceKeys = Object.keys(source);
  const sourceSet = new Set(sourceKeys);
  const report = {};

  for (const { code } of LANGUAGES) {
    const table = messages.get(code) ?? {};
    const keys = Object.keys(table);
    const keySet = new Set(keys);

    report[code] = {
      missing: sourceKeys.filter((key) => !keySet.has(key)),
      extra: keys.filter((key) => !sourceSet.has(key)),
    };
  }

  console.group('[i18n] Kontrola tłumaczeń');

  for (const [code, entry] of Object.entries(report)) {
    console.log(
      `${code}: brakujące ${entry.missing.length}, nadmiarowe ${entry.extra.length}`,
      entry,
    );
  }

  console.groupEnd();
  return report;
}

/**
 * Inicjalizuje i18n: wczytuje wszystkie języki, wybiera język i ustawia dokument.
 * @returns {Promise<string>} kod wybranego języka
 */
export async function init() {
  if (initialized) {
    return currentLanguage;
  }

  const loaded = await Promise.all(
    SUPPORTED_LANGUAGE_CODES.map(async (code) => {
      try {
        return [code, await loadLocale(code)];
      } catch (error) {
        console.error(`Nie udało się wczytać tłumaczeń dla języka "${code}":`, error);
        return [code, {}];
      }
    }),
  );

  for (const [code, table] of loaded) {
    messages.set(code, table);
  }

  if (Object.keys(messages.get(DEFAULT_LANGUAGE) ?? {}).length === 0) {
    throw new Error(
      `Nie udało się wczytać tłumaczeń bazowych (www/locales/${DEFAULT_LANGUAGE}.json).`,
    );
  }

  currentLanguage = chooseInitialLanguage();
  applyDocumentLanguage();

  if (typeof window !== 'undefined') {
    window.__i18nCheck = checkTranslations;
  }

  initialized = true;
  return currentLanguage;
}
