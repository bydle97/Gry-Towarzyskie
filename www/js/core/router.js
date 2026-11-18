/**
 * Router ekranów HUB-a — bez bibliotek i bez zmiany adresu w pasku przeglądarki.
 *
 * Ekrany rejestrują się przez registerScreen(). Funkcja render dostaje
 * { container, params } i może zwrócić funkcję czyszczącą (cleanup), która jest
 * wywoływana przed pokazaniem następnego ekranu — dzięki temu gra może posprzątać
 * swoje timery w kontrolowany sposób.
 *
 * Historia przeglądarki (gest i przycisk „wstecz”):
 *  - każdy ekran to jeden wpis History API ze stanem { gt, depth, route } — adres
 *    strony się nie zmienia, zmienia się tylko stan wpisu,
 *  - depth = długość stosu routera, więc wpis bazowy (depth 0) to ekran główny;
 *    „wstecz” na ekranie głównym wychodzi z aplikacji jak na zwykłej stronie,
 *  - strzałka w nagłówku woła history.back(), a o przejściu decyduje popstate,
 *  - ekran może zarejestrować własną obsługę „wstecz” (setBackHandler) — ekran gry
 *    pokazuje wtedy okno „Zakończyć grę?” zamiast od razu wychodzić.
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

/** Ile ms po przejściu ignorujemy kolejne navigate()/back() (podwójne dotknięcie karty, „Start”). */
const NAVIGATION_GUARD_MS = 300;

let lastNavigateAt = Number.NEGATIVE_INFINITY;

/** Identyfikator tego załadowania strony — wpisy historii sprzed odświeżenia są „obce”. */
const SESSION_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/**
 * Własna obsługa „wstecz” bieżącego ekranu (np. okno wyjścia z gry).
 * @type {null | ((options: {onCancel: () => void}) => void)}
 */
let backHandler = null;

/**
 * true = po geście „wstecz” przeglądarka jest o jeden wpis za pokazanym ekranem
 * (np. gra czeka na odpowiedź w oknie „Zakończyć grę?”).
 */
let exitPrompt = false;

/** Ile zdarzeń popstate pominąć (wywołanych przez nas history.go() przy reset). */
let ignoredPops = 0;

/** Ekran, który po resecie ma trafić do wpisu bazowego, gdy history.go() się zakończy. */
let pendingBaseRoute = null;

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
  window.addEventListener('popstate', handlePopState);
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
 * Ustawia własną obsługę „wstecz” dla bieżącego ekranu (np. ekran gry).
 * Handler dostaje { onCancel } — trzeba je wywołać, gdy użytkownik zostaje
 * na ekranie (router dopisze wtedy z powrotem wpis historii).
 * @param {(options: {onCancel: () => void}) => void} handler
 * @returns {() => void} funkcja wyrejestrowująca
 */
export function setBackHandler(handler) {
  backHandler = handler;

  return () => {
    if (backHandler === handler) {
      backHandler = null;
    }
  };
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
  // Drugie wywołanie tuż po pierwszym to niemal zawsze podwójne dotknięcie.
  if (!passNavigationGuard()) {
    return;
  }

  const route = { name, params };

  if (exitPrompt) {
    // Wyjście po geście „wstecz”: przeglądarka jest już na wpisie poprzedniego
    // ekranu, więc kończymy to cofnięcie — stos traci ostatni ekran, a wpis,
    // na którym stoi przeglądarka, dostaje nowy ekran.
    exitPrompt = false;
    historyStack.length = Math.max(0, historyStack.length - 1);
    renderRoute(route);
    writeHistory('replace', route);
    return;
  }

  if (reset) {
    const depth = historyStack.length;
    historyStack.length = 0;
    renderRoute(route);

    if (depth > 0 && goInHistory(-depth)) {
      // Wracamy do wpisu bazowego: „wstecz” z ekranu głównego ma wyjść z aplikacji.
      ignoredPops += 1;
      pendingBaseRoute = route;
    } else {
      writeHistory('replace', route);
    }
    return;
  }

  if (replace) {
    renderRoute(route);
    writeHistory('replace', route);
    return;
  }

  if (currentRoute) {
    historyStack.push(currentRoute);
  }
  renderRoute(route);
  writeHistory('push', route);
}

/**
 * Wraca do poprzedniego ekranu (strzałka w nagłówku): history.back(),
 * a samo przejście wykonuje handler popstate.
 * @returns {boolean} false, gdy nie ma dokąd wrócić
 */
export function back() {
  if (historyStack.length === 0 || !passNavigationGuard()) {
    return false;
  }

  try {
    window.history.back();
  } catch (error) {
    // Bez History API: cofamy się bez historii przeglądarki.
    renderRoute(historyStack.pop());
  }
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

/** @returns {boolean} true, gdy można nawigować (minęła blokada podwójnego dotknięcia) */
function passNavigationGuard() {
  const now = performance.now();

  if (now - lastNavigateAt < NAVIGATION_GUARD_MS) {
    return false;
  }

  lastNavigateAt = now;
  return true;
}

/**
 * Stan wpisu historii dla ekranu na danej głębokości stosu.
 * @param {number} depth
 * @param {{name: string, params: Object}} route
 */
function createEntryState(depth, route) {
  return {
    gt: SESSION_ID,
    depth,
    route: { name: route.name, params: { ...(route.params ?? {}) } },
  };
}

/**
 * Zapisuje bieżący ekran w historii przeglądarki (bez zmiany adresu).
 * @param {'push'|'replace'} mode
 * @param {{name: string, params: Object}} route
 * @param {number} [depth] domyślnie długość stosu routera
 */
function writeHistory(mode, route, depth = historyStack.length) {
  try {
    const entry = createEntryState(depth, route);

    if (mode === 'push') {
      window.history.pushState(entry, '');
    } else {
      window.history.replaceState(entry, '');
    }
  } catch (error) {
    // Brak History API (np. bardzo stara przeglądarka) — router działa bez historii.
  }
}

/** @returns {boolean} true, gdy udało się poprosić przeglądarkę o przejście */
function goInHistory(delta) {
  try {
    window.history.go(delta);
    return true;
  } catch (error) {
    return false;
  }
}

/** Użytkownik został na ekranie (np. „Zostań w grze”) — dopisujemy z powrotem jego wpis. */
function restoreAfterCancel() {
  if (!exitPrompt || !currentRoute) {
    return;
  }

  exitPrompt = false;
  writeHistory('push', currentRoute);
}

/**
 * Gest/przycisk „wstecz” albo „dalej” przeglądarki.
 * @param {PopStateEvent} event
 */
function handlePopState(event) {
  if (ignoredPops > 0) {
    // To nasze history.go() z navigate(..., {reset: true}).
    ignoredPops -= 1;

    if (pendingBaseRoute) {
      writeHistory('replace', pendingBaseRoute, 0);
      pendingBaseRoute = null;
    }
    return;
  }

  const entry = event.state;

  if (!entry || entry.gt !== SESSION_ID || typeof entry.depth !== 'number' || !entry.route) {
    // Wpis sprzed odświeżenia strony albo spoza aplikacji: zaczynamy od ekranu głównego
    // i ten wpis staje się nowym wpisem bazowym.
    exitPrompt = false;
    historyStack.length = 0;
    renderRoute({ name: 'home', params: {} });
    writeHistory('replace', { name: 'home', params: {} }, 0);
    return;
  }

  const renderedDepth = historyStack.length;

  if (exitPrompt) {
    if (entry.depth < renderedDepth - 1) {
      // Kolejny „wstecz” przy otwartym oknie: zostajemy o jeden wpis za ekranem,
      // żeby przeglądarka nie uciekła dalej, zanim użytkownik odpowie.
      writeHistory('push', historyStack[renderedDepth - 1], renderedDepth - 1);
    } else if (entry.depth >= renderedDepth) {
      // „Dalej” przy otwartym oknie — przeglądarka znów stoi na wpisie ekranu.
      exitPrompt = false;
    }
    return;
  }

  if (entry.depth < renderedDepth) {
    if (backHandler) {
      // Ekran z własną obsługą (gra): zostaje na ekranie i pyta użytkownika.
      exitPrompt = true;

      if (entry.depth < renderedDepth - 1) {
        writeHistory('push', historyStack[renderedDepth - 1], renderedDepth - 1);
      }

      try {
        backHandler({ onCancel: restoreAfterCancel });
      } catch (error) {
        console.error('Błąd obsługi „wstecz” ekranu:', error);
      }
      return;
    }

    historyStack.length = entry.depth;
    renderRoute(entry.route);
    return;
  }

  if (entry.depth > renderedDepth) {
    // „Dalej” przeglądarki: ekran z wpisu trafia na wierzch stosu.
    if (currentRoute) {
      historyStack.push(currentRoute);
    }
    renderRoute(entry.route);

    if (entry.depth !== historyStack.length) {
      writeHistory('replace', entry.route);
    }
  }
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
