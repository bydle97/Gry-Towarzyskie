/**
 * Ekran szczegółów gry: duży nagłówek, znaczniki liczby graczy, instrukcja
 * (cel, kroki, wskazówki) oraz przyklejony do dołu pasek akcji ze "Start".
 * Start prowadzi do ekranu rozgrywki (rejestrowanego razem z grami).
 */
import { el } from '../core/dom.js';
import { formatPlayersRange } from '../core/format.js';
import { getGameById } from '../core/games-registry.js';
import { navigate } from '../core/router.js';
import { getPlayerNames } from '../core/session.js';

/**
 * @param {{container: HTMLElement, params: {gameId?: string}}} context
 */
export function renderDetailsScreen({ container, params }) {
  const game = getGameById(params.gameId);

  if (!game) {
    container.append(createMissingGameBox());
    return;
  }

  const playerNames = getPlayerNames();
  const playersOk = playerNames.length >= game.minPlayers && playerNames.length <= game.maxPlayers;

  container.append(
    el('div', { class: 'details' }, [
      createHeader(game, playerNames.length),
      ...createInstruction(game),
      playersOk
        ? null
        : el('p', {
            class: 'form-error',
            text: `Wymagany zakres graczy: ${formatPlayersRange(game.minPlayers, game.maxPlayers)}.`,
          }),
      createActions(game, playersOk),
    ]),
  );
}

/**
 * Nagłówek: ikona, nazwa gry i dwa znaczniki z liczbą graczy.
 * @param {Readonly<import('../core/game-contract.js').GameDefinition>} game
 * @param {number} playersCount
 * @returns {HTMLElement}
 */
function createHeader(game, playersCount) {
  return el('header', { class: 'details__head' }, [
    el('span', { class: 'details__icon', 'aria-hidden': 'true', text: game.icon }),
    el('h2', { class: 'details__title', text: game.name }),
    el('div', { class: 'details__badges' }, [
      el('span', {
        class: 'details__badge',
        text: `Zakres graczy: ${formatPlayersRange(game.minPlayers, game.maxPlayers)}`,
      }),
      el('span', {
        class: 'details__badge details__badge--count',
        text: `Gracze: ${playersCount}`,
      }),
    ]),
  ]);
}

/**
 * Instrukcja gry. Gra bez howToPlay pokazuje zamiast kroków sam opis dużą czcionką.
 * @param {Readonly<import('../core/game-contract.js').GameDefinition>} game
 * @returns {HTMLElement[]}
 */
function createInstruction(game) {
  const howToPlay = game.howToPlay;

  if (!howToPlay) {
    return [
      el('section', { class: 'panel' }, [
        el('h3', { class: 'details__section-title', text: 'O grze' }),
        el('p', { class: 'details__goal', text: game.description }),
      ]),
    ];
  }

  const sections = [
    el('section', { class: 'panel' }, [
      el('h3', { class: 'details__section-title', text: 'Cel gry' }),
      el('p', { class: 'details__goal', text: howToPlay.goal }),
    ]),
    el('section', { class: 'panel' }, [
      el('h3', { class: 'details__section-title', text: 'Jak grać' }),
      el(
        'ol',
        { class: 'details__steps' },
        howToPlay.steps.map((step) =>
          el('li', { class: 'details__step' }, [el('span', { text: step })]),
        ),
      ),
    ]),
  ];

  if (Array.isArray(howToPlay.tips) && howToPlay.tips.length > 0) {
    sections.push(
      el('section', { class: 'panel' }, [
        el('h3', { class: 'details__section-title', text: 'Wskazówki' }),
        el(
          'ul',
          { class: 'details__tips' },
          howToPlay.tips.map((tip) =>
            el('li', { class: 'details__tip' }, [el('span', { text: tip })]),
          ),
        ),
      ]),
    );
  }

  return sections;
}

/**
 * Pasek akcji przyklejony do dołu ekranu.
 * @param {Readonly<import('../core/game-contract.js').GameDefinition>} game
 * @param {boolean} playersOk
 * @returns {HTMLElement}
 */
function createActions(game, playersOk) {
  return el('div', { class: 'details__actions' }, [
    el('button', {
      class: 'button button--primary button--block details__start',
      type: 'button',
      text: 'Start',
      disabled: !playersOk,
      onClick: () => navigate('game', { gameId: game.id }),
    }),
    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: 'Wróć do listy graczy',
      onClick: () => navigate('home', {}, { reset: true }),
    }),
  ]);
}

function createMissingGameBox() {
  return el('div', { class: 'empty-state' }, [
    el('span', { class: 'empty-state__icon', 'aria-hidden': 'true', text: '❓' }),
    el('p', { class: 'empty-state__title', text: 'Nie znaleziono gry' }),
    el('p', { text: 'Ta gra nie istnieje w rejestrze gier.' }),
    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: 'Wróć do listy gier',
      onClick: () => navigate('home', {}, { reset: true }),
    }),
  ]);
}
