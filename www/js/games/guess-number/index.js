/**
 * Gra "Na oko" (id: guess-number).
 *
 * Zasady:
 *  - pytanie czyta jedna osoba na głos, reszta obstawia liczbę całkowitą,
 *  - telefon krąży po graczach w bieżącej kolejności, a typy poprzednich graczy
 *    są cały czas widoczne (kolejność ma znaczenie),
 *  - po typach wszystkich graczy pokazujemy prawidłową odpowiedź i ranking rundy
 *    (najbliższy pierwszy; przy remisie odległości zostaje dotychczasowa kolejność),
 *  - kolejność graczy w następnym pytaniu = kolejność z rankingu,
 *  - pytania są losowane pojedynczo z puli sesji (core/content-pool.js): kolejne
 *    partie nie powtarzają pytań, dopóki pula się nie wyczerpie,
 *  - brak punktów i brak zapisu na dysku: cały stan żyje w pamięci tego modułu.
 */
import { loadQuestions } from '../../core/content-loader.js';
import { drawNext, hasOther, redraw } from '../../core/content-pool.js';
import { clear } from '../../core/dom.js';
import { getLanguage, t } from '../../core/i18n.js';
import { renderLoadErrorScreen, renderLoadingScreen } from '../../components/content-status.js';
import {
  addGuess,
  canRedrawRound,
  computeRanking,
  createInitialOrder,
  createNameMap,
  createOrderFromRanking,
  createPlayers,
  getCurrentPlayerId,
  hasGuessed,
} from './engine.js';
import {
  createExitFooter,
  ensureStyles,
  removeStyles,
  renderAnswerScreen,
  renderExitDialog,
  renderFinishedScreen,
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
 *   totalQuestions: number,
 *   questionIndex: number,
 *   order: string[],
 *   turnIndex: number,
 *   guesses: Array<{playerId: string, value: number}>,
 *   ranking: Array<{playerId: string, value: number, distance: number}>,
 *   phase: 'loading' | 'load-error' | 'turn' | 'ready' | 'answer' | 'finished',
 *   loadError: string,
 *   loadToken: number,
 *   exitRequested: boolean,
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
    ],
    tipKeys: ['games.guess-number.tips.1', 'games.guess-number.tips.2'],
  },

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
      totalQuestions: 0,
      questionIndex: 0,
      order: [],
      turnIndex: 0,
      guesses: [],
      ranking: [],
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

function currentQuestion() {
  return state.question;
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
  state.question = drawNext(getQuestionPoolId(), questions, getQuestionKey);
  state.totalQuestions = Math.min(QUESTIONS_PER_GAME, questions.length);
  state.questionIndex = 0;
  // Pierwsza runda: losowa kolejność stałych identyfikatorów graczy.
  state.order = createInitialOrder(state.players.map((player) => player.id));
  state.turnIndex = 0;
  state.guesses = [];
  state.ranking = [];
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
      return;
    }
    const overlay = renderExitDialog({
      onConfirm: () => state.api.exit(),
      onCancel: () => {
        state.exitRequested = false;
        renderState();
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

  // Zabezpieczenie: brak pytań w pliku z treścią oznacza od razu koniec partii.
  if (state.phase !== 'finished' && (state.totalQuestions === 0 || state.question === null)) {
    state.phase = 'finished';
  }

  if (state.phase === 'finished') {
    container.append(
      renderFinishedScreen({
        totalQuestions: state.totalQuestions,
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
          ? hasOther(getQuestionPoolId(), state.questions, getQuestionKey, state.question.text)
          : false,
    }),
  );
  container.append(createExitFooter(requestExit));
}

function requestExit() {
  if (!state || state.exitRequested) {
    return;
  }
  state.exitRequested = true;
  renderState();
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

  const next = redraw(getQuestionPoolId(), state.questions, getQuestionKey, state.question.text);

  if (!next) {
    return;
  }

  state.question = next;
  renderState();
}

function revealAnswer() {
  if (!state || state.phase !== 'ready') {
    return;
  }

  state.ranking = computeRanking(state.guesses, currentQuestion().answer);
  state.phase = 'answer';
  renderState();
}

/** Następne pytanie — kolejność graczy bierzemy z rankingu (najbliższy zaczyna). */
function goToNextQuestion() {
  if (!state) {
    return;
  }

  // Następną rundę zaczyna najbliższy z rankingu — kolejność to znów tablica id.
  state.order = createOrderFromRanking(state.ranking);
  state.questionIndex += 1;
  state.turnIndex = 0;
  state.guesses = [];
  state.ranking = [];

  if (state.questionIndex >= state.totalQuestions) {
    // Partia ma QUESTIONS_PER_GAME pytań (albo mniej, gdy w pliku jest ich mniej).
    state.question = null;
    state.phase = 'finished';
  } else {
    // Kolejne pytanie z puli sesji — nie powtarza wcześniej użytych.
    state.question = drawNext(getQuestionPoolId(), state.questions, getQuestionKey);
    state.phase = state.question === null ? 'finished' : 'turn';
  }

  renderState();
}

