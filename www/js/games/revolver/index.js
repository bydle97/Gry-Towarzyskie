/**
 * Gra "W pół słowa" (id: revolver).
 *
 * Zasady:
 *  - po Starcie gracze dzielą się na dwie drużyny (wspólny components/team-setup.js),
 *  - liczba rund = liczba osób w większej drużynie; w każdej rundzie tłumaczy po jednej
 *    osobie z każdej drużyny (kolejność w drużynie jest przetasowana, a w mniejszej
 *    drużynie zapętla się, więc nikt nie tłumaczy drugi raz, zanim nie zrobią tego wszyscy),
 *  - która drużyna zaczyna: w pierwszej rundzie losowo, w kolejnych na zmianę,
 *  - zwycięzca rundy dostaje 1 punkt, „Unieważnij" kończy rundę bez punktu,
 *  - hasła są losowane pojedynczo z puli sesji (core/content-pool.js): kolejne partie
 *    nie powtarzają haseł, dopóki pula się nie wyczerpie,
 *  - brak zapisu na dysku: cały stan żyje w pamięci tego modułu.
 */
import { loadLines } from '../../core/content-loader.js';
import { drawNext, hasOther, redraw } from '../../core/content-pool.js';
import { clear, el } from '../../core/dom.js';
import { getLanguage, t } from '../../core/i18n.js';
import { shuffle } from '../../core/random.js';
import { renderLoadErrorScreen, renderLoadingScreen } from '../../components/content-status.js';
import { TEAMS, mountTeamSetup } from '../../components/team-setup.js';
import {
  createExitFooter,
  ensureStyles,
  removeStyles,
  renderExitDialog,
  renderFinishedScreen,
  renderRoundIntroScreen,
  renderRoundResultScreen,
  renderWordScreen,
} from './ui.js';

/** Id puli haseł w content-pool.js — wspólna dla wszystkich partii w tej sesji. */
const PHRASE_POOL_ID = 'revolver';

/** Pule różnych języków są niezależne, np. "revolver:pl" i "revolver:en". */
const getPhrasePoolId = () => `${PHRASE_POOL_ID}:${getLanguage()}`;

/** Klucz hasła w puli to sam tekst hasła. */
const getPhraseKey = (phrase) => phrase;

/** Ile razy w jednej rundzie można zmienić hasło przyciskiem „Inne hasło”. */
const MAX_REDRAWS_PER_ROUND = 2;

/** Ile ms po zmianie hasła ignorujemy kolejne kliknięcia (ochrona przed podwójnym dotknięciem). */
const REDRAW_GUARD_MS = 250;

/**
 * Stan jednej partii.
 *
 * Gracze mają stałe id nadane przy starcie partii. `teams`, `order` i `explainers`
 * to tablice identyfikatorów — imiona służą wyłącznie do wyświetlania.
 *
 * @type {null | {
 *   container: HTMLElement,
 *   api: import('../../core/game-contract.js').GameApi,
 *   players: Array<{id: string, name: string}>,
 *   playerNames: Map<string, string>,
 *   phrases: string[],
 *   teams: {first: string[], second: string[]} | null,
 *   order: {first: string[], second: string[]} | null,
 *   rounds: number,
 *   roundIndex: number,
 *   word: string,
 *   redrawsLeft: number,
 *   lastRedrawAt: number,
 *   firstStarterId: string,
 *   scores: {first: number, second: number},
 *   explainers: {first: string, second: string} | null,
 *   lastWinnerId: string | null,
 *   phase: 'loading' | 'load-error' | 'teams' | 'intro' | 'word' | 'result' | 'finished',
 *   loadError: string,
 *   loadToken: number,
 *   exitRequested: boolean,
 * }}
 */
let state = null;

const game = {
  id: 'revolver',
  nameKey: 'games.revolver.name',
  descriptionKey: 'games.revolver.description',
  icon: '🗣️',
  minPlayers: 4,
  maxPlayers: 20,

  howToPlay: {
    goalKey: 'games.revolver.goal',
    stepKeys: [
      'games.revolver.steps.1',
      'games.revolver.steps.2',
      'games.revolver.steps.3',
      'games.revolver.steps.4',
      'games.revolver.steps.5',
    ],
    tipKeys: ['games.revolver.tips.1', 'games.revolver.tips.2'],
  },

  /**
   * @param {HTMLElement} container
   * @param {string[]} players
   * @param {import('../../core/game-contract.js').GameApi} api
   */
  mount(container, players, api) {
    ensureStyles();

    // Sesja HUB-a trzyma tylko imiona — stałe id graczy powstają na starcie partii.
    const roster = createRoster(players);

    state = {
      container,
      api,
      players: roster,
      playerNames: new Map(roster.map((player) => [player.id, player.name])),
      phrases: [],
      teams: null,
      order: null,
      rounds: 0,
      roundIndex: 0,
      word: '',
      redrawsLeft: 0,
      lastRedrawAt: 0,
      firstStarterId: randomTeamId(),
      scores: { first: 0, second: 0 },
      explainers: null,
      lastWinnerId: null,
      phase: 'loading',
      loadError: '',
      loadToken: 0,
      exitRequested: false,
    };

    renderState();
    loadContent();
  },

  unmount() {
    removeStyles();
    state = null;
  },
};

export default game;

/** Nadaje graczom stałe identyfikatory na czas partii (imiona są tylko do wyświetlania). */
function createRoster(names) {
  return names.map((name, index) => ({ id: `p${index + 1}`, name }));
}

/** Imię gracza z mapy id → imię. */
function nameOf(playerId) {
  return state.playerNames.get(playerId) ?? '—';
}

/** Skład drużyn jako imiona do wyświetlenia (stan partii trzyma identyfikatory). */
function teamNames() {
  return {
    first: state.teams.first.map(nameOf),
    second: state.teams.second.map(nameOf),
  };
}

/** Losowa drużyna (używana do wyboru, kto zaczyna pierwszą rundę). */
function randomTeamId() {
  return shuffle(TEAMS)[0].id;
}

/** Wczytuje hasła z pliku; ekran podziału na drużyny pojawia się po sukcesie. */
async function loadContent() {
  const sessionState = state;

  if (!sessionState) {
    return;
  }

  const token = sessionState.loadToken + 1;
  sessionState.loadToken = token;
  sessionState.phase = 'loading';
  sessionState.loadError = '';
  renderState();

  try {
    const phrases = await loadLines('phrases');

    if (state !== sessionState || sessionState.loadToken !== token) {
      return;
    }

    if (phrases.length === 0) {
      showLoadError(t('games.revolver.loadEmpty'));
      return;
    }

    state.phrases = phrases;
    state.phase = 'teams';
    renderState();
  } catch (error) {
    if (state !== sessionState || sessionState.loadToken !== token) {
      return;
    }

    console.error('Nie udało się wczytać haseł gry "W pół słowa":', error);
    showLoadError(t('games.revolver.loadError'));
  }
}

/** Pokazuje ekran błędu wczytywania z ponowieniem i wyjściem do HUB-a. */
function showLoadError(message) {
  state.phase = 'load-error';
  state.loadError = message;
  renderState();
}

function teamById(teamId) {
  return TEAMS.find((team) => team.id === teamId) ?? TEAMS[0];
}

function otherTeamId(teamId) {
  return teamId === 'first' ? 'second' : 'first';
}

/** Drużyna zaczynająca bieżącą rundę: pierwsza losowo, potem na zmianę. */
function currentStarterId() {
  return state.roundIndex % 2 === 0 ? state.firstStarterId : otherTeamId(state.firstStarterId);
}

/** Hasło bieżącej rundy — wylosowane pojedynczo z puli sesji. */
function currentWord() {
  return state.word || '—';
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

function renderState() {
  if (!state) {
    return;
  }

  const { container } = state;

  if (state.exitRequested) {
    if (container.querySelector('.rv-overlay')) {
      return;
    }
    const overlay = renderExitDialog({
      onConfirm: () => state.api.exit(),
      onCancel: () => {
        state.exitRequested = false;
        // Zdejmujemy tylko nakładkę: ekran pod spodem (np. ręczny podział drużyn) zostaje bez zmian.
        container.querySelector('.rv-overlay')?.remove();
      },
    });
    container.append(overlay);
    overlay.querySelector('.button--secondary')?.focus();
    return;
  }

  clear(container);
  window.scrollTo(0, 0);

  if (state.phase === 'loading') {
    container.append(renderLoadingScreen());
    container.append(createExitFooter(requestExit));
    return;
  }

  if (state.phase === 'load-error') {
    container.append(
      renderLoadErrorScreen({
        message: state.loadError,
        onRetry: loadContent,
        onExit: () => state.api.exit(),
      }),
    );
    return;
  }

  if (state.phase === 'teams') {
    renderTeamsPhase();
    return;
  }

  if (state.phase === 'intro') {
    container.append(
      renderRoundIntroScreen({
        roundNumber: state.roundIndex + 1,
        totalRounds: state.rounds,
        explainers: {
          first: nameOf(state.explainers.first),
          second: nameOf(state.explainers.second),
        },
        onReveal: revealWord,
      }),
    );
    container.append(createExitFooter(requestExit));
    return;
  }

  if (state.phase === 'word') {
    container.append(
      renderWordScreen({
        roundNumber: state.roundIndex + 1,
        totalRounds: state.rounds,
        word: currentWord(),
        starterTeam: teamById(currentStarterId()),
        onTeamGuessed: handleTeamGuessed,
        onRoundCancelled: handleRoundCancelled,
        onRedrawWord: redrawWord,
        redrawsLeft: state.redrawsLeft,
        canRedrawWord: hasOther(getPhrasePoolId(), state.phrases, getPhraseKey, state.word),
      }),
    );
    container.append(createExitFooter(requestExit));
    return;
  }

  if (state.phase === 'result') {
    container.append(
      renderRoundResultScreen({
        roundNumber: state.roundIndex + 1,
        totalRounds: state.rounds,
        winnerTeam: state.lastWinnerId ? teamById(state.lastWinnerId) : null,
        scores: state.scores,
        isLastRound: isLastRound(),
        onNext: goToNextRound,
      }),
    );
    container.append(createExitFooter(requestExit));
    return;
  }

  const winnerTeamId = getWinnerTeamId();
  container.append(
    renderFinishedScreen({
      teams: teamNames(),
      scores: state.scores,
      winnerTeam: winnerTeamId ? teamById(winnerTeamId) : null,
      onPlayAgain: playAgain,
      onNewTeams: chooseNewTeams,
      onExit: () => state.api.exit(),
    }),
  );
}

/** Ekran podziału na drużyny (wspólny komponent) + przycisk wyjścia. */
function renderTeamsPhase() {
  const setupRoot = el('div', { class: 'stack' });
  state.container.append(setupRoot);

  mountTeamSetup({
    container: setupRoot,
    players: state.players,
    onConfirm: startMatch,
  });

  state.container.append(createExitFooter(requestExit));
}

function requestExit() {
  if (!state || state.exitRequested) {
    return;
  }
  state.exitRequested = true;
  renderState();
}

/** Start partii po zatwierdzeniu drużyn: kolejności tłumaczy, hasło z puli, kto zaczyna. */
function startMatch(teams) {
  // Bez dwóch niepustych drużyn rotacja tłumaczy nie istnieje (modulo przez zero).
  if (teams.first.length === 0 || teams.second.length === 0) {
    return;
  }

  state.teams = { first: [...teams.first], second: [...teams.second] };
  state.order = {
    first: shuffle(state.teams.first),
    second: shuffle(state.teams.second),
  };
  state.rounds = Math.max(state.teams.first.length, state.teams.second.length);
  state.scores = { first: 0, second: 0 };
  state.roundIndex = 0;
  state.firstStarterId = randomTeamId();
  prepareRound();
}

function prepareRound() {
  state.word = drawNext(getPhrasePoolId(), state.phrases, getPhraseKey) ?? '—';
  state.redrawsLeft = MAX_REDRAWS_PER_ROUND;
  state.lastRedrawAt = 0;
  state.explainers = {
    first: state.order.first[state.roundIndex % state.order.first.length],
    second: state.order.second[state.roundIndex % state.order.second.length],
  };
  state.lastWinnerId = null;
  state.phase = 'intro';
  renderState();
}

function revealWord() {
  if (state.phase !== 'intro') {
    return;
  }
  state.phase = 'word';
  renderState();
}

/**
 * „Inne hasło” — najwyżej MAX_REDRAWS_PER_ROUND razy na rundę.
 * Zmiana nie wpływa na numer rundy, punktację ani drużynę zaczynającą.
 */
function redrawWord() {
  if (!state || state.phase !== 'word' || state.redrawsLeft <= 0) {
    return;
  }

  // Szybkie podwójne dotknięcie nie może zużyć dwóch zmian pod rząd.
  const now = performance.now();

  if (now - state.lastRedrawAt < REDRAW_GUARD_MS) {
    return;
  }

  const next = redraw(getPhrasePoolId(), state.phrases, getPhraseKey, state.word);

  if (!next) {
    return;
  }

  state.word = next;
  state.redrawsLeft -= 1;
  state.lastRedrawAt = now;
  renderState();
}

function handleTeamGuessed(teamId) {
  if (state.phase !== 'word') {
    return;
  }
  state.scores[teamId] += 1;
  state.lastWinnerId = teamId;
  state.phase = 'result';
  renderState();
}

function handleRoundCancelled() {
  if (state.phase !== 'word') {
    return;
  }
  state.lastWinnerId = null;
  state.phase = 'result';
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

/** „Jeszcze raz": te same drużyny, nowe hasła i nowe kolejności tłumaczy. */
function playAgain() {
  state.order = {
    first: shuffle(state.teams.first),
    second: shuffle(state.teams.second),
  };
  state.scores = { first: 0, second: 0 };
  state.roundIndex = 0;
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
  state.explainers = null;
  state.lastWinnerId = null;
  state.phase = 'teams';
  renderState();
}

