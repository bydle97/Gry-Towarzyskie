/**
 * Punkt wejścia HUB-a: podłącza router do szkieletu z index.html,
 * rejestruje ekrany i startuje od ekranu głównego (tytuł + gracze + gry).
 */
import { getGameById } from './core/games-registry.js';
import { initRouter, navigate, registerScreen } from './core/router.js';
import { renderHomeScreen } from './screens/home-screen.js';
import { renderDetailsScreen } from './screens/details-screen.js';
import { renderGameScreen } from './screens/game-screen.js';

const container = document.getElementById('app');
const titleElement = document.getElementById('screen-title');
const backButton = document.getElementById('back-button');
const header = document.querySelector('.app-header');

if (!container || !titleElement || !backButton || !header) {
  throw new Error('Brak elementów szkieletu w index.html: .app-header, #app, #screen-title, #back-button.');
}

initRouter({ container, titleElement, backButton, header });

// Ekran główny ma własny, duży tytuł — nagłówek aplikacji jest na nim ukryty.
registerScreen('home', {
  title: 'Gry Towarzyskie',
  hideHeader: true,
  render: renderHomeScreen,
});

registerScreen('details', {
  title: ({ gameId }) => getGameById(gameId)?.name ?? 'Szczegóły gry',
  render: renderDetailsScreen,
});

registerScreen('game', {
  title: ({ gameId }) => getGameById(gameId)?.name ?? 'Gra',
  render: renderGameScreen,
});

navigate('home', {}, { reset: true });
