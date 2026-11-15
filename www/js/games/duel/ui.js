/**
 * Widoki gry "Ping-pong" oraz jej lokalne style.
 *
 * Style gry są wstrzykiwane do <head> przy starcie partii i usuwane w unmount(),
 * dzięki czemu gra jest samowystarczalna i nie wymaga zmian w css/ HUB-a.
 * Klasy mają prefiks "dl-", a kolory drużyn pochodzą ze wspólnych klas
 * .team--first / .team--second (components/team-setup.js + components.css).
 */
import { el } from '../../core/dom.js';
import { TEAMS } from '../../components/team-setup.js';

const STYLE_ELEMENT_ID = 'duel-styles';

const STYLES = `
.dl-progress {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.dl-category-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  color: var(--color-text-muted);
}

.dl-category {
  font-size: clamp(1.6rem, 7vw, 2.2rem);
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
}

.dl-hint {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* Mały przycisk „Inna kategoria” — nad dużym przyciskiem „Gotowi”. */
.dl-redraw {
  display: flex;
  justify-content: center;
}

.dl-redraw .button {
  font-size: 0.9rem;
}

.dl-duelists {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dl-team-line {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  color: var(--team-color, var(--color-text));
}

.dl-team-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.dl-winner {
  font-size: clamp(1.3rem, 5.5vw, 1.8rem);
  font-weight: 800;
  line-height: 1.25;
  text-align: center;
  overflow-wrap: anywhere;
  color: var(--team-color, var(--color-text));
}

.dl-final {
  font-size: clamp(1.8rem, 9vw, 2.6rem);
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
  color: var(--team-color, var(--color-text));
}

.dl-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.dl-list__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 0.95rem;
}

.dl-list__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dl-score {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.dl-score__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--team-color, var(--color-border));
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.dl-score__team {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--team-color, var(--color-text));
}

.dl-score__value {
  font-size: 1.6rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* --- Zegar pojedynku (pełny ekran) ---------------------------------------- */

.dl-clock {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  background-color: var(--color-bg);
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  overscroll-behavior: contain;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.dl-half {
  display: grid;
  place-items: center;
  width: 100%;
  margin: 0;
  padding: var(--space-3);
  border: 0;
  border-radius: 0;
  background-color: var(--color-bg-soft);
  color: var(--color-text);
  font: inherit;
  text-align: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 120ms ease, opacity 120ms ease;
}

/* Górna połowa jest obrócona, żeby osoba naprzeciwko widziała ją poprawnie. */
.dl-half--top {
  transform: rotate(180deg);
}

.dl-half--active {
  background-color: var(--team-tint, var(--color-surface));
  opacity: 1;
}

.dl-half--idle {
  opacity: 0.55;
}

.dl-half:disabled {
  cursor: default;
}

.dl-half__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  max-width: 460px;
}

.dl-half__team {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--team-color, var(--color-text));
}

.dl-half__icon {
  font-size: 1rem;
  line-height: 1;
}

.dl-half__name {
  font-size: 1.05rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.dl-half__time {
  font-size: clamp(3rem, 17vw, 4.6rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.dl-half__time--low {
  color: var(--color-danger);
}

.dl-half__category {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.dl-half__count {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.dl-half__progress {
  display: block;
  width: min(72%, 280px);
  height: 6px;
  margin-top: 2px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.16);
  overflow: hidden;
}

.dl-half__bar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background-color: var(--team-color, var(--color-accent));
  transition: width 100ms linear;
}

.dl-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-block: 1px solid var(--color-border);
  background-color: var(--color-bg);
}

.dl-controls__starter {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.dl-control {
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  touch-action: manipulation;
}

.dl-control--start {
  padding: 0 var(--space-5);
  border-color: transparent;
  background-color: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 0.95rem;
}

.dl-control--abort {
  border-color: rgba(255, 122, 122, 0.5);
  color: var(--color-danger);
}

.dl-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background-color: rgba(4, 6, 14, 0.8);
  backdrop-filter: blur(4px);
}

.dl-dialog {
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

/** Przycisk wyjścia do HUB-a (ekrany przed pojedynkiem i po nim). */
export function createExitFooter(onRequestExit) {
  return el('button', {
    class: 'button button--secondary button--block',
    type: 'button',
    text: 'Zakończ grę i wróć do HUB-a',
    onClick: onRequestExit,
  });
}

/**
 * Format czasu w sekundach z jedną cyfrą po przecinku (przecinek polski), np. "8,4".
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatSeconds(milliseconds) {
  const seconds = Math.max(0, milliseconds) / 1000;
  return seconds.toFixed(1).replace('.', ',');
}

function teamById(teamId) {
  return TEAMS.find((team) => team.id === teamId) ?? TEAMS[0];
}

/** Wiersz z ikoną drużyny i tekstem (kolor drużyny przez klasę team--*). */
function createTeamLine(team, text) {
  return el('div', { class: `dl-team-line ${team.className}` }, [
    el('span', { class: 'dl-team-icon', 'aria-hidden': 'true', text: team.icon }),
    el('span', { text }),
  ]);
}

/** Tablica wyników drużyn. */
function createScoreBoard(scores) {
  return el(
    'div',
    { class: 'dl-score' },
    TEAMS.map((team) =>
      el('div', { class: `dl-score__item ${team.className}` }, [
        el('span', { class: 'dl-score__team', text: `${team.icon} ${team.name}` }),
        el('span', { class: 'dl-score__value', text: String(scores[team.id]) }),
      ]),
    ),
  );
}

/** Podsumowanie składów drużyn (ekran końcowy). */
function createTeamsSummary(teams) {
  return el(
    'div',
    { class: 'team-columns' },
    TEAMS.map((team) =>
      el('div', { class: `team-column ${team.className}` }, [
        el('div', { class: 'team-column__header' }, [
          el('span', { class: 'team-column__icon', 'aria-hidden': 'true', text: team.icon }),
          el('span', { class: 'team-column__name', text: team.name }),
          el('span', { class: 'team-column__count', text: `${teams[team.id].length}` }),
        ]),
        el(
          'ul',
          { class: 'player-list' },
          teams[team.id].map((name) => el('li', { class: 'chip', text: name })),
        ),
      ]),
    ),
  );
}

/**
 * Ekran przed pojedynkiem: kto z kim, kategoria i przycisk "Gotowi".
 * @param {{
 *   roundNumber: number,
 *   totalRounds: number,
 *   duelists: {first: string, second: string},
 *   category: string,
 *   onReady: () => void,
 *   onRedrawCategory: () => void,
 *   canRedrawCategory: boolean,
 * }} options
 * @returns {HTMLElement}
 */
export function renderIntroScreen({
  roundNumber,
  totalRounds,
  duelists,
  category,
  onReady,
  onRedrawCategory,
  canRedrawCategory,
}) {
  return el('div', { class: 'stack' }, [
    el('p', { class: 'dl-progress', text: `Runda ${roundNumber} z ${totalRounds}` }),

    el('div', { class: 'panel' }, [
      el('h2', { class: 'panel__title', text: 'Ping-pong' }),
      el('div', { class: 'dl-duelists' }, [
        createTeamLine(TEAMS[0], `${duelists.first} (${TEAMS[0].name})`),
        createTeamLine(TEAMS[1], `${duelists.second} (${TEAMS[1].name})`),
      ]),
      el('p', { class: 'dl-hint', text: 'Połóżcie telefon między sobą.' }),
    ]),

    el('div', { class: 'panel' }, [
      el('p', { class: 'dl-category-label', text: 'Kategoria' }),
      el('p', { class: 'dl-category', text: category }),
    ]),

    el('div', { class: 'dl-redraw' }, [
      el('button', {
        class: 'button button--secondary button--compact',
        type: 'button',
        text: canRedrawCategory ? 'Inna kategoria' : 'Brak innych',
        disabled: !canRedrawCategory,
        onClick: onRedrawCategory,
      }),
    ]),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: 'Gotowi',
      onClick: onReady,
    }),
  ]);
}

/**
 * Buduje pełnoekranowy zegar pojedynku. Zwraca element oraz funkcję update(model),
 * która tylko podmienia teksty i klasy — bez przerysowywania drzewa DOM
 * (dzięki temu aktualizacja co 100 ms jest tania i nie gubi dotknięć).
 *
 * @param {{
 *   duelists: {first: string, second: string},
 *   category: string,
 *   startingTeam: {id: string, name: string, icon: string, className: string},
 *   poolMs: number,
 *   lowTimeMs: number,
 *   onStart: () => void,
 *   onTap: (teamId: string) => void,
 *   onPause: () => void,
 *   onResume: () => void,
 *   onAbort: () => void,
 * }} options
 * @returns {{el: HTMLElement, update: (model: Object) => void}}
 */
export function createClockScreen({
  duelists,
  category,
  startingTeam,
  poolMs,
  lowTimeMs,
  onStart,
  onTap,
  onPause,
  onResume,
  onAbort,
}) {
  /** @type {Record<string, {button: HTMLButtonElement, timeNode: HTMLElement, countNode: HTMLElement, barNode: HTMLElement}>} */
  const halves = {};

  const startLabel = el('p', {
    class: 'dl-controls__starter',
    text: `Zaczyna: ${duelists[startingTeam.id]}`,
  });
  const startButton = el('button', {
    class: 'dl-control dl-control--start',
    type: 'button',
    text: 'Start',
    onClick: onStart,
  });
  const pauseButton = el('button', {
    class: 'dl-control',
    type: 'button',
    text: 'Pauza',
    onClick: onPause,
  });
  const resumeButton = el('button', {
    class: 'dl-control',
    type: 'button',
    text: 'Wznów',
    onClick: onResume,
  });
  const abortButton = el('button', {
    class: 'dl-control dl-control--abort',
    type: 'button',
    text: 'Przerwij pojedynek',
    onClick: onAbort,
  });

  const controls = el('div', { class: 'dl-controls' }, [
    startLabel,
    startButton,
    pauseButton,
    resumeButton,
    abortButton,
  ]);

  // Drużyna 1 gra na dole (układ normalny), Drużyna 2 na górze (obrócona o 180°).
  const topHalf = createHalf(TEAMS[1], 'top');
  const bottomHalf = createHalf(TEAMS[0], 'bottom');
  const element = el('div', { class: 'dl-clock' }, [topHalf, controls, bottomHalf]);

  return { el: element, update };

  function createHalf(team, position) {
    const timeNode = el('span', { class: 'dl-half__time', text: formatSeconds(poolMs) });
    const countNode = el('span', { class: 'dl-half__count', text: 'Wymieniono: 0' });
    const barNode = el('span', { class: 'dl-half__bar' });

    const button = el(
      'button',
      {
        type: 'button',
        class: `dl-half dl-half--${position} ${team.className}`,
        onPointerdown: () => onTap(team.id),
        onKeydown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onTap(team.id);
          }
        },
      },
      [
        el('span', { class: 'dl-half__inner' }, [
          el('span', { class: 'dl-half__team' }, [
            el('span', { class: 'dl-half__icon', 'aria-hidden': 'true', text: team.icon }),
            el('span', { text: team.name }),
          ]),
          el('span', { class: 'dl-half__name', text: duelists[team.id] }),
          timeNode,
          el('span', { class: 'dl-half__category', text: `Kategoria: ${category}` }),
          countNode,
          el('span', { class: 'dl-half__progress' }, [barNode]),
        ]),
      ],
    );

    halves[team.id] = { button, timeNode, countNode, barNode };
    return button;
  }

  /**
   * @param {{
   *   started: boolean,
   *   paused: boolean,
   *   finished: boolean,
   *   activeTeamId: string,
   *   remaining: {first: number, second: number},
   *   counts: {first: number, second: number},
   * }} model
   */
  function update(model) {
    for (const team of TEAMS) {
      const half = halves[team.id];

      if (!half) {
        continue;
      }

      const isActive =
        model.started && !model.paused && !model.finished && model.activeTeamId === team.id;
      const remaining = Math.max(0, model.remaining[team.id]);

      half.button.disabled = !isActive;
      half.button.classList.toggle('dl-half--active', isActive);
      half.button.classList.toggle('dl-half--idle', !isActive);
      half.timeNode.textContent = formatSeconds(remaining);
      half.timeNode.classList.toggle('dl-half__time--low', remaining <= lowTimeMs);
      half.countNode.textContent = `Wymieniono: ${model.counts[team.id]}`;
      half.barNode.style.width = `${Math.max(0, Math.min(1, remaining / poolMs)) * 100}%`;
    }

    const showStart = !model.started && !model.finished;
    const showPause = model.started && !model.paused && !model.finished;
    const showResume = model.started && model.paused && !model.finished;

    startLabel.hidden = !showStart;
    startButton.hidden = !showStart;
    pauseButton.hidden = !showPause;
    resumeButton.hidden = !showResume;
    abortButton.hidden = !showResume;
  }
}

/**
 * Ekran wyniku pojedynku: zwycięzca, liczba wymienionych rzeczy i czas zwycięzcy.
 * @param {{
 *   roundNumber: number,
 *   totalRounds: number,
 *   winnerTeam: {id: string, name: string, icon: string, className: string},
 *   winnerName: string,
 *   duelists: {first: string, second: string},
 *   counts: {first: number, second: number},
 *   winnerRemainingMs: number,
 *   scores: {first: number, second: number},
 *   isLastRound: boolean,
 *   onNext: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderResultScreen({
  roundNumber,
  totalRounds,
  winnerTeam,
  winnerName,
  duelists,
  counts,
  winnerRemainingMs,
  scores,
  isLastRound,
  onNext,
}) {
  return el('div', { class: 'stack' }, [
    el('p', { class: 'dl-progress', text: `Runda ${roundNumber} z ${totalRounds}` }),

    el('div', { class: 'panel' }, [
      el('p', { class: 'dl-category-label', text: 'Wynik pojedynku' }),
      el('p', { class: `dl-winner ${winnerTeam.className}`, text: `Wygrywa ${winnerName}` }),
      createTeamLine(winnerTeam, winnerTeam.name),
      el('p', { class: 'dl-hint', text: 'Wymienione rzeczy:' }),
      el('ul', { class: 'dl-list' }, [
        el('li', { class: 'dl-list__row' }, [
          el('span', { text: `${duelists.first} (${TEAMS[0].name})` }),
          el('span', { class: 'dl-list__value', text: String(counts.first) }),
        ]),
        el('li', { class: 'dl-list__row' }, [
          el('span', { text: `${duelists.second} (${TEAMS[1].name})` }),
          el('span', { class: 'dl-list__value', text: String(counts.second) }),
        ]),
      ]),
      el('p', { class: 'dl-hint', text: `Czas zwycięzcy: ${formatSeconds(winnerRemainingMs)} s` }),
    ]),

    createScoreBoard(scores),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: isLastRound ? 'Pokaż wynik' : 'Następna runda',
      onClick: onNext,
    }),
  ]);
}

/**
 * Ekran końcowy partii: wynik, zwycięzca lub remis, składy drużyn.
 * @param {{
 *   teams: {first: string[], second: string[]},
 *   scores: {first: number, second: number},
 *   winnerTeam: {id: string, name: string, icon: string, className: string} | null,
 *   onPlayAgain: () => void,
 *   onNewTeams: () => void,
 *   onExit: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderFinishedScreen({ teams, scores, winnerTeam, onPlayAgain, onNewTeams, onExit }) {
  return el('div', { class: 'stack' }, [
    el('div', { class: 'panel' }, [
      el('p', { class: 'dl-category-label', text: 'Koniec gry' }),
      winnerTeam
        ? el('p', {
            class: `dl-final ${winnerTeam.className}`,
            text: `${winnerTeam.icon} Wygrywa ${winnerTeam.name}`,
          })
        : el('p', { class: 'dl-final', text: 'Remis' }),
    ]),

    createScoreBoard(scores),
    createTeamsSummary(teams),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: 'Jeszcze raz (te same drużyny)',
      onClick: onPlayAgain,
    }),
    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: 'Nowy podział drużyn',
      onClick: onNewTeams,
    }),
    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: 'Wróć do HUB-a',
      onClick: onExit,
    }),
  ]);
}

/**
 * Potwierdzenie wyjścia / przerwania pojedynku (nakładka).
 * @param {{
 *   title: string,
 *   message: string,
 *   confirmLabel: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  return el('div', { class: 'dl-overlay' }, [
    el(
      'div',
      {
        class: 'dl-dialog',
        role: 'alertdialog',
        'aria-modal': 'true',
        'aria-labelledby': 'dl-dialog-title',
      },
      [
        el('h2', { class: 'panel__title', id: 'dl-dialog-title', text: title }),
        el('p', { class: 'dl-hint', text: message }),
        el('button', {
          class: 'button button--primary button--block',
          type: 'button',
          text: confirmLabel,
          onClick: onConfirm,
        }),
        el('button', {
          class: 'button button--secondary button--block dl-dialog__cancel',
          type: 'button',
          text: 'Nie, zostań',
          onClick: onCancel,
        }),
      ],
    ),
  ]);
}




