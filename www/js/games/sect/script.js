/**
 * Teksty, które mistrz gry czyta na głos (i krótkie instrukcje dla niego).
 *
 * Trzymamy je osobno od interfejsu, żeby można było poprawiać scenariusz bez
 * dotykania logiki i widoków. Wszystkie teksty pochodzą z tłumaczeń; klucze
 * `say` to dokładnie to, co mistrz gry czyta na głos.
 */
import { t } from '../../core/i18n.js';

/** Wynik sprawdzenia łowcy — pokazywany wyłącznie po przytrzymaniu przycisku. */
export const DETECTIVE_RESULT_TEXTS = Object.freeze({
  get sect() {
    return t('games.sect.script.detectiveResult.sect');
  },
  get notSect() {
    return t('games.sect.script.detectiveResult.notSect');
  },
  get gesture() {
    return t('games.sect.script.detectiveResult.gesture');
  },
});

/**
 * Kroki znachora. W pierwszą noc, gdy żyją znachor i uczeń, najpierw budzą się
 * obaj, żeby się poznać, potem uczeń zamyka oczy, a znachor (oczy już otwarte)
 * wybiera jak zwykle. Gdy moc znachora ma uczeń, „Zrób” podpowiada mistrzowi, kto to.
 * @param {{doctorAlive: boolean, apprenticeMeets: boolean, apprenticeActingName: string|null}} options
 * @returns {Array<{id: string, say: string, doText: string, pick: string|null}>}
 */
function createHealerSteps({ doctorAlive, apprenticeMeets, apprenticeActingName }) {
  const meetSteps = apprenticeMeets
    ? [
        {
          id: 'healer-apprentice-meet',
          say: t('games.sect.script.healerMeet.say'),
          doText: t('games.sect.script.healerMeet.do'),
          pick: null,
        },
        {
          id: 'apprentice-close',
          say: t('games.sect.script.apprenticeClose.say'),
          doText: t('games.sect.script.apprenticeClose.do'),
          pick: null,
        },
      ]
    : [];

  let doText = t('games.sect.script.doctor.doDead');

  if (doctorAlive && apprenticeActingName) {
    doText = t('games.sect.script.doctor.doApprentice', { name: apprenticeActingName });
  } else if (doctorAlive) {
    doText = t('games.sect.script.doctor.doAlive');
  }

  return [
    ...meetSteps,
    {
      id: 'doctor',
      // Po poznaniu z uczniem znachor ma już otwarte oczy.
      say: apprenticeMeets
        ? t('games.sect.script.doctor.sayAfterMeet')
        : t('games.sect.script.doctor.say'),
      doText,
      pick: doctorAlive ? 'doctor' : null,
    },
  ];
}

/**
 * Scenariusz jednej nocy. Każdy krok ma tekst do przeczytania i polecenie "Zrób".
 * pick: 'sect' | 'doctor' | 'detective' | null (null = krok bez wybierania osoby).
 * @param {{
 *   nightNumber: number,
 *   doctorAlive: boolean,
 *   detectiveAlive: boolean,
 *   apprenticeMeets?: boolean,
 *   apprenticeActingName?: string|null,
 *   doctorInGame?: boolean,
 *   detectiveInGame?: boolean,
 *   servantMeets?: boolean,
 *   witchInGame?: boolean,
 *   witchActive?: boolean,
 * }} options
 *   witchInGame — wiedźma jest w składzie: jej krok jest po znachorze, a przed łowcą,
 *   witchActive — wiedźma żyje i ma choć jedną miksturę; inaczej krok jest atrapą,
 *   servantMeets — pierwsza noc, w grze jest sługa: po zamknięciu oczu przez wampiry
 *   sługa poznaje wampiry (wampiry unoszą rękę z zamkniętymi oczami),
 *   doctorAlive — ktoś ma moc znachora (znachor albo uczeń po przejęciu),
 *   apprenticeMeets — pierwsza noc, żyją znachor i uczeń: budzą się razem,
 *   apprenticeActingName — imię ucznia, gdy to on ma dziś moc znachora,
 *   doctorInGame / detectiveInGame — rola jest w składzie tej partii; gdy jej nie ma
 *   (wyłączona na ekranie wyboru ról), jej kroki są pominięte. Rola w grze, ale
 *   martwa, nadal ma krok-atrapę, żeby nikt nie poznał jej stanu.
 * @returns {Array<{id: string, say: string, doText: string, pick: string|null}>}
 */
export function createNightSteps({
  nightNumber,
  doctorAlive,
  detectiveAlive,
  apprenticeMeets = false,
  apprenticeActingName = null,
  doctorInGame = true,
  detectiveInGame = true,
  servantMeets = false,
  witchInGame = false,
  witchActive = false,
}) {
  // Wiedźma: prawdziwy krok (pick 'witch') albo atrapa z tymi samymi słowami.
  const witchSteps = witchInGame
    ? [
        {
          id: 'witch',
          say: t('games.sect.script.witch.say'),
          doText: witchActive
            ? t('games.sect.script.witch.doActive')
            : t('games.sect.script.witch.doDead'),
          pick: witchActive ? 'witch' : null,
        },
        {
          id: 'witch-close',
          say: t('games.sect.script.witchClose.say'),
          doText: t('games.sect.script.witchClose.do'),
          pick: null,
        },
      ]
    : [];

  // Sługa poznaje wampiry tylko w pierwszą noc; potem nie ma żadnego kroku.
  const servantSteps = servantMeets
    ? [
        {
          id: 'servant-open',
          say: t('games.sect.script.servant.say'),
          doText: t('games.sect.script.servant.do'),
          pick: null,
        },
        {
          id: 'servant-close',
          say: t('games.sect.script.servantClose.say'),
          doText: t('games.sect.script.servantClose.do'),
          pick: null,
        },
      ]
    : [];

  const healerSteps = doctorInGame
    ? [
        ...createHealerSteps({ doctorAlive, apprenticeMeets, apprenticeActingName }),
        {
          id: 'doctor-close',
          say: t('games.sect.script.doctorClose.say'),
          doText: t('games.sect.script.doctorClose.do'),
          pick: null,
        },
      ]
    : [];

  const detectiveSteps = detectiveInGame
    ? [
        {
          id: 'detective',
          say: t('games.sect.script.detective.say'),
          doText: detectiveAlive
            ? t('games.sect.script.detective.doAlive')
            : t('games.sect.script.detective.doDead'),
          pick: detectiveAlive ? 'detective' : null,
        },
        {
          id: 'detective-close',
          say: t('games.sect.script.detectiveClose.say'),
          doText: t('games.sect.script.detectiveClose.do'),
          pick: null,
        },
      ]
    : [];

  return [
    {
      id: 'night-start',
      say: t('games.sect.script.nightStart.say'),
      doText: t('games.sect.script.nightStart.do'),
      pick: null,
    },
    {
      id: 'sect',
      say:
        nightNumber === 1
          ? t('games.sect.script.sect.sayFirst')
          : t('games.sect.script.sect.sayAgain'),
      doText: t('games.sect.script.sect.do'),
      pick: 'sect',
    },
    {
      id: 'sect-close',
      say: t('games.sect.script.sectClose.say'),
      doText: t('games.sect.script.sectClose.do'),
      pick: null,
    },
    ...servantSteps,
    ...healerSteps,
    ...witchSteps,
    ...detectiveSteps,
    {
      id: 'night-end',
      say: t('games.sect.script.nightEnd.say'),
      doText: t('games.sect.script.nightEnd.do'),
      pick: null,
    },
  ];
}

/**
 * Lista imion w jednym zdaniu: „Ala i Bartek”, „Ala, Bartek i Celina”.
 * @param {string[]} names
 * @returns {string}
 */
function joinNames(names) {
  if (names.length <= 1) {
    return names.join('');
  }
  return `${names.slice(0, -1).join(', ')}${t('games.sect.script.morning.namesAnd')}${names[names.length - 1]}`;
}

/** Szczegół dla mistrza gry: kto uratował ofiarę wampirów (albo pusty tekst). */
function getSavedDetail(savedBy) {
  if (savedBy === 'both') {
    return t('games.sect.script.morning.savedBothDetail');
  }
  if (savedBy === 'witch') {
    return t('games.sect.script.morning.savedByWitchDetail');
  }
  if (savedBy === 'healer') {
    return t('games.sect.script.morning.savedDetail');
  }
  return '';
}

/**
 * Ogłoszenie poranka i szczegół tylko dla mistrza gry. W jednej nocy mogą zginąć
 * 0, 1 albo 2 osoby (ofiara wampirów i osoba otruta przez wiedźmę).
 * @param {{
 *   victims: Array<{name: string, roleName: string}>,
 *   savedBy?: 'healer'|'witch'|'both'|null,
 * }} options
 * @returns {{say: string, detail: string}}
 */
export function getMorningTexts({ victims = [], savedBy = null }) {
  const savedDetail = getSavedDetail(savedBy);

  if (victims.length === 0) {
    return {
      say: t('games.sect.script.morning.noVictimSay'),
      detail: savedDetail || t('games.sect.script.morning.noTargetDetail'),
    };
  }

  const say =
    victims.length === 1
      ? t('games.sect.script.morning.victimSay', { name: victims[0].name })
      : t('games.sect.script.morning.victimsSay', { names: joinNames(victims.map((v) => v.name)) });
  const roles =
    victims.length === 1
      ? t('games.sect.script.morning.victimDetail', { role: victims[0].roleName })
      : t('games.sect.script.morning.victimsDetail', {
          roles: victims.map((v) => `${v.name} — ${v.roleName}`).join(', '),
        });

  return { say, detail: savedDetail ? `${roles} ${savedDetail}` : roles };
}

/** Teksty dnia: dyskusja i głosowanie. */
export const DAY_TEXTS = Object.freeze({
  get discussionSay() {
    return t('games.sect.script.day.discussionSay');
  },
  get discussionDo() {
    return t('games.sect.script.day.discussionDo');
  },
  get voteSay() {
    return t('games.sect.script.day.voteSay');
  },
  get voteDo() {
    return t('games.sect.script.day.voteDo');
  },
  get resultDo() {
    return t('games.sect.script.day.resultDo');
  },
  get commanderDo() {
    return t('games.sect.script.commander.do');
  },
});

/**
 * Tekst do przeczytania, gdy komendant przejmuje głosowanie.
 * @param {string} commanderName
 * @returns {string}
 */
export function getCommanderSay(commanderName) {
  return t('games.sect.script.commander.say', { name: commanderName });
}

/**
 * Ogłoszenie wyniku głosowania.
 * @param {{removedName: string|null, removedRoleName: string|null}} options
 * @returns {string}
 */
export function getDayResultSay({ removedName, removedRoleName }) {
  if (!removedName) {
    return t('games.sect.script.dayResult.nobody');
  }
  return t('games.sect.script.dayResult.removed', {
    name: removedName,
    role: removedRoleName,
  });
}

/** Ogłoszenie zwycięzcy. */
export const FINISH_TEXTS = Object.freeze({
  get villagers() {
    return t('games.sect.script.finish.villagers');
  },
  get sect() {
    return t('games.sect.script.finish.sect');
  },
  /** Wygrana wampirów, gdy w grze jest sługa (wygrywa razem z nimi). */
  get sectWithServant() {
    return t('games.sect.script.finish.sectWithServant');
  },
});

/**
 * Tekst wyniku dla wyniku z engine.getWinnerOutcome().
 * @param {'villagers'|'sect'|'sectWithServant'|null} outcome
 * @returns {string} pusty tekst, gdy gra trwa
 */
export function getFinishText(outcome) {
  if (outcome === 'villagers') {
    return FINISH_TEXTS.villagers;
  }
  if (outcome === 'sectWithServant') {
    return FINISH_TEXTS.sectWithServant;
  }
  if (outcome === 'sect') {
    return FINISH_TEXTS.sect;
  }
  return '';
}
