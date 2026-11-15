/**
 * Przełącznik języka na ekranie głównym HUB-a.
 *
 * Używa natywnego <select>, więc działa z klawiaturą i czytnikami ekranu.
 * Nazwy języków pochodzą z languages.js i są zawsze w swoim języku.
 */
import { el } from '../core/dom.js';
import { LANGUAGES } from '../core/languages.js';
import { getLanguage, setLanguage, t } from '../core/i18n.js';

/**
 * Buduje przełącznik języka z etykietą dostępną dla czytników ekranu.
 * @returns {HTMLElement}
 */
export function createLanguageSwitcher() {
  const selectId = 'language-select';

  const select = el(
    'select',
    {
      class: 'language-switcher__select',
      id: selectId,
      'aria-label': t('language.selectAria'),
      onChange: (event) => {
        setLanguage(event.target.value);
      },
    },
    LANGUAGES.map((language) =>
      el('option', {
        value: language.code,
        text: language.nativeName,
        selected: language.code === getLanguage(),
      }),
    ),
  );

  return el('div', { class: 'language-switcher' }, [
    el('label', {
      class: 'language-switcher__label',
      for: selectId,
      text: t('language.label'),
    }),
    select,
  ]);
}
