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
import { drawNext, hasOther, redraw } from '../../core/content-pool.js';
import { clear } from '../../core/dom.js';
import { shuffle } from '../../core/random.js';
import { QUESTIONS } from './questions.js';
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

/** Klucz pytania w puli to jego unikalne id. */
const getQuestionKey = (question) => question.id;

/**
 * Stan jednej partii.
 * @type {null | {
 *   container: HTMLElement,
 *   api: import('../../core/game-contract.js').GameApi,
 *   players: string[],
 *   question: {id: string, text: string, answer: number, unit: string} | null,
 *   totalQuestions: number,
 *   questionIndex: number,
 *   order: number[],
 *   turnIndex: number,
 *   guesses: Array<{playerIndex: number, value: number}>,
 *   ranking: Array<{playerIndex: number, value: number, distance: number}>,
 *   phase: 'turn' | 'ready' | 'answer' | 'finished',
 *   exitRequested: boolean,
 * }}
 */
let state = null;

const game = {
  id: 'guess-number',
  name: 'Na oko',
  description: 'Zgadnij liczbę. Kto będzie najbliżej?',
  icon: '🎯',
  minPlayers: 2,
  maxPlayers: 10,

  howToPlay: {
    goal: 'Zgadnij liczbę z pytania i bądź najbliżej prawdziwej odpowiedzi.',
    steps: [
      'Jedna osoba czyta pytanie na głos. Odpowiedzią jest liczba: ilość, rok albo miara.',
      'Telefon krąży po kolei po graczach. Każdy wpisuje swoją liczbę i dotyka „Zatwierdź".',
      'Gdy wszyscy obstawią, dotknijcie „Pokaż odpowiedź" — zobaczycie prawdziwą odpowiedź i ranking od najbliższego typu.',
      'Ranking pokazuje każdy typ i różnicę od odpowiedzi. Najbliższy gracz zaczyna następne pytanie, potem kolejni według rankingu.',
      'Gdy pytania się skończą, zobaczycie ekran „Koniec" — partia jest skończona i wracacie do HUB-a.',
    ],
    tips: [
      'Typy poprzednich graczy są widoczne na liście, więc kolejność ma znaczenie.',
      'Możecie obstawić tę samą liczbę co poprzednik — to nie jest błąd.',
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
      question: drawNext(QUESTION_POOL_ID, QUESTIONS, getQuestionKey),
      totalQuestions: Math.min(QUESTIONS_PER_GAME, QUESTIONS.length),
      questionIndex: 0,
      // Pierwsza runda: losowa kolejność graczy (indeksy w tablicy players).
      order: shuffle(players.map((_, index) => index)),
      turnIndex: 0,
      guesses: [],
      ranking: [],
      phase: 'turn',
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

function currentQuestion() {
  return state.question;
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

  // Zabezpieczenie: brak pytań w pliku questions.js oznacza od razu koniec partii.
  if (state.phase !== 'finished' && (state.totalQuestions === 0 || state.question === null)) {
    state.phase = 'finished';
  }

  clear(container);
  window.scrollTo(0, 0);

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
        players: state.players,
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

  container.append(
    renderTurnScreen({
      players: state.players,
      question: currentQuestion(),
      questionNumber: state.questionIndex + 1,
      totalQuestions: state.totalQuestions,
      guesses: state.guesses,
      currentPlayerIndex: Math.min(state.turnIndex, state.order.length - 1),
      allGuessed: state.phase === 'ready',
      onSubmit: submitGuess,
      onReveal: revealAnswer,
      onRedrawQuestion: redrawQuestion,
      canRedrawQuestion:
        state.guesses.length === 0 && state.question !== null
          ? hasOther(QUESTION_POOL_ID, QUESTIONS, getQuestionKey, state.question.id)
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

/** Zapisuje typ bieżącego gracza i przechodzi dalej (albo do przycisku "Pokaż odpowiedź"). */
function submitGuess(value) {
  if (!state || state.phase !== 'turn') {
    return;
  }

  state.guesses.push({ playerIndex: state.order[state.turnIndex], value });
  state.turnIndex += 1;
  state.phase = state.turnIndex >= state.order.length ? 'ready' : 'turn';
  renderState();
}

/**
 * „Inne pytanie” — działa tylko przed pierwszym typem w tej rundzie i bez limitu.
 * Numer pytania, kolejność graczy i punktacja pozostają bez zmian.
 */
function redrawQuestion() {
  if (!state || state.phase !== 'turn' || state.guesses.length > 0 || state.question === null) {
    return;
  }

  const next = redraw(QUESTION_POOL_ID, QUESTIONS, getQuestionKey, state.question.id);

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

  state.ranking = computeRanking();
  state.phase = 'answer';
  renderState();
}

/**
 * Ranking rundy: od najmniejszej odległości od prawidłowej odpowiedzi.
 * Przy równych odległościach decyduje pozycja w kolejności typowania
 * (drugi warunek sortowania), więc remis zachowuje dotychczasową kolejność.
 */
function computeRanking() {
  const answer = currentQuestion().answer;

  return state.guesses
    .map((guess, position) => ({
      playerIndex: guess.playerIndex,
      value: guess.value,
      distance: Math.abs(guess.value - answer),
      position,
    }))
    .sort((first, second) => first.distance - second.distance || first.position - second.position);
}

/** Następne pytanie — kolejność graczy bierzemy z rankingu (najbliższy zaczyna). */
function goToNextQuestion() {
  if (!state) {
    return;
  }

  state.order = state.ranking.map((entry) => entry.playerIndex);
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
    state.question = drawNext(QUESTION_POOL_ID, QUESTIONS, getQuestionKey);
    state.phase = state.question === null ? 'finished' : 'turn';
  }

  renderState();
}

