/**
 * REJESTR GIER — jedyne miejsce w HUB-ie, które trzeba zmienić, dodając nową grę.
 *
 * Jak dodać grę:
 *   1. utwórz folder `www/js/games/<id>/` z plikiem `index.js`, który eksportuje
 *      obiekt gry zgodny z kontraktem z `js/core/game-contract.js` (pola: id, name,
 *      description, icon, minPlayers, maxPlayers, mount, unmount),
 *   2. dopisz import gry w sekcji "IMPORTY GIER" poniżej,
 *   3. dopisz zaimportowany obiekt do tablicy RAW_GAMES.
 *
 * Nic więcej nie trzeba zmieniać: ekrany HUB-a czytają wyłącznie ten rejestr,
 * więc karty na ekranie głównym i ekran szczegółów pojawią się automatycznie.
 */
import { defineGame } from './game-contract.js';

// --- IMPORTY GIER -----------------------------------------------------------
// Każda gra = jeden folder w js/games/. Wzór:
// import exampleGame from '../games/example/index.js';
import guessNumberGame from '../games/guess-number/index.js';
import revolverGame from '../games/revolver/index.js';
import duelGame from '../games/duel/index.js';
import sectGame from '../games/sect/index.js';

// --- LISTA GIER -------------------------------------------------------------
// Kolejność na liście = kolejność kart na ekranie głównym.
const RAW_GAMES = [
  guessNumberGame,
  revolverGame,
  duelGame,
  sectGame,
];

const seenIds = new Set();

/**
 * Wszystkie gry po walidacji kontraktu. Tablica i obiekty są zamrożone,
 * więc żaden ekran nie podmieni gry w trakcie działania aplikacji.
 * @type {ReadonlyArray<Readonly<import('./game-contract.js').GameDefinition>>}
 */
const games = Object.freeze(
  RAW_GAMES.map((rawGame) => {
    const game = defineGame(rawGame);

    if (seenIds.has(game.id)) {
      throw new Error(`Zduplikowany identyfikator gry: "${game.id}".`);
    }
    seenIds.add(game.id);

    return game;
  }),
);

/** @returns {ReadonlyArray<Readonly<import('./game-contract.js').GameDefinition>>} */
export function getAllGames() {
  return games;
}

/**
 * Zwraca grę o podanym id albo null, gdy takiej gry nie ma w rejestrze.
 * @param {string} gameId
 * @returns {Readonly<import('./game-contract.js').GameDefinition> | null}
 */
export function getGameById(gameId) {
  return games.find((game) => game.id === gameId) ?? null;
}

/**
 * Klucze tłumaczeń używane przez definicje gier (nazwa, opis, cel, kroki, wskazówki).
 * Czyta surowe definicje, bo obiekty z rejestru mają już przetłumaczone gettery.
 * Używane przez window.__i18nCheck() do wykrycia literówek w kluczach.
 * @returns {string[]}
 */
export function getGameTranslationKeys() {
  const keys = [];

  for (const rawGame of RAW_GAMES) {
    const howToPlay = rawGame.howToPlay ?? {};

    keys.push(
      rawGame.nameKey,
      rawGame.descriptionKey,
      howToPlay.goalKey,
      ...(howToPlay.stepKeys ?? []),
      ...(howToPlay.tipKeys ?? []),
    );
  }

  return keys.filter((key) => typeof key === 'string' && key !== '');
}
