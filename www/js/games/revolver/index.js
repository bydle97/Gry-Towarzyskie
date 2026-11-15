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
import { drawNext, hasOther, redraw } from '../../core/content-pool.js';
import { clear, el } from '../../core/dom.js';
import { shuffle } from '../../core/random.js';
import { TEAMS, mountTeamSetup } from '../../components/team-setup.js';
import { PHRASES } from './phrases.js';
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

/** Klucz hasła w puli to sam tekst hasła. */
const getPhraseKey = (phrase) => phrase;

/** Ile razy w jednej rundzie można zmienić hasło przyciskiem „Inne hasło”. */
const MAX_REDRAWS_PER_ROUND = 2;

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
 *   word: string,
 *   redrawsLeft: number,
 *   firstStarterId: string,
 *   scores: {first: number, second: number},
 *   explainers: {first: string, second: string} | null,
 *   lastWinnerId: string | null,
 *   phase: 'teams' | 'intro' | 'word' | 'result' | 'finished',
 *   exitRequested: boolean,
 * }}
 */
let state = null;

const game = {
  id: 'revolver',
  name: 'W pół słowa',
  description: 'Dwie drużyny, jedno hasło, po jednym słowie na zmianę.',
  icon: '🗣️',
  minPlayers: 4,
  maxPlayers: 20,

  howToPlay: {
    goal: 'Twoja drużyna ma pierwsza odgadnąć hasło.',
    steps: [
      'Gracze dzielą się na dwie drużyny — losowo albo ręcznie, klikając imiona. Każda drużyna musi mieć co najmniej 2 osoby.',
      'W każdej rundzie telefon biorą dwie osoby, po jednej z każdej drużyny, i dotykają „Pokaż hasło". Reszta odwraca wzrok.',
      'Obie osoby widzą to samo hasło i na zmianę mówią po jednym słowie. Pierwsze słowo mówi drużyna pokazana na ekranie.',
      'Gdy któraś drużyna odgadnie, dotknijcie „Odgadła Drużyna 1" albo „Odgadła Drużyna 2". Jeśli nikt nie odgadł lub ktoś oszukiwał — „Unieważnij (0 pkt)".',
      'Gra trwa tyle rund, ile osób ma większa drużyna. Punkt za każdą wygraną rundę, a wygrywa drużyna z większą liczbą punktów.',
    ],
    tips: [
      'Szczegóły, np. czy wolno używać słów z hasła, ustalcie przed grą.',
      'Ekran „Podaj telefon dalej" jest po to, żeby nikt nie zobaczył hasła przed czasem.',
    ],
  },

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
      word: '',
      redrawsLeft: 0,
      firstStarterId: randomTeamId(),
      scores: { first: 0, second: 0 },
      explainers: null,
      lastWinnerId: null,
      phase: 'teams',
      exitRequested: false,
    };

    renderState();
  },

  unmount() {
    removeStyles();
    state = null;
  },
};

export default game;

/** Losowa drużyna (używana do wyboru, kto zaczyna pierwszą rundę). */
function randomTeamId() {
  return shuffle(TEAMS)[0].id;
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

  if (state.phase === 'teams') {
    renderTeamsPhase();
    return;
  }

  if (state.phase === 'intro') {
    container.append(
      renderRoundIntroScreen({
        roundNumber: state.roundIndex + 1,
        totalRounds: state.rounds,
        explainers: state.explainers,
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
        canRedrawWord: hasOther(PHRASE_POOL_ID, PHRASES, getPhraseKey, state.word),
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
      teams: state.teams,
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
  state.word = drawNext(PHRASE_POOL_ID, PHRASES, getPhraseKey) ?? '—';
  state.redrawsLeft = MAX_REDRAWS_PER_ROUND;
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

  const next = redraw(PHRASE_POOL_ID, PHRASES, getPhraseKey, state.word);

  if (!next) {
    return;
  }

  state.word = next;
  state.redrawsLeft -= 1;
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

