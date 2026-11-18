/**
 * Router ekranów HUB-a — bez bibliotek i bez History API.
 *
 * Ekrany rejestrują się przez registerScreen(). Funkcja render dostaje
 * { container, params } i może zwrócić funkcję czyszczącą (cleanup), która jest
 * wywoływana przed pokazaniem następnego ekranu — dzięki temu gra może posprzątać
 * swoje timery w kontrolowany sposób.
 */
import { clear, el } from './dom.js';
import { t } from './i18n.js';

/** @type {Map<string, {title: string|((params: Object) => string), render: Function, hideHeader: boolean}>} */
const screens = new Map();

/** @type {Array<{name: string, params: Object}>} */
const historyStack = [];

let shell = null;
let currentRoute = null;
let currentCleanup = null;

/**
 * Podłącza router do elementów szkieletu z index.html.
 * @param {{
 *   container: HTMLElement,
 *   titleElement: HTMLElement,
 *   backButton: HTMLButtonElement,
 *   header?: HTMLElement,
 * }} elements
 */
export function initRouter({ container, titleElement, backButton, header = null }) {
  shell = { container, titleElement, backButton, header };
  backButton.addEventListener('click', () => {
    back();
  });
}

/**
 * Rejestruje ekran.
 * @param {string} name nazwa ekranu, np. "home"
 * @param {{
 *   title?: string|((params: Object) => string),
 *   render: Function,
 *   hideHeader?: boolean,
 * }} definition
 *   hideHeader — ekran ukrywa nagłówek aplikacji (np. ekran główny z własnym tytułem)
 */
export function registerScreen(name, definition) {
  if (typeof definition?.render !== 'function') {
    throw new Error(`Ekran "${name}" musi mieć funkcję render().`);
  }
  screens.set(name, {
    title: definition.title ?? '',
    render: definition.render,
    hideHeader: definition.hideHeader === true,
  });
}

/**
 * Pokazuje ekran.
 * @param {string} name
 * @param {Object} [params]
 * @param {{replace?: boolean, reset?: boolean}} [options]
 *   replace — nie dodawaj obecnego ekranu do historii,
 *   reset — wyczyść historię (np. powrót do ekranu głównego)
 */
export function navigate(name, params = {}, { replace = false, reset = false } = {}) {
  if (reset) {
    historyStack.length = 0;
  } else if (!replace && currentRoute) {
    historyStack.push(currentRoute);
  }
  renderRoute({ name, params });
}

/**
 * Wraca do poprzedniego ekranu.
 * @returns {boolean} false, gdy nie ma dokąd wrócić
 */
export function back() {
  if (historyStack.length === 0) {
    return false;
  }
  renderRoute(historyStack.pop());
  return true;
}

/**
 * Przerysowuje bieżący ekran bez zmiany historii (np. po zmianie języka).
 * @returns {boolean} false, gdy żaden ekran nie jest jeszcze pokazany
 */
export function refreshCurrentScreen() {
  if (!currentRoute) {
    return false;
  }

  // Odświeżenie (np. zmiana języka) zostawia przewinięcie strony bez zmian.
  renderRoute(
    { name: currentRoute.name, params: { ...currentRoute.params } },
    { scrollToTop: false },
  );
  return true;
}

/**
 * Rysuje ekran.
 * @param {{name: string, params: Object}} route
 * @param {{scrollToTop?: boolean}} [options]
 *   scrollToTop — po narysowaniu przewiń stronę na górę (domyślnie tak; nowy ekran
 *   nie może zaczynać się w miejscu, w którym przewinięty był poprzedni)
 */
function renderRoute(route, { scrollToTop = true } = {}) {
  if (!shell) {
    throw new Error('Router nie został zainicjowany: wywołaj initRouter() w main.js.');
  }

  if (typeof currentCleanup === 'function') {
    try {
      currentCleanup();
    } catch (error) {
      console.error('Błąd czyszczenia poprzedniego ekranu:', error);
    }
  }
  currentCleanup = null;
  currentRoute = route;

  clear(shell.container);
  const screenElement = el('section', { class: 'screen', dataset: { screen: route.name } });
  shell.container.append(screenElement);

  const screen = screens.get(route.name);
  shell.titleElement.textContent = resolveTitle(screen, route.params);
  shell.backButton.hidden = historyStack.length === 0;
  if (shell.header) {
    shell.header.hidden = screen?.hideHeader === true;
  }

  if (!screen) {
    renderMissingScreen(screenElement, route.name);
  } else {
    const cleanup = screen.render({ container: screenElement, params: route.params ?? {} });
    if (typeof cleanup === 'function') {
      currentCleanup = cleanup;
    }
  }

  if (scrollToTop) {
    window.scrollTo(0, 0);
  }
}

function resolveTitle(screen, params) {
  if (!screen) {
    return t('router.missingTitle');
  }
  return typeof screen.title === 'function' ? screen.title(params ?? {}) : screen.title;
}

function renderMissingScreen(container, name) {
  container.append(
    el('div', { class: 'empty-state' }, [
      el('span', { class: 'empty-state__icon', 'aria-hidden': 'true', text: '🧭' }),
      el('p', { class: 'empty-state__title', text: t('router.missingHeading') }),
      el('p', { text: t('router.missingText', { name }) }),
      el('button', {
        class: 'button button--primary button--block',
        type: 'button',
        text: t('router.backHome'),
        onClick: () => navigate('home', {}, { reset: true }),
      }),
    ]),
  );
}
