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
 * }} options
 *   doctorAlive — ktoś ma moc znachora (znachor albo uczeń po przejęciu),
 *   apprenticeMeets — pierwsza noc, żyją znachor i uczeń: budzą się razem,
 *   apprenticeActingName — imię ucznia, gdy to on ma dziś moc znachora
 * @returns {Array<{id: string, say: string, doText: string, pick: string|null}>}
 */
export function createNightSteps({
  nightNumber,
  doctorAlive,
  detectiveAlive,
  apprenticeMeets = false,
  apprenticeActingName = null,
}) {
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
    ...createHealerSteps({ doctorAlive, apprenticeMeets, apprenticeActingName }),
    {
      id: 'doctor-close',
      say: t('games.sect.script.doctorClose.say'),
      doText: t('games.sect.script.doctorClose.do'),
      pick: null,
    },
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
    {
      id: 'night-end',
      say: t('games.sect.script.nightEnd.say'),
      doText: t('games.sect.script.nightEnd.do'),
      pick: null,
    },
  ];
}

/**
 * Ogłoszenie poranka i szczegół tylko dla mistrza gry.
 * @param {{victimName: string|null, victimRoleName: string|null, saved: boolean}} options
 * @returns {{say: string, detail: string}}
 */
export function getMorningTexts({ victimName, victimRoleName, saved }) {
  if (victimName) {
    return {
      say: t('games.sect.script.morning.victimSay', { name: victimName }),
      detail: t('games.sect.script.morning.victimDetail', { role: victimRoleName }),
    };
  }

  return {
    say: t('games.sect.script.morning.noVictimSay'),
    detail: saved
      ? t('games.sect.script.morning.savedDetail')
      : t('games.sect.script.morning.noTargetDetail'),
  };
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
});
