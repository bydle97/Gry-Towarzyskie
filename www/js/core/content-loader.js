/**
 * Wczytywanie treści gier z plików tekstowych w www/data/<kod języka>/.
 *
 * Pliki są częścią projektu, więc aplikacja działa offline. Każdy plik jest
 * pobierany najwyżej raz na sesję: wynik (tekst) trzymamy w pamięci modułu.
 * Nic nie trafia do localStorage ani na dysk.
 *
 * Jeśli pliku w bieżącym języku brakuje, loader używa wersji polskiej
 * i raz ostrzega w konsoli.
 *
 * Format pytań: „Pytanie | odpowiedź | jednostka” (jednostka opcjonalna).
 * Odpowiedź to liczba całkowita; spacje i podkreślenia w niej są pomijane.
 * Format haseł i kategorii: jedna pozycja w linii.
 * Puste linie i linie zaczynające się od # są ignorowane, podobnie duplikaty
 * (bez rozróżniania wielkości liter).
 */
import { DEFAULT_LANGUAGE } from './languages.js';
import { getLanguage } from './i18n.js';

/** Nazwy plików treści — wspólne dla wszystkich języków. */
const CONTENT_FILE_NAMES = Object.freeze({
  questions: 'questions-na-oko.txt',
  phrases: 'phrases-w-pol-slowa.txt',
  categories: 'categories-ping-pong.txt',
});

/**
 * Buduje adres pliku treści dla języka (względnie do tego modułu).
 * @param {'questions'|'phrases'|'categories'} kind
 * @param {string} [language]
 * @returns {URL}
 */
export function getContentUrl(kind, language = getLanguage()) {
  const fileName = CONTENT_FILE_NAMES[kind];

  if (!fileName) {
    throw new Error(`Nieznany rodzaj treści: "${kind}".`);
  }

  return new URL(`../../data/${language}/${fileName}`, import.meta.url);
}

/** @type {Map<string, Promise<string>>} */
const textCache = new Map();

/** Ostrzeżenia o fallbacku już pokazane (jeden raz na rodzaj treści i język). */
const warnedFallbacks = new Set();

/**
 * Pobiera tekst pliku (UTF-8). Wynik jest pamiętany do końca sesji.
 * Błąd nie zostaje w pamięci, żeby „Spróbuj ponownie” mogło ponowić pobranie.
 * @param {string|URL} url
 * @returns {Promise<string>}
 */
async function loadText(url) {
  const cacheKey = String(url);
  const cached = textCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const request = (async () => {
    const response = await fetch(url, { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`Nie udało się pobrać pliku (HTTP ${response.status}): ${cacheKey}`);
    }

    return response.text();
  })();

  textCache.set(cacheKey, request);

  try {
    return await request;
  } catch (error) {
    textCache.delete(cacheKey);
    throw error;
  }
}

/**
 * Wczytuje tekst treści dla bieżącego języka. Jeśli pliku w tym języku brakuje,
 * używa polskiego i raz ostrzega w konsoli.
 * @param {'questions'|'phrases'|'categories'} kind
 * @returns {Promise<{text: string, url: URL}>}
 */
async function loadContentText(kind) {
  const language = getLanguage();
  const candidates = language === DEFAULT_LANGUAGE ? [language] : [language, DEFAULT_LANGUAGE];
  let lastError = null;

  for (const candidate of candidates) {
    const url = getContentUrl(kind, candidate);

    try {
      return { text: await loadText(url), url };
    } catch (error) {
      lastError = error;

      if (candidate === language && language !== DEFAULT_LANGUAGE) {
        const warningKey = `${kind}:${language}`;

        if (!warnedFallbacks.has(warningKey)) {
          warnedFallbacks.add(warningKey);
          console.warn(
            `[content] Brak pliku treści "${kind}" w języku "${language}" (${url}) — używam wersji "${DEFAULT_LANGUAGE}".`,
          );
        }
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Dzieli tekst na linie, obcina spacje i pomija puste linie oraz komentarze.
 * Obsługuje końce linii Windows (\r\n) i uniksowe (\n).
 * @param {string} text
 * @returns {Array<{lineNumber: number, text: string}>}
 */
function normalizeLines(text) {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ lineNumber: index + 1, text: line.trim() }))
    .filter((line) => line.text !== '' && !line.text.startsWith('#'));
}

/**
 * Nazwa pliku do komunikatów w konsoli (bez pełnej ścieżki i parametrów).
 * @param {string|URL} url
 * @returns {string}
 */
function fileName(url) {
  const clean = String(url).split('?')[0];
  return clean.slice(clean.lastIndexOf('/') + 1);
}

/**
 * Wypisuje ostrzeżenie o pominiętej linii pliku z treścią.
 * @param {string|URL} url
 * @param {number} lineNumber
 * @param {string} reason
 */
function warnLine(url, lineNumber, reason) {
  console.warn(`${fileName(url)}, linia ${lineNumber}: ${reason} — linia pominięta.`);
}

/**
 * Wczytuje proste pozycje tekstowe (hasła albo kategorie).
 * @param {'phrases'|'categories'} kind
 * @returns {Promise<string[]>}
 */
export async function loadLines(kind) {
  const { text } = await loadContentText(kind);
  const seen = new Set();
  const result = [];

  for (const line of normalizeLines(text)) {
    const key = line.text.toLocaleLowerCase('pl');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(line.text);
  }

  return result;
}

/**
 * Wczytuje pytania w formacie „Pytanie | odpowiedź | jednostka”.
 * Błędne linie są pomijane z ostrzeżeniem w konsoli, żeby jedna pomyłka
 * nie psuła całej gry. Pytania muszą mieć unikalny tekst (bez względu na
 * wielkość liter) i nie mogą zawierać znaku |.
 * @param {'questions'} kind
 * @returns {Promise<Array<{text: string, answer: number, unit: string}>>}
 */
export async function loadQuestions(kind) {
  const { text, url } = await loadContentText(kind);
  const questions = [];
  const seen = new Set();

  for (const line of normalizeLines(text)) {
    const parts = line.text.split('|').map((part) => part.trim());

    if (parts.length < 2) {
      warnLine(url, line.lineNumber, 'brak znaku | rozdzielającego pytanie i odpowiedź');
      continue;
    }
    if (parts.length > 3) {
      warnLine(url, line.lineNumber, 'za dużo znaków | (pytanie nie może zawierać znaku |)');
      continue;
    }

    const [questionText, rawAnswerText, unit = ''] = parts;
    // Separatory tysięcy w postaci spacji, twardych spacji i podkreśleń są dozwolone
    // („5 000 000”, „5_000_000”). Przecinków i kropek NIE usuwamy: „64,6” po polsku
    // i „239,057” po angielsku znaczą co innego, więc takie linie nadal są odrzucane.
    const answerText = rawAnswerText.replace(/[\s   _]/g, '');

    if (questionText === '') {
      warnLine(url, line.lineNumber, 'pytanie jest puste');
      continue;
    }
    if (!/^[+-]?\d+$/.test(answerText)) {
      warnLine(url, line.lineNumber, 'odpowiedź nie jest liczbą całkowitą');
      continue;
    }

    const answer = Number(answerText);

    if (!Number.isSafeInteger(answer)) {
      warnLine(url, line.lineNumber, 'odpowiedź jest poza zakresem liczb całkowitych');
      continue;
    }

    const key = questionText.toLocaleLowerCase('pl');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    questions.push({ text: questionText, answer, unit });
  }

  return questions;
}
