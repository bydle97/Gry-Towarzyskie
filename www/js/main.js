/**
 * Punkt wejścia HUB-a: inicjalizuje tłumaczenia, podłącza router do szkieletu
 * z index.html, rejestruje ekrany i startuje od ekranu głównego.
 */
import { getGameById, getGameTranslationKeys } from './core/games-registry.js';
import { checkTranslations, init as initI18n, onLanguageChange, t } from './core/i18n.js';
import { onSystemBack } from './core/native.js';
import {
  handleSystemBack,
  initRouter,
  navigate,
  refreshCurrentScreen,
  registerScreen,
} from './core/router.js';
import { renderHomeScreen } from './screens/home-screen.js';
import { renderDetailsScreen } from './screens/details-screen.js';
import { renderGameScreen } from './screens/game-screen.js';

/** Teksty zapisane bezpośrednio w index.html (poza routerem). */
function applyStaticTexts() {
  const backButton = document.getElementById('back-button');

  if (backButton) {
    backButton.setAttribute('aria-label', t('app.backAria'));
  }

  const noscript = document.getElementById('noscript-message');

  if (noscript) {
    noscript.textContent = t('app.noscript');
  }
}

async function start() {
  await initI18n();

  // Narzędzie dla autora (konsola przeglądarki): kompletność tłumaczeń
  // oraz istnienie kluczy użytych w rejestrze gier.
  window.__i18nCheck = () => checkTranslations({ requiredKeys: getGameTranslationKeys() });

  const container = document.getElementById('app');
  const titleElement = document.getElementById('screen-title');
  const backButton = document.getElementById('back-button');
  const header = document.querySelector('.app-header');

  if (!container || !titleElement || !backButton || !header) {
    throw new Error(
      'Brak elementów szkieletu w index.html: .app-header, #app, #screen-title, #back-button.',
    );
  }

  initRouter({ container, titleElement, backButton, header });

  // Ekran główny ma własny, duży tytuł — nagłówek aplikacji jest na nim ukryty.
  registerScreen('home', {
    title: () => t('hub.screenTitle'),
    hideHeader: true,
    render: renderHomeScreen,
  });

  registerScreen('details', {
    title: ({ gameId }) => getGameById(gameId)?.name ?? t('details.fallbackTitle'),
    render: renderDetailsScreen,
  });

  registerScreen('game', {
    title: ({ gameId }) => getGameById(gameId)?.name ?? t('game.fallbackTitle'),
    render: renderGameScreen,
  });

  // Język można zmienić tylko na ekranie głównym; po zmianie przerysowujemy
  // bieżący ekran (na ekranie głównym to właśnie ten z przełącznikiem).
  onLanguageChange(() => {
    applyStaticTexts();
    refreshCurrentScreen();
  });

  // Przycisk „wstecz” Androida (tylko w APK; w przeglądarce no-op): w grze okno
  // „Zakończyć grę?”, poza grą krok wstecz, na ekranie głównym zamknięcie aplikacji.
  onSystemBack(handleSystemBack);

  applyStaticTexts();
  navigate('home', {}, { reset: true });
}

start().catch((error) => {
  console.error('Błąd uruchamiania aplikacji:', error);

  const container = document.getElementById('app');

  if (container) {
    // Komunikat awaryjny przed/bez i18n — aplikacja nie ma wtedy tłumaczeń,
    // więc tekst jest wprost, w obu językach. Częsta przyczyna: brak serwera.
    container.textContent =
      'Nie udało się uruchomić aplikacji. Odśwież stronę. Aplikację trzeba otworzyć przez serwer (adres strony), a nie z pliku. ' +
      '/ The app failed to start. Reload the page. Open it through a web server (a page address), not as a file.';
  }
});
