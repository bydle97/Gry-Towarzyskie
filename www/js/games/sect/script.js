/**
 * Teksty, które mistrz gry czyta na głos (i krótkie instrukcje dla niego).
 *
 * Trzymamy je osobno od interfejsu, żeby można było poprawiać scenariusz bez
 * dotykania logiki i widoków. Wszystkie teksty są po polsku i dotyczą wyłącznie
 * tego, co mistrz gry ma powiedzieć lub zrobić.
 */

/** Wynik sprawdzenia śledczego — pokazywany wyłącznie po przytrzymaniu przycisku. */
export const DETECTIVE_RESULT_TEXTS = Object.freeze({
  sect: 'Ta osoba JEST sekciarzem',
  notSect: 'Ta osoba NIE JEST sekciarzem',
  gesture:
    'Pokaż śledczemu kciuk w górę, jeśli jest sekciarzem, albo kciuk w dół, jeśli nie jest.',
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
      say: 'Zapada noc. Wszyscy zamykają oczy i opuszczają głowy.',
      doText: 'Odczekaj, aż wszyscy zamkną oczy i opuszczą głowy.',
      pick: null,
    },
    {
      id: 'sect',
      say:
        nightNumber === 1
          ? 'Sekta otwiera oczy. Spójrzcie na siebie, żeby się poznać. Teraz bezgłośnie wskażcie jedną osobę, którą chcecie zabić.'
          : 'Sekta otwiera oczy. Bezgłośnie wskażcie jedną osobę, którą chcecie zabić.',
      doText:
        'Patrz, kogo wskazują. Dotknij imienia wskazanej osoby (może to być sekciarz) i zatwierdź. Jeśli się nie zgadzają, wybierz osobę wskazaną przez większość.',
      pick: 'sect',
    },
    {
      id: 'sect-close',
      say: 'Sekta zamyka oczy.',
      doText: 'Odczekaj chwilę, aż sekta zamknie oczy.',
      pick: null,
    },
    {
      id: 'doctor',
      say: 'Lekarz otwiera oczy. Wskaż, kogo chcesz ochronić tej nocy.',
      doText: doctorAlive
        ? 'Dotknij wskazaną osobę i zatwierdź. Osoba chroniona poprzedniej nocy jest zablokowana.'
        : 'Lekarz nie żyje. Powiedz te same słowa i odczekaj ok. 5–8 sekund, żeby nikt nie poznał, że go nie ma. Nikogo nie wybieraj.',
      pick: doctorAlive ? 'doctor' : null,
    },
    {
      id: 'doctor-close',
      say: 'Lekarz zamyka oczy.',
      doText: 'Odczekaj chwilę.',
      pick: null,
    },
    {
      id: 'detective',
      say: 'Śledczy otwiera oczy. Wskaż osobę, którą chcesz sprawdzić.',
      doText: detectiveAlive
        ? 'Dotknij wskazaną osobę (żywą, nie samego śledczego) i zatwierdź.'
        : 'Śledczy nie żyje. Powiedz te same słowa i odczekaj ok. 5–8 sekund, żeby nikt nie poznał, że go nie ma. Nikogo nie wybieraj.',
      pick: detectiveAlive ? 'detective' : null,
    },
    {
      id: 'detective-close',
      say: 'Śledczy zamyka oczy.',
      doText: 'Odczekaj chwilę.',
      pick: null,
    },
    {
      id: 'night-end',
      say: 'Nastaje poranek. Wszyscy otwierają oczy.',
      doText: 'Dotknij „Dalej", żeby rozstrzygnąć noc.',
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
      say: `Tej nocy zginęła osoba: ${victimName}.`,
      detail: `Rola zmarłego: ${victimRoleName}.`,
    };
  }

  return {
    say: 'Tej nocy nikt nie zginął.',
    detail: saved ? 'Lekarz uratował ofiarę sekty.' : 'Sekta nikogo nie wskazała.',
  };
}

/** Teksty dnia: dyskusja i głosowanie. */
export const DAY_TEXTS = Object.freeze({
  discussionSay: 'Rozpocznijcie dyskusję. Po niej wspólnie zdecydujecie, kto odpada z gry.',
  discussionDo:
    'Włącz licznik, jeśli chcesz ograniczyć czas dyskusji, a potem przejdź do głosowania.',
  voteSay: 'Kto odpada? Wskażcie wspólnie jedną osobę albo wybierzcie „Nikt nie odpada".',
  voteDo: 'Dotknij imienia odpadającej osoby (albo „Nikt nie odpada") i zatwierdź.',
  resultDo: 'Sprawdź warunek wygranej i przejdź dalej.',
});

/**
 * Ogłoszenie wyniku głosowania.
 * @param {{removedName: string|null, removedRoleName: string|null}} options
 * @returns {string}
 */
export function getDayResultSay({ removedName, removedRoleName }) {
  if (!removedName) {
    return 'Nikt dziś nie odpada.';
  }
  return `Z gry odpada osoba: ${removedName}. Jej rola: ${removedRoleName}.`;
}

/** Ogłoszenie zwycięzcy. */
export const FINISH_TEXTS = Object.freeze({
  villagers: 'Mieszkańcy wygrywają: sekta została wykryta.',
  sect: 'Sekta wygrywa: miasteczko jest w jej rękach.',
});
