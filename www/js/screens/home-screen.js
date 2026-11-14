/**
 * Ekran główny: lista gier (karty) z rejestru.
 * Gdy rejestr jest pusty, pokazujemy instrukcję, jak dodać pierwszą grę.
 */
import { el } from '../core/dom.js';
import { formatPlayersRange } from '../core/format.js';
import { getAllGames } from '../core/games-registry.js';
import { navigate } from '../core/router.js';

/**
 * @param {{container: HTMLElement}} context
 */
export function renderHomeScreen({ container }) {
  const games = getAllGames();

  container.append(
    el('p', {
      class: 'screen__intro',
      text: 'Wybierz grę na jedno urządzenie. Telefon krąży między graczami, a wszystko działa offline.',
    }),
  );

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
    grid.append(createGameCard(game));
  }
  container.append(grid);
}

/**
 * @param {Readonly<import('../core/game-contract.js').GameDefinition>} game
 * @returns {HTMLButtonElement}
 */
function createGameCard(game) {
  return el(
    'button',
    {
      class: 'game-card',
      type: 'button',
      onClick: () => navigate('players', { gameId: game.id }),
    },
    [
      el('span', { class: 'game-card__icon', 'aria-hidden': 'true', text: game.icon }),
      el('span', { class: 'game-card__body' }, [
        el('span', { class: 'game-card__title', text: game.name }),
        el('span', { class: 'game-card__desc', text: game.description }),
        el('span', {
          class: 'game-card__meta',
          text: formatPlayersRange(game.minPlayers, game.maxPlayers),
        }),
      ]),
      el('span', { class: 'game-card__chevron', 'aria-hidden': 'true', text: '›' }),
    ],
  );
}
