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
