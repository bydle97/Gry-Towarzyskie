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
 *   roleConfig         konfiguracja ról tej partii (config.js: { vampires, znachor, ... })
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
 *   witchPotions       { heal, poison } — które mikstury wiedźmy są jeszcze dostępne
 *                      (zużycie zapisywane dopiero przy rozstrzygnięciu nocy)
 *   nightLog[]         wpisy z rozstrzygnięciami nocy (z healerActorId — kto miał moc znachora,
 *                      victimIds — kto zginął, savedBy — kto uratował ofiarę, wybory wiedźmy)
 *   dayLog[]           wpisy dnia, np. { type: 'commander', day, commanderId, targetId }
 *   winner             'villagers' | 'sect' | null
 */
import { shuffle } from '../../core/random.js';
import {
  ACTIVE_ROLE_CONFIG_KEYS,
  COUNT_MIN_VAMPIRES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  MIN_VAMPIRES,
  MIN_VILLAGERS_WARNING,
  ROLE_CONFIG_KEYS,
  ROLE_IDS,
  ROLE_ID_BY_CONFIG_KEY,
  VAMPIRES_WARNING_SHARE,
  defaultRoleConfig,
} from './config.js';

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

/** Kody błędów i ostrzeżeń walidacji konfiguracji ról (teksty: games.sect.setup.*). */
export const ROLE_CONFIG_ISSUES = Object.freeze({
  noVampires: 'noVampires',
  vampireMajority: 'vampireMajority',
  tooManyRoles: 'tooManyRoles',
  apprenticeWithoutHealer: 'apprenticeWithoutHealer',
  countNeedsVampires: 'countNeedsVampires',
  manyVampires: 'manyVampires',
  fewVillagers: 'fewVillagers',
  apprenticeOff: 'apprenticeOff',
  countOff: 'countOff',
});

/**
 * Porządkuje konfigurację ról: liczba wampirów całkowita i co najmniej 1, role
 * jeszcze nieaktywne zawsze wyłączone, a przełączniki łamiące zależności
 * wyłączone automatycznie (uczeń bez znachora, hrabia przy mniej niż 2 wampirach).
 * Zwraca też notatki o automatycznym wyłączeniu (do krótkiego wyjaśnienia na ekranie).
 * @param {number} playerCount
 * @param {Object} [config] domyślnie defaultRoleConfig(playerCount)
 * @returns {{config: Object, notes: string[]}}
 */
export function normalizeRoleConfig(playerCount, config = defaultRoleConfig(playerCount)) {
  const vampires = Number.isInteger(config?.vampires) ? config.vampires : MIN_VAMPIRES;
  const result = { vampires: Math.max(MIN_VAMPIRES, vampires) };
  const notes = [];

  for (const key of ROLE_CONFIG_KEYS) {
    result[key] = ACTIVE_ROLE_CONFIG_KEYS.includes(key) && config?.[key] === true;
  }

  if (result.uczen && !result.znachor) {
    result.uczen = false;
    notes.push(ROLE_CONFIG_ISSUES.apprenticeOff);
  }
  if (result.hrabia && result.vampires < COUNT_MIN_VAMPIRES) {
    result.hrabia = false;
    notes.push(ROLE_CONFIG_ISSUES.countOff);
  }

  return { config: result, notes };
}

/**
 * Ile miejsc zajmują role z konfiguracji (wampiry + włączone role specjalne).
 * Hrabia jest jednym z wampirów, więc nie dodaje miejsca.
 * @param {Object} config
 * @returns {number}
 */
export function countRoleSlots(config) {
  let slots = config.vampires;

  for (const key of ROLE_CONFIG_KEYS) {
    if (key !== 'hrabia' && config[key] === true) {
      slots += 1;
    }
  }

  return slots;
}

/**
 * Liczba zwykłych mieszkańców: reszta grających po rozdaniu ról z konfiguracji.
 * Może wyjść ujemna, gdy ról jest za dużo (walidacja zgłasza wtedy błąd).
 * @param {number} playerCount
 * @param {Object} config
 * @returns {number}
 */
export function countVillagers(playerCount, config) {
  return playerCount - countRoleSlots(config);
}

/**
 * Sprawdza konfigurację ról dla liczby grających.
 * Błędy (blokują rozdanie ról): mniej niż 1 wampir; wampiry od razu mają przewagę
 * (wampirów ≥ pozostałych graczy); ról więcej niż grających; uczeń bez znachora;
 * hrabia przy mniej niż 2 wampirach.
 * Ostrzeżenia (nie blokują): wampirów więcej niż 1/3 grających; mniej niż
 * 2 zwykłych mieszkańców.
 * @param {number} playerCount
 * @param {Object} config
 * @returns {{ok: boolean, errors: Array<{code: string, params: Object}>, warnings: Array<{code: string, params: Object}>}}
 */
export function validateRoleConfig(playerCount, config) {
  const errors = [];
  const warnings = [];
  const vampires = Number.isInteger(config?.vampires) ? config.vampires : 0;
  const slots = countRoleSlots({ ...config, vampires });
  const villagers = playerCount - slots;

  if (vampires < MIN_VAMPIRES) {
    errors.push({ code: ROLE_CONFIG_ISSUES.noVampires, params: { min: MIN_VAMPIRES } });
  }
  if (vampires >= MIN_VAMPIRES && vampires >= playerCount - vampires) {
    errors.push({
      code: ROLE_CONFIG_ISSUES.vampireMajority,
      params: { vampires, others: playerCount - vampires },
    });
  }
  if (slots > playerCount) {
    errors.push({ code: ROLE_CONFIG_ISSUES.tooManyRoles, params: { roles: slots, players: playerCount } });
  }
  if (config?.uczen === true && config?.znachor !== true) {
    errors.push({ code: ROLE_CONFIG_ISSUES.apprenticeWithoutHealer, params: {} });
  }
  if (config?.hrabia === true && vampires < COUNT_MIN_VAMPIRES) {
    errors.push({ code: ROLE_CONFIG_ISSUES.countNeedsVampires, params: { min: COUNT_MIN_VAMPIRES } });
  }

  if (vampires > playerCount * VAMPIRES_WARNING_SHARE) {
    warnings.push({ code: ROLE_CONFIG_ISSUES.manyVampires, params: { vampires } });
  }
  if (slots <= playerCount && villagers < MIN_VILLAGERS_WARNING) {
    warnings.push({
      code: ROLE_CONFIG_ISSUES.fewVillagers,
      params: { villagers, min: MIN_VILLAGERS_WARNING },
    });
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Lista ról dla liczby grających według konfiguracji (bez tasowania):
 * wampiry, role specjalne z konfiguracji, reszta mieszkańcy.
 * Rzuca błąd przy niepoprawnej konfiguracji — interfejs nie pozwala wtedy rozdać ról.
 * @param {number} playerCount
 * @param {Object} [config] domyślnie defaultRoleConfig(playerCount)
 * @returns {string[]}
 */
export function buildRoleList(playerCount, config = defaultRoleConfig(playerCount)) {
  if (!Number.isInteger(playerCount) || playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(`Liczba grających musi mieścić się w zakresie ${MIN_PLAYERS}–${MAX_PLAYERS}.`);
  }

  const { config: normalized } = normalizeRoleConfig(playerCount, config);
  const validation = validateRoleConfig(playerCount, normalized);

  if (!validation.ok) {
    throw new Error(`Niepoprawna konfiguracja ról: ${validation.errors.map((e) => e.code).join(', ')}.`);
  }

  const roles = [];
  // Hrabia zajmuje jedno miejsce z puli wampirów (dodaje go pętla ról niżej).
  const plainVampires = normalized.vampires - (normalized.hrabia ? 1 : 0);

  for (let index = 0; index < plainVampires; index += 1) {
    roles.push(ROLE_IDS.sect);
  }
  for (const key of ACTIVE_ROLE_CONFIG_KEYS) {
    if (normalized[key] && ROLE_ID_BY_CONFIG_KEY[key]) {
      roles.push(ROLE_ID_BY_CONFIG_KEY[key]);
    }
  }
  while (roles.length < playerCount) {
    roles.push(ROLE_IDS.villager);
  }

  return roles;
}

/**
 * Losowo przypisuje role graczom (core/random.js) zgodnie z konfiguracją.
 * Identyfikatory graczy są stałe przez całą partię.
 * @param {string[]} playerNames
 * @param {Object} [config] konfiguracja ról
 * @returns {Array<{id: string, name: string, roleId: string, alive: boolean, death: null, roleChecked: boolean}>}
 */
export function assignRoles(playerNames, config) {
  const roleIds = shuffle(buildRoleList(playerNames.length, config));

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
    // true = łowca sprawdził hrabiego i dostał wynik zafałszowany („nie wampir”).
    detectiveFaked: false,
    // Wybory wiedźmy tej nocy. Mikstury są zużywane dopiero w resolveNight(),
    // więc „Cofnij krok” (przywrócenie migawki wyborów) przywraca też mikstury.
    witchHeal: false,
    witchPoisonTargetId: null,
  };
}

/** Mikstury wiedźmy na początku partii: obie dostępne (każda raz w grze). */
export function createWitchPotions() {
  return { heal: true, poison: true };
}

/**
 * Tworzy nowy stan partii.
 * @param {{
 *   gmName?: string|null,
 *   playerNames: string[],
 *   roleConfig?: Object,
 * }} options roleConfig — konfiguracja ról (domyślnie wg liczby graczy, config.js)
 * @returns {Object}
 */
export function createGameState({ gmName = null, playerNames, roleConfig }) {
  const { config } = normalizeRoleConfig(playerNames.length, roleConfig);

  return {
    gmName,
    roleConfig: config,
    players: assignRoles(playerNames, config),
    nightNumber: 0,
    nightChoices: createEmptyNightChoices(),
    previousDoctorTargetId: null,
    healerInheritance: null,
    commanderTakeover: null,
    witchPotions: createWitchPotions(),
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

/**
 * Czy gracz jest wampirem (strona wampirów w warunkach wygranej i w ataku nocnym).
 * Hrabia też jest wampirem. Sługa NIE jest wampirem — liczy się jako zwykły gracz.
 * @param {{roleId: string}} player
 */
export function isSect(player) {
  return player.roleId === ROLE_IDS.sect || player.roleId === ROLE_IDS.count;
}

/**
 * Czy w partii gra sługa (wygrywa razem z wampirami, żywy czy martwy).
 * @param {Object} state
 * @returns {boolean}
 */
export function hasServant(state) {
  return state.players.some((player) => player.roleId === ROLE_IDS.servant);
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
 * Wynik sprawdzenia przez łowcę dla wskazanej osoby — to, co mistrz gry pokazuje
 * łowcy. Zwykły wampir: „jest wampirem”. Hrabia i sługa: „nie jest wampirem”
 * (u hrabiego to wynik zafałszowany — zob. isDetectionFaked).
 * @param {Object} state
 * @param {string} playerId
 * @returns {'sect'|'notSect'}
 */
export function getDetectiveResultFor(state, playerId) {
  const player = getPlayerById(state, playerId);
  return player && player.roleId === ROLE_IDS.sect ? 'sect' : 'notSect';
}

/**
 * Czy wynik łowcy dla tej osoby jest zafałszowany (sprawdzany jest hrabia):
 * łowca słyszy „nie wampir”, a mistrz gry widzi prawdę w dzienniku i na Tablicy.
 * @param {Object} state
 * @param {string} playerId
 * @returns {boolean}
 */
export function isDetectionFaked(state, playerId) {
  const player = getPlayerById(state, playerId);
  return Boolean(player && player.roleId === ROLE_IDS.count);
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

/** Kody odmowy użycia mikstur wiedźmy (dla interfejsu i testów). */
export const WITCH_ERRORS = Object.freeze({
  noWitch: 'no-witch',
  witchDead: 'witch-dead',
  healUsed: 'heal-used',
  poisonUsed: 'poison-used',
  noVictim: 'no-victim',
  invalidPoisonTarget: 'invalid-poison-target',
});

/**
 * Mikstury wiedźmy dostępne w tej chwili: stan z całej gry (witchPotions) minus
 * mikstury wybrane już tej nocy (nightChoices — jeszcze nierozstrzygnięte).
 * @param {Object} state
 * @returns {{heal: boolean, poison: boolean}}
 */
export function getWitchPotionsAvailable(state) {
  const potions = state.witchPotions ?? createWitchPotions();
  const choices = state.nightChoices ?? {};

  return {
    heal: potions.heal && choices.witchHeal !== true,
    poison: potions.poison && !choices.witchPoisonTargetId,
  };
}

/**
 * Czy wiedźma ma tej nocy prawdziwy krok: żyje i ma choć jedną miksturę.
 * W przeciwnym razie (martwa albo bez mikstur) krok jest atrapą, żeby nikt nie
 * poznał jej stanu. Gdy wiedźmy nie ma w składzie — zwraca false.
 * @param {Object} state
 * @returns {boolean}
 */
export function isWitchActive(state) {
  const witch = getPlayerByRole(state, ROLE_IDS.witch);
  const potions = state.witchPotions ?? createWitchPotions();
  return Boolean(witch && witch.alive && (potions.heal || potions.poison));
}

/**
 * Osoby, które wiedźma może otruć: żywi, bez samej wiedźmy.
 * @param {Object} state
 * @returns {Object[]}
 */
export function getWitchPoisonTargets(state) {
  const witch = getPlayerByRole(state, ROLE_IDS.witch);
  return getAlivePlayers(state).filter((player) => !witch || player.id !== witch.id);
}

/**
 * Zapisuje wybór wiedźmy w tej nocy: uleczenie ofiary wampirów i/lub otrucie
 * jednej żywej osoby (nie siebie). Można użyć obu, jednej albo żadnej mikstury.
 * Każda mikstura raz w grze — druga próba jest odrzucana. Uleczenie ofiary, którą
 * i tak chroni znachor, jest dozwolone (mikstura zostanie zużyta bez skutku —
 * interfejs pyta wcześniej o potwierdzenie).
 * @param {Object} state
 * @param {{heal?: boolean, poisonTargetId?: string|null}} choice
 * @returns {{ok: true, state: Object} | {ok: false, state: Object, error: string}}
 *   przy odmowie zwraca niezmieniony stan i kod z WITCH_ERRORS
 */
export function applyWitchChoice(state, { heal = false, poisonTargetId = null } = {}) {
  const witch = getPlayerByRole(state, ROLE_IDS.witch);

  if (!witch) {
    return { ok: false, state, error: WITCH_ERRORS.noWitch };
  }
  if (!witch.alive) {
    return { ok: false, state, error: WITCH_ERRORS.witchDead };
  }

  const available = getWitchPotionsAvailable(state);

  if (heal && !available.heal) {
    return { ok: false, state, error: WITCH_ERRORS.healUsed };
  }
  if (heal && !state.nightChoices.sectTargetId) {
    return { ok: false, state, error: WITCH_ERRORS.noVictim };
  }
  if (poisonTargetId && !available.poison) {
    return { ok: false, state, error: WITCH_ERRORS.poisonUsed };
  }
  if (poisonTargetId && !getWitchPoisonTargets(state).some((player) => player.id === poisonTargetId)) {
    return { ok: false, state, error: WITCH_ERRORS.invalidPoisonTarget };
  }

  return {
    ok: true,
    state: {
      ...state,
      nightChoices: {
        ...state.nightChoices,
        witchHeal: state.nightChoices.witchHeal === true || heal === true,
        witchPoisonTargetId: state.nightChoices.witchPoisonTargetId ?? (poisonTargetId || null),
      },
    },
  };
}

/**
 * Rozstrzyga noc:
 *  - ofiara wampirów ginie, chyba że chroni ją osoba z mocą znachora LUB wiedźma ją uleczyła,
 *  - osoba otruta przez wiedźmę ginie zawsze (ochrona znachora nie działa na truciznę),
 *  - gdy ofiara i otruta to ta sama osoba, ginie jedna osoba — w jednej nocy mogą więc
 *    zginąć najwyżej dwie osoby,
 *  - zużyte mikstury wiedźmy znikają z witchPotions (także uleczenie bez skutku).
 * Dopisuje wpis do dziennika (healerActorId — kto miał moc znachora; victimIds — kto
 * zginął; savedBy — kto uratował ofiarę) i zapamiętuje cel ochrony. Wybory nocy zostają
 * w stanie do startu kolejnej nocy — Tablica pokazuje oznaczenia także rano i w dzień.
 * Po śmierciach sprawdza dziedziczenie mocy znachora przez ucznia (także po otruciu).
 * Numer nocy pozostaje bez zmian (interfejs zwiększa go przy starcie kolejnej nocy).
 * @param {Object} state
 * @returns {Object} nowy stan
 */
export function resolveNight(state) {
  const { sectTargetId, doctorTargetId, detectiveTargetId, detectiveResult } = state.nightChoices;
  const detectiveFaked = state.nightChoices.detectiveFaked === true;
  const witchHeal = state.nightChoices.witchHeal === true;
  const witchPoisonTargetId = state.nightChoices.witchPoisonTargetId ?? null;
  const healerActor = getHealerActor(state);

  const savedByHealer = sectTargetId !== null && sectTargetId === doctorTargetId;
  const savedByWitch = sectTargetId !== null && witchHeal;
  const saved = savedByHealer || savedByWitch;
  let savedBy = null;

  if (savedByHealer && savedByWitch) {
    savedBy = 'both';
  } else if (savedByHealer) {
    savedBy = 'healer';
  } else if (savedByWitch) {
    savedBy = 'witch';
  }

  const victimIds = [];

  if (sectTargetId !== null && !saved) {
    victimIds.push(sectTargetId);
  }
  if (witchPoisonTargetId && !victimIds.includes(witchPoisonTargetId)) {
    victimIds.push(witchPoisonTargetId);
  }

  const players = state.players.map((player) =>
    victimIds.includes(player.id) && player.alive
      ? { ...player, alive: false, death: { type: 'night', number: state.nightNumber } }
      : player,
  );

  const potions = state.witchPotions ?? createWitchPotions();

  const entry = {
    night: state.nightNumber,
    sectTargetId,
    doctorTargetId,
    detectiveTargetId,
    detectiveResult,
    detectiveFaked,
    witchHeal,
    witchPoisonTargetId,
    saved,
    savedBy,
    // victimId — pierwsza ofiara (zgodność z dotychczasowym dziennikiem), victimIds — wszystkie.
    victimId: victimIds[0] ?? null,
    victimIds,
    healerActorId: healerActor ? healerActor.id : null,
    healerActorIsApprentice: Boolean(healerActor && healerActor.roleId === ROLE_IDS.apprentice),
  };

  return applyHealerInheritance({
    ...state,
    players,
    witchPotions: {
      heal: potions.heal && !witchHeal,
      poison: potions.poison && !witchPoisonTargetId,
    },
    nightLog: [...state.nightLog, entry],
    previousDoctorTargetId: doctorTargetId,
  });
}

/**
 * Sprawdza warunek wygranej na podstawie żywych graczy.
 * Wampiry (także hrabia) wygrywają, gdy jest ich tyle co pozostałych żywych lub
 * więcej — sługa, uczeń i komendant liczą się tu jako pozostali gracze.
 * Mieszkańcy wygrywają, gdy nie ma żywych wampirów (sługa nie ma znaczenia).
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
 * Kto wygrał, z uwzględnieniem sługi — do ekranu końcowego i Tablicy:
 * 'villagers', 'sect' (same wampiry), 'sectWithServant' (wampiry i sługa) albo null.
 * @param {Object} state
 * @returns {'villagers'|'sect'|'sectWithServant'|null}
 */
export function getWinnerOutcome(state) {
  const winner = state.winner ?? checkWin(state);

  if (winner === WINNERS.sect && hasServant(state)) {
    return 'sectWithServant';
  }
  return winner;
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
 * Konfiguracja ról (roleConfig) zostaje taka jak w poprzedniej partii.
 * @param {Object} state
 * @returns {Object} nowy stan
 */
export function restartGame(state) {
  const names = state.players.map((player) => player.name);
  const { config } = normalizeRoleConfig(names.length, state.roleConfig);

  return {
    ...state,
    roleConfig: config,
    players: assignRoles(names, config),
    nightNumber: 0,
    nightChoices: createEmptyNightChoices(),
    previousDoctorTargetId: null,
    healerInheritance: null,
    commanderTakeover: null,
    witchPotions: createWitchPotions(),
    nightLog: [],
    dayLog: [],
    corrections: [],
    winner: null,
  };
}
