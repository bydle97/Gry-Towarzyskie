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
 *
 * Gracze przychodzą jako lista {id, name}, a drużyny zwracamy jako tablice id —
 * dzięki temu podział i przenoszenie nie zależą od tekstu imienia.
 */
import { clear, el } from '../core/dom.js';
import { formatNumber, t, tPlural } from '../core/i18n.js';
import { shuffle } from '../core/random.js';

/**
 * Drużyny. Nazwa i ikona rozróżniają je niezależnie od koloru (dostępność),
 * a className nadaje kolor przez zmienną CSS --team-color.
 */
export const TEAMS = Object.freeze([
  Object.freeze({
    id: 'first',
    icon: '🔵',
    className: 'team--first',
    get name() {
      return t('teams.first');
    },
  }),
  Object.freeze({
    id: 'second',
    icon: '🟠',
    className: 'team--second',
    get name() {
      return t('teams.second');
    },
  }),
]);

/** Minimalna liczba osób w drużynie, żeby można było zacząć grę. */
export const MIN_TEAM_SIZE = 2;

/** Ile ms po kliknięciu ignorujemy kolejne kliknięcia przycisków zmieniających cały ekran. */
const BUTTON_GUARD_MS = 250;

/**
 * Montuje ekran podziału na drużyny w podanym kontenerze.
 * @param {{
 *   container: HTMLElement,
 *   players: Array<{id: string, name: string}>,
 *   onConfirm: (teams: {first: string[], second: string[]}) => void,
 *   minTeamSize?: number,
 * }} options
 *   players — gracze ze stałymi id; imiona służą tylko do wyświetlania.
 *   onConfirm — dostaje drużyny jako tablice identyfikatorów (nie imion).
 *   minTeamSize — ile osób musi mieć każda drużyna, żeby zacząć.
 *   Domyślnie MIN_TEAM_SIZE (2), tak jak w grze "W pół słowa"; "Ping-pong" dopuszcza 1,
 *   bo to gra jeden na jednego.
 */
export function mountTeamSetup({ container, players, onConfirm, minTeamSize = MIN_TEAM_SIZE }) {
  /** @type {{first: string[], second: string[]}} identyfikatory graczy w drużynach */
  const teams = { first: [], second: [] };

  /** Mapa id → imię — imiona służą wyłącznie do wyświetlania. */
  const namesById = new Map(players.map((player) => [player.id, player.name]));

  /** Znacznik ostatniej akcji przycisków, które przerysowują cały ekran. */
  let lastButtonActionAt = Number.NEGATIVE_INFINITY;

  shuffleTeams();
  render();

  function nameById(playerId) {
    return namesById.get(playerId) ?? '—';
  }

  function otherTeamId(teamId) {
    return teamId === 'first' ? 'second' : 'first';
  }

  /** Ochrona przed podwójnym dotknięciem: drugi klik w tym samym momencie jest ignorowany. */
  function canAct() {
    const now = performance.now();

    if (now - lastButtonActionAt < BUTTON_GUARD_MS) {
      return false;
    }

    lastButtonActionAt = now;
    return true;
  }

  function shuffleTeams() {
    const shuffled = shuffle(players);
    const firstSize = Math.ceil(shuffled.length / 2);
    teams.first = shuffled.slice(0, firstSize).map((player) => player.id);
    teams.second = shuffled.slice(firstSize).map((player) => player.id);
  }

  function movePlayer(teamId, playerId) {
    const source = teams[teamId];
    const index = source.indexOf(playerId);

    if (index === -1) {
      return;
    }

    source.splice(index, 1);
    teams[otherTeamId(teamId)].push(playerId);
    render();
  }

  function getRoundsCount() {
    return Math.max(teams.first.length, teams.second.length);
  }

  function canStart() {
    return teams.first.length >= minTeamSize && teams.second.length >= minTeamSize;
  }

  /** Komunikat o minimalnej liczbie osób w drużynie (odmiana przez Intl.PluralRules). */
  function getMinimumMessage() {
    return tPlural('teams.minimum', minTeamSize);
  }

  function render() {
    clear(container);

    container.append(
      el('p', {
        class: 'screen__intro',
        text: t('teams.moveHint'),
      }),
      el('div', { class: 'team-columns' }, TEAMS.map(createTeamColumn)),
      createMessages(),
      el('button', {
        class: 'button button--secondary button--block',
        type: 'button',
        text: t('teams.shuffle'),
        onClick: () => {
          if (!canAct()) {
            return;
          }
          shuffleTeams();
          render();
        },
      }),
      el('button', {
        class: 'button button--primary button--block',
        type: 'button',
        text: t('teams.start'),
        disabled: !canStart(),
        onClick: () => {
          if (!canStart() || !canAct()) {
            return;
          }
          onConfirm({ first: [...teams.first], second: [...teams.second] });
        },
      }),
    );
  }

  function createTeamColumn(team) {
    const playerIds = teams[team.id];

    return el('div', { class: `team-column ${team.className}` }, [
      el('div', { class: 'team-column__header' }, [
        el('span', { class: 'team-column__icon', 'aria-hidden': 'true', text: team.icon }),
        el('span', { class: 'team-column__name', text: team.name }),
        el('span', { class: 'team-column__count', text: `${playerIds.length}` }),
      ]),
      playerIds.length === 0
        ? el('p', { class: 'team-column__empty', text: t('teams.empty') })
        : el(
            'ul',
            { class: 'team-column__list' },
            playerIds.map((playerId) => {
              const name = nameById(playerId);

              return el('li', {}, [
                el('button', {
                  class: 'team-name-button',
                  type: 'button',
                  text: name,
                  'aria-label': t('teams.moveAria', { name }),
                  onClick: () => movePlayer(team.id, playerId),
                }),
              ]);
            }),
          ),
    ]);
  }

  function createMessages() {
    const messages = [];

    if (!canStart()) {
      messages.push(
        el('p', {
          class: 'form-error',
          text: getMinimumMessage(),
        }),
      );
    } else if (teams.first.length !== teams.second.length) {
      messages.push(
        el('p', {
          class: 'stepper__hint',
          text: t('teams.uneven'),
        }),
      );
    } else {
      messages.push(
        el('p', {
          class: 'stepper__hint',
          text: t('teams.rounds', { count: formatNumber(getRoundsCount()) }),
        }),
      );
    }

    return el('div', { class: 'stack' }, messages);
  }
}
