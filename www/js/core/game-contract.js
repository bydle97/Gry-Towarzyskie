/**
 * KONTRAKT GRY — wspólny format, który musi spełniać każda gra w HUB-ie.
 *
 * Każda gra to zwykły obiekt (zwykle eksport z `www/js/games/<id>/index.js`) z polami:
 *
 *   id             {string}  unikalny identyfikator: małe litery, cyfry i myślniki, np. "example"
 *   nameKey        {string}  klucz tłumaczenia nazwy (np. "games.example.name");
 *                            zamiast niego można podać stały tekst w polu `name`
 *   descriptionKey {string}  klucz krótkiego opisu (1–2 zdania) z karty gry;
 *                            zamiast niego można podać stały tekst w polu `description`
 *   icon           {string}  emoji zamiast pliku graficznego (działa offline, bez zależności)
 *   howToPlay      {Object}  [opcjonalne] instrukcja dla ekranu szczegółów, jako klucze:
 *                            { goalKey: string, stepKeys: string[], tipKeys?: string[] }
 *                            stepKeys — od 3 do 6 kluczy (każdy krok do ok. 140 znaków).
 *                            Starszy wariant z gotowymi tekstami { goal, steps, tips } też działa.
 *                            Gra bez howToPlay pokazuje na szczegółach sam opis.
 *   howToPlayParams {Object} [opcjonalne] parametry podstawiane do tekstów instrukcji,
 *                            np. { seconds: 10 } dla „{seconds} s”
 *   minPlayers     {number}  minimalna liczba graczy (liczba całkowita >= 1)
 *   maxPlayers     {number}  maksymalna liczba graczy (liczba całkowita >= minPlayers)
 *   mount(container, players, api)  uruchamia grę
 *   unmount()                       sprząta po grze (timery, nasłuchy zdarzeń, wstrzyknięte style)
 *
 * Parametry funkcji mount:
 *   container {HTMLElement} pusty element, w którym gra rysuje swój interfejs.
 *                           Gra nie tworzy własnego <body> ani nie zmienia stylów globalnych.
 *   players   {string[]}    IMIONA graczy w kolejności z ekranu głównego (unikalne bez względu
 *                           na wielkość liter). Gra od razu na starcie nadaje każdemu graczowi
 *                           stały identyfikator (np. `p1`…`pN`) i w stanie gry (tury, wyniki,
 *                           drużyny, role) posługuje się wyłącznie tym id. Pozycja w tablicy
 *                           NIE jest tożsamością gracza — kolejność tur i rankingi to osobne
 *                           tablice identyfikatorów. Imiona służą tylko do wyświetlania.
 *   api       {GameApi}     funkcje HUB-a opisane niżej (tylko te, które dostarcza createGameApi()).
 *
 * Zasady dla gier:
 *  - zero sieci poza własnymi plikami treści (core/content-loader.js); brak CDN,
 *    zewnętrznych fontów i obrazków,
 *  - brak zapisu danych na dysku (localStorage, sessionStorage, IndexedDB) — stan żyje w pamięci,
 *  - po wywołaniu unmount() nie może zostać żaden aktywny timer ani nasłuch zdarzeń,
 *  - wszystkie teksty widoczne dla gracza idą przez t() / tPlural() z core/i18n.js, a klucze
 *    trzeba dodać do www/locales/pl.json i en.json; identyfikatory w kodzie po angielsku.
 */
import { t } from './i18n.js';

/** Dozwolony format identyfikatora gry, np. "example", "mafia", "rewolwer-2". */
export const GAME_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Funkcje HUB-a przekazywane grze w funkcji mount — dokładnie to, co zwraca
 * createGameApi() z core/game-api.js. Wspólne elementy interfejsu (podział na
 * drużyny, ekrany wczytywania) gry importują bezpośrednio z js/components/.
 * @typedef {Object} GameApi
 * @property {(roleList: string[], playerCount: number) => string[]} shuffleRoles
 *   Losuje role: tasuje kopię listy ról i zwraca dokładnie `playerCount` pozycji
 *   (lista ról musi mieć co najmniej tyle pozycji, inaczej funkcja rzuca błąd).
 * @property {() => void} exit
 *   Kończy grę i wraca do ekranu szczegółów (HUB sam wywoła unmount).
 */

/**
 * Instrukcja gry pokazywana na ekranie szczegółów (pole opcjonalne).
 * @typedef {Object} HowToPlay
 * @property {string} goal   jedno zdanie: o co chodzi w grze
 * @property {string[]} steps  od 3 do 6 krótkich kroków (każdy do ok. 140 znaków)
 * @property {string[]} [tips]  opcjonalne krótkie wskazówki
 */

/**
 * Definicja gry — pełny kształt obiektu wymagany przez rejestr gier.
 * @typedef {Object} GameDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {HowToPlay} [howToPlay]
 * @property {string} icon
 * @property {number} minPlayers
 * @property {number} maxPlayers
 * @property {(container: HTMLElement, players: string[], api: GameApi) => void} mount
 * @property {() => void} unmount
 */

/**
 * Sprawdza, czy przekazany obiekt spełnia kontrakt gry.
 * Nie rzuca wyjątku — zwraca listę błędów, więc nadaje się też do diagnostyki w konsoli.
 * @param {unknown} game
 * @returns {string[]} komunikaty po polsku; pusta tablica oznacza poprawną grę
 */
export function validateGame(game) {
  if (game === null || typeof game !== 'object') {
    return ['Gra musi być obiektem.'];
  }

  const errors = [];

  if (typeof game.id !== 'string' || !GAME_ID_PATTERN.test(game.id)) {
    errors.push('Pole "id" musi składać się z małych liter, cyfr i myślników, np. "example".');
  }
  if (!isNonEmptyText(game.nameKey) && !isNonEmptyText(game.name)) {
    errors.push('Pole "nameKey" (albo "name") musi być niepustym tekstem.');
  }
  if (!isNonEmptyText(game.descriptionKey) && !isNonEmptyText(game.description)) {
    errors.push('Pole "descriptionKey" (albo "description") musi być niepustym tekstem.');
  }
  if (typeof game.icon !== 'string' || game.icon.trim() === '') {
    errors.push('Pole "icon" musi zawierać emoji, np. "🎲".');
  }
  if (!Number.isInteger(game.minPlayers) || game.minPlayers < 1) {
    errors.push('Pole "minPlayers" musi być liczbą całkowitą większą lub równą 1.');
  }
  if (!Number.isInteger(game.maxPlayers) || game.maxPlayers < 1) {
    errors.push('Pole "maxPlayers" musi być liczbą całkowitą większą lub równą 1.');
  }
  if (
    Number.isInteger(game.minPlayers) &&
    Number.isInteger(game.maxPlayers) &&
    game.maxPlayers < game.minPlayers
  ) {
    errors.push('Pole "maxPlayers" nie może być mniejsze od "minPlayers".');
  }
  if (typeof game.mount !== 'function') {
    errors.push('Pole "mount" musi być funkcją mount(container, players, api).');
  }
  if (typeof game.unmount !== 'function') {
    errors.push('Pole "unmount" musi być funkcją bez argumentów.');
  }
  if (game.howToPlay !== undefined) {
    errors.push(...validateHowToPlay(game.howToPlay));
  }

  return errors;
}

/**
 * Waliduje opcjonalną instrukcję gry (pole howToPlay).
 * @param {unknown} howToPlay
 * @returns {string[]} komunikaty po polsku; pusta tablica = instrukcja poprawna
 */
function validateHowToPlay(howToPlay) {
  if (howToPlay === null || typeof howToPlay !== 'object') {
    return ['Pole "howToPlay" musi być obiektem { goal, steps, tips }.'];
  }

  const errors = [];

  if (isNonEmptyText(howToPlay.goalKey)) {
    if (
      !Array.isArray(howToPlay.stepKeys) ||
      howToPlay.stepKeys.length < 3 ||
      howToPlay.stepKeys.length > 6
    ) {
      errors.push('Pole "howToPlay.stepKeys" musi być tablicą od 3 do 6 kluczy.');
    } else if (howToPlay.stepKeys.some((key) => !isNonEmptyText(key))) {
      errors.push('Każdy klucz w "howToPlay.stepKeys" musi być niepustym tekstem.');
    }
    if (
      howToPlay.tipKeys !== undefined &&
      (!Array.isArray(howToPlay.tipKeys) || howToPlay.tipKeys.some((key) => !isNonEmptyText(key)))
    ) {
      errors.push('Pole "howToPlay.tipKeys" musi być tablicą niepustych tekstów.');
    }
    return errors;
  }

  if (typeof howToPlay.goal !== 'string' || howToPlay.goal.trim() === '') {
    errors.push('Pole "howToPlay.goal" musi być niepustym tekstem.');
  }
  if (
    !Array.isArray(howToPlay.steps) ||
    howToPlay.steps.length < 3 ||
    howToPlay.steps.length > 6
  ) {
    errors.push('Pole "howToPlay.steps" musi być tablicą od 3 do 6 kroków.');
  } else if (howToPlay.steps.some((step) => typeof step !== 'string' || step.trim() === '')) {
    errors.push('Każdy krok w "howToPlay.steps" musi być niepustym tekstem.');
  }
  if (howToPlay.tips !== undefined) {
    const tipsOk =
      Array.isArray(howToPlay.tips) &&
      howToPlay.tips.every((tip) => typeof tip === 'string' && tip.trim() !== '');
    if (!tipsOk) {
      errors.push('Pole "howToPlay.tips" musi być tablicą niepustych tekstów.');
    }
  }

  return errors;
}

/**
 * Czy wartość jest niepustym tekstem?
 * @param {unknown} value
 * @returns {boolean}
 */
function isNonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Buduje obiekt gry z getterami tłumaczeń. Gettery są leniwe, więc nazwa, opis
 * i instrukcja zawsze pochodzą z aktualnie wybranego języka.
 * @param {Object} rawGame
 * @returns {Object}
 */
function localizeGame(rawGame) {
  const howToPlayParams = rawGame.howToPlayParams ?? {};

  return {
    ...rawGame,
    get name() {
      return rawGame.nameKey ? t(rawGame.nameKey) : rawGame.name;
    },
    get description() {
      return rawGame.descriptionKey ? t(rawGame.descriptionKey) : rawGame.description;
    },
    get howToPlay() {
      const howToPlay = rawGame.howToPlay;

      if (!howToPlay) {
        return undefined;
      }
      if (!howToPlay.goalKey) {
        return howToPlay;
      }

      return {
        goal: t(howToPlay.goalKey, howToPlayParams),
        steps: howToPlay.stepKeys.map((key) => t(key, howToPlayParams)),
        tips: (howToPlay.tipKeys ?? []).map((key) => t(key, howToPlayParams)),
      };
    },
  };
}

/**
 * Waliduje i zamraża definicję gry.
 * Rzuca polski błąd, gdy gra łamie kontrakt — dzięki temu literówka w polach gry
 * jest widoczna od razu po uruchomieniu HUB-a, a nie dopiero w trakcie rozgrywki.
 * @param {import('./game-contract.js').GameDefinition} game
 * @returns {Readonly<import('./game-contract.js').GameDefinition>}
 */
export function defineGame(game) {
  const errors = validateGame(game);

  if (errors.length > 0) {
    throw new Error(`Nieprawidłowa definicja gry: ${errors.join(' ')}`);
  }

  return Object.freeze(localizeGame(game));
}
