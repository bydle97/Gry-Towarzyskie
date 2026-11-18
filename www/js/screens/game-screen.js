/**
 * Ekran rozgrywki: montuje wybraną grę w kontenerze routera.
 * Gra dostaje imiona graczy z sesji oraz wspólne api (core/game-api.js).
 * Router wywoła zwrócony cleanup przed pokazaniem innego ekranu — wtedy pada unmount().
 *
 * W trakcie gry:
 *  - gest/przycisk „wstecz” przeglądarki pokazuje okno wyjścia gry (game.requestExit),
 *    a przy „Zostań w grze” router dopisuje z powrotem wpis historii,
 *  - odświeżenie lub zamknięcie karty wywołuje ostrzeżenie przeglądarki (beforeunload).
 */
import { el } from '../core/dom.js';
import { formatNumber, t } from '../core/i18n.js';
import { formatPlayersRange } from '../core/format.js';
import { createGameApi } from '../core/game-api.js';
import { getGameById } from '../core/games-registry.js';
import { navigate, setBackHandler } from '../core/router.js';
import { getPlayerNames } from '../core/session.js';

/**
 * Ostrzeżenie przed opuszczeniem strony w trakcie gry. Treść okna ustala
 * przeglądarka (własnego tekstu nie da się podać).
 * @param {BeforeUnloadEvent} event
 */
function warnBeforeUnload(event) {
  event.preventDefault();
  // Starsze przeglądarki wymagają ustawienia returnValue.
  event.returnValue = '';
}

/**
 * @param {{container: HTMLElement, params: {gameId?: string}}} context
 * @returns {(() => void) | undefined} funkcja sprzątająca grę
 */
export function renderGameScreen({ container, params }) {
  const game = getGameById(params.gameId);

  if (!game) {
    container.append(
      createMessageBox({
        title: t('game.missingTitle'),
        text: t('game.missingText'),
        actionLabel: t('game.backToGames'),
        onAction: () => navigate('home', {}, { reset: true }),
      }),
    );
    return undefined;
  }

  const players = getPlayerNames();
  const playersOk = players.length >= game.minPlayers && players.length <= game.maxPlayers;

  if (!playersOk) {
    container.append(
      createMessageBox({
        title: t('game.wrongPlayersTitle'),
        text: t('game.wrongPlayersText', {
          range: formatPlayersRange(game.minPlayers, game.maxPlayers),
          count: formatNumber(players.length),
        }),
        actionLabel: t('game.backToDetails'),
        onAction: () => navigate('details', { gameId: game.id }, { replace: true }),
      }),
    );
    return undefined;
  }

  // W trakcie gry wychodzimy wyłącznie przyciskiem gry (z potwierdzeniem),
  // dlatego chowamy strzałkę w nagłówku HUB-a. Router przywróci ją przy zmianie ekranu.
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.hidden = true;
  }

  const api = createGameApi({
    onExit: () => navigate('details', { gameId: game.id }, { replace: true }),
  });

  try {
    game.mount(container, players, api);
  } catch (error) {
    console.error('Błąd uruchamiania gry:', error);
    try {
      game.unmount();
    } catch (unmountError) {
      console.error('Błąd zamykania gry po nieudanym starcie:', unmountError);
    }
    container.append(
      createMessageBox({
        title: t('game.startErrorTitle'),
        text: t('game.startErrorText'),
        actionLabel: t('game.backToDetails'),
        onAction: () => navigate('details', { gameId: game.id }, { replace: true }),
      }),
    );
    return undefined;
  }

  // „Wstecz” w trakcie gry: okno „Zakończyć grę?” zamiast natychmiastowego wyjścia.
  const removeBackHandler =
    typeof game.requestExit === 'function'
      ? setBackHandler(({ onCancel }) => game.requestExit({ onCancel }))
      : () => {};

  window.addEventListener('beforeunload', warnBeforeUnload);

  return () => {
    removeBackHandler();
    window.removeEventListener('beforeunload', warnBeforeUnload);

    try {
      game.unmount();
    } catch (error) {
      console.error('Błąd zamykania gry:', error);
    }
  };
}

function createMessageBox({ title, text, actionLabel, onAction }) {
  return el('div', { class: 'empty-state' }, [
    el('span', { class: 'empty-state__icon', 'aria-hidden': 'true', text: '⚠️' }),
    el('p', { class: 'empty-state__title', text: title }),
    el('p', { text }),
    el('button', {
      class: 'button button--primary button--block',
      type: 'button',
      text: actionLabel,
      onClick: onAction,
    }),
  ]);
}
