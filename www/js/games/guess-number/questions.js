/**
 * Pytania do gry "Obstawianie".
 *
 * Jak dodać kolejne pytanie:
 *   1. dopisz nowy obiekt na końcu tablicy QUESTIONS (kolejność w pliku nie ma znaczenia —
 *      gra tasuje listę na starcie partii i nie powtarza pytań w obrębie jednej partii),
 *   2. pole "id" musi być unikalne: małe litery, cyfry i myślniki, np. "moon-distance",
 *   3. pole "text" to treść pytania po polsku (jedno zdanie, bez odpowiedzi w treści),
 *   4. pole "answer" to poprawna odpowiedź — liczba całkowita (może być ujemna),
 *   5. pole "unit" to jednostka pokazywana po odpowiedzi, np. "jaj", "km"; użyj "" (pusty tekst),
 *      gdy odpowiedź jest bezjednostkowa,
 *   6. nie zmieniaj istniejących pytań w trakcie partii — gra trzyma ich kopię w pamięci.
 *
 * Odpowiedzi opracowano na podstawie Wikipedii — przy dopisywaniu nowych pytań warto
 * sprawdzić wartość w źródle i dobrać jednostkę zgodną z treścią pytania. Odpowiedź
 * zawsze musi być jedną liczbą całkowitą (ranking liczy odległość od jednej wartości),
 * dlatego pytania o zakres (np. „128 × 128") zamieniamy na pytanie o jedną wartość.
 */

/** @type {ReadonlyArray<{id: string, text: string, answer: number, unit: string}>} */
export const QUESTIONS = [
  {
    id: 'hen-eggs-per-year',
    text: 'Ile jaj rocznie składa kura nioska w hodowli towarowej?',
    answer: 300,
    unit: 'jaj',
  },
  {
    id: 'first-electric-toaster-year',
    text: 'W którym roku skonstruowano pierwszy samodzielny toster elektryczny?',
    answer: 1893,
    unit: '',
  },
  {
    id: 'norway-islands-count',
    text: 'Ile wysp liczy Norwegia według danych norweskiego urzędu kartograficznego?',
    answer: 239057,
    unit: 'wysp',
  },
  {
    id: 'first-webcam-year',
    text: 'W którym roku powstała pierwsza kamera internetowa, która obserwowała dzbanek z kawą na Uniwersytecie Cambridge?',
    answer: 1991,
    unit: '',
  },
  {
    id: 'first-sms-year',
    text: 'W którym roku wysłano pierwszą wiadomość SMS w historii?',
    answer: 1992,
    unit: '',
  },
  {
    id: 'first-atm-year',
    text: 'W którym roku zainstalowano bankomat uznawany za pierwszy na świecie?',
    answer: 1967,
    unit: '',
  },
  {
    id: 'first-public-aquarium-year',
    text: 'W którym roku otwarto pierwsze publiczne akwarium na świecie?',
    answer: 1853,
    unit: '',
  },
  {
    id: 'first-crossword-year',
    text: 'W którym roku opublikowano pierwszą nowoczesną krzyżówkę?',
    answer: 1913,
    unit: '',
  },
  {
    id: 'first-mouse-prototype-year',
    text: 'W którym roku zbudowano pierwszy prototyp myszy komputerowej?',
    answer: 1964,
    unit: '',
  },
  {
    id: 'tennis-for-two-year',
    text: 'W którym roku po raz pierwszy zaprezentowano grę komputerową „Tennis for Two”?',
    answer: 1958,
    unit: '',
  },
  {
    id: 'creeper-worm-year',
    text: 'W którym roku powstał Creeper — pierwszy robak komputerowy?',
    answer: 1971,
    unit: '',
  },
  {
    id: 'sputnik-1-launch-year',
    text: 'W którym roku wystrzelono Sputnika 1, pierwszego sztucznego satelitę Ziemi?',
    answer: 1957,
    unit: '',
  },
  {
    id: 'anglo-zanzibar-war-minutes',
    text: 'Ile minut trwała wojna brytyjsko-zanzibarska, uznawana za najkrótszą w historii?',
    answer: 38,
    unit: 'minut',
  },
  {
    id: 'first-passenger-steam-railway-year',
    text: 'W którym roku uruchomiono pierwszą pasażerską kolej parową na świecie?',
    answer: 1825,
    unit: '',
  },
  {
    id: 'otis-passenger-elevator-year',
    text: 'W którym roku zainstalowano pierwszy pasażerski dźwig osobowy zaprojektowany przez Elishę Otisa?',
    answer: 1857,
    unit: '',
  },
  {
    id: 'first-parachute-jump-year',
    text: 'W którym roku Louis-Sébastien Lenormand wykonał pierwszy odnotowany publiczny skok ze spadochronem?',
    answer: 1783,
    unit: '',
  },
  {
    id: 'coney-island-roller-coaster-year',
    text: 'W którym roku powstała pierwsza kolejka górska na Coney Island w Nowym Jorku?',
    answer: 1884,
    unit: '',
  },
  {
    id: 'penny-black-print-run',
    text: 'Ile egzemplarzy pierwszego znaczka pocztowego Penny Black wydrukowano?',
    answer: 68808000,
    unit: 'egzemplarzy',
  },
  {
    id: 'me-at-the-zoo-duration-seconds',
    text: 'Ile sekund trwał pierwszy film opublikowany na YouTube, zatytułowany „Me at the zoo”?',
    answer: 19,
    unit: 'sekund',
  },
  {
    id: 'sputnik-1-transmission-days',
    text: 'Przez ile dni Sputnik 1 nadawał sygnał radiowy po wystrzeleniu?',
    answer: 22,
    unit: 'dni',
  },
  {
    id: 'first-webcam-width-pixels',
    text: 'Ile pikseli miała szerokość obrazu pierwszej kamery internetowej w Cambridge?',
    answer: 128,
    unit: 'pikseli',
  },
];
