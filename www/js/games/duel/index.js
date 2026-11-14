/**
 * Gra "Pojedynek" (id: duel).
 *
 * Zasady:
 *  - po Starcie gracze dzielą się na dwie drużyny (wspólny components/team-setup.js),
 *  - liczba rund = liczba osób w większej drużynie; w każdej rundzie pojedynkuje się
 *    jedna osoba z każdej drużyny (kolejność w drużynie jest przetasowana, a w mniejszej
 *    drużynie zapętla się — nikt nie występuje drugi raz, zanim nie wystąpią wszyscy),
 *    dobór par jest taki sam jak w grze "Rewolwer",
 *  - kategorię losujemy raz na partię i nie powtarzamy jej, dopóki nie skończy się lista,
 *  - zegar działa jak w szachach: każdy gracz ma JEDNĄ pulę na cały pojedynek,
 *    odlicza się tylko czas gracza, którego tura trwa; dotknięcie własnej połowy
 *    kończy wymianę i przekazuje turę przeciwnikowi,
 *  - przegrywa gracz, którego pula spadnie do zera; punkt dla jego drużyny dostaje rywal,
 *  - brak zapisu na dysku: cały stan żyje w pamięci tego modułu.
 */
import { clear, el } from '../../core/dom.js';
import { shuffle } from '../../core/random.js';
import { TEAMS, mountTeamSetup } from '../../components/team-setup.js';
import { CATEGORIES } from './categories.js';
import {
  createClockScreen,
  createExitFooter,
  ensureStyles,
  removeStyles,
  renderConfirmDialog,
  renderFinishedScreen,
  renderIntroScreen,
  renderResultScreen,
} from './ui.js';

/**
 * Jedna pula czasu na gracza na cały pojedynek (w sekundach) — łatwa do zmiany.
 */
const PLAYER_TIME_SECONDS = 10;

/**
 * Dodatek do puli po każdej wymienionej rzeczy (w sekundach). 0 = wyłączone.
 */
const INCREMENT_SECONDS = 0;

/** Co ile ms odświeżamy wyświetlany czas (samo odliczanie liczymy z timestampów). */
const TICK_MS = 100;

/** Ile ms po zmianie tury ignorujemy dotknięcia (ochrona przed przypadkowym dublem). */
const TAP_GUARD_MS = 200;

/** Od ilu ms pozostałego czasu zegar jest wyróżniony na czerwono. */
const LOW_TIME_MS = 3000;

/** Wibracje (ms): krótka przy zmianie tury, dłuższa na koniec pojedynku. */
const VIBRATION_TURN_MS = 30;
const VIBRATION_END_MS = 300;

/**
 * Stan jednej partii.
 * @type {null | {
 *   container: HTMLElement,
 *   api: import('../../core/game-contract.js').GameApi,
 *   players: string[],
 *   teams: {first: string[], second: string[]} | null,
 *   order: {first: string[], second: string[]} | null,
 *   rounds: number,
 *   roundIndex: number,
 *   deck: ReadonlyArray<string>,
 *   firstStarterId: string,
 *   scores: {first: number, second: number},
 *   duelists: {first: string, second: string} | null,
 *   startingTeamId: string,
 *   clock: null | {
 *     remaining: {first: number, second: number},
 *     counts: {first: number, second: number},
 *     activeTeamId: string,
 *     started: boolean,
 *     paused: boolean,
 *     finished: boolean,
 *     winnerTeamId: string | null,
 *     turnStartedAt: number,
 *     lastTurnChangeAt: number,
 *     tickId: number | null,
 *   },
 *   clockView: null | {el: HTMLElement, update: Function},
 *   confirmDialog: null | {title: string, message: string, confirmLabel: string},
 *   phase: 'teams' | 'intro' | 'clock' | 'result' | 'finished',
 * }}
 */
let state = null;

/** Blokada wygaszania ekranu (jeśli API istnieje). */
let wakeLockSentinel = null;

const game = {
  id: 'duel',
  name: 'Pojedynek',
  description: 'Jedna kategoria, dwóch rywali i zegar jak w szachach.',
  icon: '⏱️',
  minPlayers: 2,
  maxPlayers: 20,

  /**
   * @param {HTMLElement} container
   * @param {string[]} players
   * @param {import('../../core/game-contract.js').GameApi} api
   */
  mount(container, players, api) {
    ensureStyles();

    state = {
      container,
      api,
      players: [...players],
      teams: null,
      order: null,
      rounds: 0,
      roundIndex: 0,
      deck: shuffle(CATEGORIES),
      firstStarterId: randomTeamId(),
      scores: { first: 0, second: 0 },
      duelists: null,
      startingTeamId: 'first',
      clock: null,
      clockView: null,
      confirmDialog: null,
      phase: 'teams',
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    renderState();
  },

  unmount() {
    stopTicking();
    releaseWakeLock();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    setHubHeaderHidden(false);
    removeStyles();
    state = null;
  },
};

export default game;

/** Losowa drużyna — kto zaczyna pierwszą rundę. */
function randomTeamId() {
  return shuffle(TEAMS)[0].id;
}

function teamById(teamId) {
  return TEAMS.find((team) => team.id === teamId) ?? TEAMS[0];
}

function otherTeamId(teamId) {
  return teamId === 'first' ? 'second' : 'first';
}

function isLastRound() {
  return state.roundIndex + 1 >= state.rounds;
}

/** Zwycięzca partii albo null przy remisie. */
function getWinnerTeamId() {
  if (state.scores.first === state.scores.second) {
    return null;
  }
  return state.scores.first > state.scores.second ? 'first' : 'second';
}

/** Kategoria bieżącej rundy; talia zapętla się, gdy kategorii jest mniej niż rund. */
function currentCategory() {
  if (state.deck.length === 0) {
    return '—';
  }
  return state.deck[state.roundIndex % state.deck.length];
}

/** Ekran zegara jest pełnoekranowy — na ten czas chowamy nagłówek HUB-a. */
function setHubHeaderHidden(hidden) {
  const header = document.querySelector('.app-header');
  if (header) {
    header.hidden = hidden;
  }
}

/** Wibracja jest opcjonalna i nigdy nie może przerwać gry. */
function vibrate(durationMs) {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch (error) {
    // brak wsparcia lub zgody — po prostu gramy dalej
  }
}

/** Prosi o blokadę wygaszania ekranu, jeśli przeglądarka to wspiera. */
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) {
    return;
  }

  try {
    const sentinel = await navigator.wakeLock.request('screen');
    const clock = state?.clock;

    if (!clock || clock.finished || clock.paused) {
      try {
        await sentinel.release();
      } catch (error) {
        // nie udało się zwolnić od razu — system zwolni blokadę sam
      }
      return;
    }

    wakeLockSentinel = sentinel;
  } catch (error) {
    wakeLockSentinel = null;
  }
}

function releaseWakeLock() {
  const sentinel = wakeLockSentinel;
  wakeLockSentinel = null;

  if (!sentinel) {
    return;
  }

  try {
    const result = sentinel.release();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch (error) {
    // brak wsparcia — ignorujemy
  }
}

/** Gdy karta przeglądarki znika z ekranu, zegar sam się wstrzymuje. */
function handleVisibilityChange() {
  if (document.hidden) {
    pauseDuel();
  }
}

function renderState() {
  if (!state) {
    return;
  }

  const { container } = state;

  if (state.confirmDialog) {
    if (container.querySelector('.dl-overlay')) {
      return;
    }
    const overlay = renderConfirmDialog({
      ...state.confirmDialog,
      onConfirm: () => state.api.exit(),
      onCancel: () => {
        state.confirmDialog = null;
        container.querySelector('.dl-overlay')?.remove();
      },
    });
    container.append(overlay);
    overlay.querySelector('.dl-dialog__cancel')?.focus();
    return;
  }

  if (state.phase !== 'clock') {
    stopTicking();
    setHubHeaderHidden(false);
    state.clockView = null;
  }

  clear(container);
  window.scrollTo(0, 0);

  if (state.phase === 'teams') {
    renderTeamsPhase();
    return;
  }

  if (state.phase === 'intro') {
    renderIntroPhase();
    return;
  }

  if (state.phase === 'clock') {
    renderClockPhase();
    return;
  }

  if (state.phase === 'result') {
    renderResultPhase();
    return;
  }

  renderFinishedPhase();
}

/** Ekran podziału na drużyny (wspólny komponent) + przycisk wyjścia. */
function renderTeamsPhase() {
  const setupRoot = el('div', { class: 'stack' });
  state.container.append(setupRoot);

  mountTeamSetup({
    container: setupRoot,
    players: state.players,
    onConfirm: startMatch,
    // Pojedynek to gra 1 na 1, więc drużyna może liczyć jedną osobę.
    minTeamSize: 1,
  });

  state.container.append(createExitFooter(requestExit));
}

function renderIntroPhase() {
  state.container.append(
    renderIntroScreen({
      roundNumber: state.roundIndex + 1,
      totalRounds: state.rounds,
      duelists: state.duelists,
      category: currentCategory(),
      onReady: startClockPhase,
    }),
  );
  state.container.append(createExitFooter(requestExit));
}

function renderClockPhase() {
  state.clock = createClockState();

  const view = createClockScreen({
    duelists: state.duelists,
    category: currentCategory(),
    startingTeam: teamById(state.startingTeamId),
    poolMs: PLAYER_TIME_SECONDS * 1000,
    lowTimeMs: LOW_TIME_MS,
    onStart: startDuel,
    onTap: handleHalfTap,
    onPause: pauseDuel,
    onResume: resumeDuel,
    onAbort: requestAbort,
  });

  state.clockView = view;
  state.container.append(view.el);
  setHubHeaderHidden(true);
  updateClockUi();
}

function renderResultPhase() {
  const clock = state.clock;

  state.container.append(
    renderResultScreen({
      roundNumber: state.roundIndex + 1,
      totalRounds: state.rounds,
      winnerTeam: teamById(clock.winnerTeamId),
      winnerName: state.duelists[clock.winnerTeamId],
      duelists: state.duelists,
      counts: clock.counts,
      winnerRemainingMs: clock.remaining[clock.winnerTeamId],
      scores: state.scores,
      isLastRound: isLastRound(),
      onNext: goToNextRound,
    }),
  );
  state.container.append(createExitFooter(requestExit));
}

function renderFinishedPhase() {
  const winnerTeamId = getWinnerTeamId();

  state.container.append(
    renderFinishedScreen({
      teams: state.teams,
      scores: state.scores,
      winnerTeam: winnerTeamId ? teamById(winnerTeamId) : null,
      onPlayAgain: playAgain,
      onNewTeams: chooseNewTeams,
      onExit: () => state.api.exit(),
    }),
  );
}

/** Przejście z ekranu "Gotowi" na pełnoekranowy zegar. */
function startClockPhase() {
  state.phase = 'clock';
  renderState();
}

/** Świeży stan zegara dla nowego pojedynku (jedna pula na gracza). */
function createClockState() {
  const poolMs = PLAYER_TIME_SECONDS * 1000;

  return {
    remaining: { first: poolMs, second: poolMs },
    counts: { first: 0, second: 0 },
    activeTeamId: state.startingTeamId,
    started: false,
    paused: false,
    finished: false,
    winnerTeamId: null,
    turnStartedAt: 0,
    lastTurnChangeAt: 0,
    tickId: null,
  };
}

/** Pozostały czas z uwzględnieniem trwającej tury (liczony z timestampu, bez zapisu). */
function getLiveRemaining() {
  const clock = state.clock;
  const remaining = { ...clock.remaining };

  if (clock.started && !clock.paused && !clock.finished && clock.activeTeamId) {
    const elapsed = performance.now() - clock.turnStartedAt;
    remaining[clock.activeTeamId] = Math.max(0, clock.remaining[clock.activeTeamId] - elapsed);
  }

  return remaining;
}

function updateClockUi() {
  const clock = state?.clock;
  const view = state?.clockView;

  if (!clock || !view) {
    return;
  }

  view.update({
    started: clock.started,
    paused: clock.paused,
    finished: clock.finished,
    activeTeamId: clock.activeTeamId,
    remaining: getLiveRemaining(),
    counts: clock.counts,
  });
}

function startTicking() {
  stopTicking();
  state.clock.tickId = window.setInterval(onTick, TICK_MS);
}

function stopTicking() {
  const clock = state?.clock;

  if (clock && clock.tickId !== null) {
    window.clearInterval(clock.tickId);
    clock.tickId = null;
  }
}

function onTick() {
  const clock = state?.clock;

  if (!clock || !clock.started || clock.paused || clock.finished) {
    return;
  }

  if (getLiveRemaining()[clock.activeTeamId] <= 0) {
    finishDuel();
    return;
  }

  updateClockUi();
}

function startDuel() {
  const clock = state?.clock;

  if (!clock || clock.started) {
    return;
  }

  clock.started = true;
  clock.paused = false;
  clock.activeTeamId = state.startingTeamId;
  clock.turnStartedAt = performance.now();
  clock.lastTurnChangeAt = clock.turnStartedAt;

  startTicking();
  void requestWakeLock();
  updateClockUi();
}

function pauseDuel() {
  const clock = state?.clock;

  if (!clock || !clock.started || clock.paused || clock.finished) {
    return;
  }

  const now = performance.now();
  clock.remaining[clock.activeTeamId] = Math.max(
    0,
    clock.remaining[clock.activeTeamId] - (now - clock.turnStartedAt),
  );
  clock.paused = true;

  stopTicking();
  releaseWakeLock();
  updateClockUi();
}

function resumeDuel() {
  const clock = state?.clock;

  if (!clock || !clock.paused || clock.finished) {
    return;
  }

  clock.paused = false;
  clock.turnStartedAt = performance.now();
  clock.lastTurnChangeAt = clock.turnStartedAt;

  startTicking();
  void requestWakeLock();
  updateClockUi();
}

/** Dotknięcie własnej połowy: koniec wymiany i przekazanie tury. */
function handleHalfTap(teamId) {
  const clock = state?.clock;

  if (!clock || !clock.started || clock.paused || clock.finished) {
    return;
  }
  if (teamId !== clock.activeTeamId) {
    return;
  }

  const now = performance.now();
  if (now - clock.lastTurnChangeAt < TAP_GUARD_MS) {
    return;
  }

  if (getLiveRemaining()[clock.activeTeamId] <= 0) {
    finishDuel();
    return;
  }

  clock.remaining[clock.activeTeamId] = Math.max(
    0,
    clock.remaining[clock.activeTeamId] - (now - clock.turnStartedAt),
  );
  clock.counts[clock.activeTeamId] += 1;

  if (INCREMENT_SECONDS > 0) {
    clock.remaining[clock.activeTeamId] += INCREMENT_SECONDS * 1000;
  }

  clock.activeTeamId = otherTeamId(clock.activeTeamId);
  clock.turnStartedAt = now;
  clock.lastTurnChangeAt = now;

  vibrate(VIBRATION_TURN_MS);
  updateClockUi();
}

/** Koniec pojedynku: wygrywa gracz, którego zegar nie spadł do zera. */
function finishDuel() {
  const clock = state?.clock;

  if (!clock || clock.finished) {
    return;
  }

  clock.remaining = getLiveRemaining();
  clock.finished = true;
  clock.paused = true;
  clock.winnerTeamId = otherTeamId(clock.activeTeamId);

  stopTicking();
  releaseWakeLock();
  vibrate(VIBRATION_END_MS);

  state.scores[clock.winnerTeamId] += 1;
  state.phase = 'result';
  renderState();
}

function requestExit() {
  if (!state || state.confirmDialog) {
    return;
  }

  state.confirmDialog = {
    title: 'Zakończyć grę?',
    message: 'Wrócisz do HUB-a, a bieżąca rozgrywka przepadnie — wyniki nie są zapisywane.',
    confirmLabel: 'Tak, zakończ grę',
  };
  renderState();
}

/** Wyjście z ekranu zegara — przycisk jest widoczny tylko po pauzie. */
function requestAbort() {
  if (!state || !state.clock || state.confirmDialog) {
    return;
  }

  state.confirmDialog = {
    title: 'Przerwać pojedynek?',
    message: 'Ten pojedynek nie zostanie dokończony. Wrócisz do HUB-a.',
    confirmLabel: 'Tak, przerwij',
  };
  renderState();
}

/** Start partii po zatwierdzeniu drużyn. */
function startMatch(teams) {
  state.teams = { first: [...teams.first], second: [...teams.second] };
  state.order = {
    first: shuffle(state.teams.first),
    second: shuffle(state.teams.second),
  };
  state.rounds = Math.max(state.teams.first.length, state.teams.second.length);
  state.scores = { first: 0, second: 0 };
  state.roundIndex = 0;
  state.deck = shuffle(CATEGORIES);
  state.firstStarterId = randomTeamId();
  prepareRound();
}

function prepareRound() {
  state.duelists = {
    first: state.order.first[state.roundIndex % state.order.first.length],
    second: state.order.second[state.roundIndex % state.order.second.length],
  };
  state.startingTeamId =
    state.roundIndex % 2 === 0 ? state.firstStarterId : otherTeamId(state.firstStarterId);
  state.clock = null;
  state.clockView = null;
  state.phase = 'intro';
  renderState();
}

function goToNextRound() {
  if (state.phase !== 'result') {
    return;
  }

  if (isLastRound()) {
    state.phase = 'finished';
    renderState();
    return;
  }

  state.roundIndex += 1;
  prepareRound();
}

/** „Jeszcze raz": te same drużyny, nowe kategorie i nowe kolejności. */
function playAgain() {
  state.order = {
    first: shuffle(state.teams.first),
    second: shuffle(state.teams.second),
  };
  state.scores = { first: 0, second: 0 };
  state.roundIndex = 0;
  state.deck = shuffle(CATEGORIES);
  state.firstStarterId = randomTeamId();
  prepareRound();
}

/** „Nowy podział drużyn": powrót do ekranu podziału z czystym stanem partii. */
function chooseNewTeams() {
  state.teams = null;
  state.order = null;
  state.rounds = 0;
  state.roundIndex = 0;
  state.scores = { first: 0, second: 0 };
  state.duelists = null;
  state.clock = null;
  state.clockView = null;
  state.phase = 'teams';
  renderState();
}




