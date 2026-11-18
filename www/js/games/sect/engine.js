/**
 * Silnik gry "Wampir" (historyczne id: sect) — czyste funkcje bez DOM.
 * Nazwy w kodzie są historyczne: sect = wampiry, doctor = znachor, detective = łowca.
 * Nowe role mają zwykłe nazwy: apprentice = uczeń znachora, commander = komendant.
 *
 * Cały stan gry jest zwykłym obiektem, a każda funkcja zwraca NOWY stan
 * (kopiujemy tylko zmieniane fragmenty). Dzięki temu interfejs może trzymać
 * migawki stanu i cofać ostatni krok nocy bez psucia reszty danych.
 *
 * Stan gry:
 *   gmName             imię mistrza gry albo null (mistrz spoza listy)
 *   roleOptions        { commander, apprentice } — role dodatkowe tej partii
 *   players[]          { id, name, roleId, alive, death, roleChecked }
 *                      death: null albo { type: 'night'|'day'|'correction', number }
 *   nightNumber        numer bieżącej nocy (0 = jeszcze nie było nocy)
 *   nightChoices       { sectTargetId, doctorTargetId, detectiveTargetId, detectiveResult }
 *   previousDoctorTargetId  kogo chroniła moc znachora poprzedniej nocy
 *                      (to samo ograniczenie obowiązuje ucznia po przejęciu mocy)
 *   healerInheritance  null albo { apprenticeId, fromNight } — od nocy fromNight
 *                      uczeń pełni rolę znachora (znachor nie żyje)
 *   commanderTakeover  null albo { commanderId, targetId, day } — komendant użył mocy
 *                      (raz na grę; od tej chwili jego rola jest jawna)
 *   nightLog[]         wpisy z rozstrzygnięciami nocy (z healerActorId — kto miał moc znachora)
 *   dayLog[]           wpisy dnia, np. { type: 'commander', day, commanderId, targetId }
 *   winner             'villagers' | 'sect' | null
 */
import { shuffle } from '../../core/random.js';
import { MAX_PLAYERS, MIN_PLAYERS, ROLE_IDS, getLineup, normalizeOptionalRoles } from './config.js';

/** Możliwe zwycięzcy. */
export const WINNERS = Object.freeze({
  villagers: 'villagers',
  sect: 'sect',
});

/** Powody odmowy przejęcia głosowania przez komendanta (dla interfejsu i testów). */
export const COMMANDER_ERRORS = Object.freeze({
  noCommander: 'no-commander',
  commanderDead: 'commander-dead',
  alreadyUsed: 'already-used',
  invalidTarget: 'invalid-target',
});

/**
 * Lista ról dla podanej liczby grających i ról dodatkowych (bez tasowania).
 * To jest „skład ról dla danej liczby graczy” — liczby bierze z config.js.
 * @param {number} playerCount
 * @param {{commander?: boolean, apprentice?: boolean}} [roleOptions] domyślnie wg liczby graczy
 * @returns {string[]}
 */
export function buildRoleList(playerCount, roleOptions) {
  if (!Number.isInteger(playerCount) || playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(`Liczba grających musi mieścić się w zakresie ${MIN_PLAYERS}–${MAX_PLAYERS}.`);
  }

  const lineup = getLineup(playerCount, roleOptions);
  const counts = [
    [ROLE_IDS.sect, lineup.sect],
    [ROLE_IDS.doctor, lineup.doctor],
    [ROLE_IDS.apprentice, lineup.apprentice],
    [ROLE_IDS.detective, lineup.detective],
    [ROLE_IDS.commander, lineup.commander],
    [ROLE_IDS.villager, lineup.villager],
  ];
  const roles = [];

  for (const [roleId, count] of counts) {
    for (let index = 0; index < count; index += 1) {
      roles.push(roleId);
    }
  }

  return roles;
}

/**
 * Losowo przypisuje role graczom. Identyfikatory graczy są stałe przez całą partię.
 * @param {string[]} playerNames
 * @param {{commander?: boolean, apprentice?: boolean}} [roleOptions]
 * @returns {Array<{id: string, name: string, roleId: string, alive: boolean, death: null, roleChecked: boolean}>}
 */
export function assignRoles(playerNames, roleOptions) {
  const roleIds = shuffle(buildRoleList(playerNames.length, roleOptions));

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
 * @param {{
 *   gmName?: string|null,
 *   playerNames: string[],
 *   roleOptions?: {commander?: boolean, apprentice?: boolean},
 * }} options roleOptions — domyślnie wg liczby graczy (config.js)
 * @returns {Object}
 */
export function createGameState({ gmName = null, playerNames, roleOptions }) {
  // Przełączniki są normalizowane, żeby skład zawsze mieścił się w liczbie graczy.
  const options = normalizeOptionalRoles(playerNames.length, roleOptions);

  return {
    gmName,
    roleOptions: options,
    players: assignRoles(playerNames, options),
    nightNumber: 0,
    nightChoices: createEmptyNightChoices(),
    previousDoctorTargetId: null,
    healerInheritance: null,
    commanderTakeover: null,
    nightLog: [],
    dayLog: [],
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

/**
 * Pierwszy gracz z daną rolą (role specjalne występują najwyżej raz).
 * @param {Object} state
 * @param {string} roleId
 * @returns {Object|undefined}
 */
export function getPlayerByRole(state, roleId) {
  return state.players.find((player) => player.roleId === roleId);
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
 * Wynik sprawdzenia przez łowcę dla wskazanej osoby.
 * @param {Object} state
 * @param {string} playerId
 * @returns {'sect'|'notSect'}
 */
export function getDetectiveResultFor(state, playerId) {
  const player = getPlayerById(state, playerId);
  return player && isSect(player) ? 'sect' : 'notSect';
}

/**
 * Kto ma moc znachora w nocy o numerze state.nightNumber:
 *  - żywy znachor,
 *  - albo żywy uczeń, jeśli przejął moc (healerInheritance) i ta noc jest
 *    nie wcześniejsza niż fromNight,
 *  - albo nikt (null) — krok znachora jest wtedy atrapą.
 * @param {Object} state
 * @returns {Object|null} gracz z mocą znachora albo null
 */
export function getHealerActor(state) {
  const healer = getPlayerByRole(state, ROLE_IDS.doctor);

  if (healer && healer.alive) {
    return healer;
  }

  const inheritance = state.healerInheritance;

  if (!inheritance || state.nightNumber < inheritance.fromNight) {
    return null;
  }

  const apprentice = getPlayerById(state, inheritance.apprenticeId);
  return apprentice && apprentice.alive ? apprentice : null;
}

/**
 * Czy uczeń pełni dziś w nocy rolę znachora (do tekstów i dziennika).
 * @param {Object} state
 * @returns {boolean}
 */
export function isApprenticeActingHealer(state) {
  const actor = getHealerActor(state);
  return Boolean(actor && actor.roleId === ROLE_IDS.apprentice);
}

/**
 * Dziedziczenie mocy znachora: jeśli znachor nie żyje, a żywy uczeń jeszcze nie
 * przejął mocy, zapisuje przejęcie od NASTĘPNEJ nocy (nightNumber + 1).
 * Wołane po każdej śmierci (noc, dzień, korekta). Idempotentne: drugi raz nic nie zmienia.
 * Ożywienie znachora korektą nie kasuje zapisu — getHealerActor() i tak woli żywego znachora.
 * @param {Object} state
 * @returns {Object} nowy stan (albo ten sam, gdy nic się nie zmienia)
 */
export function applyHealerInheritance(state) {
  if (state.healerInheritance) {
    return state;
  }

  const healer = getPlayerByRole(state, ROLE_IDS.doctor);
  const apprentice = getPlayerByRole(state, ROLE_IDS.apprentice);

  if (!healer || healer.alive || !apprentice || !apprentice.alive) {
    return state;
  }

  return {
    ...state,
    healerInheritance: { apprenticeId: apprentice.id, fromNight: state.nightNumber + 1 },
  };
}

/**
 * Rozstrzyga noc: ofiara wampirów ginie, chyba że chroni ją osoba z mocą znachora.
 * Dopisuje wpis do dziennika (z healerActorId — kto miał moc znachora tej nocy)
 * i zapamiętuje cel ochrony. Wybory nocy zostają w stanie do startu kolejnej
 * nocy — dzięki temu Tablica pokazuje oznaczenia bieżącej nocy także rano i w dzień.
 * Po śmierci sprawdza dziedziczenie mocy znachora przez ucznia.
 * Numer nocy pozostaje bez zmian (interfejs zwiększa go przy starcie kolejnej nocy).
 * @param {Object} state
 * @returns {Object} nowy stan
 */
export function resolveNight(state) {
  const { sectTargetId, doctorTargetId, detectiveTargetId, detectiveResult } = state.nightChoices;
  const healerActor = getHealerActor(state);
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
    healerActorId: healerActor ? healerActor.id : null,
    healerActorIsApprentice: Boolean(healerActor && healerActor.roleId === ROLE_IDS.apprentice),
  };

  return applyHealerInheritance({
    ...state,
    players,
    nightLog: [...state.nightLog, entry],
    previousDoctorTargetId: doctorTargetId,
  });
}

/**
 * Sprawdza warunek wygranej na podstawie żywych graczy (bez zmian po dodaniu
 * nowych ról: uczeń i komendant liczą się po stronie mieszkańców).
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
 * Po śmierci sprawdza dziedziczenie mocy znachora.
 * @param {Object} state
 * @param {string} playerId
 * @param {{type?: 'night'|'day'|'correction'}} [options]
 * @returns {Object} nowy stan
 */
export function eliminatePlayer(state, playerId, { type = 'day' } = {}) {
  return applyHealerInheritance({
    ...state,
    players: state.players.map((player) =>
      player.id === playerId && player.alive
        ? { ...player, alive: false, death: { type, number: state.nightNumber } }
        : player,
    ),
  });
}

/**
 * Czy komendant może teraz przejąć głosowanie (raz na grę, tylko żywy).
 * Pora dnia jest sprawdzana przez interfejs (przycisk jest tylko na ekranie głosowania).
 * @param {Object} state
 * @returns {string|null} null = może, w przeciwnym razie kod z COMMANDER_ERRORS
 */
export function getCommanderBlocker(state) {
  const commander = getPlayerByRole(state, ROLE_IDS.commander);

  if (!commander) {
    return COMMANDER_ERRORS.noCommander;
  }
  if (!commander.alive) {
    return COMMANDER_ERRORS.commanderDead;
  }
  if (state.commanderTakeover) {
    return COMMANDER_ERRORS.alreadyUsed;
  }
  return null;
}

/**
 * Lista osób, które komendant może wskazać: żywi, bez samego komendanta.
 * @param {Object} state
 * @returns {Object[]}
 */
export function getCommanderTargets(state) {
  const commander = getPlayerByRole(state, ROLE_IDS.commander);
  return getAlivePlayers(state).filter((player) => !commander || player.id !== commander.id);
}

/**
 * Komendant przejmuje głosowanie: wskazana osoba odpada (jak po głosowaniu),
 * użycie mocy jest zapisywane (commanderTakeover — rola komendanta staje się
 * jawna, ponowne użycie jest zablokowane) i trafia do dziennika dnia.
 * Wygraną interfejs sprawdza potem przez checkWin(), jak po zwykłym głosowaniu.
 * @param {Object} state
 * @param {string} targetId
 * @returns {{ok: true, state: Object} | {ok: false, state: Object, error: string}}
 *   przy odmowie zwraca niezmieniony stan i kod błędu
 */
export function commanderTakeOver(state, targetId) {
  const blocker = getCommanderBlocker(state);

  if (blocker) {
    return { ok: false, state, error: blocker };
  }

  const commander = getPlayerByRole(state, ROLE_IDS.commander);

  if (!getCommanderTargets(state).some((player) => player.id === targetId)) {
    return { ok: false, state, error: COMMANDER_ERRORS.invalidTarget };
  }

  const takeover = { commanderId: commander.id, targetId, day: state.nightNumber };
  const removed = eliminatePlayer(state, targetId, { type: 'day' });

  return {
    ok: true,
    state: {
      ...removed,
      commanderTakeover: takeover,
      dayLog: [...(state.dayLog ?? []), { type: 'commander', ...takeover }],
    },
  };
}

/**
 * Ręczna korekta stanu gracza (np. po pomyłce mistrza gry).
 * Wpis trafia do listy korekt, a nie do dziennika nocy. Po „uśmierceniu”
 * sprawdza dziedziczenie mocy znachora.
 * @param {Object} state
 * @param {string} playerId
 * @param {{alive: boolean}} options
 * @returns {Object} nowy stan
 */
export function correctPlayerState(state, playerId, { alive }) {
  return applyHealerInheritance({
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
  });
}

/**
 * Restart partii z tymi samymi osobami: role są losowane na nowo i wszyscy
 * sprawdzają je jeszcze raz (poprzednie role zostały ujawnione na ekranie końcowym).
 * Role dodatkowe (roleOptions) zostają takie jak w poprzedniej partii.
 * @param {Object} state
 * @returns {Object} nowy stan
 */
export function restartGame(state) {
  const names = state.players.map((player) => player.name);
  const options = normalizeOptionalRoles(names.length, state.roleOptions);

  return {
    ...state,
    roleOptions: options,
    players: assignRoles(names, options),
    nightNumber: 0,
    nightChoices: createEmptyNightChoices(),
    previousDoctorTargetId: null,
    healerInheritance: null,
    commanderTakeover: null,
    nightLog: [],
    dayLog: [],
    corrections: [],
    winner: null,
  };
}
