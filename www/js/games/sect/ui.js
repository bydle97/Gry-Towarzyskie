/**
 * Widoki gry "Sekta" oraz jej lokalne style.
 *
 * Style są wstrzykiwane do <head> przy starcie partii i usuwane w unmount(),
 * więc gra nie wymaga zmian w css/ HUB-a. Klasy mają prefiks "sec-".
 *
 * Odsłanianie po przytrzymaniu (podgląd ról) jest zaimplementowane tutaj,
 * bo w projekcie nie ma wspólnego components/hold-to-reveal.js.
 */
import { clear, el } from '../../core/dom.js';
import { formatNumber, t } from '../../core/i18n.js';
import { MIN_PLAYERS, ROLES } from './config.js';
import { GUIDE_SECTIONS } from './gm-guide.js';

const STYLE_ELEMENT_ID = 'sect-styles';

const STYLES = `
.sec-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3);
  border-radius: var(--radius-lg);
  background-image: radial-gradient(80% 100% at 50% 0%, rgba(255, 179, 71, 0.14), transparent 70%);
  text-align: center;
}

.sec-head__icon {
  font-size: 2.5rem;
  line-height: 1;
}

.sec-head__title {
  font-size: clamp(1.5rem, 6vw, 2rem);
  font-weight: 800;
  line-height: 1.15;
}

.sec-head__subtitle {
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.sec-hint {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.sec-select {
  width: 100%;
  min-height: 48px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 1rem;
}

.sec-lineup {
  font-size: 1rem;
  line-height: 1.45;
}

.sec-counter {
  flex: 0 0 auto;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background-color: var(--color-surface);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* Lista graczy na ekranie sprawdzania ról. */
.sec-player-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sec-player {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  min-height: 56px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 600;
  text-align: left;
  touch-action: manipulation;
}

.sec-player--checked {
  border-style: dashed;
  background-color: var(--color-bg-soft);
  color: var(--color-text-muted);
  cursor: default;
}

.sec-player__note {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.sec-done {
  border-color: rgba(255, 179, 71, 0.5);
}

.sec-done__text {
  font-size: 1.05rem;
  font-weight: 600;
  text-align: center;
}

.sec-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* Ekran odsłoniętej roli. */
.sec-reveal {
  align-items: center;
  gap: var(--space-3);
  text-align: center;
}

.sec-role-name {
  font-size: clamp(2rem, 10vw, 2.8rem);
  font-weight: 800;
  line-height: 1.1;
  color: var(--color-accent);
  overflow-wrap: anywhere;
}

.sec-role-text {
  font-size: 1.05rem;
  line-height: 1.5;
}

/* "Przytrzymaj, aby zobaczyć" — hold-to-reveal. */
.sec-hold {
  min-height: 56px;
  font-weight: 700;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.sec-hold--active {
  border-color: rgba(255, 179, 71, 0.6);
  background-color: var(--color-surface-strong);
  color: var(--color-accent);
}

.sec-secret {
  margin-top: var(--space-3);
}

.sec-role-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sec-role-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.sec-role-row:last-child {
  border-bottom: 0;
}

.sec-role-row__name {
  flex: 1 1 40%;
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.sec-role-tag {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-accent);
  white-space: nowrap;
}

/* Ponowne sprawdzenie roli. */
.sec-unlock-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sec-unlock-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.sec-unlock-row__name {
  flex: 1 1 40%;
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.sec-unlock-row__button {
  min-height: 48px;
  padding: 0 var(--space-3);
  font-size: 0.85rem;
  white-space: normal;
}

/* Dialog potwierdzenia. */
.sec-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
  background-color: rgba(4, 6, 14, 0.82);
  backdrop-filter: blur(4px);
}

.sec-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: min(420px, 100%);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.sec-dialog__message {
  font-size: 1rem;
  line-height: 1.5;
}

/* --- Ekrany mistrza gry (noc, poranek, dzień) ------------------------------ */

.sec-gm-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.sec-gm-head__label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.sec-gm-head__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.sec-gm-head__button {
  min-height: 48px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  touch-action: manipulation;
}

.sec-gm-head__button--danger {
  border-color: rgba(255, 122, 122, 0.5);
  color: var(--color-danger);
}

/* Bloki "Powiedz na głos" i "Zrób". */
.sec-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-soft);
}

.sec-block--say {
  border-color: rgba(255, 179, 71, 0.45);
  background-image: radial-gradient(80% 100% at 50% 0%, rgba(255, 179, 71, 0.12), transparent 70%);
}

.sec-block__label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

/* Tekst czytany na głos — duża czcionka (min. 22 px). */
.sec-say {
  font-size: clamp(1.375rem, 5.6vw, 1.75rem);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.sec-do {
  font-size: 1rem;
  line-height: 1.5;
}

/* Wybór osoby. */
.sec-pick-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sec-pick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  min-height: 56px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 600;
  text-align: left;
  touch-action: manipulation;
}

.sec-pick--selected {
  border-color: var(--color-accent);
  background-color: var(--color-surface-strong);
  color: var(--color-accent);
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.sec-pick:disabled {
  border-style: dashed;
  background-color: var(--color-bg-soft);
  color: var(--color-text-muted);
  cursor: default;
}

.sec-pick__note {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.sec-gm-action {
  min-height: 56px;
  font-size: 1.05rem;
}

/* Tajny wynik (śledczy) i szczegóły poranka. */
.sec-secret-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sec-result {
  font-size: clamp(1.125rem, 4.5vw, 1.35rem);
  font-weight: 800;
  line-height: 1.35;
}

/* Licznik dyskusji. */
.sec-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.sec-timer__value {
  font-size: clamp(2rem, 9vw, 2.6rem);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.sec-timer__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
}

.sec-timer__button {
  min-height: 48px;
  padding: 0 var(--space-4);
  font-size: 0.9rem;
}

/* Ekran końcowy. */
.sec-finish__winner {
  font-size: clamp(1.25rem, 5vw, 1.6rem);
  font-weight: 800;
  line-height: 1.3;
  text-align: center;
}

.sec-finish__winner--villagers {
  color: #8fd18f;
}

.sec-finish__winner--sect {
  color: var(--color-danger);
}

.sec-log {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sec-log__entry {
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

/* --- Tablica mistrza gry (nakładka) --------------------------------------- */

.sec-board {
  position: fixed;
  inset: 0;
  z-index: 55;
  overflow-y: auto;
  padding: calc(var(--space-4) + env(safe-area-inset-top, 0px)) var(--space-4)
    calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
  background-color: rgba(4, 6, 14, 0.97);
  backdrop-filter: blur(6px);
}

.sec-board__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: min(600px, 100%);
  margin: 0 auto;
}

.sec-board__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.sec-board__list,
.sec-board__secret-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sec-board__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.sec-board__name {
  flex: 1 1 40%;
  min-width: 0;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.sec-board__state {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.sec-board__state--dead {
  font-weight: 600;
  color: var(--color-danger);
}

.sec-board__secret-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.sec-marker {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-accent);
}

/* --- Instrukcja mistrza gry ----------------------------------------------- */

.sec-guide__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sec-guide__point {
  display: flex;
  gap: var(--space-2);
  font-size: 1.125rem;
  line-height: 1.5;
}

.sec-guide__point::before {
  content: '•';
  color: var(--color-accent);
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

/** Nagłówek ekranu: ikona świecy, tytuł i krótki opis. */
function createHead(title, subtitle) {
  return el('header', { class: 'sec-head' }, [
    el('span', { class: 'sec-head__icon', 'aria-hidden': 'true', text: '🕯️' }),
    el('h2', { class: 'sec-head__title', text: title }),
    el('p', { class: 'sec-head__subtitle', text: subtitle }),
  ]);
}

/** Przycisk wyjścia do HUB-a (z potwierdzeniem po stronie ekranu). */
function createExitFooter(onExit) {
  return el('button', {
    class: 'button button--secondary button--block',
    type: 'button',
    text: t('games.sect.ui.exitFooter'),
    onClick: onExit,
  });
}

/**
 * Dialog potwierdzenia (nakładka na bieżący ekran).
 * @param {{
 *   title: string,
 *   message: string,
 *   confirmLabel: string,
 *   cancelLabel?: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = t('games.sect.dialog.cancel'),
  onConfirm,
  onCancel,
}) {
  return el('div', { class: 'sec-overlay' }, [
    el(
      'div',
      {
        class: 'sec-dialog',
        role: 'alertdialog',
        'aria-modal': 'true',
        'aria-labelledby': 'sect-dialog-title',
      },
      [
        el('h2', { class: 'panel__title', id: 'sect-dialog-title', text: title }),
        el('p', { class: 'sec-dialog__message', text: message }),
        el('button', {
          class: 'button button--primary button--block',
          type: 'button',
          text: confirmLabel,
          onClick: onConfirm,
        }),
        el('button', {
          class: 'button button--secondary button--block sec-dialog__cancel',
          type: 'button',
          text: cancelLabel,
          onClick: onCancel,
        }),
      ],
    ),
  ]);
}

/**
 * Ekran przygotowania: wybór mistrza gry, podgląd składu i rozdanie ról.
 * @param {{
 *   players: string[],
 *   gmName: string|null,
 *   playingCount: number,
 *   lineupText: string,
 *   belowMinimum: boolean,
 *   onGmChange: (value: string) => void,
 *   onDealRoles: () => void,
 *   onExit: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderSetupScreen({
  players,
  gmName,
  playingCount,
  lineupText,
  belowMinimum,
  onGmChange,
  onDealRoles,
  onOpenGuide,
  onExit,
}) {
  const gmOptions = [
    el('option', {
      value: '',
      text: t('games.sect.setup.outsider'),
      selected: gmName === null,
    }),
    ...players.map((name) => el('option', { value: name, text: name, selected: gmName === name })),
  ];

  return el('div', { class: 'stack' }, [
    createHead(t('games.sect.name'), t('games.sect.description')),

    el('div', { class: 'panel' }, [
      el('label', {
        class: 'field__label',
        for: 'sect-gm-select',
        text: t('games.sect.setup.gmLabel'),
      }),
      el(
        'select',
        {
          class: 'sec-select',
          id: 'sect-gm-select',
          onChange: (event) => onGmChange(event.target.value),
        },
        gmOptions,
      ),
      el('p', {
        class: 'sec-hint',
        text: t('games.sect.setup.gmHint'),
      }),
    ]),

    el('div', { class: 'panel' }, [
      el('h3', { class: 'panel__title', text: t('games.sect.setup.lineupTitle') }),
      el('p', {
        class: 'sec-lineup',
        text: t('games.sect.setup.players', { count: formatNumber(playingCount) }),
      }),
      belowMinimum
        ? el('p', {
            class: 'form-error',
            text: t('games.sect.setup.notEnough', { count: formatNumber(MIN_PLAYERS) }),
          })
        : el('p', {
            class: 'sec-lineup',
            text: t('games.sect.setup.lineup', { lineup: lineupText }),
          }),
    ]),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: t('games.sect.setup.dealRoles'),
      disabled: belowMinimum,
      onClick: onDealRoles,
    }),

    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: t('games.sect.setup.openGuide'),
      onClick: onOpenGuide,
    }),

    createExitFooter(onExit),
  ]);
}

/**
 * Wspólny ekran sprawdzania ról (gracze podają sobie telefon).
 * @param {{
 *   gameState: Object,
 *   checkedCount: number,
 *   allChecked: boolean,
 *   onPickPlayer: (playerId: string) => void,
 *   onOpenPreview: () => void,
 *   onGoToGm: () => void,
 *   onExit: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderRoleCheckScreen({
  gameState,
  checkedCount,
  allChecked,
  onPickPlayer,
  onOpenPreview,
  onGoToGm,
  onExit,
}) {
  const playerList = el(
    'ul',
    { class: 'sec-player-list' },
    gameState.players.map((player) =>
      el('li', {}, [
        el(
          'button',
          {
            class: player.roleChecked ? 'sec-player sec-player--checked' : 'sec-player',
            type: 'button',
            disabled: player.roleChecked,
            onClick: () => onPickPlayer(player.id),
          },
          [
            el('span', { class: 'sec-player__name', text: player.name }),
            player.roleChecked
              ? el('span', {
                  class: 'sec-player__note',
                  text: t('games.sect.check.roleChecked'),
                })
              : null,
          ],
        ),
      ]),
    ),
  );

  return el('div', { class: 'stack' }, [
    el('div', { class: 'panel' }, [
      el('div', { class: 'row' }, [
        el('h2', { class: 'panel__title', text: t('games.sect.check.title') }),
        el('span', {
          class: 'sec-counter',
          text: t('games.sect.check.counter', {
            checked: formatNumber(checkedCount),
            total: formatNumber(gameState.players.length),
          }),
        }),
      ]),
      el('p', {
        class: 'sec-hint',
        text: t('games.sect.check.hint'),
      }),
      playerList,
    ]),

    allChecked
      ? el('div', { class: 'panel sec-done' }, [
          el('p', {
            class: 'sec-done__text',
            text: t('games.sect.check.done'),
          }),
        ])
      : null,

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: allChecked ? t('games.sect.check.handed') : t('games.sect.check.continue'),
      onClick: onGoToGm,
    }),

    el('div', { class: 'sec-actions' }, [
      el('button', {
        class: 'button button--secondary button--block',
        type: 'button',
        text: t('games.sect.check.preview'),
        onClick: onOpenPreview,
      }),
      el('button', {
        class: 'button button--secondary button--block',
        type: 'button',
        text: t('games.sect.check.abort'),
        onClick: onExit,
      }),
    ]),
  ]);
}

/**
 * Ekran odsłoniętej roli. Po "Ukryj rolę" ekran jest całkowicie zastępowany,
 * więc rola nie zostaje w DOM.
 * @param {{
 *   player: {id: string, name: string},
 *   role: {name: string, revealText: string},
 *   onHide: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderRoleRevealScreen({ player, role, onHide }) {
  return el('div', { class: 'stack' }, [
    el('div', { class: 'panel sec-reveal' }, [
      el('p', {
        class: 'sec-hint',
        text: t('games.sect.reveal.title', { name: player.name }),
      }),
      el('p', { class: 'sec-role-name', text: role.name }),
      el('p', { class: 'sec-role-text', text: role.revealText }),
    ]),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: t('games.sect.reveal.hide'),
      onClick: onHide,
    }),
  ]);
}

/** Lista ról widoczna wyłącznie na czas przytrzymania przycisku. */
function createSecretList(players) {
  return el(
    'ul',
    { class: 'sec-role-list' },
    players.map((player) => {
      const role = ROLES[player.roleId];
      return el('li', { class: 'sec-role-row' }, [
        el('span', { class: 'sec-role-row__name', text: player.name }),
        el('span', { class: 'sec-role-tag', text: `${role.icon} ${role.name}` }),
      ]);
    }),
  );
}

/**
 * Ekran mistrza gry "Podgląd ról": role widoczne tylko po przytrzymaniu przycisku
 * oraz odblokowywanie ponownego sprawdzenia roli.
 * @param {{
 *   gameState: Object,
 *   onUnlockRole: (playerId: string) => void,
 *   onBack: () => void,
 *   onExit: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderPreviewScreen({ gameState, onUnlockRole, onBack, onExit }) {
  const holdBox = createHoldReveal({
    label: t('games.sect.preview.hold'),
    renderContent: () => createSecretList(gameState.players),
  });

  const unlockList = el(
    'ul',
    { class: 'sec-unlock-list' },
    gameState.players.map((player) =>
      el('li', { class: 'sec-unlock-row' }, [
        el('span', { class: 'sec-unlock-row__name', text: player.name }),
        el('button', {
          class: 'button button--secondary sec-unlock-row__button',
          type: 'button',
          text: t('games.sect.preview.unlock'),
          disabled: !player.roleChecked,
          onClick: () => onUnlockRole(player.id),
        }),
      ]),
    ),
  );

  return el('div', { class: 'stack' }, [
    createHead(
      t('games.sect.preview.title'),
      t('games.sect.preview.subtitle'),
    ),

    el('div', { class: 'panel' }, [holdBox]),

    el('div', { class: 'panel' }, [
      el('h3', { class: 'panel__title', text: t('games.sect.preview.unlockTitle') }),
      el('p', {
        class: 'sec-hint',
        text: t('games.sect.preview.unlockHint'),
      }),
      unlockList,
    ]),

    el('div', { class: 'sec-actions' }, [
      el('button', {
        class: 'button button--secondary button--block',
        type: 'button',
        text: t('games.sect.preview.back'),
        onClick: onBack,
      }),
      createExitFooter(onExit),
    ]),
  ]);
}

/**
 * Mechanizm "przytrzymaj, aby zobaczyć": tajna treść trafia do DOM tylko na czas
 * przytrzymania przycisku i jest usuwana po puszczeniu.
 * @param {{label: string, renderContent: () => HTMLElement}} options
 * @returns {HTMLElement}
 */
function createHoldReveal({ label, renderContent }) {
  const secretBox = el('div', { class: 'sec-secret', hidden: true });
  let isHolding = false;

  const button = el('button', {
    class: 'button button--secondary button--block sec-hold',
    type: 'button',
    text: label,
    onPointerdown: (event) => {
      event.preventDefault();
      show();
    },
    onPointerup: hide,
    onPointerleave: hide,
    onPointercancel: hide,
    onKeydown: (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        show();
      }
    },
    onKeyup: hide,
    onBlur: hide,
  });

  function show() {
    if (isHolding) {
      return;
    }
    isHolding = true;
    button.classList.add('sec-hold--active');
    secretBox.append(renderContent());
    secretBox.hidden = false;
  }

  function hide() {
    if (!isHolding) {
      return;
    }
    isHolding = false;
    button.classList.remove('sec-hold--active');
    secretBox.hidden = true;
    clear(secretBox);
  }

  return el('div', {}, [button, secretBox]);
}

/** Nagłówek ekranów mistrza gry: wskaźnik kroku oraz skróty. */
export function createGmHeader({ label, onOpenPreview, onOpenBoard, onOpenGuide, onAbort }) {
  return el('div', { class: 'sec-gm-head' }, [
    el('p', { class: 'sec-gm-head__label', text: label }),
    el('div', { class: 'sec-gm-head__actions' }, [
      el('button', {
        class: 'sec-gm-head__button',
        type: 'button',
        text: t('games.sect.gm.preview'),
        onClick: onOpenPreview,
      }),
      el('button', {
        class: 'sec-gm-head__button',
        type: 'button',
        text: t('games.sect.gm.board'),
        onClick: onOpenBoard,
      }),
      el('button', {
        class: 'sec-gm-head__button',
        type: 'button',
        text: t('games.sect.gm.guide'),
        onClick: onOpenGuide,
      }),
      el('button', {
        class: 'sec-gm-head__button sec-gm-head__button--danger',
        type: 'button',
        text: t('games.sect.gm.abort'),
        onClick: onAbort,
      }),
    ]),
  ]);
}

/** Blok "Powiedz na głos" — tekst w cudzysłowie, dużą czcionką. */
function createSayBlock(text) {
  return el('div', { class: 'sec-block sec-block--say' }, [
    el('p', { class: 'sec-block__label', text: t('games.sect.gm.sayLabel') }),
    el('p', { class: 'sec-say', text: `„${text}”` }),
  ]);
}

/** Blok "Zrób" z dowolną zawartością. */
function createDoBlock(children) {
  return el('div', { class: 'sec-block sec-block--do' }, [
    el('p', { class: 'sec-block__label', text: t('games.sect.gm.doLabel') }),
    ...children,
  ]);
}

/** Wspólna rama ekranu mistrza gry: nagłówek, oba bloki i główny przycisk. */
function createGmScreenFrame({
  label,
  sayText,
  doChildren,
  actionLabel,
  onAction,
  actionDisabled = false,
  onOpenPreview,
  onOpenBoard,
  onOpenGuide,
  onAbort,
  onUndo = null,
  extra = null,
}) {
  return el('div', { class: 'stack' }, [
    createGmHeader({ label, onOpenPreview, onOpenBoard, onOpenGuide, onAbort }),
    createSayBlock(sayText),
    createDoBlock(doChildren),
    extra,
    el('button', {
      class: 'button button--primary button--block sec-gm-action',
      type: 'button',
      text: actionLabel,
      disabled: actionDisabled,
      onClick: onAction,
    }),
    onUndo
      ? el('button', {
          class: 'button button--secondary button--block',
          type: 'button',
          text: t('games.sect.gm.undo'),
          onClick: onUndo,
        })
      : null,
  ]);
}

/** Lista kandydatów do wyboru (noc oraz głosowanie w dzień). */
function createPickList(candidates, selectedId, onSelect) {
  return el(
    'ul',
    { class: 'sec-pick-list' },
    candidates.map((candidate) =>
      el('li', {}, [
        el(
          'button',
          {
            class: candidate.id === selectedId ? 'sec-pick sec-pick--selected' : 'sec-pick',
            type: 'button',
            disabled: candidate.disabled === true,
            onClick: () => onSelect(candidate.id),
          },
          [
            el('span', { class: 'sec-pick__name', text: candidate.name }),
            candidate.note ? el('span', { class: 'sec-pick__note', text: candidate.note }) : null,
          ],
        ),
      ]),
    ),
  );
}

/** Ekran informacyjny (krok bez wybierania osoby). */
export function renderGmInfoScreen({
  label,
  sayText,
  doText,
  actionLabel = t('games.sect.gm.next'),
  onAction,
  onOpenPreview,
  onOpenBoard,
  onOpenGuide,
  onAbort,
  onUndo,
}) {
  return createGmScreenFrame({
    label,
    sayText,
    doChildren: [el('p', { class: 'sec-do', text: doText })],
    actionLabel,
    onAction,
    onOpenPreview,
    onOpenBoard,
    onOpenGuide,
    onAbort,
    onUndo,
  });
}

/** Ekran wyboru osoby (sekta, lekarz, śledczy, głosowanie w dzień). */
export function renderGmPickScreen({
  label,
  sayText,
  doText,
  candidates,
  selectedId,
  onSelect,
  onConfirm,
  onOpenPreview,
  onOpenBoard,
  onOpenGuide,
  onAbort,
  onUndo,
}) {
  return createGmScreenFrame({
    label,
    sayText,
    doChildren: [
      el('p', { class: 'sec-do', text: doText }),
      createPickList(candidates, selectedId, onSelect),
    ],
    actionLabel: t('games.sect.gm.confirm'),
    actionDisabled: !selectedId,
    onAction: onConfirm,
    onOpenPreview,
    onOpenBoard,
    onOpenGuide,
    onAbort,
    onUndo,
  });
}

/** Ekran tajnego wyniku sprawdzenia śledczego (widoczny tylko po przytrzymaniu). */
export function renderDetectiveResultScreen({
  label,
  sayText,
  targetName,
  resultText,
  gestureText,
  onNext,
  onOpenPreview,
  onOpenBoard,
  onOpenGuide,
  onAbort,
  onUndo,
}) {
  const secret = createHoldReveal({
    label: t('games.sect.gm.holdResult'),
    renderContent: () =>
      el('div', { class: 'sec-secret-inner' }, [
        el('p', { class: 'sec-result', text: resultText }),
        el('p', { class: 'sec-do', text: gestureText }),
      ]),
  });

  return createGmScreenFrame({
    label,
    sayText,
    doChildren: [
      el('p', {
        class: 'sec-do',
        text: t('games.sect.gm.detectiveCheck', { name: targetName }),
      }),
      secret,
    ],
    actionLabel: t('games.sect.gm.next'),
    onAction: onNext,
    onOpenPreview,
    onOpenBoard,
    onOpenGuide,
    onAbort,
    onUndo,
  });
}

/** Poranek: ogłoszenie wyniku nocy i szczegóły tylko dla mistrza gry. */
export function renderMorningScreen({
  label,
  sayText,
  doText,
  detailText,
  onNext,
  onOpenPreview,
  onOpenBoard,
  onOpenGuide,
  onAbort,
}) {
  const detail = createHoldReveal({
    label: t('games.sect.gm.holdDetails'),
    renderContent: () => el('p', { class: 'sec-do', text: detailText }),
  });

  return createGmScreenFrame({
    label,
    sayText,
    doChildren: [el('p', { class: 'sec-do', text: doText }), detail],
    actionLabel: t('games.sect.gm.next'),
    onAction: onNext,
    onOpenPreview,
    onOpenBoard,
    onOpenGuide,
    onAbort,
  });
}

/** Czas w formacie mm:ss. */
function formatClock(milliseconds) {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Prosty licznik odliczający w dół (start/stop). destroy() trzeba wywołać
 * przy zmianie ekranu, żeby nie zostawić działającego interwału.
 * @param {{seconds: number}} options
 * @returns {{el: HTMLElement, destroy: () => void}}
 */
function createCountdown({ seconds }) {
  const totalMs = seconds * 1000;
  let remainingMs = totalMs;
  let endAt = 0;
  let tickId = null;

  const valueNode = el('span', { class: 'sec-timer__value', text: formatClock(remainingMs) });

  const startButton = el('button', {
    class: 'button button--secondary sec-timer__button',
    type: 'button',
    text: t('games.sect.ui.start'),
    onClick: start,
  });
  const stopButton = el('button', {
    class: 'button button--secondary sec-timer__button',
    type: 'button',
    text: t('games.sect.ui.stop'),
    onClick: stop,
  });

  const element = el('div', { class: 'sec-timer' }, [
    valueNode,
    el('div', { class: 'sec-timer__actions' }, [startButton, stopButton]),
  ]);

  function start() {
    if (tickId !== null) {
      return;
    }
    endAt = performance.now() + remainingMs;
    tickId = window.setInterval(tick, 250);
  }

  function stop() {
    if (tickId === null) {
      return;
    }
    remainingMs = Math.max(0, endAt - performance.now());
    window.clearInterval(tickId);
    tickId = null;
    render();
  }

  function tick() {
    const left = endAt - performance.now();

    if (left <= 0) {
      remainingMs = 0;
      window.clearInterval(tickId);
      tickId = null;
      render();
      return;
    }

    remainingMs = left;
    render();
  }

  function render() {
    valueNode.textContent = formatClock(remainingMs);
  }

  function destroy() {
    if (tickId !== null) {
      window.clearInterval(tickId);
      tickId = null;
    }
  }

  return { el: element, destroy };
}

/**
 * Dzień: dyskusja z opcjonalnym licznikiem czasu.
 * @returns {{el: HTMLElement, destroy: () => void}}
 */
export function renderDayDiscussionScreen({
  label,
  sayText,
  doText,
  seconds,
  onNext,
  onOpenPreview,
  onOpenBoard,
  onOpenGuide,
  onAbort,
}) {
  const timer = createCountdown({ seconds });

  const element = createGmScreenFrame({
    label,
    sayText,
    doChildren: [el('p', { class: 'sec-do', text: doText }), timer.el],
    actionLabel: t('games.sect.ui.goToVote'),
    onAction: () => {
      timer.destroy();
      onNext();
    },
    onOpenPreview,
    onOpenBoard,
    onOpenGuide,
    onAbort,
  });

  return { el: element, destroy: timer.destroy };
}

/** Dzień: głosowanie — kto odpada (albo "Nikt nie odpada"). */
export function renderDayVoteScreen({
  label,
  sayText,
  doText,
  candidates,
  selectedId,
  onSelect,
  onConfirm,
  onOpenPreview,
  onOpenBoard,
  onOpenGuide,
  onAbort,
}) {
  return createGmScreenFrame({
    label,
    sayText,
    doChildren: [
      el('p', { class: 'sec-do', text: doText }),
      createPickList(candidates, selectedId, onSelect),
    ],
    actionLabel: t('games.sect.gm.confirm'),
    actionDisabled: !selectedId,
    onAction: onConfirm,
    onOpenPreview,
    onOpenBoard,
    onOpenGuide,
    onAbort,
  });
}

/** Dzień: ogłoszenie wyniku głosowania. */
export function renderDayResultScreen({
  label,
  sayText,
  doText,
  onNext,
  onOpenPreview,
  onOpenBoard,
  onOpenGuide,
  onAbort,
}) {
  return createGmScreenFrame({
    label,
    sayText,
    doChildren: [el('p', { class: 'sec-do', text: doText })],
    actionLabel: t('games.sect.gm.next'),
    onAction: onNext,
    onOpenPreview,
    onOpenBoard,
    onOpenGuide,
    onAbort,
  });
}

/**
 * Opis jednej nocy do dziennika (ekran końcowy i tablica mistrza gry).
 * @param {Object} entry
 * @param {Array<{id: string, name: string}>} players
 * @returns {string}
 */
function describeNightEntry(entry, players) {
  const nameOf = (playerId) => {
    const player = players.find((item) => item.id === playerId);
    return player ? player.name : '—';
  };

  const parts = [];

  if (entry.sectTargetId) {
    parts.push(t('games.sect.log.sect', { name: nameOf(entry.sectTargetId) }));
  }
  if (entry.doctorTargetId) {
    parts.push(t('games.sect.log.doctor', { name: nameOf(entry.doctorTargetId) }));
  }
  if (entry.detectiveTargetId) {
    const result =
      entry.detectiveResult === 'sect'
        ? t('games.sect.log.detectiveSect')
        : t('games.sect.log.detectiveNotSect');
    parts.push(
      t('games.sect.log.detective', {
        name: nameOf(entry.detectiveTargetId),
        result,
      }),
    );
  }
  if (parts.length === 0) {
    parts.push(t('games.sect.log.noChoices'));
  }

  const effect = entry.victimId
    ? t('games.sect.log.victim', { name: nameOf(entry.victimId) })
    : entry.saved
      ? t('games.sect.log.saved')
      : t('games.sect.log.noVictim');

  return t('games.sect.log.entry', {
    night: formatNumber(entry.night),
    parts: parts.join('; '),
    effect,
  });
}

/**
 * Ekran końcowy: wynik, role wszystkich graczy oraz dziennik nocy.
 * @param {{
 *   winnerText: {text: string, isSect: boolean},
 *   players: Object[],
 *   nightLog: Object[],
 *   onPlayAgain: () => void,
 *   onNewRoles: () => void,
 *   onExit: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderFinishedScreen({
  winnerText,
  players,
  nightLog,
  onPlayAgain,
  onNewRoles,
  onExit,
}) {
  return el('div', { class: 'stack' }, [
    createHead(t('games.sect.finished.title'), t('games.sect.finished.subtitle')),

    el('div', { class: 'panel' }, [
      el('p', {
        class: `sec-finish__winner ${
          winnerText.isSect ? 'sec-finish__winner--sect' : 'sec-finish__winner--villagers'
        }`,
        text: winnerText.text,
      }),
    ]),

    el('div', { class: 'panel' }, [
      el('h3', { class: 'panel__title', text: t('games.sect.finished.rolesTitle') }),
      el(
        'ul',
        { class: 'sec-role-list' },
        players.map((player) =>
          el('li', { class: 'sec-role-row' }, [
            el('span', {
              class: 'sec-role-row__name',
              text: `${player.alive ? '' : '💀 '}${player.name}`,
            }),
            el('span', {
              class: 'sec-role-tag',
              text: `${ROLES[player.roleId].icon} ${ROLES[player.roleId].name}`,
            }),
          ]),
        ),
      ),
    ]),

    el('div', { class: 'panel' }, [
      el('h3', { class: 'panel__title', text: t('games.sect.finished.logTitle') }),
      nightLog.length === 0
        ? el('p', { class: 'sec-hint', text: t('games.sect.finished.noNights') })
        : el(
            'ul',
            { class: 'sec-log' },
            nightLog.map((entry) =>
              el('li', { class: 'sec-log__entry', text: describeNightEntry(entry, players) }),
            ),
          ),
    ]),

    el('p', {
      class: 'sec-hint',
      text: t('games.sect.finished.hint'),
    }),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: t('games.sect.finished.playAgain'),
      onClick: onPlayAgain,
    }),
    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: t('games.sect.finished.newRoles'),
      onClick: onNewRoles,
    }),
    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: t('games.sect.finished.backToHub'),
      onClick: onExit,
    }),
  ]);
}

/** Publiczny opis stanu gracza do Tablicy mistrza gry. */
function describePlayerState(player) {
  if (player.alive) {
    return t('games.sect.state.alive');
  }

  const death = player.death;

  if (!death) {
    return t('games.sect.state.dead');
  }
  if (death.type === 'night') {
    return t('games.sect.state.deadNight', { night: formatNumber(death.number) });
  }
  if (death.type === 'day') {
    return t('games.sect.state.deadDay', { day: formatNumber(death.number) });
  }
  return t('games.sect.state.deadManual');
}

/** Oznaczenia bieżącej nocy (zawsze ikona + tekst, nie tylko kolor). */
function getNightMarkers(player, nightChoices) {
  const markers = [];

  if (nightChoices.sectTargetId === player.id) {
    markers.push(t('games.sect.markers.sectTarget'));
  }
  if (nightChoices.doctorTargetId === player.id) {
    markers.push(t('games.sect.markers.doctorTarget'));
  }
  if (nightChoices.detectiveTargetId === player.id) {
    markers.push(
      nightChoices.detectiveResult === 'sect'
        ? t('games.sect.markers.detectiveSect')
        : t('games.sect.markers.detectiveNotSect'),
    );
  }

  return markers;
}

/** Tajna część Tablicy: role, oznaczenia nocy, dziennik i korekty. */
function createBoardSecret({ players, nightChoices, nightLog, corrections }) {
  const rows = players.map((player) => {
    const role = ROLES[player.roleId];
    const markers = getNightMarkers(player, nightChoices);

    return el('li', { class: 'sec-board__secret-row' }, [
      el('span', { class: 'sec-role-row__name', text: player.name }),
      el('span', { class: 'sec-role-tag', text: `${role.icon} ${role.name}` }),
      ...markers.map((marker) => el('span', { class: 'sec-marker', text: marker })),
    ]);
  });

  const correctionRows = corrections.map((entry) => {
    const player = players.find((item) => item.id === entry.playerId);
    const stateText = entry.alive
      ? t('games.sect.dialog.correctAlive')
      : t('games.sect.dialog.correctDead');

    return el('li', {
      class: 'sec-log__entry',
      text: t('games.sect.board.correction', {
        night: formatNumber(entry.number),
        name: player ? player.name : '—',
        state: stateText,
      }),
    });
  });

  return el('div', { class: 'sec-secret-inner' }, [
    el('p', { class: 'sec-block__label', text: t('games.sect.board.secretLabel') }),
    el('ul', { class: 'sec-board__secret-list' }, rows),

    el('p', { class: 'sec-block__label', text: t('games.sect.finished.logTitle') }),
    nightLog.length === 0
      ? el('p', { class: 'sec-hint', text: t('games.sect.finished.noNights') })
      : el(
          'ul',
          { class: 'sec-log' },
          nightLog.map((entry) =>
            el('li', { class: 'sec-log__entry', text: describeNightEntry(entry, players) }),
          ),
        ),
    correctionRows.length === 0 ? null : el('ul', { class: 'sec-log' }, correctionRows),
  ]);
}

/**
 * Pełnoekranowa Tablica mistrza gry (nakładka, nie zmienia kroku gry).
 * @param {{
 *   players: Object[],
 *   nightChoices: Object,
 *   nightLog: Object[],
 *   corrections: Object[],
 *   winnerText: string,
 *   onClose: () => void,
 *   onCorrect: (playerId: string) => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderBoardOverlay({
  players,
  nightChoices,
  nightLog,
  corrections,
  winnerText,
  onClose,
  onCorrect,
}) {
  const aliveCount = players.filter((player) => player.alive).length;
  const deadCount = players.length - aliveCount;

  const secret = createHoldReveal({
    label: t('games.sect.board.hold'),
    renderContent: () => createBoardSecret({ players, nightChoices, nightLog, corrections }),
  });

  return el(
    'div',
    {
      class: 'sec-board',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'sec-board-title',
    },
    [
      el('div', { class: 'sec-board__inner' }, [
        el('div', { class: 'sec-board__head' }, [
          el('h2', {
            class: 'panel__title',
            id: 'sec-board-title',
            text: t('games.sect.board.title'),
          }),
          el('button', {
            class: 'sec-gm-head__button',
            type: 'button',
            text: t('games.sect.board.close'),
            onClick: onClose,
          }),
        ]),

        el('p', {
          class: 'sec-hint',
          text: t('games.sect.board.aliveDead', {
            alive: formatNumber(aliveCount),
            dead: formatNumber(deadCount),
          }),
        }),

        winnerText
          ? el('p', {
              class: 'form-error',
              text: t('games.sect.board.winCondition', { text: winnerText }),
            })
          : null,

        el(
          'ul',
          { class: 'sec-board__list' },
          players.map((player) =>
            el('li', { class: 'sec-board__row' }, [
              el('span', { class: 'sec-board__name', text: player.name }),
              el('span', {
                class: player.alive ? 'sec-board__state' : 'sec-board__state sec-board__state--dead',
                text: describePlayerState(player),
              }),
              el('button', {
                class: 'sec-gm-head__button',
                type: 'button',
                text: t('games.sect.board.correct'),
                onClick: () => onCorrect(player.id),
              }),
            ]),
          ),
        ),

        el('div', { class: 'panel' }, [secret]),

        el('button', {
          class: 'button button--secondary button--block',
          type: 'button',
          text: t('games.sect.board.closeBoard'),
          onClick: onClose,
        }),
      ]),
    ],
  );
}

/**
 * Instrukcja mistrza gry: sekcje z gm-guide.js.
 * auto = true → przyciski "Przeczytałem, zaczynamy" / "Pomiń" (przed pierwszą nocą),
 * auto = false → "Zamknij instrukcję" (otwarta z przycisku).
 * @param {{auto: boolean, onStart: () => void, onSkip: () => void, onBack: () => void}} options
 * @returns {HTMLElement}
 */
export function renderGuideScreen({ auto, onStart, onSkip, onBack }) {
  return el('div', { class: 'stack' }, [
    createHead(t('games.sect.guideScreen.title'), t('games.sect.guideScreen.subtitle')),

    ...GUIDE_SECTIONS.map((section) =>
      el('section', { class: 'panel' }, [
        el('h3', { class: 'panel__title', text: section.title }),
        el(
          'ul',
          { class: 'sec-guide__list' },
          section.points.map((point) => el('li', { class: 'sec-guide__point', text: point })),
        ),
      ]),
    ),

    auto
      ? el('button', {
          class: 'button button--primary button--block sec-gm-action',
          type: 'button',
          text: t('games.sect.guideScreen.read'),
          onClick: onStart,
        })
      : null,

    auto
      ? el('button', {
          class: 'button button--secondary button--block',
          type: 'button',
          text: t('games.sect.guideScreen.skip'),
          onClick: onSkip,
        })
      : el('button', {
          class: 'button button--secondary button--block',
          type: 'button',
          text: t('games.sect.guideScreen.close'),
          onClick: onBack,
        }),
  ]);
}






