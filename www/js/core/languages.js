/**
 * Lista języków obsługiwanych przez aplikację.
 *
 * Aby dodać język:
 *   1. skopiuj www/locales/pl.json do www/locales/<kod>.json i przetłumacz,
 *   2. dodaj folder www/data/<kod>/ z plikami treści gier,
 *   3. dopisz język do tej tablicy.
 *
 * `nativeName` jest zawsze pokazywany w swoim języku (np. „Polski”, „English”),
 * a `dir` ustawia kierunek tekstu w <html>.
 */
export const LANGUAGES = Object.freeze([
  Object.freeze({ code: 'pl', nativeName: 'Polski', dir: 'ltr' }),
  Object.freeze({ code: 'en', nativeName: 'English', dir: 'ltr' }),
]);

/** Język źródłowy tekstów i zapasowy dla brakujących kluczy. */
export const DEFAULT_LANGUAGE = 'pl';

/** Kody wszystkich obsługiwanych języków. */
export const SUPPORTED_LANGUAGE_CODES = Object.freeze(
  LANGUAGES.map((language) => language.code),
);

/**
 * Czy kod języka jest obsługiwany?
 * @param {unknown} code
 * @returns {boolean}
 */
export function isSupportedLanguage(code) {
  return typeof code === 'string' && SUPPORTED_LANGUAGE_CODES.includes(code);
}

/**
 * Informacje o języku; dla nieznanego kodu zwraca język źródłowy.
 * @param {string} code
 * @returns {{code: string, nativeName: string, dir: string}}
 */
export function getLanguageInfo(code) {
  return (
    LANGUAGES.find((language) => language.code === code) ??
    LANGUAGES.find((language) => language.code === DEFAULT_LANGUAGE) ??
    LANGUAGES[0]
  );
}
