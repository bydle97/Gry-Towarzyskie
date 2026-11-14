/**
 * Ekran konfiguracji graczy: liczba graczy w dozwolonym zakresie gry + imiona.
 * Imiona trzymamy wyłącznie w pamięci sesji (js/core/session.js) — bez zapisu na dysku.
 */
import { clear, el } from '../core/dom.js';
import { formatPlayersCount, formatPlayersRange } from '../core/format.js';
import { getGameById } from '../core/games-registry.js';
import { navigate } from '../core/router.js';
import {
  PLAYER_NAME_MAX_LENGTH,
  getPlayerNames,
  normalizePlayerName,
  setPlayerNames,
  validatePlayerNames,
} from '../core/session.js';

/**
 * @param {{container: HTMLElement, params: {gameId?: string}}} context
 */
export function renderPlayersScreen({ container, params }) {
  const game = getGameById(params.gameId);

  if (!game) {
    container.append(createMissingGameBox());
    return;
  }

  const rememberedNames = getPlayerNames();
  const names = Array.from({ length: game.maxPlayers }, (_, index) => rememberedNames[index] ?? '');
  const startingCount = rememberedNames.length > 0 ? rememberedNames.length : game.minPlayers;
  let playerCount = clamp(startingCount, game.minPlayers, game.maxPlayers);

  const countValue = el('span', {
    class: 'stepper__value',
    text: String(playerCount),
    'aria-live': 'polite',
  });
  const minusButton = el('button', {
    class: 'stepper__button',
    type: 'button',
    text: '−',
    'aria-label': 'Mniej graczy',
    onClick: () => changeCount(-1),
  });
  const plusButton = el('button', {
    class: 'stepper__button',
    type: 'button',
    text: '+',
    'aria-label': 'Więcej graczy',
    onClick: () => changeCount(1),
  });
  const fieldsList = el('div', { class: 'stack' });
  const errorBox = el('p', { class: 'form-error', role: 'alert', hidden: true });

  function changeCount(delta) {
    playerCount = clamp(playerCount + delta, game.minPlayers, game.maxPlayers);
    renderFields();
  }

  function hideError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  function renderFields() {
    clear(fieldsList);

    for (let index = 0; index < playerCount; index += 1) {
      const input = el('input', {
        class: 'input',
        type: 'text',
        id: `player-name-${index}`,
        maxLength: PLAYER_NAME_MAX_LENGTH,
        autocomplete: 'off',
        placeholder: 'Wpisz imię',
        value: names[index],
        onInput: (event) => {
          names[index] = event.target.value;
          hideError();
        },
      });

      fieldsList.append(
        el('div', { class: 'field' }, [
          el('label', { class: 'field__label', for: `player-name-${index}`, text: `Gracz ${index + 1}` }),
          input,
        ]),
      );
    }

    countValue.textContent = String(playerCount);
    minusButton.disabled = playerCount <= game.minPlayers;
    plusButton.disabled = playerCount >= game.maxPlayers;
    submitButton.textContent = `Dalej: ${formatPlayersCount(playerCount)}`;
  }

  function onSubmit() {
    const enteredNames = names.slice(0, playerCount).map(normalizePlayerName);
    const errors = validatePlayerNames(enteredNames);

    if (errors.length > 0) {
      errorBox.textContent = errors[0];
      errorBox.hidden = false;

      const firstEmptyIndex = enteredNames.findIndex((name) => name === '');
      if (firstEmptyIndex >= 0) {
        const input = fieldsList.querySelectorAll('input')[firstEmptyIndex];
        if (input) {
          input.focus();
        }
      }
      return;
    }

    setPlayerNames(enteredNames);
    navigate('details', { gameId: game.id });
  }

  const submitButton = el('button', {
    class: 'button button--primary button--block',
    type: 'button',
    text: `Dalej: ${formatPlayersCount(playerCount)}`,
    onClick: onSubmit,
  });

  container.append(
    el('div', { class: 'panel' }, [
      el('h2', { class: 'panel__title', text: 'Liczba graczy' }),
      el('div', { class: 'stepper' }, [minusButton, countValue, plusButton]),
      el('p', {
        class: 'stepper__hint',
        text: `Dla tej gry: ${formatPlayersRange(game.minPlayers, game.maxPlayers)}.`,
      }),
    ]),

    el('div', { class: 'panel' }, [
      el('h2', { class: 'panel__title', text: 'Imiona graczy' }),
      el('p', {
        class: 'stepper__hint',
        text: 'Imiona są przechowywane tylko w pamięci aplikacji i znikają po zamknięciu karty.',
      }),
      fieldsList,
      errorBox,
    ]),

    submitButton,
  );

  renderFields();
}

/**
 * Ogranicza liczbę do zakresu <min, max>.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createMissingGameBox() {
  return el('div', { class: 'empty-state' }, [
    el('span', { class: 'empty-state__icon', 'aria-hidden': 'true', text: '❓' }),
    el('p', { class: 'empty-state__title', text: 'Nie znaleziono gry' }),
    el('p', { text: 'Ta gra nie istnieje w rejestrze gier.' }),
    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: 'Wróć do listy gier',
      onClick: () => navigate('home', {}, { reset: true }),
    }),
  ]);
}
