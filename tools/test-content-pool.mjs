/**
 * Test puli treści (www/js/core/content-pool.js) — bez zależności, czysty Node.
 *
 * Uruchomienie z katalogu projektu:
 *   node tools/test-content-pool.mjs
 *
 * Co sprawdza:
 *  1. Główna symulacja: 2000 sesji × 5 partii × 8 losowań z 19 elementów.
 *     W obrębie JEDNEJ partii żaden element nie może się powtórzyć
 *     (gra przekazuje do puli zbiór kluczy użytych w bieżącej partii).
 *  2. Lista krótsza niż partia (5 elementów, 8 losowań): powtórka wolno dopiero
 *     wtedy, gdy partia zużyła już wszystkie elementy.
 *  3. redraw() nigdy nie zwraca elementu bieżącego ani użytego w tej partii,
 *     a hasOther() zgadza się z tym, czy redraw() coś zwróci.
 *
 * Kod wyjścia: 0 = wszystko w porządku, 1 = znaleziono błąd.
 */
import { drawNext, hasOther, redraw } from '../www/js/core/content-pool.js';

const SESSIONS = 2000;
const GAMES_PER_SESSION = 5;
const DRAWS_PER_GAME = 8;
const ITEM_COUNT = 19;

const getKey = (item) => item;
const makeItems = (count) => Array.from({ length: count }, (_, index) => `item-${index + 1}`);

let failures = 0;

function fail(message) {
  failures += 1;
  if (failures <= 10) {
    console.error(`  BŁĄD: ${message}`);
  }
}

/** Jedna partia tak, jak robią to gry: zbiór kluczy partii przekazywany do puli. */
function playGame(poolId, items, draws) {
  const usedInGame = new Set();
  const drawn = [];

  for (let index = 0; index < draws; index += 1) {
    const item = drawNext(poolId, items, getKey, usedInGame);
    drawn.push(item);
    usedInGame.add(getKey(item));
  }

  return drawn;
}

// --- 1. Główna symulacja ------------------------------------------------------
{
  const items = makeItems(ITEM_COUNT);
  let gamesWithRepeat = 0;

  for (let session = 0; session < SESSIONS; session += 1) {
    const poolId = `main-${session}`;

    for (let gameIndex = 0; gameIndex < GAMES_PER_SESSION; gameIndex += 1) {
      const drawn = playGame(poolId, items, DRAWS_PER_GAME);

      if (new Set(drawn).size !== drawn.length) {
        gamesWithRepeat += 1;
        fail(`sesja ${session + 1}, partia ${gameIndex + 1}: powtórka w ${drawn.join(', ')}`);
      }
    }
  }

  const totalGames = SESSIONS * GAMES_PER_SESSION;
  console.log(
    `1. ${SESSIONS} sesji × ${GAMES_PER_SESSION} partii × ${DRAWS_PER_GAME} losowań z ${ITEM_COUNT}: ` +
      `partie z powtórką w obrębie partii: ${gamesWithRepeat} / ${totalGames}`,
  );
}

// --- 2. Lista krótsza niż partia ---------------------------------------------
{
  const items = makeItems(5);
  let badGames = 0;

  for (let session = 0; session < 500; session += 1) {
    const drawn = playGame(`short-${session}`, items, 8);
    const firstFive = drawn.slice(0, 5);

    if (new Set(firstFive).size !== 5) {
      badGames += 1;
      fail(`krótka lista, sesja ${session + 1}: powtórka przed zużyciem wszystkich (${drawn.join(', ')})`);
    }
  }

  console.log(`2. 5 elementów, 8 losowań: powtórki przed zużyciem całej listy: ${badGames} / 500`);
}

// --- 3. redraw() i hasOther() -------------------------------------------------
{
  const items = makeItems(ITEM_COUNT);
  let badRedraws = 0;
  let mismatches = 0;

  for (let session = 0; session < 500; session += 1) {
    const poolId = `redraw-${session}`;

    for (let gameIndex = 0; gameIndex < GAMES_PER_SESSION; gameIndex += 1) {
      const usedInGame = new Set();

      for (let round = 0; round < DRAWS_PER_GAME; round += 1) {
        let current = drawNext(poolId, items, getKey, usedInGame);
        usedInGame.add(current);

        // Do dwóch zmian na rundę, jak „Inne hasło” w „W pół słowa”.
        for (let change = 0; change < 2; change += 1) {
          const expected = hasOther(poolId, items, getKey, current, usedInGame);
          const next = redraw(poolId, items, getKey, current, usedInGame);

          if (expected !== (next !== null)) {
            mismatches += 1;
            fail(`hasOther=${expected}, a redraw zwróciło ${next}`);
          }
          if (next === null) {
            break;
          }
          if (next === current || usedInGame.has(next)) {
            badRedraws += 1;
            fail(`redraw zwróciło element już użyty w partii: ${next}`);
          }

          usedInGame.add(next);
          current = next;
        }
      }
    }
  }

  console.log(
    `3. redraw: zwrócone elementy już użyte w partii: ${badRedraws}; ` +
      `niezgodności hasOther/redraw: ${mismatches}`,
  );
}

if (failures > 0) {
  console.error(`WYNIK: BŁĄD (${failures})`);
  process.exitCode = 1;
} else {
  console.log('WYNIK: OK');
}
