/**
 * Gra "Na oko" (id: guess-number).
 *
 * Zasady:
 *  - pytanie czyta jedna osoba na głos, reszta obstawia liczbę całkowitą,
 *  - telefon krąży po graczach w bieżącej kolejności, a typy poprzednich graczy
 *    są cały czas widoczne (kolejność ma znaczenie),
 *  - po typach wszystkich graczy pokazujemy prawidłową odpowiedź i ranking rundy
 *    (najbliższy pierwszy; przy remisie odległości zostaje dotychczasowa kolejność),
 *  - za rundę gracze dostają punkty: N − miejsce + 1 (metoda sportowa, remisy mają
 *    wspólne miejsce), a trafienie dokładne daje bonus +2 — punkty sumują się,
 *  - kolejność graczy w następnym pytaniu = kolejność z rankingu (niezależnie od punktów),
 *  - pytania są losowane pojedynczo z puli sesji (core/content-pool.js): kolejne
 *    partie nie powtarzają pytań, dopóki pula się nie wyczerpie,
 *  - partia kończy się po QUESTIONS_PER_GAME pytaniach; wygrywa najwyższa suma punktów,
 *  - brak zapisu na dysku: cały stan żyje w pamięci tego modułu.
 */
import { loadQuestions } from '../../core/content-loader.js';
import { drawNext, hasOther, redraw } from '../../core/content-pool.js';
import { SCREEN_CHANGE_GUARD_MS, clear, clearTapGuard, guardTaps } from '../../core/dom.js';
import { getLanguage, t } from '../../core/i18n.js';
import { renderLoadErrorScreen, renderLoadingScreen } from '../../components/content-status.js';
import {
  addGuess,
  addToTotals,
  canRedrawRound,
  computeRanking,
  computeStandings,
  createInitialOrder,
  createNameMap,
  createOrderFromRanking,
  createPlayers,
  getCurrentPlayerId,
  getWinners,
  hasGuessed,
  scoreRound,
} from './engine.js';
import {
  createExitFooter,
  ensureStyles,
  removeStyles,
  renderAnswerScreen,
  renderExitDialog,
  renderFinishedScreen,
  renderStandingsDialog,
  renderTurnScreen,
} from './ui.js';

/** Ile pytań ma jedna partia — pula sesyjna wystarcza dzięki temu na kilka partii. */
const QUESTIONS_PER_GAME = 8;

/** Id puli pytań w content-pool.js — wspólna dla wszystkich partii w tej sesji. */
const QUESTION_POOL_ID = 'guess-number';

/** Pule różnych języków są niezależne, np. "guess-number:pl" i "guess-number:en". */
const getQuestionPoolId = () => `${QUESTION_POOL_ID}:${getLanguage()}`;

/** Klucz pytania w puli to tekst pytania (pliki tekstowe nie mają identyfikatorów). */
const getQuestionKey = (question) => question.text;

/**
 * Stan jednej partii.
 *
 * Gracze mają stałe identyfikatory (id) nadane przy starcie partii. Tura, wpisy
 * i ranking używają wyłącznie id — pozycja w tablicy nie jest tożsamością gracza.
 *
 * @type {null | {
 *   container: HTMLElement,
 *   api: import('../../core/game-contract.js').GameApi,
 *   players: Array<{id: string, name: string}>,
 *   playerNames: Map<string, string>,
 *   questions: Array<{text: string, answer: number, unit: string}>,
 *   question: {text: string, answer: number, unit: string} | null,
 *   usedQuestionKeys: Set<string>,
 *   totalQuestions: number,
 *   questionIndex: number,
 *   order: string[],
 *   turnIndex: number,
 *   guesses: Array<{playerId: string, value: number}>,
 *   ranking: Array<{playerId: string, value: number, distance: number}>,
 *   totals: Map<string, number>,
 *   roundScores: Map<string, {points: number, place: number, exact: boolean}>,
 *   phase: 'loading' | 'load-error' | 'turn' | 'ready' | 'answer' | 'finished',
 *   loadError: string,
 *   loadToken: number,
 *   exitRequested: boolean,
 *   renderPending: boolean,
 *   lastScreenKey: string,
 *   exitCancelCallback: (() => void) | null,
 * }}
 */
let state = null;

const game = {
  id: 'guess-number',
  nameKey: 'games.guess-number.name',
  descriptionKey: 'games.guess-number.description',
  icon: '🎯',
  minPlayers: 2,
  maxPlayers: 10,

  howToPlay: {
    goalKey: 'games.guess-number.goal',
    stepKeys: [
      'games.guess-number.steps.1',
      'games.guess-number.steps.2',
      'games.guess-number.steps.3',
      'games.guess-number.steps.4',
      'games.guess-number.steps.5',
      'games.guess-number.steps.6',
    ],
    tipKeys: [
      'games.guess-number.tips.1',
      'games.guess-number.tips.2',
      'games.guess-number.tips.3',
    ],
  },
  howToPlayParams: { count: QUESTIONS_PER_GAME },

  /**
   * @param {HTMLElement} container
   * @param {string[]} players
   * @param {import('../../core/game-contract.js').GameApi} api
   */
  mount(container, players, api) {
    ensureStyles();

    // Sesja HUB-a trzyma tylko imiona — stałe id graczy powstają na starcie partii.
    const roster = createPlayers(players);

    state = {
      container,
      api,
      players: roster,
      playerNames: createNameMap(roster),
      questions: [],
      question: null,
      usedQuestionKeys: new Set(),
      totalQuestions: 0,
      questionIndex: 0,
      order: [],
      turnIndex: 0,
      guesses: [],
      ranking: [],
      totals: new Map(),
      roundScores: new Map(),
      phase: 'loading',
      loadError: '',
      loadToken: 0,
      exitRequested: false,
      renderPending: false,
      lastScreenKey: '',
      exitCancelCallback: null,
    };

    renderState();
    loadContent();
  },

  unmount() {
    if (state) {
      clearTapGuard(state.container);
    }
    removeStyles();
    state = null;
  },

  /** Gest „wstecz” (core/router.js): to samo okno co przycisk „Zakończ grę”. */
  requestExit(options) {
    requestExit(options);
  },
};

export default game;

function currentQuestion() {
  return state.question;
}

/**
 * Losuje kolejne pytanie z puli sesji, z pominięciem pytań użytych w tej partii.
 * @returns {{text: string, answer: number, unit: string} | null}
 */
function drawQuestion() {
  const question = drawNext(
    getQuestionPoolId(),
    state.questions,
    getQuestionKey,
    state.usedQuestionKeys,
  );

  if (question !== null) {
    state.usedQuestionKeys.add(getQuestionKey(question));
  }

  return question;
}

/** Wczytuje pytania z pliku; gra startuje dopiero po udanym wczytaniu. */
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
    const questions = await loadQuestions('questions');

    if (state !== sessionState || sessionState.loadToken !== token) {
      return;
    }

    if (questions.length === 0) {
      showLoadError(t('games.guess-number.loadEmpty'));
      return;
    }

    startGame(questions);
  } catch (error) {
    if (state !== sessionState || sessionState.loadToken !== token) {
      return;
    }

    console.error('Nie udało się wczytać pytań gry "Na oko":', error);
    showLoadError(t('games.guess-number.loadError'));
  }
}

/** Pokazuje ekran błędu wczytywania z ponowieniem i wyjściem do HUB-a. */
function showLoadError(message) {
  state.phase = 'load-error';
  state.loadError = message;
  renderState();
}

/** Pierwsza runda zaczyna się po wczytaniu pliku z pytaniami. */
function startGame(questions) {
  state.questions = questions;
  // Nowa partia: pytania poprzednich partii pilnuje pula sesji, a ten zbiór
  // pilnuje, żeby nic nie powtórzyło się w obrębie tej partii.
  state.usedQuestionKeys = new Set();
  state.question = drawQuestion();
  state.totalQuestions = Math.min(QUESTIONS_PER_GAME, questions.length);
  state.questionIndex = 0;
  // Pierwsza runda: losowa kolejność stałych identyfikatorów graczy.
  state.order = createInitialOrder(state.players.map((player) => player.id));
  state.turnIndex = 0;
  state.guesses = [];
  state.ranking = [];
  // Nowa partia zawsze startuje od zera punktów.
  state.totals = new Map();
  state.roundScores = new Map();
  state.phase = state.question === null ? 'finished' : 'turn';
  renderState();
}

function renderState() {
  if (!state) {
    return;
  }

  const { container } = state;

  if (state.exitRequested) {
    if (container.querySelector('.gn-overlay')) {
      // Ekran pod nakładką jest nieaktualny (np. pytania wczytały się w tle) —
      // przerysujemy go po zamknięciu okna.
      state.renderPending = true;
      return;
    }
    const overlay = renderExitDialog({
      onConfirm: () => state.api.exit(),
      onCancel: () => {
        state.exitRequested = false;
        notifyExitCancelled();

        if (state.renderPending) {
          state.renderPending = false;
          renderState();
          return;
        }

        // Zdejmujemy tylko nakładkę: ekran pod spodem (np. wpisana liczba) zostaje bez zmian.
        container.querySelector('.gn-overlay')?.remove();
      },
    });
    container.append(overlay);
    overlay.querySelector('.button--secondary')?.focus();
    return;
  }

  state.renderPending = false;
  clear(container);
  window.scrollTo(0, 0);

  // Nowy ekran (faza, pytanie albo tura) — krótka blokada dotknięć przed „przeklikaniem”.
  const screenKey = `${state.phase}:${state.questionIndex}:${state.turnIndex}`;

  if (screenKey !== state.lastScreenKey) {
    state.lastScreenKey = screenKey;
    guardTaps(container, SCREEN_CHANGE_GUARD_MS);
  }

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

  // Zabezpieczenie: brak pytań w pliku z treścią oznacza od razu koniec partii.
  if (state.phase !== 'finished' && (state.totalQuestions === 0 || state.question === null)) {
    state.phase = 'finished';
  }

  if (state.phase === 'finished') {
    // Tabela końcowa liczona z sum punktów; remis sumy = kilku zwycięzców.
    const standings = computeStandings(state.totals, state.players);

    container.append(
      renderFinishedScreen({
        playerNames: state.playerNames,
        totalQuestions: state.totalQuestions,
        standings,
        winners: getWinners(standings),
        onExit: () => state.api.exit(),
      }),
    );
    return;
  }

  if (state.phase === 'answer') {
    container.append(
      renderAnswerScreen({
        playerNames: state.playerNames,
        question: currentQuestion(),
        questionNumber: state.questionIndex + 1,
        totalQuestions: state.totalQuestions,
        ranking: state.ranking,
        roundScores: state.roundScores,
        totals: state.totals,
        isLastQuestion: state.questionIndex + 1 >= state.totalQuestions,
        onNext: goToNextQuestion,
      }),
    );
    container.append(createExitFooter(requestExit));
    return;
  }

  // Bieżący gracz wyłącznie po stałym id z kolejności tury.
  const currentPlayerId = getCurrentPlayerId(state.order, state.turnIndex);

  container.append(
    renderTurnScreen({
      playerNames: state.playerNames,
      question: currentQuestion(),
      questionNumber: state.questionIndex + 1,
      totalQuestions: state.totalQuestions,
      guesses: state.guesses,
      currentPlayerId,
      allGuessed: state.phase === 'ready',
      // Ekran pamięta, dla kogo jest tura — spóźnione kliknięcie nie zapisze wpisu innemu graczowi.
      onSubmit: (value) => submitGuess(currentPlayerId, value),
      onReveal: revealAnswer,
      onRedrawQuestion: redrawQuestion,
      canRedrawQuestion:
        canRedrawRound(state.guesses) && state.question !== null
          ? hasOther(
              getQuestionPoolId(),
              state.questions,
              getQuestionKey,
              state.question.text,
              state.usedQuestionKeys,
            )
          : false,
      onShowStandings: openStandings,
    }),
  );
  container.append(createExitFooter(requestExit));
}

/**
 * Okno „Zakończyć grę?” (przycisk w grze albo gest „wstecz”).
 * @param {{onCancel?: () => void}} [options] onCancel — wołane po „Zostań w grze”
 *   (router dopisuje wtedy z powrotem wpis historii); przycisk w grze go nie podaje
 */
function requestExit({ onCancel } = {}) {
  if (!state) {
    return;
  }
  if (typeof onCancel === 'function') {
    state.exitCancelCallback = onCancel;
  }
  if (state.exitRequested) {
    return;
  }
  state.exitRequested = true;
  renderState();
}

/** Użytkownik został w grze — informujemy router (jeśli okno otworzył gest „wstecz”). */
function notifyExitCancelled() {
  const callback = state.exitCancelCallback;
  state.exitCancelCallback = null;

  if (typeof callback === 'function') {
    callback();
  }
}

/**
 * Nakładka z tabelą wyników w trakcie partii.
 *
 * Tylko czyta stan (sumy punktów i listę graczy), więc nie zmienia tury, typów
 * ani kolejności. Własna klasa nakładki (.gn-sheet-overlay) nie koliduje
 * z dialogiem wyjścia (.gn-overlay) — oba mogą działać niezależnie.
 */
function openStandings() {
  if (!state) {
    return;
  }

  const { container } = state;

  if (container.querySelector('.gn-sheet-overlay')) {
    return;
  }

  const overlay = renderStandingsDialog({
    playerNames: state.playerNames,
    standings: computeStandings(state.totals, state.players),
    onClose: () => {
      overlay.remove();
      container.querySelector('.gn-standings-button')?.focus();
    },
  });

  container.append(overlay);
  overlay.querySelector('button')?.focus();
}

/**
 * Zapisuje typ gracza wskazanego przez ekran i przechodzi dalej
 * (albo do przycisku "Pokaż odpowiedź").
 *
 * Ekran tury przekazuje id gracza z chwili rysowania. Jeśli tura zdążyła się już
 * zmienić, id nie zgadza się z bieżącym i nic nie zapisujemy — drugie kliknięcie
 * „Zatwierdź” nie dopisze typu następnemu graczowi.
 *
 * @param {string|null} playerId
 * @param {number} value
 */
function submitGuess(playerId, value) {
  if (!state || state.phase !== 'turn' || playerId === null) {
    return;
  }

  const currentPlayerId = getCurrentPlayerId(state.order, state.turnIndex);

  if (currentPlayerId !== playerId || hasGuessed(state.guesses, playerId)) {
    return;
  }

  // Najpierw wpis dla aktualnego gracza, potem przesunięcie tury, na końcu odświeżenie ekranu.
  state.guesses = addGuess(state.guesses, playerId, value);
  state.turnIndex += 1;
  state.phase = state.turnIndex >= state.order.length ? 'ready' : 'turn';
  renderState();
}

/**
 * „Inne pytanie” — działa tylko przed pierwszym typem w tej rundzie i bez limitu.
 * Numer pytania, kolejność graczy i punktacja pozostają bez zmian.
 */
function redrawQuestion() {
  // „Inne pytanie” tylko przed pierwszym typem: nie zmienia cudzych wpisów ani kolejności tury.
  if (!state || state.phase !== 'turn' || !canRedrawRound(state.guesses) || state.question === null) {
    return;
  }

  const next = redraw(
    getQuestionPoolId(),
    state.questions,
    getQuestionKey,
    state.question.text,
    state.usedQuestionKeys,
  );

  if (!next) {
    return;
  }

  // Odrzucone pytanie już jest w zbiorze partii (było wylosowane), więc nie wróci.
  state.usedQuestionKeys.add(getQuestionKey(next));
  state.question = next;
  renderState();
}

function revealAnswer() {
  if (!state || state.phase !== 'ready') {
    return;
  }

  state.ranking = computeRanking(state.guesses, currentQuestion().answer);
  // Punkty rundy liczone raz, przy odsłonięciu odpowiedzi — potem tylko sumowanie.
  state.roundScores = scoreRound(state.ranking, state.players.length);
  state.totals = addToTotals(state.totals, state.roundScores);
  state.phase = 'answer';
  renderState();
}

/** Następne pytanie — kolejność graczy bierzemy z rankingu (najbliższy zaczyna). */
function goToNextQuestion() {
  // Tylko z ekranu odpowiedzi: drugie wywołanie zbudowałoby kolejność z pustego rankingu.
  if (!state || state.phase !== 'answer') {
    return;
  }

  // Następną rundę zaczyna najbliższy z rankingu — kolejność to znów tablica id.
  state.order = createOrderFromRanking(state.ranking);
  state.questionIndex += 1;
  state.turnIndex = 0;
  state.guesses = [];
  state.ranking = [];
  // Sumy punktów zostają; czyścimy tylko punktację poprzedniej rundy.
  state.roundScores = new Map();

  if (state.questionIndex >= state.totalQuestions) {
    // Partia ma QUESTIONS_PER_GAME pytań (albo mniej, gdy w pliku jest ich mniej).
    state.question = null;
    state.phase = 'finished';
  } else {
    // Kolejne pytanie z puli sesji — nie powtarza wcześniej użytych.
    state.question = drawQuestion();
    state.phase = state.question === null ? 'finished' : 'turn';
  }

  renderState();
}

