/**
 * Pierwszy ekran aplikacji: lista graczy sesji.
 * Graczy dodajemy, edytujemy i usuwamy w pamięci (js/core/session.js) — bez zapisu na dysku.
 * Ta sama lista trafia potem do każdej gry w mount(container, players, api).
 */
import { clear, el } from '../core/dom.js';
import { navigate } from '../core/router.js';
import {
  PLAYER_NAME_MAX_LENGTH,
  addPlayerName,
  getPlayerNames,
  removePlayerName,
  updatePlayerName,
} from '../core/session.js';

/** Ilu graczy potrzeba, aby przejść do listy gier. */
const MIN_PLAYERS_TO_CONTINUE = 2;

/**
 * @param {{container: HTMLElement}} context
 */
export function renderPlayersScreen({ container }) {
  const view = {
    editingIndex: -1,
    draftName: '',
    editDraft: '',
    error: '',
    focusAdd: false,
    focusEdit: false,
  };

  function render() {
    clear(container);

    const players = getPlayerNames();

    container.append(
      el('p', {
        class: 'screen__intro',
        text: 'Dodaj graczy, a potem wybierz grę. Lista żyje tylko w pamięci aplikacji.',
      }),
      createAddForm(),
      createErrorBox(),
      createPlayersPanel(players),
      createFooter(players),
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
        class: 'panel',
        novalidate: true,
        onSubmit: (event) => {
          event.preventDefault();
          handleAdd();
        },
      },
      [
        el('label', { class: 'field__label', for: 'player-name-input', text: 'Nowy gracz' }),
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
        el('p', {
          class: 'stepper__hint',
          text: `Maksymalnie ${PLAYER_NAME_MAX_LENGTH} znaków, bez powtórzeń.`,
        }),
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

  function createPlayersPanel(players) {
    const rows =
      players.length === 0
        ? [el('p', { class: 'stepper__hint', text: 'Lista jest pusta. Dodaj pierwszego gracza.' })]
        : players.map((name, index) =>
            view.editingIndex === index ? createEditRow(index) : createPlayerRow(name, index),
          );

    return el('div', { class: 'panel' }, [
      el('h2', {
        class: 'panel__title',
        text: `Lista graczy: ${players.length}`,
      }),
      el('div', { class: 'stack' }, rows),
    ]);
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

  function createFooter(players) {
    const canContinue = players.length >= MIN_PLAYERS_TO_CONTINUE;

    return el('div', { class: 'stack' }, [
      canContinue
        ? null
        : el('p', {
            class: 'stepper__hint',
            text: `Minimalna liczba graczy do przejścia dalej: ${MIN_PLAYERS_TO_CONTINUE}.`,
          }),
      el('button', {
        class: 'button button--primary button--block',
        type: 'button',
        text: 'Dalej: wybierz grę',
        disabled: !canContinue,
        onClick: () => navigate('home', {}, { replace: true }),
      }),
    ]);
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
  }

  render();
}
