/**
 * Komponent edytora listy graczy (sekcja "Lista graczy" na ekranie głównym).
 *
 * Gracze żyją wyłącznie w pamięci sesji (core/session.js) — nic nie trafia na dysk.
 * Komponent sam zarządza swoim fragmentem DOM-u i po każdej zmianie listy woła
 * onChange(names), żeby ekran mógł odświeżyć elementy zależne (np. karty gier).
 * Ekran główny przerysowuje wtedy tylko sekcję gier, więc pole imienia zachowuje
 * focus i można dodawać kolejne osoby bez zamykania klawiatury.
 */
import { clear, el } from '../core/dom.js';
import {
  PLAYER_NAME_MAX_LENGTH,
  addPlayerName,
  getPlayerNames,
  removePlayerName,
  updatePlayerName,
} from '../core/session.js';

/**
 * Montuje edytor listy graczy w podanym kontenerze.
 * @param {{container: HTMLElement, onChange?: (names: string[]) => void}} options
 */
export function mountPlayerListEditor({ container, onChange }) {
  const view = {
    editingIndex: -1,
    draftName: '',
    editDraft: '',
    error: '',
    focusAdd: false,
    focusEdit: false,
  };

  render();

  function notifyChange() {
    if (typeof onChange === 'function') {
      onChange(getPlayerNames());
    }
  }

  function render() {
    clear(container);

    const players = getPlayerNames();

    container.append(
      el('h2', { class: 'panel__title', text: `Lista graczy: ${players.length}` }),
      createAddForm(),
      createErrorBox(),
      createList(players),
    );

    if (view.focusAdd) {
      view.focusAdd = false;
      container.querySelector('#player-name-input')?.focus();
    } else if (view.focusEdit) {
      view.focusEdit = false;
      container.querySelector('#edit-player-input')?.focus();
    }
  }

  function createAddForm() {
    return el(
      'form',
      {
        class: 'player-form',
        novalidate: true,
        onSubmit: (event) => {
          event.preventDefault();
          handleAdd();
        },
      },
      [
        el('label', {
          class: 'visually-hidden',
          for: 'player-name-input',
          text: 'Imię gracza',
        }),
        el('div', { class: 'row' }, [
          el('input', {
            class: 'input',
            id: 'player-name-input',
            type: 'text',
            maxLength: PLAYER_NAME_MAX_LENGTH,
            autocomplete: 'off',
            placeholder: 'Imię gracza',
            value: view.draftName,
            onInput: (event) => {
              view.draftName = event.target.value;
            },
          }),
          el('button', { class: 'button button--primary', type: 'submit', text: 'Dodaj' }),
        ]),
      ],
    );
  }

  function createErrorBox() {
    return el('p', {
      class: 'form-error',
      role: 'alert',
      hidden: view.error === '',
      text: view.error,
    });
  }

  function createList(players) {
    if (players.length === 0) {
      return el('p', {
        class: 'player-list-editor__empty',
        text: 'Dodaj graczy, aby odblokować gry.',
      });
    }

    return el(
      'ul',
      { class: 'player-list-editor__list' },
      players.map((name, index) =>
        el('li', {}, [
          view.editingIndex === index ? createEditRow(index) : createPlayerRow(name, index),
        ]),
      ),
    );
  }

  function createPlayerRow(name, index) {
    return el('div', { class: 'player-row' }, [
      el('span', { class: 'player-row__index', text: `${index + 1}.` }),
      el('span', { class: 'player-row__name', text: name }),
      el('div', { class: 'player-row__actions' }, [
        el('button', {
          class: 'button button--secondary button--compact',
          type: 'button',
          text: 'Edytuj',
          'aria-label': `Edytuj gracza ${name}`,
          onClick: () => startEdit(index),
        }),
        el('button', {
          class: 'button button--secondary button--compact',
          type: 'button',
          text: 'Usuń',
          'aria-label': `Usuń gracza ${name}`,
          onClick: () => handleRemove(index),
        }),
      ]),
    ]);
  }

  function createEditRow(index) {
    return el(
      'form',
      {
        class: 'player-row player-row--editing',
        novalidate: true,
        onSubmit: (event) => {
          event.preventDefault();
          handleSave(index);
        },
      },
      [
        el('label', {
          class: 'visually-hidden',
          for: 'edit-player-input',
          text: `Imię gracza ${index + 1}`,
        }),
        el('input', {
          class: 'input',
          id: 'edit-player-input',
          type: 'text',
          maxLength: PLAYER_NAME_MAX_LENGTH,
          autocomplete: 'off',
          value: view.editDraft,
          onInput: (event) => {
            view.editDraft = event.target.value;
          },
        }),
        el('div', { class: 'player-row__actions' }, [
          el('button', {
            class: 'button button--primary button--compact',
            type: 'submit',
            text: 'Zapisz',
          }),
          el('button', {
            class: 'button button--secondary button--compact',
            type: 'button',
            text: 'Anuluj',
            onClick: cancelEdit,
          }),
        ]),
      ],
    );
  }

  function handleAdd() {
    const result = addPlayerName(view.draftName);

    if (!result.ok) {
      view.error = result.error;
      view.focusAdd = true;
      render();
      return;
    }

    view.draftName = '';
    view.error = '';
    view.focusAdd = true;
    render();
    notifyChange();
  }

  function startEdit(index) {
    view.editingIndex = index;
    view.editDraft = getPlayerNames()[index] ?? '';
    view.error = '';
    view.focusEdit = true;
    render();
  }

  function cancelEdit() {
    view.editingIndex = -1;
    view.editDraft = '';
    view.error = '';
    render();
  }

  function handleSave(index) {
    const result = updatePlayerName(index, view.editDraft);

    if (!result.ok) {
      view.error = result.error;
      view.focusEdit = true;
      render();
      return;
    }

    view.editingIndex = -1;
    view.editDraft = '';
    view.error = '';
    render();
    notifyChange();
  }

  function handleRemove(index) {
    if (view.editingIndex === index) {
      view.editingIndex = -1;
      view.editDraft = '';
    } else if (view.editingIndex > index) {
      view.editingIndex -= 1;
    }

    removePlayerName(index);
    view.error = '';
    render();
    notifyChange();
  }
}
