/**
 * Widoki gry "W pół słowa" oraz jej lokalne style.
 *
 * Style gry są wstrzykiwane do <head> przy starcie partii i usuwane w unmount(),
 * dzięki czemu gra jest samowystarczalna i nie wymaga zmian w css/ HUB-a.
 * Klasy mają prefiks "rv-", a kolory drużyn pochodzą ze wspólnych klas
 * .team--first / .team--second (components/team-setup.js + components.css).
 */
import { el } from '../../core/dom.js';
import { TEAMS } from '../../components/team-setup.js';

const STYLE_ELEMENT_ID = 'revolver-styles';

const STYLES = `
.rv-progress {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.rv-word-card {
  align-items: center;
  gap: var(--space-2);
  text-align: center;
}

.rv-word-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.rv-word {
  font-size: clamp(2rem, 11vw, 3.2rem);
  font-weight: 800;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.rv-final {
  font-size: clamp(1.8rem, 9vw, 2.6rem);
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
  color: var(--team-color, var(--color-text));
}

.rv-team-line {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  color: var(--team-color, var(--color-text));
}

.rv-team-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.rv-starter {
  align-items: center;
  text-align: center;
}

.rv-hint {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* Rząd zmiany hasła — mały przycisk z dala od dużych przycisków wyniku. */
.rv-redraw {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
}

.rv-redraw__count {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.rv-redraw .button {
  font-size: 0.9rem;
}

.rv-score {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.rv-score__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--team-color, var(--color-border));
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.rv-score__team {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--team-color, var(--color-text));
}

.rv-score__value {
  font-size: 1.6rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.rv-team-button {
  border-color: var(--team-color, var(--color-border));
  background-color: var(--color-surface);
}

.rv-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background-color: rgba(4, 6, 14, 0.78);
  backdrop-filter: blur(4px);
}

.rv-dialog {
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

/** Przycisk wyjścia do HUB-a dostępny w trakcie gry. */
export function createExitFooter(onRequestExit) {
  return el('button', {
    class: 'button button--secondary button--block',
    type: 'button',
    text: 'Zakończ grę i wróć do HUB-a',
    onClick: onRequestExit,
  });
}

/** Wiersz z ikoną drużyny i tekstem (kolor pochodzi z klasy drużyny). */
function createTeamLine(team, text) {
  return el('div', { class: `rv-team-line ${team.className}` }, [
    el('span', { class: 'rv-team-icon', 'aria-hidden': 'true', text: team.icon }),
    el('span', { text }),
  ]);
}

/** Tablica wyników: jedna kolumna na drużynę. */
function createScoreBoard(scores) {
  return el(
    'div',
    { class: 'rv-score' },
    TEAMS.map((team) =>
      el('div', { class: `rv-score__item ${team.className}` }, [
        el('span', { class: 'rv-score__team', text: `${team.icon} ${team.name}` }),
        el('span', { class: 'rv-score__value', text: String(scores[team.id]) }),
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
 * Ekran przejściowy rundy: kto tłumaczy + przycisk "Pokaż hasło".
 * @param {{
 *   roundNumber: number,
 *   totalRounds: number,
 *   explainers: {first: string, second: string},
 *   onReveal: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderRoundIntroScreen({ roundNumber, totalRounds, explainers, onReveal }) {
  return el('div', { class: 'stack' }, [
    el('p', { class: 'rv-progress', text: `Runda ${roundNumber} z ${totalRounds}` }),

    el('div', { class: 'panel' }, [
      el('h2', { class: 'panel__title', text: 'Podaj telefon dalej' }),
      el('p', { class: 'rv-hint', text: 'Tłumaczą:' }),
      createTeamLine(TEAMS[0], `${TEAMS[0].name}: ${explainers.first}`),
      createTeamLine(TEAMS[1], `${TEAMS[1].name}: ${explainers.second}`),
      el('p', { class: 'rv-hint', text: 'Reszta niech odwróci wzrok.' }),
    ]),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: 'Pokaż hasło',
      onClick: onReveal,
    }),
  ]);
}

/**
 * Ekran hasła: duże słowo, informacja o drużynie zaczynającej i przyciski wyniku.
 * @param {{
 *   roundNumber: number,
 *   totalRounds: number,
 *   word: string,
 *   starterTeam: {id: string, name: string, icon: string, className: string},
 *   onTeamGuessed: (teamId: string) => void,
 *   onRoundCancelled: () => void,
 *   onRedrawWord: () => void,
 *   redrawsLeft: number,
 *   canRedrawWord: boolean,
 * }} options
 * @returns {HTMLElement}
 */
export function renderWordScreen({
  roundNumber,
  totalRounds,
  word,
  starterTeam,
  onTeamGuessed,
  onRoundCancelled,
  onRedrawWord,
  redrawsLeft,
  canRedrawWord,
}) {
  const redrawLimitReached = redrawsLeft <= 0;
  const redrawLabel = redrawLimitReached
    ? 'Brak zmian'
    : canRedrawWord
      ? 'Inne hasło'
      : 'Brak innych';
  const redrawDisabled = redrawLimitReached || !canRedrawWord;

  return el('div', { class: 'stack' }, [
    el('p', { class: 'rv-progress', text: `Runda ${roundNumber} z ${totalRounds}` }),

    el('div', { class: 'panel rv-word-card' }, [
      el('p', { class: 'rv-word-label', text: 'Hasło' }),
      el('p', { class: 'rv-word', text: word }),
    ]),

    el('div', { class: 'rv-redraw' }, [
      el('button', {
        class: 'button button--secondary button--compact',
        type: 'button',
        text: redrawLabel,
        disabled: redrawDisabled,
        onClick: onRedrawWord,
      }),
      el('span', { class: 'rv-redraw__count', text: `Zostało zmian: ${redrawsLeft}` }),
    ]),

    el('div', { class: 'panel rv-starter' }, [
      createTeamLine(starterTeam, `Pierwsze słowo mówi ${starterTeam.name}`),
      el('p', {
        class: 'rv-hint',
        text: 'Mówicie na zmianę po jednym słowie, aż któraś drużyna odgadnie.',
      }),
    ]),

    el('button', {
      class: `button button--block rv-team-button ${TEAMS[0].className}`,
      type: 'button',
      text: `Odgadła ${TEAMS[0].name}`,
      onClick: () => onTeamGuessed(TEAMS[0].id),
    }),
    el('button', {
      class: `button button--block rv-team-button ${TEAMS[1].className}`,
      type: 'button',
      text: `Odgadła ${TEAMS[1].name}`,
      onClick: () => onTeamGuessed(TEAMS[1].id),
    }),
    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: 'Unieważnij (0 pkt)',
      onClick: onRoundCancelled,
    }),
  ]);
}

/**
 * Ekran po rundzie: zwycięzca rundy (albo unieważnienie) i aktualny wynik.
 * @param {{
 *   roundNumber: number,
 *   totalRounds: number,
 *   winnerTeam: {id: string, name: string, icon: string, className: string} | null,
 *   scores: {first: number, second: number},
 *   isLastRound: boolean,
 *   onNext: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderRoundResultScreen({
  roundNumber,
  totalRounds,
  winnerTeam,
  scores,
  isLastRound,
  onNext,
}) {
  return el('div', { class: 'stack' }, [
    el('p', { class: 'rv-progress', text: `Runda ${roundNumber} z ${totalRounds}` }),

    el('div', { class: 'panel rv-starter' }, [
      el('p', { class: 'rv-word-label', text: 'Wynik rundy' }),
      winnerTeam
        ? createTeamLine(winnerTeam, `Rundę wygrała ${winnerTeam.name}`)
        : el('p', { class: 'panel__title', text: 'Runda unieważniona' }),
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
 * Ekran końcowy: wynik, zwycięzca (albo remis), składy drużyn, wybór dalszego kroku.
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
    el('div', { class: 'panel rv-starter' }, [
      el('p', { class: 'rv-word-label', text: 'Koniec gry' }),
      winnerTeam
        ? el('p', {
            class: `rv-final ${winnerTeam.className}`,
            text: `${winnerTeam.icon} Wygrywa ${winnerTeam.name}`,
          })
        : el('p', { class: 'rv-final', text: 'Remis' }),
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
 * Potwierdzenie wyjścia z gry (nakładka na bieżący ekran).
 * @param {{onConfirm: () => void, onCancel: () => void}} options
 * @returns {HTMLElement}
 */
export function renderExitDialog({ onConfirm, onCancel }) {
  return el('div', { class: 'rv-overlay' }, [
    el(
      'div',
      {
        class: 'rv-dialog',
        role: 'alertdialog',
        'aria-modal': 'true',
        'aria-labelledby': 'rv-dialog-title',
      },
      [
        el('h2', { class: 'panel__title', id: 'rv-dialog-title', text: 'Zakończyć grę?' }),
        el('p', {
          class: 'rv-hint',
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

