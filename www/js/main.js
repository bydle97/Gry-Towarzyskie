/**
 * Punkt wejścia HUB-a: podłącza router do szkieletu z index.html,
 * rejestruje ekrany i startuje od listy graczy (pierwszy ekran aplikacji).
 */
import { getGameById } from './core/games-registry.js';
import { initRouter, navigate, registerScreen } from './core/router.js';
import { renderHomeScreen } from './screens/home-screen.js';
import { renderPlayersScreen } from './screens/players-screen.js';
import { renderDetailsScreen } from './screens/details-screen.js';
import { renderGameScreen } from './screens/game-screen.js';

const container = document.getElementById('app');
const titleElement = document.getElementById('screen-title');
const backButton = document.getElementById('back-button');

if (!container || !titleElement || !backButton) {
  throw new Error('Brak elementów szkieletu w index.html: #app, #screen-title, #back-button.');
}

initRouter({ container, titleElement, backButton });

registerScreen('home', {
  title: 'Gry towarzyskie',
  render: renderHomeScreen,
});

registerScreen('players', {
  title: 'Gracze',
  render: renderPlayersScreen,
});

registerScreen('details', {
  title: ({ gameId }) => getGameById(gameId)?.name ?? 'Szczegóły gry',
  render: renderDetailsScreen,
});

registerScreen('game', {
  title: ({ gameId }) => getGameById(gameId)?.name ?? 'Gra',
  render: renderGameScreen,
});

// Aplikacja startuje od listy graczy — grę wybieramy dopiero po skomponowaniu ekipy.
navigate('players', {}, { reset: true });
