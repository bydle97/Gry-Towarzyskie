/**
 * Silnik gry "Sekta" — czyste funkcje bez DOM.
 *
 * Cały stan gry jest zwykłym obiektem, a każda funkcja zwraca NOWY stan
 * (kopiujemy tylko zmieniane fragmenty). Dzięki temu interfejs może trzymać
 * migawki stanu i cofać ostatni krok nocy bez psucia reszty danych.
 *
 * Stan gry:
 *   gmName             imię mistrza gry albo null (mistrz spoza listy)
 *   players[]          { id, name, roleId, alive, death, roleChecked }
 *                      death: null albo { type: 'night'|'day'|'correction', number }
 *   nightNumber        numer bieżącej nocy (0 = jeszcze nie było nocy)
 *   nightChoices       { sectTargetId, doctorTargetId, detectiveTargetId, detectiveResult }
 *   previousDoctorTargetId  kogo lekarz chronił poprzedniej nocy
 *   nightLog[]         wpisy z rozstrzygnięciami nocy
 *   winner             'villagers' | 'sect' | null
 */
import { shuffle } from '../../core/random.js';
import { MAX_PLAYERS, MIN_PLAYERS, ROLE_IDS, getLineup } from './config.js';

/** Możliwe zwycięzcy. */
export const WINNERS = Object.freeze({
  villagers: 'villagers',
  sect: 'sect',
});

/**
 * Lista ról dla podanej liczby grających (bez tasowania).
 * @param {number} playerCount
 * @returns {string[]}
 */
export function buildRoleList(playerCount) {
  if (!Number.isInteger(playerCount) || playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(`Liczba grających musi mieścić się w zakresie ${MIN_PLAYERS}–${MAX_PLAYERS}.`);
  }

  const lineup = getLineup(playerCount);
  const roles = [];

  for (let index = 0; index < lineup.sect; index += 1) {
    roles.push(ROLE_IDS.sect);
  }
  for (let index = 0; index < lineup.doctor; index += 1) {
    roles.push(ROLE_IDS.doctor);
  }
  for (let index = 0; index < lineup.detective; index += 1) {
    roles.push(ROLE_IDS.detective);
  }
  for (let index = 0; index < lineup.villager; index += 1) {
    roles.push(ROLE_IDS.villager);
  }

  return roles;
}

/**
 * Losowo przypisuje role graczom. Identyfikatory graczy są stałe przez całą partię.
 * @param {string[]} playerNames
 * @returns {Array<{id: string, name: string, roleId: string, alive: boolean, death: null, roleChecked: boolean}>}
 */
export function assignRoles(playerNames) {
  const roleIds = shuffle(buildRoleList(playerNames.length));

  return playerNames.map((name, index) => ({
    id: `p${index + 1}`,
    name,
    roleId: roleIds[index],
    alive: true,
    death: null,
    roleChecked: false,
  }));
}

/** Puste wybory nocy (używane przy starcie nocy i po jej rozstrzygnięciu). */
export function createEmptyNightChoices() {
  return {
    sectTargetId: null,
    doctorTargetId: null,
    detectiveTargetId: null,
    detectiveResult: null,
  };
}

/**
 * Tworzy nowy stan partii.
 * @param {{gmName?: string|null, playerNames: string[]}} options
 * @returns {Object}
 */
export function createGameState({ gmName = null, playerNames }) {
  return {
    gmName,
    players: assignRoles(playerNames),
    nightNumber: 0,
    nightChoices: createEmptyNightChoices(),
    previousDoctorTargetId: null,
    nightLog: [],
    corrections: [],
    winner: null,
  };
}

/**
 * @param {Object} state
 * @param {string} playerId
 * @returns {Object|undefined}
 */
export function getPlayerById(state, playerId) {
  return state.players.find((player) => player.id === playerId);
}

/** @param {Object} state */
export function getAlivePlayers(state) {
  return state.players.filter((player) => player.alive);
}

/** @param {{roleId: string}} player */
export function isSect(player) {
  return player.roleId === ROLE_IDS.sect;
}

/**
 * Oznacza, że gracz zobaczył swoją rolę.
 * @param {Object} state
 * @param {string} playerId
 * @returns {Object} nowy stan
 */
export function markRoleChecked(state, playerId) {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, roleChecked: true } : player,
    ),
  };
}

/**
 * Odblokowuje ponowne sprawdzenie roli (np. po pomyłce).
 * @param {Object} state
 * @param {string} playerId
 * @returns {Object} nowy stan
 */
export function unmarkRoleChecked(state, playerId) {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, roleChecked: false } : player,
    ),
  };
}

/**
 * Wynik sprawdzenia przez śledczego dla wskazanej osoby.
 * @param {Object} state
 * @param {string} playerId
 * @returns {'sect'|'notSect'}
 */
export function getDetectiveResultFor(state, playerId) {
  const player = getPlayerById(state, playerId);
  return player && isSect(player) ? 'sect' : 'notSect';
}

/**
 * Rozstrzyga noc: ofiara sekty ginie, chyba że lekarz ją ochronił.
 * Dopisuje wpis do dziennika i zapamiętuje cel lekarza. Wybory nocy zostają
 * w stanie do momentu startu kolejnej nocy — dzięki temu Tablica mistrza gry
 * pokazuje oznaczenia bieżącej nocy także rano i w dzień.
 * Numer nocy pozostaje bez zmian (interfejs zwiększa go przy starcie kolejnej nocy).
 * @param {Object} state
 * @returns {Object} nowy stan
 */
export function resolveNight(state) {
  const { sectTargetId, doctorTargetId, detectiveTargetId, detectiveResult } = state.nightChoices;
  const saved = sectTargetId !== null && sectTargetId === doctorTargetId;
  const victimId = sectTargetId !== null && !saved ? sectTargetId : null;

  const players = state.players.map((player) =>
    player.id === victimId
      ? { ...player, alive: false, death: { type: 'night', number: state.nightNumber } }
      : player,
  );

  const entry = {
    night: state.nightNumber,
    sectTargetId,
    doctorTargetId,
    detectiveTargetId,
    detectiveResult,
    saved,
    victimId,
  };

  return {
    ...state,
    players,
    nightLog: [...state.nightLog, entry],
    previousDoctorTargetId: doctorTargetId,
  };
}

/**
 * Sprawdza warunek wygranej na podstawie żywych graczy.
 * @param {Object} state
 * @returns {'villagers'|'sect'|null} null = gra toczy się dalej
 */
export function checkWin(state) {
  const alive = getAlivePlayers(state);
  const sectAlive = alive.filter(isSect).length;

  if (sectAlive === 0) {
    return WINNERS.villagers;
  }
  if (sectAlive >= alive.length - sectAlive) {
    return WINNERS.sect;
  }
  return null;
}

/**
 * Eliminuje gracza w dzień (głosowanie) i zapisuje informację o śmierci.
 * @param {Object} state
 * @param {string} playerId
 * @param {{type?: 'night'|'day'|'correction'}} [options]
 * @returns {Object} nowy stan
 */
export function eliminatePlayer(state, playerId, { type = 'day' } = {}) {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId && player.alive
        ? { ...player, alive: false, death: { type, number: state.nightNumber } }
        : player,
    ),
  };
}

/**
 * Ręczna korekta stanu gracza (np. po pomyłce mistrza gry).
 * Wpis trafia do listy korekt, a nie do dziennika nocy.
 * @param {Object} state
 * @param {string} playerId
 * @param {{alive: boolean}} options
 * @returns {Object} nowy stan
 */
export function correctPlayerState(state, playerId, { alive }) {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            alive,
            death: alive ? null : { type: 'correction', number: state.nightNumber },
          }
        : player,
    ),
    corrections: [...state.corrections, { number: state.nightNumber, playerId, alive }],
  };
}

/**
 * Restart partii z tymi samymi osobami.
 * keepRoles = true  → te same role, gracze oznaczani jako "rola sprawdzona"
 *                     (partia od razu od pierwszej nocy),
 * keepRoles = false → role tasowane na nowo i ponowne sprawdzanie ról.
 * @param {Object} state
 * @param {{keepRoles?: boolean}} [options]
 * @returns {Object} nowy stan
 */
export function restartGame(state, { keepRoles = false } = {}) {
  const names = state.players.map((player) => player.name);

  return {
    ...state,
    players: keepRoles
      ? state.players.map((player) => ({ ...player, alive: true, death: null, roleChecked: true }))
      : assignRoles(names),
    nightNumber: 0,
    nightChoices: createEmptyNightChoices(),
    previousDoctorTargetId: null,
    nightLog: [],
    corrections: [],
    winner: null,
  };
}


