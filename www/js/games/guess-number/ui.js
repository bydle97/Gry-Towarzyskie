/**
 * Widoki gry "Na oko" oraz jej lokalne style.
 *
 * Style gry są wstrzykiwane do <head> przy starcie partii i usuwane w unmount(),
 * dzięki czemu gra jest samowystarczalna: nie wymaga zmian w css/ HUB-a.
 * Wszystkie klasy mają prefiks "gn-" (guess-number), żeby nie kolidowały z HUB-em.
 */
import { el } from '../../core/dom.js';
import { formatNumber, t } from '../../core/i18n.js';
import { EXACT_HIT_BONUS } from './engine.js';

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

/* Pasek drobnych akcji nad panelem: „Inne pytanie” i „Wyniki”. */
.gn-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2);
}

.gn-toolbar .button {
  font-size: 0.9rem;
}

/* Przycisk „Wyniki” trzyma się prawej krawędzi także bez „Innego pytania”. */
.gn-toolbar .gn-standings-button {
  margin-left: auto;
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

/* Punkty rundy i suma partii — zawsze tekstem, także przy trafieniu dokładnym. */
.gn-ranking-score {
  grid-column: 2 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  font-size: 0.9rem;
}

.gn-round-points {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
}

.gn-total-points {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

/* Trafienie dokładne: ikona + słowo + bonus, nie tylko kolor. */
.gn-exact {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-accent-strong);
}

/* Tabela wyników: nakładka w trakcie partii i lista końcowa. */
.gn-standings {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.gn-standing-row {
  display: grid;
  grid-template-columns: 1.6rem minmax(0, 1fr) auto;
  align-items: baseline;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
}

.gn-standing-name {
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gn-standing-total {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
}

/* Ogłoszenie zwycięzcy lub remisu na końcu partii. */
.gn-winner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: clamp(1.25rem, 4.6vw, 1.6rem);
  font-weight: 800;
  line-height: 1.3;
}

.gn-winner-icon {
  font-size: 1.2em;
}

.gn-overlay,
.gn-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background-color: rgba(2, 10, 8, 0.78);
  backdrop-filter: blur(4px);
}

.gn-dialog,
.gn-sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: min(420px, 100%);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

/* Tabela wyników: własna szerokość i przewijanie na niskich ekranach. */
.gn-sheet {
  width: min(440px, 100%);
  max-height: calc(100dvh - 2 * var(--space-4));
  overflow-y: auto;
  background-color: var(--color-bg-soft);
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
 *   onShowStandings: () => void,
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
  onShowStandings,
}) {
  const screen = el('div', { class: 'stack' }, [
    createQuestionBlock(question, questionNumber, totalQuestions),
    el('div', { class: 'gn-toolbar' }, [
      // Zmiana pytania jest możliwa tylko przed pierwszym typem w tej rundzie.
      guesses.length === 0
        ? el('button', {
            class: 'button button--secondary button--compact',
            type: 'button',
            text: canRedrawQuestion
              ? t('games.guess-number.redraw')
              : t('games.guess-number.noOther'),
            disabled: !canRedrawQuestion,
            onClick: onRedrawQuestion,
          })
        : null,
      // Tabela wyników otwiera nakładkę i nie zmienia bieżącej tury.
      el('button', {
        class: 'button button--secondary button--compact gn-standings-button',
        type: 'button',
        text: t('games.guess-number.standingsButton'),
        onClick: onShowStandings,
      }),
    ]),
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
    // Miejsce na liczby ze spacjami, np. „5 000 000” (spacje są usuwane przed walidacją).
    maxLength: 12,
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
          // Spacje i twarde spacje (separatory tysięcy z klawiatury) są pomijane.
          const rawValue = input.value.replace(/[\s   ]/g, '');

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
 * Przy każdej osobie pokazujemy miejsce, punkty rundy i sumę partii.
 * @param {{
 *   playerNames: Map<string, string>,
 *   question: {text: string, answer: number, unit: string},
 *   questionNumber: number,
 *   totalQuestions: number,
 *   ranking: Array<{playerId: string, value: number, distance: number}>,
 *   roundScores: Map<string, {points: number, place: number, exact: boolean}>,
 *   totals: Map<string, number>,
 *   isLastQuestion: boolean,
 *   onNext: () => void,
 * }} options
 *   isLastQuestion — po ostatnim pytaniu przycisk prowadzi do tabeli końcowej
 * @returns {HTMLElement}
 */
export function renderAnswerScreen({
  playerNames,
  question,
  questionNumber,
  totalQuestions,
  ranking,
  roundScores,
  totals,
  isLastQuestion,
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
        ranking.map((entry, index) => {
          const score = roundScores.get(entry.playerId);
          const place = score?.place ?? index + 1;
          const exact = entry.distance === 0;

          return el('li', { class: 'gn-ranking-row' }, [
            el('span', { class: 'gn-rank', text: `${formatNumber(place)}.` }),
            el('span', {
              class: 'gn-ranking-name',
              text: getPlayerName(playerNames, entry.playerId),
            }),
            el('span', { class: 'gn-ranking-value', text: formatNumber(entry.value) }),
            el('span', { class: 'gn-ranking-distance' }, [
              exact
                ? el('span', {
                    class: 'gn-exact',
                    text: t('games.guess-number.exactBadge', {
                      bonus: formatNumber(EXACT_HIT_BONUS),
                    }),
                  })
                : el('span', {
                    text: t('games.guess-number.distance', {
                      distance: formatNumber(entry.distance),
                    }),
                  }),
            ]),
            el('span', { class: 'gn-ranking-score' }, [
              el('span', {
                class: 'gn-round-points',
                text: t('games.guess-number.roundPoints', {
                  points: formatNumber(score?.points ?? 0),
                }),
              }),
              el('span', {
                class: 'gn-total-points',
                text: t('games.guess-number.totalPoints', {
                  total: formatNumber(totals.get(entry.playerId) ?? 0),
                }),
              }),
            ]),
          ]);
        }),
      ),
      el('p', {
        class: 'gn-hint',
        text: t('games.guess-number.nextOrderHint'),
      }),
    ]),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: isLastQuestion
        ? t('games.guess-number.showResult')
        : t('games.guess-number.nextQuestion'),
      onClick: onNext,
    }),
  ]);
}

/**
 * Lista tabeli wyników: miejsce, imię (z mapy id → imię) i suma punktów.
 * @param {{
 *   playerNames: Map<string, string>,
 *   standings: Array<{playerId: string, total: number, place: number}>,
 * }} options
 * @returns {HTMLElement}
 */
function createStandingsList({ playerNames, standings }) {
  return el(
    'ol',
    { class: 'gn-standings' },
    standings.map((entry) =>
      el('li', { class: 'gn-standing-row' }, [
        el('span', { class: 'gn-rank', text: `${formatNumber(entry.place)}.` }),
        el('span', {
          class: 'gn-standing-name',
          text: getPlayerName(playerNames, entry.playerId),
        }),
        el('span', {
          class: 'gn-standing-total',
          text: t('games.guess-number.totalPoints', { total: formatNumber(entry.total) }),
        }),
      ]),
    ),
  );
}

/**
 * Imiona w jednym zdaniu: „Ala i Bartek” (spójnik pochodzi z tłumaczeń).
 * @param {string[]} names
 * @returns {string}
 */
function formatNamesList(names) {
  if (names.length <= 1) {
    return names.join('');
  }

  const head = names.slice(0, -1).join(', ');
  return `${head}${t('games.guess-number.namesAnd')}${names[names.length - 1]}`;
}

/**
 * Ekran końca partii — tabela końcowa i ogłoszenie zwycięzcy lub zwycięzców.
 * @param {{
 *   playerNames: Map<string, string>,
 *   totalQuestions: number,
 *   standings: Array<{playerId: string, total: number, place: number}>,
 *   winners: string[],
 *   onExit: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderFinishedScreen({ playerNames, totalQuestions, standings, winners, onExit }) {
  const winnerNames = winners.map((playerId) => getPlayerName(playerNames, playerId));
  const announcement =
    winnerNames.length > 1
      ? t('games.guess-number.winnersTie', { names: formatNamesList(winnerNames) })
      : t('games.guess-number.winner', { name: winnerNames[0] ?? '—' });

  return el('div', { class: 'stack' }, [
    el('div', { class: 'panel gn-answer' }, [
      el('p', { class: 'gn-answer-label', text: t('games.guess-number.finishLabel') }),
      el('p', { class: 'gn-winner' }, [
        el('span', { class: 'gn-winner-icon', 'aria-hidden': 'true', text: '🏆' }),
        el('span', { text: announcement }),
      ]),
      el('p', {
        class: 'gn-hint',
        text: t('games.guess-number.finishHint', {
          count: formatNumber(totalQuestions),
        }),
      }),
    ]),
    el('div', { class: 'panel' }, [
      el('h2', { class: 'panel__title', text: t('games.guess-number.finishStandingsTitle') }),
      createStandingsList({ playerNames, standings }),
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

/**
 * Nakładka z aktualną tabelą wyników (otwierana przyciskiem „Wyniki”).
 * Tylko czyta przekazane dane — nie zmienia stanu tury.
 * @param {{
 *   playerNames: Map<string, string>,
 *   standings: Array<{playerId: string, total: number, place: number}>,
 *   onClose: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderStandingsDialog({ playerNames, standings, onClose }) {
  const overlay = el('div', { class: 'gn-sheet-overlay' }, [
    el(
      'div',
      {
        class: 'gn-sheet',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'gn-standings-title',
      },
      [
        el('h2', {
          class: 'panel__title',
          id: 'gn-standings-title',
          text: t('games.guess-number.standingsTitle'),
        }),
        el('p', { class: 'gn-hint', text: t('games.guess-number.standingsHint') }),
        createStandingsList({ playerNames, standings }),
        el('button', {
          class: 'button button--secondary button--block',
          type: 'button',
          text: t('games.guess-number.standingsClose'),
          onClick: onClose,
        }),
      ],
    ),
  ]);

  // Klik w tło (poza panelem) również zamyka nakładkę.
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      onClose();
    }
  });

  return overlay;
}

function showError(node, message) {
  node.textContent = message;
  node.hidden = false;
}

