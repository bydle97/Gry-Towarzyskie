/**
 * Ekran główny: lista gier (karty) z rejestru.
 * Liczba graczy pochodzi z sesji — gry poza zakresem są nieaktywne i pokazują powód.
 */
import { el } from '../core/dom.js';
import { formatPlayersRange } from '../core/format.js';
import { getAllGames } from '../core/games-registry.js';
import { navigate } from '../core/router.js';
import { getPlayerNames } from '../core/session.js';

/**
 * @param {{container: HTMLElement}} context
 */
export function renderHomeScreen({ container }) {
  const games = getAllGames();
  const playerNames = getPlayerNames();

  container.append(createPlayersPanel(playerNames));

  if (games.length === 0) {
    container.append(
      el('div', { class: 'empty-state' }, [
        el('span', { class: 'empty-state__icon', 'aria-hidden': 'true', text: '🕹️' }),
        el('p', { class: 'empty-state__title', text: 'Brak gier w rejestrze' }),
        el('p', {
          text: 'Dodaj folder w www/js/games/, a następnie wpisz grę do www/js/core/games-registry.js — jej karta pojawi się tutaj automatycznie.',
        }),
      ]),
    );
    return;
  }

  const grid = el('div', { class: 'game-grid' });
  for (const game of games) {
    grid.append(createGameCard(game, playerNames.length));
  }
  container.append(grid);
}

function createPlayersPanel(playerNames) {
  return el('div', { class: 'panel' }, [
    el('h2', {
      class: 'panel__title',
      text: `Gracze: ${playerNames.length}`,
    }),
    el('p', { class: 'stepper__hint', text: playerNames.join(' • ') }),
    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: 'Zmień graczy',
      onClick: () => navigate('players'),
    }),
  ]);
}

/**
 * Powód niedostępności gry dla aktualnej liczby graczy ("" = gra dostępna).
 * @param {Readonly<import('../core/game-contract.js').GameDefinition>} game
 * @param {number} playersCount
 * @returns {string}
 */
function getPlayersRequirement(game, playersCount) {
  if (playersCount < game.minPlayers) {
    return `Wymaga min. ${game.minPlayers} graczy`;
  }
  if (playersCount > game.maxPlayers) {
    return `Maks. ${game.maxPlayers} graczy`;
  }
  return '';
}

/**
 * @param {Readonly<import('../core/game-contract.js').GameDefinition>} game
 * @param {number} playersCount
 * @returns {HTMLButtonElement}
 */
function createGameCard(game, playersCount) {
  const requirement = getPlayersRequirement(game, playersCount);

  return el(
    'button',
    {
      class: requirement === '' ? 'game-card' : 'game-card game-card--disabled',
      type: 'button',
      disabled: requirement !== '',
      onClick: () => navigate('details', { gameId: game.id }),
    },
    [
      el('span', { class: 'game-card__icon', 'aria-hidden': 'true', text: game.icon }),
      el('span', { class: 'game-card__body' }, [
        el('span', { class: 'game-card__title', text: game.name }),
        el('span', { class: 'game-card__desc', text: game.description }),
        el('span', {
          class: 'game-card__meta',
          text: `Zakres graczy: ${formatPlayersRange(game.minPlayers, game.maxPlayers)}`,
        }),
        requirement === ''
          ? null
          : el('span', { class: 'game-card__warning', text: requirement }),
      ]),
      el('span', { class: 'game-card__chevron', 'aria-hidden': 'true', text: '›' }),
    ],
  );
}
