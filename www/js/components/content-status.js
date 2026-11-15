/**
 * Wspólne ekrany stanu wczytywania treści gier.
 *
 * Gry pokazują je, zanim dostaną dane z plików w www/data/. Korzystają
 * wyłącznie z globalnych klas HUB-a, więc nie wymagają własnych stylów.
 */
import { el } from '../core/dom.js';
import { t } from '../core/i18n.js';

/**
 * Krótki ekran „Wczytywanie…” (ogłaszany czytnikom ekranu).
 * @param {{message?: string}} [options]
 * @returns {HTMLElement}
 */
export function renderLoadingScreen({ message = t('content.loading') } = {}) {
  return el('div', { class: 'stack' }, [
    el('div', { class: 'panel', role: 'status', 'aria-live': 'polite' }, [
      el('h2', { class: 'panel__title', text: message }),
      el('p', { text: t('content.loadingHint') }),
    ]),
  ]);
}

/**
 * Ekran błędu wczytywania z ponowieniem i powrotem do HUB-a.
 * @param {{
 *   title?: string,
 *   message?: string,
 *   onRetry: () => void,
 *   onExit: () => void,
 * }} options
 * @returns {HTMLElement}
 */
export function renderLoadErrorScreen({
  title = t('content.errorTitle'),
  message = '',
  onRetry,
  onExit,
}) {
  return el('div', { class: 'stack' }, [
    el('div', { class: 'panel', role: 'alert' }, [
      el('h2', { class: 'panel__title', text: title }),
      message === '' ? null : el('p', { text: message }),
    ]),
    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: t('content.retry'),
      onClick: onRetry,
    }),
    el('button', {
      class: 'button button--secondary button--block',
      type: 'button',
      text: t('content.backToHub'),
      onClick: onExit,
    }),
  ]);
}
