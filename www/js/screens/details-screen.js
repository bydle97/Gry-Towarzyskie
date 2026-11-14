/**
 * Ekran szczegółów gry: opis, lista graczy z sesji i przycisk "Start".
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
    el('div', { class: 'panel' }, [
      el('div', { class: 'row' }, [
        el('span', { class: 'game-card__icon', 'aria-hidden': 'true', text: game.icon }),
        el('div', { class: 'stack' }, [
          el('h2', { class: 'game-card__title', text: game.name }),
          el('p', {
            class: 'game-card__meta',
            text: `Zakres graczy: ${formatPlayersRange(game.minPlayers, game.maxPlayers)}`,
          }),
        ]),
      ]),
      el('p', { text: game.description }),
    ]),

    el('div', { class: 'panel' }, [
      el('h2', { class: 'panel__title', text: `Gracze: ${playerNames.length}` }),
      playerNames.length > 0
        ? el(
            'ul',
            { class: 'player-list' },
            playerNames.map((name, index) =>
              el('li', { class: 'chip', text: `${index + 1}. ${name}` }),
            ),
          )
        : el('p', { class: 'stepper__hint', text: 'Nie wybrano jeszcze graczy.' }),
      playersOk
        ? null
        : el('p', {
            class: 'form-error',
            text: `Wymagany zakres graczy: ${formatPlayersRange(game.minPlayers, game.maxPlayers)}.`,
          }),
    ]),

    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: 'Start',
      disabled: !playersOk,
      onClick: () => navigate('game', { gameId: game.id }),
    }),

    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: 'Zmień graczy',
      onClick: () => navigate('players', { gameId: game.id }, { replace: true }),
    }),
  );
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
