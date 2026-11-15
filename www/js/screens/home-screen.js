/**
 * Ekran główny: tytuł aplikacji, edytor listy graczy i karty gier.
 *
 * Edytor graczy to osobny komponent (components/player-list-editor.js). Po każdej
 * zmianie listy woła onChange, więc licznik i karty gier odświeżają się na żywo,
 * bez przeładowania ekranu i bez utraty focusu w polu imienia — bo przerysowujemy
 * tylko sekcję gier, a nie cały ekran.
 */
import { clear, el } from '../core/dom.js';
import { formatNumber, t } from '../core/i18n.js';
import { formatPlayersRange } from '../core/format.js';
import { getAllGames } from '../core/games-registry.js';
import { navigate } from '../core/router.js';
import { getPlayerNames } from '../core/session.js';
import { createLanguageSwitcher } from '../components/language-switcher.js';
import { mountPlayerListEditor } from '../components/player-list-editor.js';

/**
 * @param {{container: HTMLElement}} context
 */
export function renderHomeScreen({ container }) {
  const playersRoot = el('section', { class: 'panel', 'aria-label': t('hub.playersAria') });
  const gamesRoot = el('section', { class: 'home-games', 'aria-label': t('hub.gamesAria') });

  container.append(
    el('div', { class: 'home-topbar' }, [createLanguageSwitcher()]),
    createHero(),
    playersRoot,
    gamesRoot,
  );

  mountPlayerListEditor({
    container: playersRoot,
    onChange: (names) => renderGames(gamesRoot, names),
  });

  renderGames(gamesRoot, getPlayerNames());
}

function createHero() {
  return el('header', { class: 'home-hero' }, [
    el('h1', { class: 'home-title', text: t('hub.heroTitle') }),
    el('p', { class: 'home-subtitle', text: t('hub.heroSubtitle') }),
  ]);
}

/**
 * Rysuje sekcję gier dla aktualnej liczby graczy.
 * Wywoływane także po każdej zmianie listy graczy (odświeżanie na żywo).
 * @param {HTMLElement} root
 * @param {string[]} playerNames
 */
function renderGames(root, playerNames) {
  clear(root);

  const games = getAllGames();

  root.append(el('h2', { class: 'home-games__title', text: t('hub.gamesTitle') }));

  if (games.length === 0) {
    root.append(
      el('div', { class: 'empty-state' }, [
        el('span', { class: 'empty-state__icon', 'aria-hidden': 'true', text: '🕹️' }),
        el('p', { class: 'empty-state__title', text: t('hub.noGamesTitle') }),
        el('p', { text: t('hub.noGamesText') }),
      ]),
    );
    return;
  }

  const grid = el('div', { class: 'game-grid' });
  for (const game of games) {
    grid.append(createGameCard(game, playerNames.length));
  }
  root.append(grid);
}

/**
 * Powód niedostępności gry dla aktualnej liczby graczy ("" = gra dostępna).
 * @param {Readonly<import('../core/game-contract.js').GameDefinition>} game
 * @param {number} playersCount
 * @returns {string}
 */
function getPlayersRequirement(game, playersCount) {
  if (playersCount < game.minPlayers) {
    return t('hub.minPlayers', { count: formatNumber(game.minPlayers) });
  }
  if (playersCount > game.maxPlayers) {
    return t('hub.maxPlayers', { count: formatNumber(game.maxPlayers) });
  }
  return '';
}

/**
 * Karta gry. Zablokowana karta ma prawdziwy atrybut disabled (nie tylko klasę),
 * a powód blokady jest widoczny bez dotykania karty.
 * @param {Readonly<import('../core/game-contract.js').GameDefinition>} game
 * @param {number} playersCount
 * @returns {HTMLButtonElement}
 */
function createGameCard(game, playersCount) {
  const requirement = getPlayersRequirement(game, playersCount);
  const isLocked = requirement !== '';

  return el(
    'button',
    {
      class: isLocked ? 'game-card game-card--disabled' : 'game-card',
      type: 'button',
      disabled: isLocked,
      onClick: () => navigate('details', { gameId: game.id }),
    },
    [
      el('span', { class: 'game-card__icon', 'aria-hidden': 'true', text: game.icon }),
      el('span', { class: 'game-card__body' }, [
        el('span', { class: 'game-card__title', text: game.name }),
        el('span', { class: 'game-card__desc', text: game.description }),
        el('span', {
          class: 'game-card__meta',
          text: t('hub.playersRange', {
            range: formatPlayersRange(game.minPlayers, game.maxPlayers),
          }),
        }),
        isLocked ? el('span', { class: 'game-card__warning', text: requirement }) : null,
      ]),
      el('span', {
        class: isLocked ? 'game-card__lock' : 'game-card__chevron',
        'aria-hidden': 'true',
        text: isLocked ? '🔒' : '›',
      }),
    ],
  );
}

