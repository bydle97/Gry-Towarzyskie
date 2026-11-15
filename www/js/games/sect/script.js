/**
 * Teksty, które mistrz gry czyta na głos (i krótkie instrukcje dla niego).
 *
 * Trzymamy je osobno od interfejsu, żeby można było poprawiać scenariusz bez
 * dotykania logiki i widoków. Wszystkie teksty pochodzą z tłumaczeń; klucze
 * `say` to dokładnie to, co mistrz gry czyta na głos.
 */
import { t } from '../../core/i18n.js';

/** Wynik sprawdzenia śledczego — pokazywany wyłącznie po przytrzymaniu przycisku. */
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
 * Scenariusz jednej nocy. Każdy krok ma tekst do przeczytania i polecenie "Zrób".
 * pick: 'sect' | 'doctor' | 'detective' | null (null = krok bez wybierania osoby).
 * @param {{nightNumber: number, doctorAlive: boolean, detectiveAlive: boolean}} options
 * @returns {Array<{id: string, say: string, doText: string, pick: string|null}>}
 */
export function createNightSteps({ nightNumber, doctorAlive, detectiveAlive }) {
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
    {
      id: 'doctor',
      say: t('games.sect.script.doctor.say'),
      doText: doctorAlive
        ? t('games.sect.script.doctor.doAlive')
        : t('games.sect.script.doctor.doDead'),
      pick: doctorAlive ? 'doctor' : null,
    },
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
});

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
