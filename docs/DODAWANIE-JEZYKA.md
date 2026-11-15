# Dodawanie nowego języka

Aplikacja ma teksty źródłowe po polsku (`www/locales/pl.json`) i treści gier
w folderach `www/data/<kod języka>/`. Język źródłowy i zapasowy to `pl`.

## 1. Dodaj plik tłumaczeń

1. Skopiuj `www/locales/pl.json` do `www/locales/<kod>.json` (np. `de.json`).
2. Przetłumacz wszystkie wartości. Klucze pozostaw bez zmian.
3. Nie usuwaj kluczy — brakujący klucz w wybranym języku zostanie zastąpiony
   tekstem polskim, a w konsoli pojawi się ostrzeżenie.

## 2. Dodaj treść gier

Utwórz folder `www/data/<kod>/` i wklej do niego trzy pliki:

- `questions-na-oko.txt`
- `phrases-w-pol-slowa.txt`
- `categories-ping-pong.txt`

Zachowaj format i komentarze z instrukcją (w wersji danego języka). Puste linie
i linie zaczynające się od `#` są ignorowane. Jeśli pliku w danym języku brakuje,
loader użyje wersji polskiej i wypisze `console.warn`.

## 3. Dopisz język do listy

W `www/js/core/languages.js` dopisz do `LANGUAGES`:

```js
Object.freeze({ code: 'de', nativeName: 'Deutsch', dir: 'ltr' }),
```

- `code` musi być taki sam jak nazwa pliku JSON i folderu w `www/data/`,
- `nativeName` jest nazwą widoczną w przełączniku,
- `dir` to `'ltr'` albo `'rtl'`.

Nic więcej nie trzeba zmieniać — przełącznik języka i ładowanie treści działają
na podstawie tej tablicy.

## 4. Sprawdź tłumaczenie

1. Otwórz aplikację i wybierz nowy język na ekranie głównym.
2. Sprawdź HUB, szczegóły gier i wszystkie ekrany gier.
3. W konsoli uruchom:

```js
window.__i18nCheck();
```

Powinno pokazać `0` brakujących i `0` nadmiarowych kluczy dla każdego języka.

## Jak dodawać nowe klucze

- Dodaj ten sam klucz do `pl.json` i do każdego innego pliku językowego.
- W kodzie używaj `t('klucz')`; parametry podstawiaj przez `t('klucz', { name })`.
- Liczby formatuj przez `formatNumber(value, options)`.
- Odmianę liczby mnogiej rób przez `tPlural('klucz', n)` i dodaj formy
  `_one`, `_few`, `_many`, `_other` (dla angielskiego wystarczą `_one` i `_other`,
  ale dodaj wszystkie cztery, żeby `__i18nCheck()` był czysty).
- Teksty czytane na głos w grze „Sekta” mają osobne klucze `...say`, a polecenia
  dla mistrza gry — `...do`. Nie łącz ich w jeden tekst.

## Nazewnictwo kluczy

- Obszary: `app.*`, `hub.*`, `router.*`, `players.*`, `details.*`, `game.*`,
  `content.*`, `teams.*`, `language.*`, `games.<id>.*`.
- W grach: `games.<id>.name`, `games.<id>.description`, `games.<id>.goal`,
  `games.<id>.steps.N`, `games.<id>.tips.N`, a teksty ekranów w podgrupach
  (np. `games.sect.check.title`, `games.sect.script.nightStart.say`).
- Klucze są płaskie (kropki są częścią nazwy), pisane małymi literami.

## Zasady pamięci

- `localStorage` służy wyłącznie do zapisania kodu języka pod kluczem `gt.lang`
  (w `try/catch`).
- Pule treści są pamiętane tylko w pamięci sesji i rozdzielone językami
  (np. `guess-number:pl`, `guess-number:en`).
- Po odświeżeniu strony pula i stan gry zaczynają się od nowa.
