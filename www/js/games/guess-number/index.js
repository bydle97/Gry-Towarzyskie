/**
 * Gra "Obstawianie" (id: guess-number).
 *
 * Zasady:
 *  - pytanie czyta jedna osoba na głos, reszta obstawia liczbę całkowitą,
 *  - telefon krąży po graczach w bieżącej kolejności, a typy poprzednich graczy
 *    są cały czas widoczne (kolejność ma znaczenie),
 *  - po typach wszystkich graczy pokazujemy prawidłową odpowiedź i ranking rundy
 *    (najbliższy pierwszy; przy remisie odległości zostaje dotychczasowa kolejność),
 *  - kolejność graczy w następnym pytaniu = kolejność z rankingu,
 *  - pytania są tasowane raz na starcie partii i nie powtarzają się,
 *  - brak punktów i brak zapisu na dysku: cały stan żyje w pamięci tego modułu.
 */
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

/**
 * Stan jednej partii.
 * @type {null | {
 *   container: HTMLElement,
 *   api: import('../../core/game-contract.js').GameApi,
 *   players: string[],
 *   deck: ReadonlyArray<{id: string, text: string, answer: number, unit: string}>,
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
  name: 'Obstawianie',
  description: 'Zgadnij liczbę. Kto będzie najbliżej?',
  icon: '🎯',
  minPlayers: 2,
  maxPlayers: 10,

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
      deck: shuffle(QUESTIONS),
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
  return state.deck[state.questionIndex];
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
  if (state.phase !== 'finished' && state.deck.length === 0) {
    state.phase = 'finished';
  }

  clear(container);
  window.scrollTo(0, 0);

  if (state.phase === 'finished') {
    container.append(
      renderFinishedScreen({
        totalQuestions: state.deck.length,
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
        totalQuestions: state.deck.length,
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
      totalQuestions: state.deck.length,
      guesses: state.guesses,
      currentPlayerIndex: Math.min(state.turnIndex, state.order.length - 1),
      allGuessed: state.phase === 'ready',
      onSubmit: submitGuess,
      onReveal: revealAnswer,
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
  state.phase = state.questionIndex >= state.deck.length ? 'finished' : 'turn';
  renderState();
}

