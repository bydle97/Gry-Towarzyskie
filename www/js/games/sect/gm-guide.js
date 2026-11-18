/**
 * Instrukcja mistrza gry — sekcje z nagłówkami i listą punktów.
 *
 * Tekst jest przeznaczony do czytania przez mistrza gry na telefonie, dlatego
 * dzielimy go na krótkie sekcje. Nazwy przycisków w punktach muszą zgadzać się
 * z rzeczywistym interfejsem („Podgląd ról", „Tablica", „Cofnij krok", ...).
 */

import { t } from '../../core/i18n.js';

const GUIDE_DATA = Object.freeze([
  {
    title: 'games.sect.guide.roles.title',
    points: [
      'games.sect.guide.roles.point1',
      'games.sect.guide.roles.point2',
      'games.sect.guide.roles.point3',
      'games.sect.guide.roles.point4',
    ],
  },
  {
    title: 'games.sect.guide.setup.title',
    points: [
      'games.sect.guide.setup.point1',
      'games.sect.guide.setup.point2',
      'games.sect.guide.setup.point3',
    ],
  },
  {
    title: 'games.sect.guide.before.title',
    points: [
      'games.sect.guide.before.point1',
      'games.sect.guide.before.point2',
      'games.sect.guide.before.point3',
    ],
  },
  {
    title: 'games.sect.guide.night.title',
    points: [
      'games.sect.guide.night.point1',
      'games.sect.guide.night.point2',
      'games.sect.guide.night.point3',
      'games.sect.guide.night.point4',
      'games.sect.guide.night.point5',
      'games.sect.guide.night.point6',
    ],
  },
  {
    title: 'games.sect.guide.morning.title',
    points: [
      'games.sect.guide.morning.point1',
      'games.sect.guide.morning.point2',
      'games.sect.guide.morning.point3',
    ],
  },
  {
    title: 'games.sect.guide.day.title',
    points: [
      'games.sect.guide.day.point1',
      'games.sect.guide.day.point2',
      'games.sect.guide.day.point3',
      'games.sect.guide.day.point4',
    ],
  },
  {
    title: 'games.sect.guide.count.title',
    points: [
      'games.sect.guide.count.point1',
      'games.sect.guide.count.point2',
    ],
  },
  {
    title: 'games.sect.guide.servant.title',
    points: [
      'games.sect.guide.servant.point1',
      'games.sect.guide.servant.point2',
      'games.sect.guide.servant.point3',
    ],
  },
  {
    title: 'games.sect.guide.witch.title',
    points: [
      'games.sect.guide.witch.point1',
      'games.sect.guide.witch.point2',
      'games.sect.guide.witch.point3',
      'games.sect.guide.witch.point4',
    ],
  },
  {
    title: 'games.sect.guide.apprentice.title',
    points: [
      'games.sect.guide.apprentice.point1',
      'games.sect.guide.apprentice.point2',
      'games.sect.guide.apprentice.point3',
    ],
  },
  {
    title: 'games.sect.guide.commander.title',
    points: [
      'games.sect.guide.commander.point1',
      'games.sect.guide.commander.point2',
      'games.sect.guide.commander.point3',
    ],
  },
  {
    title: 'games.sect.guide.end.title',
    points: ['games.sect.guide.end.point1', 'games.sect.guide.end.point2'],
  },
  {
    title: 'games.sect.guide.disputes.title',
    points: [
      'games.sect.guide.disputes.point1',
      'games.sect.guide.disputes.point2',
      'games.sect.guide.disputes.point3',
      'games.sect.guide.disputes.point4',
    ],
  },
  {
    title: 'games.sect.guide.legend.title',
    points: [
      'games.sect.guide.legend.point1',
      'games.sect.guide.legend.point2',
      'games.sect.guide.legend.point3',
      'games.sect.guide.legend.point4',
      'games.sect.guide.legend.point5',
      'games.sect.guide.legend.point6',
      'games.sect.guide.legend.point7',
      'games.sect.guide.legend.point8',
      'games.sect.guide.legend.point9',
    ],
  },
]);

export const GUIDE_SECTIONS = Object.freeze(
  GUIDE_DATA.map((section) =>
    Object.freeze({
      get title() {
        return t(section.title);
      },
      get points() {
        return section.points.map((key) => t(key));
      },
    }),
  ),
);
