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
 */

/** @type {ReadonlyArray<{id: string, text: string, answer: number, unit: string}>} */
export const QUESTIONS = [
  {
    id: 'hen-eggs-per-year',
    text: 'Ile jaj rocznie składa kura nioska w hodowli towarowej?',
    answer: 300,
    unit: 'jaj',
  },
];
