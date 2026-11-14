/**
 * Widoki gry "Obstawianie" oraz jej lokalne style.
 *
 * Style gry są wstrzykiwane do <head> przy starcie partii i usuwane w unmount(),
 * dzięki czemu gra jest samowystarczalna: nie wymaga zmian w css/ HUB-a.
 * Wszystkie klasy mają prefiks "gn-" (guess-number), żeby nie kolidowały z HUB-em.
 */
import { el } from '../../core/dom.js';

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
    text: 'Zakończ grę i wróć do HUB-a',
    onClick: onRequestExit,
  });
}

function createQuestionBlock(question, questionNumber, totalQuestions) {
  return el('div', { class: 'stack' }, [
    el('p', { class: 'gn-progress', text: `Pytanie ${questionNumber} z ${totalQuestions}` }),
    el('p', { class: 'gn-question', text: question.text }),
    el('p', { class: 'gn-hint', text: 'Przeczytaj pytanie na głos — reszta obstawia liczbę.' }),
  ]);
}

function createGuessesList({ players, guesses }) {
  if (guesses.length === 0) {
    return el('p', { class: 'gn-hint', text: 'Jeszcze nikt nie obstawił.' });
  }

  return el(
    'ul',
    { class: 'gn-guess-list' },
    guesses.map((guess, index) =>
      el('li', { class: 'gn-guess-row' }, [
        el('span', { class: 'gn-guess-order', text: `${index + 1}.` }),
        el('span', { class: 'gn-guess-name', text: players[guess.playerIndex] }),
        el('span', { class: 'gn-guess-value', text: String(guess.value) }),
      ]),
    ),
  );
}

/**
 * Ekran tury: pytanie, dotychczasowe typy, pole liczby albo przycisk "Pokaż odpowiedź".
 * @param {{
 *   players: string[],
 *   question: {text: string, answer: number, unit: string},
 *   questionNumber: number,
 *   totalQuestions: number,
 *   guesses: Array<{playerIndex: number, value: number}>,
 *   currentPlayerIndex: number,
 *   allGuessed: boolean,
 *   onSubmit: (value: number) => void,
 *   onReveal: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderTurnScreen({
  players,
  question,
  questionNumber,
  totalQuestions,
  guesses,
  currentPlayerIndex,
  allGuessed,
  onSubmit,
  onReveal,
}) {
  const screen = el('div', { class: 'stack' }, [
    createQuestionBlock(question, questionNumber, totalQuestions),
  ]);

  screen.append(
    el('div', { class: 'panel' }, [
      el('h2', {
        class: 'panel__title',
        text: allGuessed ? 'Wszyscy obstawili' : `Tura: ${players[currentPlayerIndex]}`,
      }),
      el('p', {
        class: 'gn-hint',
        text: allGuessed
          ? 'Sprawdźcie typy, a potem pokażcie prawidłową odpowiedź.'
          : 'Podaj telefon osobie, której jest tura — typy poprzednich graczy są widoczne poniżej.',
      }),
      createGuessesList({ players, guesses }),
    ]),
  );

  if (allGuessed) {
    screen.append(
      el('button', {
        class: 'button button--primary button--block',
        type: 'button',
        text: 'Pokaż odpowiedź',
        onClick: onReveal,
      }),
    );
    return screen;
  }

  const inputId = 'guess-number-input';
  const errorId = 'guess-number-error';

  const input = el('input', {
    class: 'input gn-input',
    id: inputId,
    type: 'text',
    inputMode: 'numeric',
    autocomplete: 'off',
    maxLength: 9,
    placeholder: 'np. 300',
    'aria-describedby': errorId,
  });
  const errorBox = el('p', { class: 'form-error', id: errorId, role: 'alert', hidden: true });

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
            showError(errorBox, 'Podaj liczbę.');
            input.focus();
            return;
          }
          if (!/^[+-]?\d+$/.test(rawValue)) {
            showError(errorBox, 'Podaj liczbę całkowitą, np. 300.');
            input.focus();
            return;
          }

          const value = Number(rawValue);
          if (!Number.isSafeInteger(value)) {
            showError(errorBox, 'Podaj liczbę całkowitą.');
            input.focus();
            return;
          }

          errorBox.hidden = true;
          onSubmit(value);
        },
      },
      [
        el('div', { class: 'field' }, [
          el('label', {
            class: 'field__label',
            for: inputId,
            text: question.unit ? `Twoja liczba (${question.unit})` : 'Twoja liczba',
          }),
          input,
        ]),
        errorBox,
        el('button', {
          class: 'button button--primary button--block',
          type: 'submit',
          text: 'Zatwierdź',
        }),
      ],
    ),
  );

  return screen;
}

/**
 * Ekran odpowiedzi: prawidłowa odpowiedź z jednostką + ranking od najbliższego.
 * @param {{
 *   players: string[],
 *   question: {text: string, answer: number, unit: string},
 *   questionNumber: number,
 *   totalQuestions: number,
 *   ranking: Array<{playerIndex: number, value: number, distance: number}>,
 *   onNext: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderAnswerScreen({
  players,
  question,
  questionNumber,
  totalQuestions,
  ranking,
  onNext,
}) {
  const answerText = question.unit
    ? `${question.answer} ${question.unit}`
    : String(question.answer);

  return el('div', { class: 'stack' }, [
    el('p', { class: 'gn-progress', text: `Pytanie ${questionNumber} z ${totalQuestions}` }),

    el('div', { class: 'panel gn-answer' }, [
      el('p', { class: 'gn-answer-label', text: 'Prawidłowa odpowiedź' }),
      el('p', { class: 'gn-answer-value', text: answerText }),
      el('p', { class: 'gn-hint', text: question.text }),
    ]),

    el('div', { class: 'panel' }, [
      el('h2', { class: 'panel__title', text: 'Ranking — od najbliższego' }),
      el(
        'ol',
        { class: 'gn-ranking' },
        ranking.map((entry, index) =>
          el('li', { class: 'gn-ranking-row' }, [
            el('span', { class: 'gn-rank', text: `${index + 1}.` }),
            el('span', { class: 'gn-ranking-name', text: players[entry.playerIndex] }),
            el('span', { class: 'gn-ranking-value', text: String(entry.value) }),
            el('span', {
              class: 'gn-ranking-distance',
              text: entry.distance === 0 ? 'trafione co do jednego!' : `różnica ${entry.distance}`,
            }),
          ]),
        ),
      ),
      el('p', {
        class: 'gn-hint',
        text: 'W następnym pytaniu gracze obstawiają w kolejności tego rankingu.',
      }),
    ]),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: 'Następne pytanie',
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
      el('p', { class: 'gn-answer-label', text: 'Koniec' }),
      el('p', { class: 'gn-question', text: 'Wykorzystaliśmy wszystkie pytania z tej partii.' }),
      el('p', {
        class: 'gn-hint',
        text: `Pytań w partii: ${totalQuestions}. Punkty nie są liczone, a wyniki nie są zapisywane.`,
      }),
    ]),
    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: 'Wróć do HUB-a',
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
        el('h2', { class: 'panel__title', id: 'gn-dialog-title', text: 'Zakończyć grę?' }),
        el('p', {
          class: 'gn-hint',
          text: 'Wrócisz do HUB-a, a bieżąca rozgrywka przepadnie — wyniki nie są zapisywane.',
        }),
        el('button', {
          class: 'button button--primary button--block',
          type: 'button',
          text: 'Tak, zakończ grę',
          onClick: onConfirm,
        }),
        el('button', {
          class: 'button button--secondary button--block',
          type: 'button',
          text: 'Zostań w grze',
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

