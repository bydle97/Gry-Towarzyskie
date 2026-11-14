/**
 * Wspólny komponent podziału na dwie drużyny (dla gier drużynowych).
 *
 * Komponent rysuje się w przekazanym kontenerze i sam nim zarządza: przy każdym
 * kliknięciu czyści go i buduje od nowa, więc gra nie musi wiedzieć nic o jego
 * wnętrzu. Po kliknięciu „Zaczynamy" woła onConfirm z gotowym podziałem — dalszy
 * przebieg rozgrywki należy już do gry.
 *
 * Użycie w grze:
 *   const root = el('div', { class: 'stack' });
 *   container.append(root);
 *   mountTeamSetup({ container: root, players, onConfirm: (teams) => startGame(teams) });
 */
import { clear, el } from '../core/dom.js';
import { shuffle } from '../core/random.js';

/**
 * Drużyny. Nazwa i ikona rozróżniają je niezależnie od koloru (dostępność),
 * a className nadaje kolor przez zmienną CSS --team-color.
 */
export const TEAMS = Object.freeze([
  Object.freeze({ id: 'first', name: 'Drużyna 1', icon: '🔵', className: 'team--first' }),
  Object.freeze({ id: 'second', name: 'Drużyna 2', icon: '🟠', className: 'team--second' }),
]);

/** Minimalna liczba osób w drużynie, żeby można było zacząć grę. */
export const MIN_TEAM_SIZE = 2;

/**
 * Montuje ekran podziału na drużyny w podanym kontenerze.
 * @param {{
 *   container: HTMLElement,
 *   players: string[],
 *   onConfirm: (teams: {first: string[], second: string[]}) => void,
 * }} options
 */
export function mountTeamSetup({ container, players, onConfirm }) {
  /** @type {{first: string[], second: string[]}} */
  const teams = { first: [], second: [] };

  shuffleTeams();
  render();

  function otherTeamId(teamId) {
    return teamId === 'first' ? 'second' : 'first';
  }

  function shuffleTeams() {
    const shuffled = shuffle(players);
    const firstSize = Math.ceil(shuffled.length / 2);
    teams.first = shuffled.slice(0, firstSize);
    teams.second = shuffled.slice(firstSize);
  }

  function movePlayer(teamId, name) {
    const source = teams[teamId];
    const index = source.indexOf(name);

    if (index === -1) {
      return;
    }

    source.splice(index, 1);
    teams[otherTeamId(teamId)].push(name);
    render();
  }

  function getRoundsCount() {
    return Math.max(teams.first.length, teams.second.length);
  }

  function canStart() {
    return teams.first.length >= MIN_TEAM_SIZE && teams.second.length >= MIN_TEAM_SIZE;
  }

  function render() {
    clear(container);

    container.append(
      el('p', {
        class: 'screen__intro',
        text: 'Kliknij imię, aby przenieść gracza do drugiej drużyny.',
      }),
      el('div', { class: 'team-columns' }, TEAMS.map(createTeamColumn)),
      createMessages(),
      el('button', {
        class: 'button button--secondary button--block',
        type: 'button',
        text: 'Losuj ponownie',
        onClick: () => {
          shuffleTeams();
          render();
        },
      }),
      el('button', {
        class: 'button button--primary button--block',
        type: 'button',
        text: 'Zaczynamy',
        disabled: !canStart(),
        onClick: () => {
          if (!canStart()) {
            return;
          }
          onConfirm({ first: [...teams.first], second: [...teams.second] });
        },
      }),
    );
  }

  function createTeamColumn(team) {
    const names = teams[team.id];

    return el('div', { class: `team-column ${team.className}` }, [
      el('div', { class: 'team-column__header' }, [
        el('span', { class: 'team-column__icon', 'aria-hidden': 'true', text: team.icon }),
        el('span', { class: 'team-column__name', text: team.name }),
        el('span', { class: 'team-column__count', text: `${names.length}` }),
      ]),
      names.length === 0
        ? el('p', { class: 'team-column__empty', text: 'Brak graczy' })
        : el(
            'ul',
            { class: 'team-column__list' },
            names.map((name) =>
              el('li', {}, [
                el('button', {
                  class: 'team-name-button',
                  type: 'button',
                  text: name,
                  'aria-label': `Przenieś ${name} do drugiej drużyny`,
                  onClick: () => movePlayer(team.id, name),
                }),
              ]),
            ),
          ),
    ]);
  }

  function createMessages() {
    const messages = [];

    if (!canStart()) {
      messages.push(
        el('p', {
          class: 'form-error',
          text: `Każda drużyna musi mieć co najmniej ${MIN_TEAM_SIZE} osoby.`,
        }),
      );
    } else if (teams.first.length !== teams.second.length) {
      messages.push(
        el('p', {
          class: 'stepper__hint',
          text: 'Drużyny są nierówne. Gra potrwa tyle rund, ile osób ma większa drużyna.',
        }),
      );
    } else {
      messages.push(
        el('p', {
          class: 'stepper__hint',
          text: `Liczba rund: ${getRoundsCount()}.`,
        }),
      );
    }

    return el('div', { class: 'stack' }, messages);
  }
}
