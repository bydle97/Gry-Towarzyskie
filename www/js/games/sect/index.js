/**
 * Gra "Wampir" (id: sect) — ukryte role, noc i dzień, mistrz gry.
 *
 * Uwaga: id "sect", nazwa folderu, klucze tłumaczeń "games.sect.*" oraz wewnętrzne
 * identyfikatory ról (sect = wampir, doctor = znachor, detective = łowca) są
 * HISTORYCZNE — gra nazywała się wcześniej „Sekta”. Zostają bez zmian, żeby nie
 * psuć kluczy i stanu; wszystkie widoczne teksty pochodzą z tłumaczeń.
 *
 * Etap A: przygotowanie (wybór mistrza gry i podgląd składu) oraz sprawdzanie ról.
 * Etap B: scenariusz mistrza gry — noc (wampiry, znachor, łowca), poranek z
 * rozstrzygnięciem, dzień z dyskusją i głosowaniem, ekran końcowy.
 * Logika (losowanie ról, rozstrzyganie nocy, warunki wygranej) siedzi w engine.js
 * jako czyste funkcje bez DOM; teksty mistrza gry są w script.js; ten plik tylko
 * spina stany i ekrany.
 *
 * Brak zapisu na dysku: cały stan żyje w pamięci tego modułu.
 */
import { SCREEN_CHANGE_GUARD_MS, clear, clearTapGuard, guardTaps } from '../../core/dom.js';
import { formatNumber, t } from '../../core/i18n.js';
import { releaseWakeLock, requestWakeLock } from '../../core/wake-lock.js';
import {
  ACTIVE_ROLE_CONFIG_KEYS,
  COUNT_MIN_VAMPIRES,
  DISCUSSION_SECONDS,
  MIN_PLAYERS,
  MIN_VAMPIRES,
  ROLES,
  ROLE_ID_BY_CONFIG_KEY,
  defaultRoleConfig,
  getRoleRevealName,
} from './config.js';
import {
  WINNERS,
  checkWin,
  correctPlayerState,
  countVillagers,
  normalizeRoleConfig,
  validateRoleConfig,
  createEmptyNightChoices,
  createGameState,
  eliminatePlayer,
  commanderTakeOver,
  getCommanderBlocker,
  getCommanderTargets,
  getDetectiveResultFor,
  getHealerActor,
  getPlayerByRole,
  getWinnerOutcome,
  getWitchPoisonTargets,
  getWitchPotionsAvailable,
  applyWitchChoice,
  isDetectionFaked,
  isWitchActive,
  markRoleChecked,
  resolveNight,
  restartGame,
  unmarkRoleChecked,
} from './engine.js';
import {
  DAY_TEXTS,
  DETECTIVE_RESULT_TEXTS,
  createNightSteps,
  getCommanderSay,
  getDayResultSay,
  getFinishText,
  getMorningTexts,
} from './script.js';
import {
  createCountdownState,
  ensureStyles,
  removeStyles,
  renderBoardOverlay,
  renderConfirmDialog,
  renderDayDiscussionScreen,
  renderDayResultScreen,
  renderDayVoteScreen,
  renderDetectiveResultScreen,
  renderWitchScreen,
  renderFinishedScreen,
  renderGmInfoScreen,
  renderGmPickScreen,
  renderGuideScreen,
  renderMorningScreen,
  renderPreviewScreen,
  renderRoleCheckScreen,
  renderRoleRevealScreen,
  renderSetupScreen,
} from './ui.js';

/**
 * Stan interfejsu partii.
 * @type {null | {
 *   container: HTMLElement,
 *   api: import('../../core/game-contract.js').GameApi,
 *   players: string[],
 *   gmName: string | null,
 *   gameState: Object | null,
 *   phase: 'setup'|'check'|'reveal'|'guide'|'night'|'morning'|'day-discussion'|'day-vote'|'day-commander'|'day-result'|'finished',
 *   revealPlayerId: string | null,
 *   revealReturnPhase: string | null,
 *   previewOpen: boolean,
 *   boardOpen: boolean,
 *   guideMode: 'auto'|'manual'|null,
 *   guideReturnPhase: string | null,
 *   guideSeen: boolean,
 *   nightSteps: Array<Object>,
 *   nightStep: number,
 *   nightHistory: Array<{stepIndex: number, nightChoices: Object}>,
 *   selection: string | null,
 *   nightConfirmed: boolean,
 *   morningInfo: Object | null,
 *   dayResult: Object | null,
 *   discussionTimer: Object | null,
 *   screenCleanup: Function | null,
 *   dialog: null | {title: string, message: string, confirmLabel: string, onConfirm: Function, onCancel?: Function},
 *   lastScreenKey: string,
 * }}
 */
let state = null;

const game = {
  // Historyczne id (dawniej „Sekta”) — nie zmieniać, widoczna nazwa to „Wampir” z tłumaczeń.
  id: 'sect',
  nameKey: 'games.sect.name',
  descriptionKey: 'games.sect.description',
  icon: '🧛',
  minPlayers: MIN_PLAYERS,
  maxPlayers: 20,

  howToPlay: {
    goalKey: 'games.sect.goal',
    stepKeys: [
      'games.sect.steps.1',
      'games.sect.steps.2',
      'games.sect.steps.3',
      'games.sect.steps.4',
      'games.sect.steps.5',
      'games.sect.steps.6',
    ],
    tipKeys: ['games.sect.tips.1', 'games.sect.tips.2'],
  },

  /**
   * @param {HTMLElement} container
   * @param {string[]} players
   * @param {import('../../core/game-contract.js').GameApi} api
   */
  mount(container, players, api) {
    ensureStyles();

    state = {
      container,
      api,
      players: [...players],
      gmName: null,
      // Konfiguracja ról („Role w tej grze”): null = domyślna wg liczby grających;
      // po pierwszej zmianie mistrz gry decyduje sam. Pamięć tylko na czas gry
      // (także „Nowe role”), bez localStorage.
      roleConfig: null,
      gameState: null,
      phase: 'setup',
      revealPlayerId: null,
      revealReturnPhase: null,
      previewOpen: false,
      boardOpen: false,
      guideMode: null,
      guideReturnPhase: null,
      guideSeen: false,
      nightSteps: [],
      nightStep: 0,
      nightHistory: [],
      selection: null,
      nightConfirmed: false,
      morningInfo: null,
      // Szkic wyboru wiedźmy w kroku nocy (uleczenie / otrucie) przed „Zatwierdź”.
      witchDraft: null,
      dayResult: null,
      discussionTimer: null,
      screenCleanup: null,
      dialog: null,
      lastScreenKey: '',
    };

    renderState();
  },

  unmount() {
    destroyScreen();
    releaseWakeLock();
    if (state) {
      clearTapGuard(state.container);
    }
    removeStyles();
    state = null;
  },

  /** Gest „wstecz” (core/router.js): to samo okno co „Przerwij grę”. */
  requestExit(options) {
    requestExit(options);
  },
};

export default game;

/** Imiona grających = lista z HUB-a bez mistrza gry, jeśli pochodzi z listy. */
function getPlayingNames() {
  return state.players.filter((name) => name !== state.gmName);
}

/**
 * @param {{keepScroll?: boolean}} [options]
 *   keepScroll — nie przewijaj na górę (używane przy zaznaczaniu osoby,
 *   żeby długa lista imion nie skakała).
 */
function renderState({ keepScroll = false } = {}) {
  if (!state) {
    return;
  }

  const { container } = state;

  if (state.dialog) {
    if (container.querySelector('.sec-overlay')) {
      return;
    }

    const dialog = state.dialog;
    const overlay = renderConfirmDialog({
      title: dialog.title,
      message: dialog.message,
      confirmLabel: dialog.confirmLabel,
      onConfirm: () => {
        state.dialog = null;
        dialog.onConfirm();
      },
      // Okno informacyjne (np. opis roli) ma tylko jeden przycisk.
      onCancel: dialog.infoOnly
        ? null
        : () => {
            state.dialog = null;
            container.querySelector('.sec-overlay')?.remove();

            if (typeof dialog.onCancel === 'function') {
              dialog.onCancel();
            }
          },
    });

    container.append(overlay);
    (overlay.querySelector('.sec-dialog__cancel') ?? overlay.querySelector('button'))?.focus();
    return;
  }

  if (state.boardOpen && state.gameState) {
    const board = renderBoardOverlay({
      players: state.gameState.players,
      nightChoices: state.gameState.nightChoices,
      nightLog: state.gameState.nightLog,
      dayLog: state.gameState.dayLog ?? [],
      corrections: state.gameState.corrections ?? [],
      // Jawny komendant (po przejęciu głosowania) i przejęcie mocy znachora przez ucznia.
      revealedCommanderId: state.gameState.commanderTakeover?.commanderId ?? null,
      healerInheritance: state.gameState.healerInheritance ?? null,
      // Stan mikstur wiedźmy (z uwzględnieniem wyborów bieżącej nocy) — tylko gdy wiedźma gra.
      witchPotions: getPlayerByRole(state.gameState, ROLES.witch.id)
        ? getWitchPotionsAvailable(state.gameState)
        : null,
      // Spełniony warunek wygranej (z uwzględnieniem sługi) albo pusty tekst.
      winnerText: state.gameState.winner ? getFinishText(getWinnerOutcome(state.gameState)) : '',
      onClose: closeBoard,
      onCorrect: askCorrectPlayer,
    });
    const existing = container.querySelector('.sec-board');

    if (existing) {
      existing.replaceWith(board);
    } else {
      container.append(board);
    }
    return;
  }

  destroyScreen();
  clear(container);
  if (!keepScroll) {
    window.scrollTo(0, 0);
  }

  // Nowy ekran (faza, podgląd, krok nocy, wynik łowcy) — krótka blokada dotknięć.
  // Zaznaczenie osoby na liście (ten sam ekran) blokady nie włącza.
  const screenKey = [
    state.previewOpen ? 'preview' : state.phase,
    state.gameState ? state.gameState.nightNumber : 0,
    state.nightStep,
    state.nightConfirmed,
  ].join(':');

  if (screenKey !== state.lastScreenKey) {
    state.lastScreenKey = screenKey;
    guardTaps(container, SCREEN_CHANGE_GUARD_MS);
  }

  if (state.previewOpen) {
    renderPreview();
    return;
  }

  if (state.phase === 'guide') {
    renderGuide();
    return;
  }

  if (state.phase === 'setup') {
    renderSetup();
    return;
  }
  if (state.phase === 'check') {
    renderCheck();
    return;
  }
  if (state.phase === 'reveal') {
    renderReveal();
    return;
  }
  if (state.phase === 'night') {
    renderNight();
    return;
  }
  if (state.phase === 'morning') {
    renderMorning();
    return;
  }
  if (state.phase === 'day-discussion') {
    renderDayDiscussion();
    return;
  }
  if (state.phase === 'day-vote') {
    renderDayVote();
    return;
  }
  if (state.phase === 'day-commander') {
    renderDayCommander();
    return;
  }
  if (state.phase === 'day-result') {
    renderDayResult();
    return;
  }

  renderFinished();
}

/** Zatrzymuje ewentualny licznik czasu z poprzedniego ekranu. */
function destroyScreen() {
  if (typeof state?.screenCleanup === 'function') {
    try {
      state.screenCleanup();
    } catch (error) {
      console.error('Błąd sprzątania ekranu:', error);
    }
  }
  if (state) {
    state.screenCleanup = null;
  }
}

/**
 * Otwiera dialog potwierdzenia nad bieżącym ekranem.
 * @param {{
 *   title: string,
 *   message: string,
 *   confirmLabel: string,
 *   onConfirm: () => void,
 *   onCancel?: () => void,
 *   infoOnly?: boolean,
 * }} options
 *   onCancel — opcjonalnie wołane po „Anuluj” (np. powiadomienie routera po geście „wstecz”),
 *   infoOnly — okno informacyjne z jednym przyciskiem (bez „Anuluj”)
 */
function openDialog({ title, message, confirmLabel, onConfirm, onCancel, infoOnly = false }) {
  if (!state) {
    return;
  }
  state.dialog = { title, message, confirmLabel, onConfirm, onCancel, infoOnly };
  renderState();
}

/**
 * Konfiguracja ról dla bieżącej liczby grających: wybór mistrza gry albo domyślna,
 * zawsze znormalizowana (np. uczeń bez znachora wyłączony z notatką).
 * Po zmianie liczby grających (inny mistrz gry) wybór zostaje i jest walidowany na nowo.
 * @param {number} playingCount
 * @returns {{config: Object, notes: string[]}}
 */
function getEffectiveRoleConfig(playingCount) {
  return normalizeRoleConfig(playingCount, state.roleConfig ?? defaultRoleConfig(playingCount));
}

/** Tekst komunikatu walidacji / notatki (klucze games.sect.setup.issues.*). */
function describeRoleIssue({ code, params = {} }) {
  const formatted = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, formatNumber(value)]),
  );
  return t(`games.sect.setup.issues.${code}`, formatted);
}

function renderSetup() {
  const playingNames = getPlayingNames();
  const playingCount = playingNames.length;
  const belowMinimum = playingCount < MIN_PLAYERS;
  const { config, notes } = getEffectiveRoleConfig(playingCount);
  const validation = validateRoleConfig(playingCount, config);

  // Przełączniki zablokowane przez zależności: uczeń bez znachora, hrabia przy 1 wampirze.
  const blockedBy = {
    uczen: !config.znachor ? 'apprenticeOff' : null,
    hrabia: config.vampires < COUNT_MIN_VAMPIRES ? 'countOff' : null,
  };

  // Wiersze listy „Role w tej grze”: role aktywne (w kolejności z config.js).
  const roleRows = ACTIVE_ROLE_CONFIG_KEYS.map((key) => ({
    key,
    role: ROLES[ROLE_ID_BY_CONFIG_KEY[key]],
    checked: config[key],
    disabled: Boolean(blockedBy[key]),
    disabledReason: blockedBy[key] ? describeRoleIssue({ code: blockedBy[key] }) : '',
  }));

  const updateConfig = (changes) => {
    state.roleConfig = { ...getEffectiveRoleConfig(playingCount).config, ...changes };
    renderState({ keepScroll: true });
  };

  state.container.append(
    renderSetupScreen({
      players: state.players,
      gmName: state.gmName,
      playingCount,
      belowMinimum,
      roleSetup: {
        vampireRole: ROLES.sect,
        vampires: config.vampires,
        canDecreaseVampires: config.vampires > MIN_VAMPIRES,
        canIncreaseVampires: config.vampires < playingCount - 1,
        rows: roleRows,
        villagers: Math.max(0, countVillagers(playingCount, config)),
        errors: belowMinimum ? [] : validation.errors.map(describeRoleIssue),
        warnings: belowMinimum ? [] : validation.warnings.map(describeRoleIssue),
        // Notatki o automatycznym wyłączeniu roli (np. hrabia przy 1 wampirze),
        // jeśli nie są już opisane przy zablokowanym przełączniku.
        notes: notes
          .filter((code) => !Object.values(blockedBy).includes(code))
          .map((code) => describeRoleIssue({ code })),
      },
      canDeal: !belowMinimum && validation.ok,
      onChangeVampires: (delta) => updateConfig({ vampires: config.vampires + delta }),
      onToggleRole: (key, checked) => updateConfig({ [key]: checked }),
      onRestoreDefaults: () => {
        state.roleConfig = null;
        renderState({ keepScroll: true });
      },
      onRoleInfo: showRoleInfo,
      onGmChange: (value) => {
        state.gmName = value === '' ? null : value;
        renderState();
      },
      onDealRoles: dealRoles,
      onOpenGuide: () => openGuide('manual'),
      onExit: requestExit,
    }),
  );
}

/** Przycisk „i”: pełny opis roli w okienku z jednym przyciskiem „Zamknij”. */
function showRoleInfo(role) {
  openDialog({
    title: `${role.icon} ${role.name}`,
    message: role.revealText,
    confirmLabel: t('games.sect.dialog.close'),
    onConfirm: () => {
      state.container.querySelector('.sec-overlay')?.remove();
    },
    infoOnly: true,
  });
}

/** Rozdaje role i przechodzi do wspólnego sprawdzania ról (tylko przy poprawnej konfiguracji). */
function dealRoles() {
  const playingNames = getPlayingNames();

  if (playingNames.length < MIN_PLAYERS) {
    return;
  }

  const { config } = getEffectiveRoleConfig(playingNames.length);

  if (!validateRoleConfig(playingNames.length, config).ok) {
    return;
  }

  // Zapamiętujemy wybór na kolejne partie („Nowe role”).
  state.roleConfig = config;
  state.gameState = createGameState({
    gmName: state.gmName,
    playerNames: playingNames,
    roleConfig: config,
  });
  state.revealPlayerId = null;
  state.phase = 'check';
  renderState();
}

function renderCheck() {
  const gameState = state.gameState;
  const checkedCount = gameState.players.filter((player) => player.roleChecked).length;

  state.container.append(
    renderRoleCheckScreen({
      gameState,
      checkedCount,
      allChecked: checkedCount === gameState.players.length,
      onPickPlayer: askPlayer,
      // Ekran sprawdzania ról krąży po graczach — podgląd dopiero po ostrzeżeniu.
      onOpenPreview: askOpenPreview,
      onGoToGm: askGoToGm,
      onExit: requestExit,
    }),
  );
}

/** Pyta o potwierdzenie tożsamości, zanim pokaże rolę. */
function askPlayer(playerId) {
  const player = state.gameState.players.find((item) => item.id === playerId);

  if (!player || player.roleChecked) {
    return;
  }

  openDialog({
    title: t('games.sect.dialog.playerTitle', { name: player.name }),
    message: t('games.sect.dialog.playerMessage'),
    confirmLabel: t('games.sect.dialog.playerConfirm'),
    onConfirm: () => {
      state.revealPlayerId = playerId;
      state.phase = 'reveal';
      renderState();
    },
  });
}

function renderReveal() {
  const player = state.gameState.players.find((item) => item.id === state.revealPlayerId);

  if (!player) {
    state.revealPlayerId = null;
    returnFromReveal();
    renderState();
    return;
  }

  state.container.append(
    renderRoleRevealScreen({
      player,
      role: ROLES[player.roleId],
      onHide: hideRole,
    }),
  );
}

/** Ukrycie roli: gracz jest oznaczony jako sprawdzony, a rola znika z ekranu i DOM. */
function hideRole() {
  state.gameState = markRoleChecked(state.gameState, state.revealPlayerId);
  state.revealPlayerId = null;
  returnFromReveal();
  renderState();
}

/**
 * Powrót z ekranu roli: do sprawdzania ról albo — gdy rolę pokazano z Podglądu
 * ról — z powrotem do podglądu nad tym samym etapem gry (np. noc).
 */
function returnFromReveal() {
  if (state.revealReturnPhase) {
    state.phase = state.revealReturnPhase;
    state.revealReturnPhase = null;
    state.previewOpen = true;
    return;
  }

  state.phase = 'check';
}

function openPreview() {
  state.previewOpen = true;
  renderState();
}

/** Podgląd z ekranu sprawdzania ról — tylko po potwierdzeniu, że to mistrz gry. */
function askOpenPreview() {
  openDialog({
    title: t('games.sect.dialog.previewTitle'),
    message: t('games.sect.dialog.previewMessage'),
    confirmLabel: t('games.sect.dialog.previewConfirm'),
    onConfirm: openPreview,
  });
}

/**
 * „Pokaż rolę tej osobie” z Podglądu ról: dla kogoś, kto nie sprawdził roli.
 * Po „Ukryj rolę” osoba jest sprawdzona, a mistrz gry wraca do podglądu.
 */
function askShowRole(playerId) {
  const player = state.gameState.players.find((item) => item.id === playerId);

  if (!player || player.roleChecked) {
    return;
  }

  openDialog({
    title: t('games.sect.dialog.handPhoneTitle', { name: player.name }),
    message: t('games.sect.dialog.handPhoneMessage'),
    confirmLabel: t('games.sect.dialog.handPhoneConfirm'),
    onConfirm: () => {
      state.revealReturnPhase = state.phase;
      state.previewOpen = false;
      state.revealPlayerId = playerId;
      state.phase = 'reveal';
      renderState();
    },
  });
}

function closePreview() {
  state.previewOpen = false;
  renderState();
}

/** "Mistrz gry: przejdź dalej" — ostrzega, gdy nie wszyscy sprawdzili role. */
function askGoToGm() {
  const allChecked = state.gameState.players.every((player) => player.roleChecked);

  if (allChecked) {
    goToFirstNight();
    return;
  }

  openDialog({
    title: t('games.sect.dialog.notAllTitle'),
    message: t('games.sect.dialog.notAllMessage'),
    confirmLabel: t('games.sect.dialog.notAllConfirm'),
    onConfirm: goToFirstNight,
  });
}

function renderPreview() {
  state.container.append(
    renderPreviewScreen({
      gameState: state.gameState,
      onUnlockRole: askUnlockRole,
      onShowRole: askShowRole,
      onBack: closePreview,
      onExit: requestExit,
    }),
  );
}

/** Odblokowanie ponownego sprawdzenia roli (z potwierdzeniem). */
function askUnlockRole(playerId) {
  const player = state.gameState.players.find((item) => item.id === playerId);

  if (!player) {
    return;
  }

  openDialog({
    title: t('games.sect.dialog.unlockTitle'),
    message: t('games.sect.dialog.unlockMessage', { name: player.name }),
    confirmLabel: t('games.sect.dialog.unlockConfirm'),
    onConfirm: () => {
      state.gameState = unmarkRoleChecked(state.gameState, playerId);
      renderState();
    },
  });
}

/**
 * Okno „Przerwać grę?” (przycisk w grze albo gest „wstecz”).
 * @param {{onCancel?: () => void}} [options] onCancel — wołane po „Anuluj”
 *   (router dopisuje wtedy z powrotem wpis historii); przyciski w grze go nie podają
 */
function requestExit({ onCancel } = {}) {
  if (!state) {
    return;
  }

  // Inne okno (np. „Jesteś …?”) jest otwarte — zamykamy je, zanim pokażemy okno wyjścia.
  if (state.dialog) {
    state.dialog = null;
    state.container.querySelector('.sec-overlay')?.remove();
  }

  openDialog({
    title: t('games.sect.dialog.exitTitle'),
    message: t('games.sect.dialog.exitMessage'),
    confirmLabel: t('games.sect.dialog.exitConfirm'),
    onConfirm: () => state.api.exit(),
    onCancel: typeof onCancel === 'function' ? onCancel : undefined,
  });
}

/** Imię gracza z bieżącego stanu gry (albo „—”). */
function nameOf(playerId) {
  const player = state.gameState.players.find((item) => item.id === playerId);
  return player ? player.name : '—';
}

/** Start nocy: numer, wyczyszczenie wyborów i scenariusz mistrza gry. */
function startNight() {
  // Od pierwszej nocy do końca gry ekran mistrza gry nie może się wygaszać
  // (wywołanie przy każdej nocy jest bezpieczne — blokada jest jedna).
  void requestWakeLock();

  const nightNumber = state.gameState.nightNumber + 1;
  const players = state.gameState.players;
  const detective = players.find((player) => player.roleId === 'detective');
  const healer = getPlayerByRole(state.gameState, ROLES.doctor.id);
  const apprentice = getPlayerByRole(state.gameState, ROLES.apprentice.id);

  state.gameState = {
    ...state.gameState,
    nightNumber,
    nightChoices: createEmptyNightChoices(),
  };

  // Moc znachora ma żywy znachor albo — po przejęciu — żywy uczeń (engine.getHealerActor).
  const healerActor = getHealerActor(state.gameState);

  state.nightSteps = createNightSteps({
    nightNumber,
    doctorAlive: healerActor !== null,
    detectiveAlive: Boolean(detective && detective.alive),
    // Pierwsza noc: znachor i uczeń budzą się razem, żeby się poznać.
    apprenticeMeets:
      nightNumber === 1 && Boolean(healer?.alive) && Boolean(apprentice?.alive),
    apprenticeActingName:
      healerActor && healerActor.roleId === ROLES.apprentice.id ? healerActor.name : null,
    // Role wyłączone na ekranie „Role w tej grze” nie mają kroków w nocy.
    doctorInGame: Boolean(healer),
    detectiveInGame: Boolean(detective),
    // Pierwsza noc: sługa poznaje wampiry (tylko jeśli sługa gra).
    servantMeets:
      nightNumber === 1 && Boolean(getPlayerByRole(state.gameState, ROLES.servant.id)),
    // Wiedźma: krok po znachorze; atrapa, gdy nie żyje albo nie ma już mikstur.
    witchInGame: Boolean(getPlayerByRole(state.gameState, ROLES.witch.id)),
    witchActive: isWitchActive(state.gameState),
  });
  state.nightStep = 0;
  state.nightHistory = [];
  state.witchDraft = null;
  state.selection = null;
  state.nightConfirmed = false;
  state.previewOpen = false;
  state.boardOpen = false;
  state.guideMode = null;
  state.guideReturnPhase = null;
  state.phase = 'night';
  renderState();
}

/** Rysuje bieżący krok nocy: informację, wybór osoby albo tajny wynik łowcy. */
function renderNight() {
  const step = state.nightSteps[state.nightStep];

  if (!step) {
    startMorning();
    return;
  }

  const label = t('games.sect.night.label', {
    night: formatNumber(state.gameState.nightNumber),
    step: formatNumber(state.nightStep + 1),
    total: formatNumber(state.nightSteps.length),
  });
  const common = {
    label,
    sayText: step.say,
    ...gmActions(),
    onUndo: state.nightHistory.length > 0 ? undoNightStep : null,
  };

  if (!step.pick) {
    state.container.append(
      renderGmInfoScreen({
        ...common,
        doText: step.doText,
        actionLabel: t('games.sect.gm.next'),
        onAction: advanceNightStep,
      }),
    );
    return;
  }

  if (step.pick === 'witch') {
    renderWitchStep(common, step);
    return;
  }

  if (step.pick === 'detective' && state.nightConfirmed) {
    state.container.append(
      renderDetectiveResultScreen({
        ...common,
        targetName: nameOf(state.gameState.nightChoices.detectiveTargetId),
        resultText:
          state.gameState.nightChoices.detectiveResult === 'sect'
            ? DETECTIVE_RESULT_TEXTS.sect
            : DETECTIVE_RESULT_TEXTS.notSect,
        gestureText: DETECTIVE_RESULT_TEXTS.gesture,
        onNext: advanceNightStep,
      }),
    );
    return;
  }

  state.container.append(
    renderGmPickScreen({
      ...common,
      doText: step.doText,
      candidates: getNightCandidates(step.pick),
      selectedId: state.selection,
      onSelect: (playerId) => {
        state.selection = playerId;
        renderState({ keepScroll: true });
      },
      onConfirm: () => confirmNightPick(step.pick),
    }),
  );
}

/** Szkic wyboru wiedźmy w bieżącym kroku (przed „Zatwierdź”). */
function getWitchDraft() {
  if (!state.witchDraft) {
    state.witchDraft = { heal: false, poisonTargetId: null, poisonPicking: false };
  }
  return state.witchDraft;
}

/**
 * Krok wiedźmy: mistrz gry widzi imię ofiary wampirów (wskazuje ją wiedźmie gestem),
 * potem zaznacza wybór wiedźmy: „Ulecz ofiarę”, „Otruj osobę” (wybór żywej osoby,
 * nie wiedźmy), obie albo „Nic” — i zatwierdza.
 */
function renderWitchStep(common, step) {
  const draft = getWitchDraft();
  const choices = state.gameState.nightChoices;
  const available = getWitchPotionsAvailable(state.gameState);

  state.container.append(
    renderWitchScreen({
      ...common,
      doText: step.doText,
      victimName: choices.sectTargetId ? nameOf(choices.sectTargetId) : null,
      victimProtected: Boolean(choices.sectTargetId) && choices.sectTargetId === choices.doctorTargetId,
      healAvailable: available.heal,
      poisonAvailable: available.poison,
      draft,
      poisonCandidates: getWitchPoisonTargets(state.gameState).map((player) => ({
        id: player.id,
        name: player.name,
      })),
      onToggleHeal: toggleWitchHeal,
      onTogglePoison: () => {
        draft.poisonPicking = !draft.poisonPicking;
        if (!draft.poisonPicking) {
          draft.poisonTargetId = null;
        }
        renderState({ keepScroll: true });
      },
      onSelectPoison: (playerId) => {
        draft.poisonTargetId = playerId;
        renderState({ keepScroll: true });
      },
      onNothing: () => {
        state.witchDraft = { heal: false, poisonTargetId: null, poisonPicking: false };
        confirmWitchChoice();
      },
      onConfirm: confirmWitchChoice,
    }),
  );
}

/**
 * „Ulecz ofiarę”: przełącza uleczenie. Gdy ofiarę i tak chroni znachor, najpierw
 * potwierdzenie, że mikstura zostanie zużyta bez skutku.
 */
function toggleWitchHeal() {
  const draft = getWitchDraft();
  const choices = state.gameState.nightChoices;

  if (draft.heal) {
    draft.heal = false;
    renderState({ keepScroll: true });
    return;
  }

  if (choices.sectTargetId && choices.sectTargetId === choices.doctorTargetId) {
    openDialog({
      title: t('games.sect.dialog.witchWasteTitle'),
      message: t('games.sect.dialog.witchWasteMessage'),
      confirmLabel: t('games.sect.dialog.witchWasteConfirm'),
      onConfirm: () => {
        getWitchDraft().heal = true;
        renderState({ keepScroll: true });
      },
    });
    return;
  }

  draft.heal = true;
  renderState({ keepScroll: true });
}

/** Zatwierdza wybór wiedźmy (z migawką do „Cofnij krok”) i przechodzi do „Wiedźma zamyka oczy”. */
function confirmWitchChoice() {
  const draft = getWitchDraft();

  // Otrucie wybrane, ale bez wskazanej osoby — czekamy na wybór.
  if (draft.poisonPicking && !draft.poisonTargetId) {
    return;
  }

  const result = applyWitchChoice(state.gameState, {
    heal: draft.heal,
    poisonTargetId: draft.poisonPicking ? draft.poisonTargetId : null,
  });

  if (!result.ok) {
    // Wybór się zdezaktualizował (np. korekta na Tablicy) — zaczynamy od nowa.
    state.witchDraft = null;
    renderState();
    return;
  }

  state.nightHistory.push({ stepIndex: state.nightStep, nightChoices: { ...state.gameState.nightChoices } });
  state.gameState = result.state;
  advanceNightStep();
}

/** Lista osób do wyboru w danym kroku nocy (z blokadami i notatkami). */
function getNightCandidates(kind) {
  const players = state.gameState.players;
  const alive = players.filter((player) => player.alive);

  if (kind === 'sect') {
    return alive.map((player) => ({ id: player.id, name: player.name }));
  }

  if (kind === 'doctor') {
    return alive.map((player) => {
      const blocked = player.id === state.gameState.previousDoctorTargetId;
      return {
        id: player.id,
        name: player.name,
        disabled: blocked,
        note: blocked ? t('games.sect.gm.noteProtected') : '',
      };
    });
  }

  const detective = players.find((player) => player.roleId === 'detective');

  return alive.map((player) => {
    const self = Boolean(detective && player.id === detective.id);
    return {
      id: player.id,
      name: player.name,
      disabled: self,
      note: self ? t('games.sect.gm.noteDetectiveSelf') : '',
    };
  });
}

/** Zapisuje wybór z bieżącego kroku nocy. */
function confirmNightPick(kind) {
  const targetId = state.selection;

  if (!targetId) {
    return;
  }

  // Wybór mógł się zdezaktualizować (np. ręczna korekta na Tablicy) — wtedy go czyścimy.
  const candidate = getNightCandidates(kind).find((item) => item.id === targetId);

  if (!candidate || candidate.disabled) {
    state.selection = null;
    renderState();
    return;
  }

  const choices = state.gameState.nightChoices;
  state.nightHistory.push({ stepIndex: state.nightStep, nightChoices: { ...choices } });

  if (kind === 'sect') {
    state.gameState = { ...state.gameState, nightChoices: { ...choices, sectTargetId: targetId } };
    advanceNightStep();
    return;
  }

  if (kind === 'doctor') {
    state.gameState = { ...state.gameState, nightChoices: { ...choices, doctorTargetId: targetId } };
    advanceNightStep();
    return;
  }

  state.gameState = {
    ...state.gameState,
    nightChoices: {
      ...choices,
      detectiveTargetId: targetId,
      detectiveResult: getDetectiveResultFor(state.gameState, targetId),
      // Hrabia: łowca widzi „nie wampir”, mistrz gry — prawdę w dzienniku i na Tablicy.
      detectiveFaked: isDetectionFaked(state.gameState, targetId),
    },
  };
  state.nightConfirmed = true;
  state.selection = null;
  renderState();
}

/** Przejście do kolejnego kroku nocy (po ostatnim kroku — poranek). */
function advanceNightStep() {
  state.nightStep += 1;
  state.selection = null;
  state.nightConfirmed = false;
  state.witchDraft = null;

  if (state.nightStep >= state.nightSteps.length) {
    startMorning();
    return;
  }

  renderState();
}

/** Rozstrzyga noc, dopisuje dziennik i pokazuje poranek. */
function startMorning() {
  const resolved = resolveNight(state.gameState);
  const winner = checkWin(resolved);
  const entry = resolved.nightLog[resolved.nightLog.length - 1];
  // W jednej nocy mogą zginąć dwie osoby (ofiara wampirów i osoba otruta).
  const victims = (entry?.victimIds ?? [])
    .map((id) => resolved.players.find((player) => player.id === id))
    .filter(Boolean)
    .map((player) => ({ name: player.name, roleName: getRoleRevealName(player.roleId) }));

  state.gameState = { ...resolved, winner };
  state.morningInfo = {
    nightNumber: entry ? entry.night : resolved.nightNumber,
    victims,
    savedBy: entry ? entry.savedBy : null,
  };
  state.selection = null;
  state.nightConfirmed = false;
  state.previewOpen = false;
  state.phase = 'morning';
  renderState();
}

function renderMorning() {
  const info = state.morningInfo;
  const texts = getMorningTexts({ victims: info.victims, savedBy: info.savedBy });

  state.container.append(
    renderMorningScreen({
      label: t('games.sect.morning.label', { night: formatNumber(info.nightNumber) }),
      sayText: texts.say,
      doText: t('games.sect.morning.do'),
      detailText: texts.detail,
      onNext: afterMorning,
      ...gmActions(),
    }),
  );
}

function afterMorning() {
  if (state.gameState.winner) {
    state.phase = 'finished';
    renderState();
    return;
  }

  // Każdy dzień ma świeży licznik; jego stan żyje tutaj, a nie w komponencie,
  // więc zajrzenie na Tablicę, do podglądu lub instrukcji go nie zeruje.
  state.discussionTimer = createCountdownState(DISCUSSION_SECONDS);
  state.phase = 'day-discussion';
  renderState();
}

function renderDayDiscussion() {
  if (!state.discussionTimer) {
    state.discussionTimer = createCountdownState(DISCUSSION_SECONDS);
  }

  const screen = renderDayDiscussionScreen({
    label: t('games.sect.day.label', { day: formatNumber(state.gameState.nightNumber) }),
    sayText: DAY_TEXTS.discussionSay,
    doText: DAY_TEXTS.discussionDo,
    timerState: state.discussionTimer,
    onNext: () => {
      state.phase = 'day-vote';
      state.selection = null;
      renderState();
    },
    ...gmActions(),
  });

  state.screenCleanup = screen.destroy;
  state.container.append(screen.el);
}

function renderDayVote() {
  const alive = state.gameState.players.filter((player) => player.alive);
  const candidates = [
    ...alive.map((player) => ({ id: player.id, name: player.name })),
    { id: 'nobody', name: t('games.sect.gm.noOne') },
  ];

  state.container.append(
    renderDayVoteScreen({
      label: t('games.sect.day.label', { day: formatNumber(state.gameState.nightNumber) }),
      sayText: DAY_TEXTS.voteSay,
      doText: DAY_TEXTS.voteDo,
      candidates,
      selectedId: state.selection,
      onSelect: (choice) => {
        state.selection = choice;
        renderState({ keepScroll: true });
      },
      onConfirm: confirmDayVote,
      // Przycisk komendanta tylko wtedy, gdy żyje i jeszcze nie użył mocy.
      onCommanderTakeover:
        getCommanderBlocker(state.gameState) === null ? askCommanderTakeover : null,
      ...gmActions(),
    }),
  );
}

/** „Komendant przejmuje głosowanie” — najpierw potwierdzenie (ujawnienie jest publiczne). */
function askCommanderTakeover() {
  const commander = getPlayerByRole(state.gameState, ROLES.commander.id);

  if (!commander || getCommanderBlocker(state.gameState) !== null) {
    return;
  }

  openDialog({
    title: t('games.sect.dialog.commanderTitle'),
    message: t('games.sect.dialog.commanderMessage', { name: commander.name }),
    confirmLabel: t('games.sect.dialog.commanderConfirm'),
    onConfirm: () => {
      state.selection = null;
      state.phase = 'day-commander';
      renderState();
    },
  });
}

/** Ekran komendanta: wybór żywej osoby (nie samego komendanta) i „Zatwierdź”. */
function renderDayCommander() {
  const commander = getPlayerByRole(state.gameState, ROLES.commander.id);

  // Moc mogła się zdezaktualizować (np. korekta na Tablicy) — wracamy do głosowania.
  if (!commander || getCommanderBlocker(state.gameState) !== null) {
    state.phase = 'day-vote';
    renderState();
    return;
  }

  state.container.append(
    renderGmPickScreen({
      label: t('games.sect.day.commanderLabel', {
        day: formatNumber(state.gameState.nightNumber),
      }),
      sayText: getCommanderSay(commander.name),
      doText: DAY_TEXTS.commanderDo,
      candidates: getCommanderTargets(state.gameState).map((player) => ({
        id: player.id,
        name: player.name,
      })),
      selectedId: state.selection,
      onSelect: (playerId) => {
        state.selection = playerId;
        renderState({ keepScroll: true });
      },
      onConfirm: confirmCommanderTakeover,
      // „Cofnij krok” — komendant się rozmyślił, wracamy do zwykłego głosowania.
      onUndo: () => {
        state.selection = null;
        state.phase = 'day-vote';
        renderState();
      },
      ...gmActions(),
    }),
  );
}

/** Zatwierdza wybór komendanta: osoba odpada, moc zużyta, potem wynik i sprawdzenie wygranej. */
function confirmCommanderTakeover() {
  const targetId = state.selection;
  const target = state.gameState.players.find((item) => item.id === targetId);
  const result = commanderTakeOver(state.gameState, targetId);

  if (!result.ok || !target) {
    state.selection = null;
    renderState();
    return;
  }

  state.gameState = { ...result.state, winner: checkWin(result.state) };
  state.dayResult = {
    removedName: target.name,
    removedRoleName: getRoleRevealName(target.roleId),
  };
  state.selection = null;
  state.phase = 'day-result';
  renderState();
}

/** Zapisuje wynik głosowania i sprawdza warunek wygranej. */
function confirmDayVote() {
  const choice = state.selection;

  if (!choice) {
    return;
  }

  if (choice === 'nobody') {
    state.gameState = { ...state.gameState, winner: checkWin(state.gameState) };
    state.dayResult = { removedName: null, removedRoleName: null };
    state.selection = null;
    state.phase = 'day-result';
    renderState();
    return;
  }

  const player = state.gameState.players.find((item) => item.id === choice && item.alive);

  // Ktoś mógł zostać oznaczony jako martwy po wyborze (korekta na Tablicy).
  if (!player) {
    state.selection = null;
    renderState();
    return;
  }

  const removed = eliminatePlayer(state.gameState, choice, { type: 'day' });

  state.gameState = { ...removed, winner: checkWin(removed) };
  state.dayResult = {
    removedName: player ? player.name : null,
    removedRoleName: player ? getRoleRevealName(player.roleId) : null,
  };
  state.selection = null;
  state.phase = 'day-result';
  renderState();
}

function renderDayResult() {
  const result = state.dayResult;

  state.container.append(
    renderDayResultScreen({
      label: t('games.sect.day.label', { day: formatNumber(state.gameState.nightNumber) }),
      sayText: getDayResultSay({
        removedName: result.removedName,
        removedRoleName: result.removedRoleName,
      }),
      doText: DAY_TEXTS.resultDo,
      onNext: afterDayResult,
      ...gmActions(),
    }),
  );
}

function afterDayResult() {
  if (state.gameState.winner) {
    state.phase = 'finished';
    renderState();
    return;
  }

  startNight();
}

function renderFinished() {
  // Koniec gry — ekran może się już wygaszać.
  releaseWakeLock();

  const isSect = state.gameState.winner === WINNERS.sect;

  state.container.append(
    renderFinishedScreen({
      // „Wampiry i sługa wygrywają”, gdy w grze był sługa.
      winnerText: { text: getFinishText(getWinnerOutcome(state.gameState)), isSect },
      players: state.gameState.players,
      nightLog: state.gameState.nightLog,
      dayLog: state.gameState.dayLog ?? [],
      onNewRoles: playAgainNewRoles,
      onExit: () => state.api.exit(),
    }),
  );
}

/** „Nowe role": te same osoby, nowe losowanie ról i powrót do wspólnego sprawdzania ról. */
function playAgainNewRoles() {
  resetRoundView();
  state.gameState = restartGame(state.gameState);
  state.phase = 'check';
  renderState();
}

/** Czyści stan ekranów rundy, żeby nowa partia nie dziedziczyła wyborów ani historii nocy. */
function resetRoundView() {
  state.nightSteps = [];
  state.nightStep = 0;
  state.nightHistory = [];
  state.selection = null;
  state.nightConfirmed = false;
  state.morningInfo = null;
  state.dayResult = null;
  state.discussionTimer = null;
  state.previewOpen = false;
  state.boardOpen = false;
  state.revealPlayerId = null;
  state.revealReturnPhase = null;
}

/** Wspólne akcje nagłówka ekranów mistrza gry. */
function gmActions() {
  return {
    onOpenPreview: openPreview,
    onOpenBoard: openBoard,
    onOpenGuide: () => openGuide('manual'),
    onAbort: requestExit,
  };
}

/** Otwiera pełnoekranową Tablicę mistrza gry (nie zmienia kroku gry). */
function openBoard() {
  if (!state || !state.gameState) {
    return;
  }

  state.boardOpen = true;
  renderState();
}

function closeBoard() {
  state.boardOpen = false;
  renderState();
}

/** Ręczna korekta stanu gracza (z potwierdzeniem). */
function askCorrectPlayer(playerId) {
  const player = state.gameState.players.find((item) => item.id === playerId);

  if (!player) {
    return;
  }

  const nextAlive = !player.alive;

  openDialog({
    title: t('games.sect.dialog.correctTitle'),
    message: t('games.sect.dialog.correctMessage', {
      name: player.name,
      state: nextAlive ? t('games.sect.dialog.correctAlive') : t('games.sect.dialog.correctDead'),
    }),
    confirmLabel: t('games.sect.dialog.correctConfirm'),
    onConfirm: () => {
      const corrected = correctPlayerState(state.gameState, playerId, { alive: nextAlive });
      state.gameState = { ...corrected, winner: checkWin(corrected) };

      // Zaznaczony cel mógł właśnie przestać być żywy — czyścimy wybór.
      if (state.selection === playerId) {
        state.selection = null;
      }

      renderState();
    },
  });
}

/** Cofnięcie ostatniego zatwierdzonego kroku nocy. */
function undoNightStep() {
  const snapshot = state.nightHistory.pop();

  if (!snapshot) {
    return;
  }

  // Migawka wyborów przywraca też mikstury wiedźmy (zużywane dopiero przy rozstrzygnięciu).
  state.gameState = { ...state.gameState, nightChoices: snapshot.nightChoices };
  state.nightStep = snapshot.stepIndex;
  state.selection = null;
  state.nightConfirmed = false;
  state.witchDraft = null;
  renderState();
}

/**
 * Otwiera instrukcję mistrza gry.
 * @param {'auto'|'manual'} mode auto = automatycznie przed pierwszą nocą
 */
function openGuide(mode) {
  if (!state) {
    return;
  }

  state.guideMode = mode;
  state.guideReturnPhase = mode === 'auto' ? null : state.phase;

  if (mode === 'auto') {
    state.guideSeen = true;
  }

  state.phase = 'guide';
  renderState();
}

function closeGuide() {
  state.phase = state.guideReturnPhase ?? 'setup';
  state.guideReturnPhase = null;
  state.guideMode = null;
  renderState();
}

function renderGuide() {
  state.container.append(
    renderGuideScreen({
      auto: state.guideMode === 'auto',
      onStart: startNight,
      onSkip: startNight,
      onBack: closeGuide,
    }),
  );
}

/** Pierwsza noc: raz pokazujemy instrukcję mistrza gry, potem startujemy noc. */
function goToFirstNight() {
  if (!state.guideSeen) {
    openGuide('auto');
    return;
  }

  startNight();
}




