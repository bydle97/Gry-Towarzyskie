/**
 * Instrukcja mistrza gry — sekcje z nagłówkami i listą punktów.
 *
 * Tekst jest przeznaczony do czytania przez mistrza gry na telefonie, dlatego
 * dzielimy go na krótkie sekcje. Nazwy przycisków w punktach muszą zgadzać się
 * z rzeczywistym interfejsem („Podgląd ról", „Tablica", „Cofnij krok", ...).
 */

export const GUIDE_SECTIONS = Object.freeze([
  Object.freeze({
    title: 'Kim jesteś',
    points: Object.freeze([
      'Jesteś mistrzem gry. Nie grasz, nie masz roli i nie głosujesz. Prowadzisz grę i jako jedyny znasz wszystkie role.',
      'Trzymaj telefon tak, żeby nikt nie widział ekranu.',
      'Tajne informacje (role, wybory nocne, wynik sprawdzenia) pokazują się tylko po przytrzymaniu przycisku.',
      'Na głos czytasz wyłącznie bloki „Powiedz na głos”. Blok „Zrób” jest tylko dla Ciebie.',
    ]),
  }),
  Object.freeze({
    title: 'Przed grą',
    points: Object.freeze([
      'Usiądźcie w kręgu. Każdy gracz dotyka swojego imienia na liście i sprawdza swoją rolę, nie pokazując jej innym.',
      'Jeśli ktoś dotknął złego imienia, w „Podglądzie ról” użyj „Pozwól sprawdzić rolę ponownie”.',
      'Gdy wszyscy znają role, odbierz telefon i dotknij „Przekazano mistrzowi gry”.',
    ]),
  }),
  Object.freeze({
    title: 'Noc',
    points: Object.freeze([
      'Wszyscy zamykają oczy i opuszczają głowy.',
      'Kolejno budzisz sektę, lekarza i śledczego. Osoba obudzona otwiera oczy i pokazuje wybraną osobę gestem, bez słów.',
      'Dotykasz imienia wskazanej osoby i zatwierdzasz przyciskiem „Zatwierdź”. Aplikacja sama ją oznacza: 🗡️ ofiara sekty, 💉 chroniony przez lekarza, 🔍 sprawdzony przez śledczego.',
      'Śledczemu pokazujesz wynik gestem: kciuk w górę = sekciarz, kciuk w dół = nie sekciarz.',
      'Gdy lekarz lub śledczy nie żyje, i tak „obudź” go słowami i odczekaj 5–8 sekund, żeby nikt nie poznał, że już go nie ma.',
      'Pomyłka w wyborze? Użyj „Cofnij krok” na ekranie nocy.',
    ]),
  }),
  Object.freeze({
    title: 'Poranek',
    points: Object.freeze([
      'Aplikacja sama rozstrzyga noc: ofiara sekty ginie, chyba że lekarz ją ochronił.',
      'Czytasz tylko ogłoszenie. Nie zdradzaj, kto był ofiarą ani kogo chronił lekarz, jeśli nikt nie zginął.',
      'Zmarły dostaje oznaczenie 💀, nie rozmawia, nie głosuje i nie zdradza swojej roli, ale może w ciszy oglądać grę.',
    ]),
  }),
  Object.freeze({
    title: 'Dzień',
    points: Object.freeze([
      'Gracze dyskutują — możesz włączyć licznik czasu przyciskami „Start” i „Stop”.',
      'Potem wspólnie, np. przez podniesienie rąk, wskazują osobę, która odpada, a Ty dotykasz jej imienia i „Zatwierdź”.',
      'Przy remisie albo braku decyzji wybierz „Nikt nie odpada”.',
      'Odczytujesz rolę odpadniętej osoby tak, jak podaje ekran.',
    ]),
  }),
  Object.freeze({
    title: 'Koniec gry',
    points: Object.freeze([
      'Mieszkańcy wygrywają, gdy nie ma już sekciarzy.',
      'Sekta wygrywa, gdy sekciarzy jest tylu co pozostałych żywych graczy lub więcej.',
    ]),
  }),
  Object.freeze({
    title: 'Sytuacje sporne',
    points: Object.freeze([
      'Sekta nie może się dogadać: wybierz osobę wskazaną przez większość.',
      'Lekarz może chronić siebie, ale nie tę samą osobę dwie noce z rzędu.',
      'Śledczy sprawdza tylko żywych i nie siebie.',
      'Pomyłka w wyborze: użyj „Cofnij krok” albo w „Tablicy” przycisk „Popraw ręcznie”.',
    ]),
  }),
  Object.freeze({
    title: 'Legenda oznaczeń',
    points: Object.freeze([
      '💀 nie żyje',
      '🗡️ ofiara sekty',
      '💉 chroniony przez lekarza',
      '🔍 sprawdzony przez śledczego',
    ]),
  }),
]);
