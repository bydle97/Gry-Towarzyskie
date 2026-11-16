/**
 * Widoki gry "Na oko" oraz jej lokalne style.
 *
 * Style gry są wstrzykiwane do <head> przy starcie partii i usuwane w unmount(),
 * dzięki czemu gra jest samowystarczalna: nie wymaga zmian w css/ HUB-a.
 * Wszystkie klasy mają prefiks "gn-" (guess-number), żeby nie kolidowały z HUB-em.
 */
import { el } from '../../core/dom.js';
import { formatNumber, t } from '../../core/i18n.js';

const STYLE_ELEMENT_ID = 'guess-number-styles';

const STYLES = `
.gn-progress {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.gn-question {
  font-size: clamp(1.5rem, 5.6vw, 2rem);
  font-weight: 700;
  line-height: 1.35;
}

.gn-hint {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* Mały przycisk „Inne pytanie” — nie konkuruje z głównym przyciskiem formularza. */
.gn-redraw {
  display: flex;
  justify-content: flex-start;
}

.gn-redraw .button {
  font-size: 0.9rem;
}

.gn-guess-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.gn-guess-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
}

.gn-guess-order {
  min-width: 1.5rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.gn-guess-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gn-guess-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
}

.gn-input {
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* Pole liczby z jednostką dopisaną na końcu (np. "___ jaj"). */
.gn-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.gn-input-row .input {
  flex: 1;
  min-width: 0;
}

.gn-input-unit {
  flex: 0 0 auto;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.gn-answer {
  align-items: center;
  text-align: center;
}

.gn-answer-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.gn-answer-value {
  font-size: clamp(2.2rem, 11vw, 3.2rem);
  font-weight: 800;
  line-height: 1.1;
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.gn-ranking {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.gn-ranking-row {
  display: grid;
  grid-template-columns: 1.6rem minmax(0, 1fr) auto;
  gap: 2px var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
}

.gn-rank {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.gn-ranking-name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gn-ranking-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
}

.gn-ranking-distance {
  grid-column: 2 / -1;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.gn-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background-color: rgba(4, 6, 14, 0.78);
  backdrop-filter: blur(4px);
}

.gn-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: min(420px, 100%);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}
`;

/** Dodaje style gry do <head> (bez duplikatów). */
export function ensureStyles() {
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }
  document.head.append(el('style', { id: STYLE_ELEMENT_ID, text: STYLES }));
}

/** Usuwa style gry z <head> (wywoływane w unmount()). */
export function removeStyles() {
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}

/** Przycisk wyjścia do HUB-a dostępny na każdym ekranie gry. */
export function createExitFooter(onRequestExit) {
  return el('button', {
    class: 'button button--secondary button--block',
    type: 'button',
    text: t('games.guess-number.exitFooter'),
    onClick: onRequestExit,
  });
}

function createQuestionBlock(question, questionNumber, totalQuestions) {
  return el('div', { class: 'stack' }, [
    el('p', {
      class: 'gn-progress',
      text: t('games.guess-number.progress', {
        current: formatNumber(questionNumber),
        total: formatNumber(totalQuestions),
      }),
    }),
    el('p', { class: 'gn-question', text: question.text }),
    el('p', { class: 'gn-hint', text: t('games.guess-number.questionHint') }),
  ]);
}

/**
 * Imię gracza zawsze z mapy id → imię (nigdy z pozycji w tablicy).
 * @param {Map<string, string>} playerNames
 * @param {string|null} playerId
 * @returns {string}
 */
function getPlayerName(playerNames, playerId) {
  return playerNames.get(playerId) ?? '—';
}

function createGuessesList({ playerNames, guesses }) {
  if (guesses.length === 0) {
    return el('p', { class: 'gn-hint', text: t('games.guess-number.noGuesses') });
  }

  return el(
    'ul',
    { class: 'gn-guess-list' },
    guesses.map((guess, index) =>
      el('li', { class: 'gn-guess-row' }, [
        el('span', { class: 'gn-guess-order', text: `${index + 1}.` }),
        el('span', { class: 'gn-guess-name', text: getPlayerName(playerNames, guess.playerId) }),
        el('span', { class: 'gn-guess-value', text: formatNumber(guess.value) }),
      ]),
    ),
  );
}

/**
 * Ekran tury: pytanie, dotychczasowe typy, pole liczby albo przycisk "Pokaż odpowiedź".
 * @param {{
 *   playerNames: Map<string, string>,
 *   question: {text: string, answer: number, unit: string},
 *   questionNumber: number,
 *   totalQuestions: number,
 *   guesses: Array<{playerId: string, value: number}>,
 *   currentPlayerId: string | null,
 *   allGuessed: boolean,
 *   onSubmit: (value: number) => void,
 *   onReveal: () => void,
 *   onRedrawQuestion: () => void,
 *   canRedrawQuestion: boolean,
 * }} options
 * @returns {HTMLElement}
 */
export function renderTurnScreen({
  playerNames,
  question,
  questionNumber,
  totalQuestions,
  guesses,
  currentPlayerId,
  allGuessed,
  onSubmit,
  onReveal,
  onRedrawQuestion,
  canRedrawQuestion,
}) {
  const screen = el('div', { class: 'stack' }, [
    createQuestionBlock(question, questionNumber, totalQuestions),
    // Zmiana pytania jest możliwa tylko przed pierwszym typem w tej rundzie.
    guesses.length === 0
      ? el('div', { class: 'gn-redraw' }, [
          el('button', {
            class: 'button button--secondary button--compact',
            type: 'button',
            text: canRedrawQuestion
              ? t('games.guess-number.redraw')
              : t('games.guess-number.noOther'),
            disabled: !canRedrawQuestion,
            onClick: onRedrawQuestion,
          }),
        ])
      : null,
  ]);

  screen.append(
    el('div', { class: 'panel' }, [
      el('h2', {
        class: 'panel__title',
        text: allGuessed
          ? t('games.guess-number.allGuessedTitle')
          : t('games.guess-number.turnTitle', {
              name: getPlayerName(playerNames, currentPlayerId),
            }),
      }),
      el('p', {
        class: 'gn-hint',
        text: allGuessed
          ? t('games.guess-number.allGuessedHint')
          : t('games.guess-number.turnHint'),
      }),
      createGuessesList({ playerNames, guesses }),
    ]),
  );

  if (allGuessed) {
    screen.append(
      el('button', {
        class: 'button button--primary button--block',
        type: 'button',
        text: t('games.guess-number.reveal'),
        onClick: onReveal,
      }),
    );
    return screen;
  }

  const inputId = 'guess-number-input';
  const errorId = 'guess-number-error';
  const unitId = 'guess-number-unit';

  const input = el('input', {
    class: 'input gn-input',
    id: inputId,
    type: 'text',
    inputMode: 'numeric',
    autocomplete: 'off',
    maxLength: 9,
    'aria-describedby': question.unit ? `${errorId} ${unitId}` : errorId,
  });
  const errorBox = el('p', { class: 'form-error', id: errorId, role: 'alert', hidden: true });

  // Jednostka dopisana na końcu pola liczby — tylko wtedy, gdy pytanie jej wymaga.
  const inputRow = el('div', { class: 'gn-input-row' }, [
    input,
    question.unit ? el('span', { class: 'gn-input-unit', id: unitId, text: question.unit }) : null,
  ]);

  // Po zatwierdzeniu przycisk zostaje zablokowany — drugie kliknięcie w tej samej
  // turze nie zapisze wpisu. Nowa tura rysuje nowy, aktywny przycisk.
  const submitButton = el('button', {
    class: 'button button--primary button--block',
    type: 'submit',
    text: t('games.guess-number.submit'),
  });

  screen.append(
    el(
      'form',
      {
        class: 'stack',
        novalidate: true,
        onSubmit: (event) => {
          event.preventDefault();
          const rawValue = input.value.trim();

          if (rawValue === '') {
            showError(errorBox, t('games.guess-number.errors.empty'));
            input.focus();
            return;
          }
          if (!/^[+-]?\d+$/.test(rawValue)) {
            showError(errorBox, t('games.guess-number.errors.integer'));
            input.focus();
            return;
          }

          const value = Number(rawValue);
          if (!Number.isSafeInteger(value)) {
            showError(errorBox, t('games.guess-number.errors.integer'));
            input.focus();
            return;
          }

          errorBox.hidden = true;
          submitButton.disabled = true;
          onSubmit(value);
        },
      },
      [
        el('div', { class: 'field' }, [
          el('label', {
            class: 'field__label',
            for: inputId,
            text: t('games.guess-number.inputLabel'),
          }),
          inputRow,
        ]),
        errorBox,
        submitButton,
      ],
    ),
  );

  return screen;
}

/**
 * Ekran odpowiedzi: prawidłowa odpowiedź z jednostką + ranking od najbliższego.
 * @param {{
 *   playerNames: Map<string, string>,
 *   question: {text: string, answer: number, unit: string},
 *   questionNumber: number,
 *   totalQuestions: number,
 *   ranking: Array<{playerId: string, value: number, distance: number}>,
 *   onNext: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderAnswerScreen({
  playerNames,
  question,
  questionNumber,
  totalQuestions,
  ranking,
  onNext,
}) {
  const answerText = question.unit
    ? `${formatNumber(question.answer)} ${question.unit}`
    : formatNumber(question.answer);

  return el('div', { class: 'stack' }, [
    el('p', {
      class: 'gn-progress',
      text: t('games.guess-number.progress', {
        current: formatNumber(questionNumber),
        total: formatNumber(totalQuestions),
      }),
    }),

    el('div', { class: 'panel gn-answer' }, [
      el('p', { class: 'gn-answer-label', text: t('games.guess-number.answerLabel') }),
      el('p', { class: 'gn-answer-value', text: answerText }),
      el('p', { class: 'gn-hint', text: question.text }),
    ]),

    el('div', { class: 'panel' }, [
      el('h2', { class: 'panel__title', text: t('games.guess-number.rankingTitle') }),
      el(
        'ol',
        { class: 'gn-ranking' },
        ranking.map((entry, index) =>
          el('li', { class: 'gn-ranking-row' }, [
            el('span', { class: 'gn-rank', text: `${index + 1}.` }),
            el('span', {
              class: 'gn-ranking-name',
              text: getPlayerName(playerNames, entry.playerId),
            }),
            el('span', { class: 'gn-ranking-value', text: formatNumber(entry.value) }),
            el('span', {
              class: 'gn-ranking-distance',
              text:
                entry.distance === 0
                  ? t('games.guess-number.exact')
                  : t('games.guess-number.distance', {
                      distance: formatNumber(entry.distance),
                    }),
            }),
          ]),
        ),
      ),
      el('p', {
        class: 'gn-hint',
        text: t('games.guess-number.nextOrderHint'),
      }),
    ]),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: t('games.guess-number.nextQuestion'),
      onClick: onNext,
    }),
  ]);
}

/**
 * Ekran końca partii — pytania się skończyły.
 * @param {{totalQuestions: number, onExit: () => void}} options
 * @returns {HTMLElement}
 */
export function renderFinishedScreen({ totalQuestions, onExit }) {
  return el('div', { class: 'stack' }, [
    el('div', { class: 'panel gn-answer' }, [
      el('p', { class: 'gn-answer-label', text: t('games.guess-number.finishLabel') }),
      el('p', {
        class: 'gn-question',
        text: t('games.guess-number.finishTitle'),
      }),
      el('p', {
        class: 'gn-hint',
        text: t('games.guess-number.finishHint', {
          count: formatNumber(totalQuestions),
        }),
      }),
    ]),
    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: t('games.guess-number.backToHub'),
      onClick: onExit,
    }),
  ]);
}

/**
 * Potwierdzenie wyjścia z gry (nakładka na bieżący ekran).
 * @param {{onConfirm: () => void, onCancel: () => void}} options
 * @returns {HTMLElement}
 */
export function renderExitDialog({ onConfirm, onCancel }) {
  return el('div', { class: 'gn-overlay' }, [
    el(
      'div',
      {
        class: 'gn-dialog',
        role: 'alertdialog',
        'aria-modal': 'true',
        'aria-labelledby': 'gn-dialog-title',
      },
      [
        el('h2', {
          class: 'panel__title',
          id: 'gn-dialog-title',
          text: t('games.guess-number.exitTitle'),
        }),
        el('p', {
          class: 'gn-hint',
          text: t('games.guess-number.exitMessage'),
        }),
        el('button', {
          class: 'button button--primary button--block',
          type: 'button',
          text: t('games.guess-number.exitConfirm'),
          onClick: onConfirm,
        }),
        el('button', {
          class: 'button button--secondary button--block',
          type: 'button',
          text: t('games.guess-number.exitCancel'),
          onClick: onCancel,
        }),
      ],
    ),
  ]);
}

function showError(node, message) {
  node.textContent = message;
  node.hidden = false;
}

