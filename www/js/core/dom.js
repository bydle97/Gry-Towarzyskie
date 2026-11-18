/**
 * Mini-helpery DOM — zamiast frameworka.
 * Wszystko tworzymy przez document.createElement i wstawiamy jako węzły tekstowe,
 * więc żadna treść nie jest wstrzykiwana jako HTML.
 */

/**
 * Tworzy element.
 * @param {string} tag nazwa znacznika, np. "button"
 * @param {Object} [props] właściwości: "class", "text", "dataset", "onClick" (i inne on*),
 *                         pozostałe trafiają jako właściwość DOM albo atrybut (np. "aria-label")
 * @param {Array|Node|string} [children] dzieci (węzły lub teksty, mogą być zagnieżdżone w tablicach)
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) {
      continue;
    }

    if (key === 'class') {
      node.className = value;
    } else if (key === 'text') {
      node.textContent = value;
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node) {
      node[key] = value;
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }

  appendChildren(node, children);
  return node;
}

/**
 * Dopisuje dzieci (węzły, teksty, zagnieżdżone tablice; null/undefined/false pomija).
 * @param {Node} node
 * @param {Array|Node|string} children
 */
export function appendChildren(node, children) {
  for (const child of [children].flat(Infinity)) {
    if (child === null || child === undefined || child === false) {
      continue;
    }
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/**
 * Usuwa całą zawartość elementu (bez zamiany elementu).
 * @param {HTMLElement} node
 */
export function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  return node;
}

/** Domyślna blokada dotknięć po zmianie ekranu gry (ms). */
export const SCREEN_CHANGE_GUARD_MS = 300;

/** @type {WeakMap<HTMLElement, {previous: string, until: number, timeoutId: number}>} */
const tapGuards = new WeakMap();

/**
 * Krótka blokada dotknięć: na `ms` milisekund ustawia container.style.pointerEvents
 * = 'none', a potem przywraca poprzednią wartość. Chroni przed „przeklikaniem”
 * nowego ekranu drugim dotknięciem, które było przeznaczone dla poprzedniego.
 *
 * Kolejne wywołanie w trakcie blokady może ją tylko wydłużyć (nigdy skrócić),
 * więc np. 800 ms po końcu pojedynku nie zostanie nadpisane przez 300 ms.
 * @param {HTMLElement} container
 * @param {number} ms
 */
export function guardTaps(container, ms) {
  if (!container || !(ms > 0)) {
    return;
  }

  const until = performance.now() + ms;
  const existing = tapGuards.get(container);

  if (existing && existing.until >= until) {
    return;
  }

  if (existing) {
    window.clearTimeout(existing.timeoutId);
  }

  const previous = existing ? existing.previous : container.style.pointerEvents;
  container.style.pointerEvents = 'none';

  const timeoutId = window.setTimeout(() => {
    container.style.pointerEvents = previous;
    tapGuards.delete(container);
  }, ms);

  tapGuards.set(container, { previous, until, timeoutId });
}

/**
 * Natychmiast zdejmuje blokadę z guardTaps() i usuwa jej timer
 * (wywoływać w unmount() gry, żeby nie zostawić aktywnego timera).
 * @param {HTMLElement} container
 */
export function clearTapGuard(container) {
  const existing = container ? tapGuards.get(container) : undefined;

  if (!existing) {
    return;
  }

  window.clearTimeout(existing.timeoutId);
  container.style.pointerEvents = existing.previous;
  tapGuards.delete(container);
}
