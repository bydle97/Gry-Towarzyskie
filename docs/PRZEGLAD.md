# Przegląd aplikacji „Gry towarzyskie” (code review + QA)

Data: 2026-11-17 · stan repozytorium: commit `529e596` (gałąź `master`, czyste drzewo)
Tryb: tylko do odczytu — w projekcie nic nie zostało zmienione poza tym plikiem.

> **Stan raportu:** ukończone wszystkie trzy części: 1 (rdzeń), 2 (gry) i 3 (przekrojowe).
> Na końcu: lista „do zrobienia przed testami” i proponowana kolejność małych commitów.

---

## 1. Podsumowanie

### 10 najważniejszych problemów (kolejność według ważności dla graczy)

1. **W-2** Gest/przycisk „wstecz” w Androidzie oraz „pociągnij, aby odświeżyć” w Chrome zamykają albo przeładowują aplikację w środku gry. Przepada partia i lista graczy.
2. **W-1** Pytania z odpowiedzią zapisaną z przecinkiem lub spacjami („64,6”, „5 000 000”, „239,057”) są po cichu pomijane: w PL znika 3 z 22 pytań, w EN 4 z 22. Sprawdzone w działaniu.
3. **W-4** Po wyczerpaniu puli treści pytania, hasła i kategorie powtarzają się w obrębie tej samej partii. Symulacja: w ok. 80% sesji któraś z pięciu partii „Na oko” zawiera powtórzone pytanie, zwykle już trzecia (ok. 58% sesji).
4. **W-5** „Sekta”: przejście do nocy bez sprawdzenia wszystkich ról sprawia, że gracz nie pozna swojej roli. Dialog obiecuje coś, czego aplikacja nie umożliwia.
5. **W-7** „Sekta”: główny przycisk po grze, „Jeszcze raz (te same osoby)”, zachowuje role, które właśnie zostały ujawnione wszystkim.
6. **W-6** Brak krótkiej blokady dotknięć po zmianie ekranu. Np. w „Ping-pongu” gracz stukający w swoją połowę w chwili końca czasu może od razu „kliknąć” ekran wyniku.
7. **W-3** Po przejściu z ekranu głównego do szczegółów gry strona nie wraca na górę.
8. **W-8** Wersja webowa nie działa offline, choć opis to obiecuje: treść gier jest pobierana dopiero przy wejściu do gry, a nie ma service workera.
9. **D-9** „Sekta”: licznik dyskusji zeruje się po zajrzeniu na Tablicę lub do instrukcji.
10. **D-13** „Na oko”: instrukcja mówi „po wszystkich pytaniach”, a partia ma 8 pytań. Ostatni przycisk to „Następne pytanie”.

Poza dziesiątką, ale tanie: D-10 (przytrzymanie w „Sekcie”), D-14 (spacje w liczbach), D-17 (`noindex`).

### Co jest dobre

- Rdzeń jest mały i czytelny: router bez bibliotek z funkcją sprzątającą, `el()` budujący DOM wyłącznie przez `textContent` (w całym `www/` nie ma `innerHTML`), stan sesji tylko w pamięci.
- Tłumaczenia są kompletne: 438 kluczy w PL i EN, identyczne zestawy, zgodne parametry `{…}`, wszystkie klucze użyte w kodzie istnieją (sprawdzone skryptem).
- Polska odmiana przez `Intl.PluralRules` jest poprawna (np. „2 osoby / 5 osób”, „2 sekciarzy”, „54 państwa”).
- Loader treści jest odporny: obsługuje CRLF/LF, komentarze, duplikaty, wraca do PL przy braku pliku, nie zapamiętuje błędów (działa „Spróbuj ponownie”), a adresy buduje względem `import.meta.url`. Działa więc pod adresem w podkatalogu (GitHub Pages).
- Wielkość liter we wszystkich importach i ścieżkach w `index.html` zgadza się z nazwami plików (sprawdzone skryptem), więc serwer z Linuksem nie zgłosi 404.
- Bezpieczeństwo i prywatność: zero `innerHTML`, zero zapytań poza własnymi plikami, jedyny zapis to kod języka (`gt.lang`), brak sekretów w całej historii git (sprawdzone).
- Gry sprzątają po sobie: interwały, nasłuch `visibilitychange`, blokada ekranu i wstrzyknięte style są usuwane w `unmount()`, a asynchroniczne wczytywanie ma tokeny chroniące przed spóźnionymi odpowiedziami.
- Dostępność jest przemyślana: cele dotyku 44–56 px, `:focus-visible`, `prefers-reduced-motion`, `safe-area` u góry i u dołu, pola 16 px (iOS nie powiększa strony), etykiety pól i `aria-label` przycisków z imionami.

---

## 2. Tabela pokrycia

| Obszar | Pliki | Przeczytane | Uruchomione / zweryfikowane w działaniu | Czego NIE sprawdzono |
|---|---|---|---|---|
| Konfiguracja i dokumentacja | `.gitignore`, `.clineignore`, `.github/workflows/pages.yml`, `docs/DODAWANIE-JEZYKA.md` | tak, w całości | — | czy wdrożenie na Pages faktycznie działa (brak dostępu do sieci/Actions) |
| Szkielet | `www/index.html`, `www/js/main.js` | tak | `node --check` | uruchomienie w przeglądarce |
| core/ | `router, session, random, content-pool, content-loader, i18n, languages, game-contract, games-registry, game-api, dom, format` | tak, wszystkie | `node --check`; **content-loader + i18n uruchomione w Node** na prawdziwych plikach `data/` (podstawiony `fetch` czytający z dysku) | zachowanie `fetch` w przeglądarce i w WebView |
| components/ | `player-list-editor, team-setup, content-status, language-switcher` | tak | `node --check` | interakcja w przeglądarce |
| screens/ | `home-screen, details-screen, game-screen` | tak | `node --check` | interakcja w przeglądarce |
| CSS | `base.css, layout.css, components.css` | tak | skrypt: klasy użyte w JS a brakujące w CSS (klasy gier `gn-/rv-/dl-/sec-` są wstrzykiwane z JS gier, więc to nie błąd) | rendering na 320 px, kontrast mierzony tylko obliczeniowo |
| Dane | `data/pl/*.txt`, `data/en/*.txt` (6 plików) | tak | parser: PL 19 pytań / 30 haseł / 30 kategorii; EN 18 / 30 / 30; kodowanie UTF-8 bez BOM | prawdziwość faktów w pytaniach |
| Tłumaczenia | `locales/pl.json`, `locales/en.json` | tak, w całości | skrypt: zgodność kluczy, parametrów, form liczby mnogiej, kluczy użytych w kodzie | — |
| Gra „Na oko” | `games/guess-number/{index,engine,ui}.js` | tak, w całości | `node --check`; **symulacja puli treści** (prawdziwy `content-pool.js`, 2000 sesji × 5 partii po 8 pytań z 19) | rozgrywka w przeglądarce |
| Gra „W pół słowa” | `games/revolver/{index,ui}.js` | `index.js` w całości, `ui.js` od linii 150 (wcześniej tylko style CSS) | `node --check` | rozgrywka w przeglądarce |
| Gra „Ping-pong” | `games/duel/{index,ui}.js` | tak, w całości | `node --check` | **zegar nie był uruchomiony**: dokładność oceniona z kodu (czas liczony ze znaczników `performance.now()`); wibracje i blokada wygaszania nie testowane na urządzeniu |
| Gra „Sekta” | `games/sect/{index,engine,config,script,gm-guide,ui}.js` | tak; w `ui.js` style CSS przejrzane wybiórczo (linie 1–240 i `z-index`), logika w całości | `node --check` | rozgrywka, gest przytrzymania na prawdziwym ekranie dotykowym |

| Część 3 (przekrojowe) | całe repozytorium | — | `git grep` sekretów we **wszystkich rewizjach** (brak); wyszukanie `innerHTML`/`fetch`/`localStorage`/adresów `http(s)` w `www/`; zliczenie zduplikowanych funkcji w grach; odwołań do usuniętych plików; nowszych funkcji JS/CSS (zgodność przeglądarek) | czy wersje akcji w `pages.yml` (checkout v7 itd.) istnieją, bo brak dostępu do sieci; zachowanie w WebView Capacitora (projekt Capacitora jeszcze nie istnieje); CSP nie była testowana w przeglądarce |

**Ogólnie NIE sprawdzone w działaniu:** żaden ekran nie był renderowany w prawdziwej przeglądarce ani na telefonie (brak środowiska z przeglądarką). Wszystko, co dotyczy dotyku, przewijania, gestów „wstecz” i czytników ekranu, wynika z analizy kodu.

---

## 3. Lista problemów

### CZĘŚĆ 1 — rdzeń

#### W-1. Pytania z liczbą zapisaną z przecinkiem lub spacjami są po cichu pomijane
- **Pliki:** `www/data/pl/questions-na-oko.txt` (linie 28, 30, 34), `www/data/en/questions-na-oko.txt` (linie 15, 26, 28, 32); `www/js/core/content-loader.js` → `loadQuestions()` (wyrażenie `/^[+-]?\d+$/`).
- **Scenariusz:** uruchom „Na oko”. W konsoli pojawia się „odpowiedź nie jest liczbą całkowitą — linia pominięta”, a gracze nigdy nie zobaczą pytań o choinkę (64,6), mieszki włosowe (5 000 000), słownik (100 000), a w EN także o wyspy Norwegii (239,057) i OED (520,779). Zweryfikowane uruchomieniem parsera: PL 19 zamiast 22 pytań, EN 18 zamiast 22. Najpewniej dotyczy to części pytań dodanych w commicie „nowe pytania do na oko”.
- **Poprawka:** w plikach zapisz odpowiedzi jako same cyfry (`5000000`, `100000`, `239057`, `520779`; choinkę zaokrąglij do `65` albo przelicz na centymetry). Opcjonalnie loader może przed sprawdzeniem usuwać spacje, twarde spacje i `_` (ale nie przecinki, bo „64,6” i „239,057” znaczą co innego w PL i EN).
- **Nakład:** mały · **Pewność:** pewny błąd (sprawdzony w działaniu).

#### W-2. „Wstecz” w systemie i „pociągnij, aby odświeżyć” kasują rozgrywkę
- **Pliki:** `www/js/core/router.js` (router celowo bez History API), `www/css/base.css` (brak `overscroll-behavior` na `html/body`), brak `beforeunload`.
- **Scenariusz:** (a) w trakcie dowolnej gry ktoś robi gest „wstecz” na Androidzie albo klika strzałkę w przeglądarce. Historia przeglądarki nie ma wpisów aplikacji, więc przeglądarka opuszcza stronę: znika gra i lista graczy. (b) W Chrome na Androidzie przy przewiniętej do góry stronie przypadkowe pociągnięcie w dół przeładowuje aplikację, a zacznie się od pustej listy graczy. (c) W Capacitorze domyślny przycisk „wstecz” bez obsługi zamyka aplikację.
- **Poprawka:** (1) dodaj `overscroll-behavior-y: none` dla `html, body` (wyłącza pull-to-refresh, jedna linia CSS). (2) W `navigate()` wołaj `history.pushState`, a w `popstate` wywołuj `back()`, na ekranie gry zaś pokaż istniejące okno „Zakończyć grę?” zamiast wychodzić. (3) Na ekranie gry ustaw `beforeunload` z ostrzeżeniem. W Capacitorze później: `App.addListener('backButton', …)` z tą samą logiką.
- **Nakład:** mały (CSS) + średni (History API) · **Pewność:** pewny błąd (analiza kodu; zachowanie gestów nie testowane na urządzeniu).

#### W-3. Nowy ekran nie startuje od góry
- **Pliki:** `www/js/core/router.js` → `renderRoute()`; `www/js/screens/home-screen.js`.
- **Scenariusz:** dodaj 6–8 graczy, przewiń w dół do kart gier i dotknij gry. Ekran szczegółów zachowuje przewinięcie strony: widać środek albo koniec instrukcji, a nie cel gry. Tak samo przy „Wróć do listy graczy”. Gry same wołają `scrollTo` przy zmianie faz, a router tego nie robi.
- **Poprawka:** w `renderRoute()` po narysowaniu ekranu wywołaj `window.scrollTo(0, 0)` (z wyjątkiem `refreshCurrentScreen`, gdzie przewinięcie można zostawić).
- **Nakład:** mały · **Pewność:** pewny błąd (analiza kodu).

#### D-1. Podwójne dotknięcie przy zmianie ekranu („ghost tap”)
- **Pliki:** `www/js/core/router.js` → `navigate()`; `home-screen.js` → `createGameCard`; `details-screen.js` → `createActions`.
- **Scenariusz:** szybkie podwójne dotknięcie „Start” na szczegółach. Pierwsze dotknięcie od razu podmienia ekran, więc drugie może trafić w przycisk gry, który pojawił się w tym samym miejscu (np. „Zaczynamy” albo „Losuj ponownie”). Dwukrotne dotknięcie karty gry nie szkodzi, bo karta znika z DOM, ale strzałka „wstecz” zachowuje się wtedy różnie w zależności od przeglądarki.
- **Poprawka:** w `navigate()` ignoruj kolejne wywołanie w ciągu ok. 300 ms (taka sama osłona jak `canAct()` w `team-setup.js`).
- **Nakład:** mały · **Pewność:** możliwy błąd.

#### D-2. Zmiana języka kasuje wpisywane imię i tryb edycji
- **Pliki:** `www/js/main.js` (`onLanguageChange` → `refreshCurrentScreen`), `components/player-list-editor.js` (stan `view` lokalny w zamknięciu).
- **Scenariusz:** zacznij wpisywać imię albo edytować gracza, potem zmień język. Ekran rysuje się od nowa i szkic przepada. Gracze zostają, bo są w sesji.
- **Poprawka:** można zostawić bez zmian. Ewentualnie przenieś `draftName` do zmiennej modułu.
- **Nakład:** mały · **Pewność:** pewny (drobny).

#### D-3. Nieaktualna dokumentacja kontraktu gry
- **Pliki:** `www/js/core/game-contract.js` (komentarz nagłówkowy, typ `GameApi`), `www/js/core/game-api.js` (komentarz „KROK 5”).
- **Scenariusz:** komentarz mówi, że „Indeks w tablicy jest identyfikatorem gracza”. To dokładnie ten wzorzec, który spowodował błąd w „Na oko”. Opisuje też `passPhone`, `holdToReveal` i `timer`, których `createGameApi()` nie dostarcza, oraz zasadę „teksty po polsku” sprzed i18n. Przy dodawaniu nowej gry łatwo na tej podstawie wpaść w ten sam błąd albo wywołać nieistniejące `api.timer`.
- **Poprawka:** zaktualizuj komentarz: gracze to imiona, a gra ma od razu nadać stałe `id` (jak w `team-setup.js`). `GameApi` ma tylko `shuffleRoles` i `exit`, a teksty idą przez `t()`.
- **Nakład:** mały · **Pewność:** pewny.

#### D-4. Martwy kod w rdzeniu
- **Pliki:** `session.js` → `setPlayerNames`, `clearSession`, `normalizePlayerName` (nikt ich nie importuje; `normalizePlayerName` dubluje `preparePlayerName`); `router.js` → `getCurrentRoute`; `games-registry.js` → `hasGames`.
- **Scenariusz:** nie wpływa na graczy, ale myli przy zmianach (np. dwie różne normalizacje imion: jedna przycina do 20 znaków, druga zwraca błąd).
- **Poprawka:** usuń nieużywane eksporty albo oznacz je komentarzem „do testów”.
- **Nakład:** mały · **Pewność:** pewny.

#### D-5. Teksty w rodzaju męskim w „Sekcie” (PL)
- **Pliki:** `www/locales/pl.json`: `games.sect.guideScreen.read` („Przeczytałem, zaczynamy”), `state.deadNight` („zginął w nocy”), `state.deadDay` („odpadł w dniu”), `log.victim` („zginął {name}”), `guide.roles.point1` („jako jedyny”).
- **Scenariusz:** prowadząca albo zmarła kobieta widzi „Przeczytałem”, „Anna — zginął w nocy 2”. Ogłoszenie poranne jest już neutralne („zginęła osoba: {name}”), więc to niespójność.
- **Poprawka:** formy neutralne, np. „Przeczytane, zaczynamy”, „💀 Nie żyje — noc {night}”, „💀 Odpada — dzień {day}”, „zginęła osoba {name}”, „jako jedyna osoba”.
- **Nakład:** mały · **Pewność:** pewny (drobny).

#### D-6. Dostępność: focus po zmianie ekranu i zablokowane karty
- **Pliki:** `router.js` → `renderRoute()`; `home-screen.js` → `createGameCard` (`disabled`).
- **Scenariusz:** po przejściu na nowy ekran focus zostaje na usuniętym elemencie (wraca na `body`), więc czytnik ekranu nie ogłasza nowego ekranu. Zablokowana karta ma `disabled`, przez co nie da się na nią przejść klawiszem Tab i usłyszeć powodu („Wymaga min. 4 graczy”).
- **Poprawka:** po renderze ustaw focus na `#screen-title` albo pierwszym nagłówku ekranu (`tabindex="-1"`). Dla zablokowanych kart użyj `aria-disabled="true"` zamiast `disabled` i ignoruj kliknięcie w kodzie.
- **Nakład:** mały · **Pewność:** pewny (wpływ głównie na czytniki ekranu).

#### D-7. Drobiazgi CSS: kontrast zablokowanych kart, safe-area w poziomie
- **Pliki:** `components.css` (`.game-card--disabled … opacity: 0.6`), `layout.css` (`env(safe-area-inset-left/right)` nieużywane).
- **Scenariusz:** opis zablokowanej gry ma kontrast ok. 3,6:1 (obliczony; norma dla małego tekstu to 4,5:1). Na telefonie z wycięciem w orientacji poziomej treść może wejść pod wycięcie.
- **Poprawka:** opacity 0.75 dla tekstów zablokowanej karty i `padding-inline: max(var(--space-4), env(safe-area-inset-left))` w `.screen-container`.
- **Nakład:** mały · **Pewność:** pewny (drobny).

#### D-8. Pytania „na dziś” będą się starzały; faktów nie weryfikowano
- **Pliki:** `www/data/*/questions-na-oko.txt` (Stephen King „do listopada 2026”, Brad Pitt, WSJP „ze stycznia 2026”, OED).
- **Scenariusz:** za rok odpowiedzi będą nieaktualne, a gracze mogą je kwestionować. Prawdziwości liczb nie sprawdzałem.
- **Poprawka:** przy dodawaniu pytań preferuj stałe fakty historyczne. Pytania z datą przejrzyj co jakiś czas.
- **Nakład:** mały · **Pewność:** uwaga redakcyjna.

#### P-1. Komunikat startowy dla otwarcia z dysku (`file://`)
- **Pliki:** `www/js/main.js` (komunikat awaryjny), dokumentacja.
- **Scenariusz:** tester otwiera `index.html` dwuklikiem. Moduły ES i `fetch` nie działają z `file://`, więc zobaczy tylko „Nie udało się uruchomić aplikacji. Odśwież stronę.” Odświeżenie nic nie da.
- **Poprawka:** w komunikacie awaryjnym dodaj zdanie „Aplikację trzeba otworzyć przez serwer (np. adres strony), a nie z pliku”, albo dopisz to w README.
- **Nakład:** mały · **Pewność:** pewny (zachowanie przeglądarek).

### CZĘŚĆ 2 — gry

#### Ocena ogólna gier (co sprawdzono i działa)

**Identyfikacja graczy po stałym id: wszystkie cztery gry są poprawne.** Każda gra na starcie nadaje graczom identyfikatory `p1…pN` i dalej (tury, rankingi, drużyny, role, ofiary, głosy) posługuje się wyłącznie nimi. Imiona służą tylko do wyświetlania. W „Sekcie” mistrz gry jest wybierany po imieniu, ale imiona są w sesji unikalne (bez względu na wielkość liter), więc to bezpieczne. Jedyne miejsce opisujące indeks jako tożsamość to nieaktualny komentarz w kontrakcie gry (D-3).

- **„Na oko”:** punktacja N − miejsce + 1 z miejscami sportowymi (remis = wspólne miejsce, kolejne przeskakuje) i bonus +2 za trafienie są zgodne z instrukcją. Kolejność następnej rundy wynika z rankingu, a przy równej odległości decyduje kolejność typowania. Wynik końcowy z remisem pokazuje kilku zwycięzców. Podwójne „Zatwierdź” jest zablokowane (przycisk + sprawdzenie id gracza). „Inne pytanie” działa tylko przed pierwszym typem. Partie dla 2, 5 i 10 graczy przeliczone w myślach bez sprzeczności.
- **„W pół słowa”:** 4 graczy daje 2×2 i 2 rundy, 5 graczy 3×2 i 3 rundy (w mniejszej drużynie jedna osoba tłumaczy dwa razy, zgodnie z opisem), 20 graczy 10×10 i 10 rund. Drużyna zaczynająca jest losowana, potem się zmienia. Przyciski wyniku mają strażnika fazy, a „Inne hasło” ma limit 2 i osłonę przed podwójnym dotknięciem. Wyjście z potwierdzeniem nie kasuje ekranu pod spodem.
- **„Ping-pong”:** zegar jest liczony z `performance.now()`, a nie ze zliczania ticków, więc nie dryfuje. Odświeżanie co 100 ms tylko podmienia teksty. Pauza zapamiętuje resztę czasu. Ukrycie karty albo zablokowanie ekranu (`visibilitychange`) samo pauzuje. Dotknięcie połowy przeciwnika jest ignorowane, a po zmianie tury działa blokada 200 ms. Wyczerpanie czasu wykryte w ticku albo przy dotknięciu kończy pojedynek i daje punkt rywalowi. `unmount()` czyści interwał, nasłuch, blokadę ekranu i nagłówek. Dla 2 graczy (1×1, jedna runda) i 20 graczy (10 rund) wszystko się zgadza.
- **„Sekta”:**
  - Skład ról: 5–7 graczy → 1 sekciarz, 8–11 → 2, 12–15 → 3, 16–20 → 4. Lekarz i śledczy są zawsze.
  - Rozstrzygnięcie nocy: ofiara ginie, chyba że lekarz ją chroni.
  - Lekarz nie może chronić tej samej osoby dwie noce z rzędu, siebie może. Śledczy nie sprawdza siebie i sprawdza tylko żywych.
  - Martwy lekarz lub śledczy w nocy: krok zostaje, z tekstem „odczekaj 5–8 s” i bez wyboru.
  - Wygrana jest sprawdzana rano, po głosowaniu i po każdej ręcznej korekcie. Sekta wygrywa przy liczebności ≥ pozostałych żywych.
  - „Cofnij krok” przywraca wybory nocy z migawki. Korekta na Tablicy unieważnia wybór, który przestał być dozwolony.
  - Przykładowa partia dla 5 graczy (1 sekciarz): noc → 4 osoby, zły głos → 3, noc → 2, czyli 1:1 i wygrana sekty. To spójne z regułą z instrukcji.

#### W-4. Powtórki treści w obrębie jednej partii po wyczerpaniu puli
- **Pliki:** `www/js/core/content-pool.js` → `drawNext()`; użycie w `guess-number/index.js` (`startGame`, `goToNextQuestion`), `revolver/index.js` (`prepareRound`), `duel/index.js` (`prepareRound`).
- **Scenariusz:** pula jest wspólna dla sesji. Gdy się wyczerpie w środku partii, `drawNext()` czyści wszystkie użyte klucze i losuje z całej listy, z wyjątkiem tylko ostatniego elementu. Pytania, hasła lub kategorie z wcześniejszych rund TEJ SAMEJ partii mogą więc wrócić. **Symulacja na prawdziwym module** (19 pytań, partie po 8): w 79% sesji któraś z pięciu partii powtarza pytanie, w 58% już trzecia. W „W pół słowa” przy 20 graczach (10 rund, do 2 zmian hasła na rundę) jedna partia może zużyć wszystkie 30 haseł.
- **Poprawka:** gra przekazuje do `drawNext()` zbiór kluczy użytych w bieżącej partii. Przy resecie puli te klucze zostają wykluczone (o ile zostaje cokolwiek innego). Przy okazji warto dopisać więcej treści do plików (to najtańszy sposób, by problem występował rzadziej).
- **Nakład:** mały–średni · **Pewność:** pewny błąd (sprawdzony symulacją).

#### W-5. „Sekta”: gracz, który nie sprawdził roli, nie ma jak jej poznać
- **Pliki:** `sect/index.js` → `askGoToGm()`, `askUnlockRole()`; `sect/ui.js` → `renderPreviewScreen()` (`disabled: !player.roleChecked`); `locales/pl.json` → `games.sect.dialog.notAllMessage`.
- **Scenariusz:** 7 graczy, jedna osoba wyszła i nie sprawdziła roli. Mistrz gry dotyka „Mistrz gry: przejdź dalej” i potwierdza „Tak, kontynuuj”, bo dialog obiecuje, że gracz „może ją później odblokować w podglądzie ról”. W Podglądzie ról przycisk „Pozwól sprawdzić rolę ponownie” jest jednak nieaktywny dla niesprawdzonych ról, a z nocy nie ma już drogi do ekranu sprawdzania. Gracz gra bez znajomości swojej roli (np. jako jedyny sekciarz albo lekarz).
- **Poprawka:** najprościej dodać w Podglądzie ról, przy niesprawdzonych osobach, przycisk „Pokaż rolę tej osobie”, który otwiera istniejący ekran `renderRoleRevealScreen` i po „Ukryj rolę” wraca do poprzedniego ekranu. Alternatywnie zablokuj przejście dalej, dopóki nie wszyscy sprawdzą, i popraw treść dialogu.
- **Nakład:** średni · **Pewność:** pewny błąd.

#### W-6. Brak krótkiej blokady dotknięć tuż po zmianie ekranu
- **Pliki:** `duel/index.js` → `finishDuel()` → `renderResultPhase()`; `revolver/index.js` → `handleTeamGuessed()`; ogólnie `renderState()` we wszystkich grach (oraz D-1 w routerze).
- **Scenariusz:** w „Ping-pongu” przegrywający gracz nerwowo stuka w swoją połowę w chwili, gdy kończy się czas. `finishDuel()` od razu podmienia ekran na wynik, a kolejne dotknięcie (zdarzenie `click` przy puszczeniu palca) trafia w „Następna runda” albo „Pokaż wynik”. Gracze nie zobaczą wyniku pojedynku. Podobnie przy szybkim podwójnym „Odgadła Drużyna 1” w „W pół słowa”. Osłony są dziś tylko lokalne (`START_GUARD_MS`, `REDRAW_GUARD_MS`, `canAct()`).
- **Poprawka:** jedna funkcja pomocnicza w `core/dom.js`, np. `guardTaps(container, ms)`, która na 300–600 ms ustawia `container.inert = true` (albo `pointer-events: none`). Wołać ją w `renderState()` gier, a na ekranie wyniku „Ping-ponga” z dłuższym czasem (ok. 800 ms).
- **Nakład:** mały · **Pewność:** możliwy błąd (zależy od miejsca dotknięcia; nie testowane na urządzeniu).

#### W-7. „Sekta”: „Jeszcze raz” zachowuje ujawnione role
- **Pliki:** `sect/index.js` → `playAgainSameRoles()`; `sect/ui.js` → `renderFinishedScreen()` (przycisk główny); `engine.js` → `restartGame({ keepRoles: true })`.
- **Scenariusz:** po końcu gry ekran pokazuje wszystkim role („Role wychodzą na jaw. Przeczytaj wynik na głos.”). Wyróżniony przycisk „Jeszcze raz (te same osoby)” startuje nową noc z TYMI SAMYMI rolami, więc każdy wie, kto jest w sekcie, i partia nie ma sensu. Łatwo go dotknąć, bo jest pierwszy i podświetlony.
- **Poprawka:** usuń wariant z zachowaniem ról albo zamień kolejność: „Nowe role” jako przycisk główny, a „te same role” jako drugorzędny z jasnym opisem („tylko jeśli nikt nie widział ról”).
- **Nakład:** mały · **Pewność:** pewny (błąd projektu przepływu).

#### D-9. „Sekta”: licznik dyskusji zeruje się i kończy bez sygnału
- **Pliki:** `sect/index.js` → `renderState()` / `destroyScreen()`, `closeBoard()`, `closePreview()`, `closeGuide()`; `sect/ui.js` → `createCountdown()`.
- **Scenariusz:** mistrz gry włącza licznik 3:00, po minucie zagląda na Tablicę albo do Podglądu ról, potem wraca. Ekran rysuje się od nowa, licznik zostaje zniszczony i znowu pokazuje 3:00 (zatrzymany). Gdy licznik dojdzie do 0:00, nie ma wibracji ani wyróżnienia.
- **Poprawka:** trzymaj `endAt` i `remainingMs` licznika w `state` gry (a nie w zamknięciu komponentu) i odtwarzaj je przy renderze. Na 0:00 dodaj `navigator.vibrate` (w `try`) i czerwony kolor.
- **Nakład:** mały · **Pewność:** pewny błąd.

#### D-10. „Sekta”: przytrzymanie odsłaniające gaśnie przy ruchu palca
- **Pliki:** `sect/ui.js` → `createHoldReveal()`, CSS `.sec-hold { touch-action: manipulation }`.
- **Scenariusz:** mistrz gry przytrzymuje „Przytrzymaj, aby zobaczyć role/wynik”. Przy `touch-action: manipulation` przeglądarka może przy lekkim przesunięciu palca zacząć przewijanie i wysłać `pointercancel`, więc tajna treść znika. Na iOS długie przytrzymanie może dodatkowo wywołać systemową lupę lub menu.
- **Poprawka:** `touch-action: none; -webkit-touch-callout: none;` dla `.sec-hold` oraz `button.setPointerCapture(event.pointerId)` w `pointerdown`.
- **Nakład:** mały · **Pewność:** możliwy błąd (zależny od przeglądarki; nie testowane na urządzeniu).

#### D-11. „Sekta”: „Podgląd ról” jest na ekranie, który krąży po graczach
- **Pliki:** `sect/ui.js` → `renderRoleCheckScreen()` (przycisk „Podgląd ról (mistrz gry)”).
- **Scenariusz:** podczas wspólnego sprawdzania ról telefon przechodzi z rąk do rąk. Ciekawski gracz może wejść w Podgląd i przytrzymać przycisk, a wtedy widzi wszystkie role. To kwestia zaufania, ale przy grze z nowymi osobami łatwo o pokusę.
- **Poprawka:** przed otwarciem podglądu dialog „Tylko dla mistrza gry” albo przeniesienie podglądu do ekranów mistrza gry (po „Przekazano mistrzowi gry”), razem z rozwiązaniem W-5.
- **Nakład:** mały · **Pewność:** uwaga projektowa.

#### D-12. „Sekta”: drobne niespójności
- **Pliki:** `sect/index.js`, `sect/script.js`, `config.js`, `locales/*.json`.
- **Scenariusz:**
  - (a) Tekst „Sekta nikogo nie wskazała” (`noTargetDetail`) jest nieosiągalny, bo krok sekty wymaga wyboru osoby.
  - (b) Kroki nocy są ustalane na jej starcie. Jeśli mistrz korektą „uśmierci” lekarza w trakcie nocy, ekran nadal poprosi o wybór lekarza.
  - (c) Karta i szczegóły pokazują „5–20 graczy”, ale gdy mistrz gry jest z listy, potrzeba 6 osób na liście. Komunikat pojawia się dopiero na ekranie gry.
  - (d) Korekta, która spełnia warunek wygranej w trakcie dnia albo nocy, jest widoczna tylko na Tablicy. Gra kończy się dopiero po porannym ogłoszeniu albo głosowaniu.
- **Poprawka:** (a) usuń tekst albo dodaj opcję „Sekta nikogo nie wybiera”. (b) Wystarczy zostawić. (c) Dopisz w kroku 1 instrukcji „(mistrz z listy nie gra — wtedy potrzeba 6 osób)”. (d) Po korekcie z wygraną pokaż od razu przycisk „Zakończ grę”.
- **Nakład:** mały · **Pewność:** pewne, wpływ niski.

#### D-13. „Na oko”: instrukcja i ostatni przycisk niezgodne z działaniem
- **Pliki:** `locales/*.json` → `games.guess-number.steps.6`; `guess-number/ui.js` → `renderAnswerScreen()`; `index.js` → `QUESTIONS_PER_GAME = 8`.
- **Scenariusz:** instrukcja mówi „Partia kończy się po wszystkich pytaniach”, a partia ma stałe 8 pytań (albo mniej, gdy w pliku jest ich mniej). Po 8. pytaniu przycisk nadal brzmi „Następne pytanie”, ale prowadzi do tabeli końcowej. Pozostałe dwie gry mają tu „Pokaż wynik”.
- **Poprawka:** w instrukcji „Partia ma {count} pytań” (parametr przez `howToPlayParams`, jak w „Ping-pongu”). W `renderAnswerScreen` przy ostatnim pytaniu użyj etykiety „Pokaż wynik”.
- **Nakład:** mały · **Pewność:** pewny.

#### D-14. „Na oko”: wpisywanie liczb i powrót z okna wyjścia
- **Pliki:** `guess-number/ui.js` → `renderTurnScreen()` (wyrażenie `/^[+-]?\d+$/`, `maxLength: 9`); `guess-number/index.js` → `renderState()` (anulowanie wyjścia).
- **Scenariusz:** (a) przy pytaniu o 239 057 wysp gracz wpisuje „240 000” i dostaje „Podaj liczbę całkowitą”, bo spacja (często wstawiana przez klawiaturę) jest odrzucana. (b) Gracz wpisał liczbę, przypadkiem dotknął „Zakończ grę”, wybrał „Zostań w grze”. Cały ekran rysuje się od nowa i wpisana liczba znika. W pozostałych grach anulowanie zdejmuje tylko nakładkę.
- **Poprawka:** (a) przed walidacją usuń spacje, twarde spacje i kropki/przecinki tysięcy, np. `rawValue.replace(/[\s  ]/g, '')`, i podnieś `maxLength` do ok. 12. (b) Przy anulowaniu tylko usuń `.gn-overlay`, jak w „W pół słowa”.
- **Nakład:** mały · **Pewność:** pewny.

#### D-15. „Na oko”: `goToNextQuestion()` bez sprawdzenia fazy
- **Pliki:** `guess-number/index.js` → `goToNextQuestion()`.
- **Scenariusz:** pozostałe przejścia sprawdzają fazę, a to nie. Gdyby wywołało się dwa razy (np. przyszła zmiana albo zdarzenie klawiatury), drugie wywołanie zbuduje kolejność z pustego rankingu. Powstanie runda „Tura: —”, w której nie da się nic zatwierdzić, i gra się zablokuje. Dziś praktycznie nieosiągalne.
- **Poprawka:** na początku dodaj `if (state.phase !== 'answer') return;`.
- **Nakład:** mały · **Pewność:** możliwy błąd (zabezpieczenie na przyszłość).

#### D-16. „Ping-pong”: „Przerwij pojedynek” kończy całą partię
- **Pliki:** `duel/index.js` → `requestAbort()` (`onConfirm: state.api.exit()`), `locales/*.json` → `games.duel.abortTitle`, `tips.1`.
- **Scenariusz:** w sporze gracze pauzują i chcą powtórzyć jeden pojedynek. „Przerwij pojedynek” wyrzuca jednak do HUB-a i kasuje wynik całej partii. Komunikat to mówi, ale tytuł sugeruje coś węższego. Wskazówka „Rzeczy, które już padły, nie powtarzają się” brzmi, jakby pilnowała tego aplikacja, a to zasada dla graczy.
- **Poprawka:** dodaj opcję „Powtórz pojedynek” (`prepareRound()` bez zmiany wyniku) albo zmień tytuł na „Zakończyć całą grę?”. Wskazówkę przeformułuj: „Nie wolno powtarzać rzeczy, które już padły”.
- **Nakład:** mały · **Pewność:** pewny (UX).

### CZĘŚĆ 3 — przekrojowe

#### (a) Bezpieczeństwo i prywatność: stan obecny

- **Wstrzykiwanie HTML:** brak. W całym `www/` nie ma `innerHTML`, `insertAdjacentHTML`, `outerHTML` ani `document.write`. Imiona graczy, hasła, kategorie i pytania trafiają do DOM wyłącznie przez `textContent` albo `setAttribute` (helper `el()` w `core/dom.js`). Style gier są stałymi tekstami w kodzie, bez danych użytkownika. **Ryzyko XSS z imion i plików treści: brak.**
- **Sieć:** tylko `fetch` własnych plików (`locales/*.json`, `data/*/*.txt`) przez adresy względne. Brak CDN, fontów, analityki. Jedyny „adres” to przestrzeń nazw SVG w ikonie (to nie jest zapytanie).
- **Zapis danych:** tylko `localStorage['gt.lang']` w `try/catch`. Imiona i stan gier żyją w pamięci.
- **Sekrety:** brak w drzewie i w historii git (przeszukane wszystkie rewizje). `.gitignore` już wyklucza `.env`, `*.keystore`, `*.jks` i `local.properties`, co przyda się przy Capacitorze.
- **Prywatność autora:** przy publicznym repozytorium (wymagane dla darmowego GitHub Pages) adres e-mail z metadanych commitów jest publicznie widoczny. Jeśli to niepożądane, ustaw w git adres `…@users.noreply.github.com` (dotyczy przyszłych commitów).

#### P-2. Content-Security-Policy: warto, ale z jednym wyjątkiem
- **Pliki:** `www/index.html` (`<head>`).
- **Scenariusz:** dziś aplikacja nie ma podatności, które CSP by łatała. CSP to tania druga linia obrony na wypadek przyszłych zmian (np. ktoś kiedyś użyje `innerHTML`). Gry wstrzykują jednak elementy `<style>`, więc `style-src` musi dopuszczać `'unsafe-inline'`, dopóki style gier nie trafią do plików CSS.
- **Poprawka:** dodaj `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">`. Po dodaniu przejdź raz każdą grę z otwartą konsolą (błędy CSP widać od razu). W Capacitorze `'self'` to `https://localhost`, więc polityka powinna działać bez zmian (niezweryfikowane).
- **Nakład:** mały · **Pewność:** zalecenie.

#### (b) Odporność

- Obsługa braków API jest poprawna: `navigator.vibrate` i `navigator.wakeLock` są sprawdzane i opakowane w `try`. Błędy `localStorage` są łapane, a błąd startu gry pokazuje ekran z powrotem.
- Stany puste są obsłużone: pusty plik treści, brak gier, za mało graczy, za mało osób w drużynie.
- Szybkie dotknięcia: zob. W-6 i D-1.
- Zgodność przeglądarek: kod używa `?.`/`??`, CSS `inset`, `dvh` i `backdrop-filter`. Minimum to w praktyce Chrome/WebView ok. 87 i Safari ok. 14.1. Starsze przeglądarki zobaczą rozjechane nakładki. Dla testerów to wystarczy, ale warto to napisać w README.

#### W-8. Wersja webowa nie działa offline, choć tak się przedstawia
- **Pliki:** `www/index.html` i `locales/*.json` (`app.metaDescription`: „Działa offline”); `content-loader.js` (`fetch(..., { cache: 'no-cache' })` przy wejściu do gry); brak service workera.
- **Scenariusz:** tester otwiera link w domu, a potem na imprezie bez zasięgu wchodzi w „Na oko”. Pliki z pytaniami są pobierane dopiero teraz, a `no-cache` wymusza zapytanie do serwera, więc pojawia się „Nie udało się wczytać treści gry”. Odświeżenie strony offline nie załaduje aplikacji wcale. W Capacitorze problemu nie będzie, bo pliki są w pakiecie aplikacji.
- **Poprawka:** minimum: zmień opis na „bez kont i bez reklam” zamiast „offline”. Docelowo: prosty `sw.js` (cache-first, ręczna lista ok. 45 plików i stała `VERSION` podbijana przy wdrożeniu), rejestrowany w `main.js` tylko poza Capacitorem. Pośrednio: po starcie HUB-a wczytaj w tle treści wszystkich gier, żeby wejście do gry nie wymagało sieci, dopóki karta jest otwarta.
- **Nakład:** mały (tekst) / średni (service worker) · **Pewność:** pewny (analiza kodu).

#### D-20. Capacitor: wibracje i blokada wygaszania w WebView; „Sekta” bez blokady ekranu
- **Pliki:** `duel/index.js` → `vibrate()`, `requestWakeLock()`; `sect/` (brak).
- **Scenariusz:** w Androidowym WebView `navigator.vibrate` działa tylko z uprawnieniem `VIBRATE` w manifeście, a Wake Lock API może być niedostępne. Kod nie zgłosi błędu, po prostu nie zadziała. W „Sekcie” mistrz gry trzyma telefon przez 3 minuty dyskusji i ekran gaśnie (dotyczy też wersji webowej).
- **Poprawka:** przy przejściu na Capacitor: plugin `@capacitor/haptics` albo uprawnienie `VIBRATE`, plus plugin typu keep-awake za tą samą funkcją `requestWakeLock()`. W „Sekcie” wołaj blokadę ekranu od pierwszej nocy do końca gry, kopiując istniejące funkcje z „Ping-ponga” albo przenosząc je do `core/`.
- **Nakład:** mały–średni · **Pewność:** możliwy problem (niezweryfikowany na urządzeniu).

#### (c) Wydajność i pamięć

Bez zastrzeżeń dla tej skali.
- Pełne przerysowanie ekranu przy zmianie fazy jest tanie: dziesiątki elementów.
- Zegar „Ping-ponga” co 100 ms tylko podmienia teksty i szerokość paska. Licznik „Sekty” odświeża się co 250 ms.
- Nie widzę wycieków: stan gier jest zerowany w `unmount()`, a nasłuchy siedzą na usuwanych elementach i znikają razem z nimi.
- Pamięć treści (`textCache`, pule) to kilka KB na język.
- Jedyny drobiazg: `requestWakeLock()` w „Ping-pongu” przy bardzo szybkim „Pauza → Wznów” może nadpisać wcześniejszą blokadę bez jej zwolnienia. System zwolni ją sam po ukryciu strony, więc to bez znaczenia praktycznego.

#### D-17. Brak `noindex` (a `robots.txt` w podkatalogu nie zadziała)
- **Pliki:** `www/index.html`.
- **Scenariusz:** link dla testerów może trafić do wyszukiwarki. Plik `robots.txt` pod `https://<użytkownik>.github.io/<repo>/robots.txt` jest ignorowany, bo roboty czytają go tylko z katalogu głównego domeny.
- **Poprawka:** dodaj `<meta name="robots" content="noindex, nofollow">` w `index.html`. `robots.txt` nie jest potrzebny.
- **Nakład:** mały · **Pewność:** pewny.

#### (d) Jakość kodu

Nazewnictwo jest spójne (angielskie identyfikatory, polskie komentarze), a JSDoc i komentarze są rzetelne. Uwagi:

#### D-18. Duplikacja między „W pół słowa” i „Ping-pongiem”
- **Pliki:** `revolver/index.js`, `duel/index.js`, `revolver/ui.js`, `duel/ui.js` (oraz 4× `ensureStyles`/`removeStyles`/`requestExit`, 3× `loadContent`/`showLoadError`).
- **Scenariusz:** ok. 15 funkcji jest identycznych lub prawie identycznych: `createRoster`, `teamById`, `otherTeamId`, `randomTeamId`, `teamNames`, `getWinnerTeamId`, `isLastRound`, `startMatch`, rotacja w `prepareRound`, `playAgain`, `chooseNewTeams`, `createScoreBoard`, `createTeamsSummary`, `createTeamLine` oraz okna potwierdzenia. Poprawka błędu w jednej grze (np. W-6) łatwo ominie drugą.
- **Poprawka:** bez przepisywania gier. Przy okazji W-6 wydziel `components/team-match.js` z czystymi funkcjami: liczba rund, para w rundzie `i`, drużyna zaczynająca, zwycięzca. Wydziel też `components/confirm-dialog.js`. Gry podmieniają tylko wywołania.
- **Nakład:** średni · **Pewność:** uwaga jakościowa.

#### D-19. Martwe klucze tłumaczeń i słaba walidacja kluczy w kontrakcie gry
- **Pliki:** `locales/pl.json`, `locales/en.json` (klucze `games.guess-number.exact`, `games.guess-number.finishTitle`, `games.sect.gm.goToVote` nie są używane; w kodzie jest `games.sect.ui.goToVote`); `core/game-contract.js` → `validateGame()`.
- **Scenariusz:** literówka w `nameKey` albo `stepKeys` przejdzie walidację, a na ekranie zamiast tekstu pojawi się surowy klucz (np. `games.revolver.steps.6`). Martwe klucze mylą przy tłumaczeniu na nowy język. Do tego dochodzi martwy kod z D-3 i D-4 (nieaktualne komentarze o `passPhone`/`holdToReveal`/„KROK 5”).
- **Poprawka:** usuń 3 nieużywane klucze. W `checkTranslations()` (`window.__i18nCheck`) dopisz sprawdzenie, czy wszystkie `nameKey`/`descriptionKey`/`goalKey`/`stepKeys`/`tipKeys` z rejestru gier istnieją w `pl.json`.
- **Nakład:** mały · **Pewność:** pewny.

#### (e) Gotowość do wdrożenia

| Obszar | Stan | Co zrobić |
|---|---|---|
| Ścieżki względne | ✅ wszystkie (`./css/…`, `./js/…`, `import.meta.url`); wielkość liter zgodna | nic |
| GitHub Pages | ✅ workflow publikuje `www/` bez budowania | sprawdź w pierwszym uruchomieniu Actions, czy wersje akcji (`checkout@v7` itd.) istnieją. Nie mogłem tego zweryfikować bez sieci |
| `noindex` | ❌ | D-17 |
| `robots.txt` | nie dotyczy podkatalogu | — |
| LICENSE | ❌ brak | to Twoja decyzja. Bez licencji kod jest „wszystkie prawa zastrzeżone”, co przy hobbystycznym projekcie i testerach jest w porządku. Dodaj licencję, jeśli chcesz, żeby inni mogli korzystać z kodu |
| README | ❌ brak | P-3 |
| Capacitor: `webDir` | ✅ `www/` jest samowystarczalne, bez kroku budowania, czyli gotowe jako `webDir: 'www'` | dodać `package.json` i `capacitor.config` (poza `www/`) |
| Capacitor: przycisk „wstecz” | ❌ | W-2 (`App.addListener('backButton', …)`) |
| Capacitor: safe-area | ✅ `viewport-fit=cover` + `env(safe-area-inset-*)` (Android 15 wymusza edge-to-edge, więc to się przyda) | sprawdzić na urządzeniu |
| Capacitor: wibracje / wake lock | ⚠️ | D-20 |
| Offline (web) | ❌ brak service workera | W-8 |

#### P-3. README dla testerów
- **Pliki:** brak `README.md` w korzeniu.
- **Scenariusz:** testerzy nie wiedzą, że aplikację otwiera się przez link (nie z pliku, P-1), że odświeżenie kasuje graczy, jakich przeglądarek potrzeba i jak zgłaszać błędy.
- **Poprawka:** krótkie README: link, 4 gry w jednym zdaniu każda, „nie odświeżaj w trakcie gry”, minimalne przeglądarki, gdzie zgłaszać uwagi.
- **Nakład:** mały · **Pewność:** zalecenie.

#### (f) Krótka ocena projektu gier

- **„Na oko” (2–10):** zasady są jasne, punktacja czytelna, a wpisane typy poprzedników dają ciekawą taktykę. Przy 2 graczach różnica punktowa to tylko 2:1 na rundę, więc o wyniku decydują trafienia (+2). Przy 10 graczach ostatni typujący ma dużą przewagę informacyjną, ale kolejność według rankingu (najlepszy typuje pierwszy) to częściowo równoważy. To dobry pomysł, warto o nim wspomnieć w instrukcji. **Największe ryzyko frustracji:** mało pytań (19–22) i powtórki (W-1, W-4), a także pytania z datą „do 2026”, które się zestarzeją.
- **„W pół słowa” (4–20):** dobra mechanika na duże grupy. Instrukcja nie mówi wprost, **kto zgaduje** (cała drużyna tłumaczącego? czy tłumaczący odpowiada na podpowiedzi rywala?). Warto dodać jedno zdanie. Przy 20 osobach 10 rund bez limitu czasu może się dłużyć, a 30 haseł wystarcza na jedną partię. **Ryzyko:** zbyt mała pula haseł.
- **„Ping-pong” (2–20):** szybka, emocjonująca gra. 10 s na cały pojedynek to mało, ale daje napięcie. Brakuje rozstrzygania sporów („czy to się liczy?”): „Pauza” jest, ale „Powtórz pojedynek” już nie (D-16). Przy nierównych drużynach część osób gra dwa razy, co gra opisuje. **Ryzyko:** przypadkowe przeklikanie wyniku (W-6) i przerwanie całej partii zamiast pojedynku.
- **„Sekta” (5–20 + mistrz gry):** to najbardziej dopracowana gra: scenariusz mistrza z blokami „Powiedz/Zrób”, Tablica, cofanie kroku, korekty. Przy 5 grających mistrz musi być spoza listy (D-12c), a gra kończy się po 2 nocach. Przy 20 grających (4 sekciarzy) partia trwa długo, zmarli długo czekają, a mistrz potrzebuje blokady ekranu (D-20). **Największe ryzyka frustracji:** W-5 (gracz bez roli), W-7 („Jeszcze raz” z jawnymi rolami), D-11 (podgląd ról w zasięgu graczy) i D-9 (licznik).
- **Wspólne:** utrata wszystkiego po geście „wstecz” lub odświeżeniu (W-2) to największe ryzyko dla całej aplikacji przy testach na telefonach.

---

## 4. Do zrobienia przed testami ze znajomymi (maks. 10)

1. **W-1**: popraw liczby w plikach pytań (PL i EN). Przy okazji dopisz kilka pytań.
2. **W-2**: `overscroll-behavior-y: none` + obsługa „wstecz” (History API) z potwierdzeniem wyjścia z gry + `beforeunload` na ekranie gry.
3. **W-4**: pula treści bez powtórek w obrębie partii. Dopisz też hasła i kategorie (najlepiej po 60+).
4. **W-5**: możliwość pokazania roli osobie, która jej nie sprawdziła (albo blokada przejścia dalej).
5. **W-7**: „Nowe role” jako główny przycisk po grze w „Sektę”.
6. **W-6**: krótka blokada dotknięć po zmianie ekranu (szczególnie wynik „Ping-ponga”).
7. **W-3**: `scrollTo(0, 0)` w routerze.
8. **D-13 + D-14 + D-15**: „Na oko”: tekst instrukcji, „Pokaż wynik” na końcu, spacje w liczbach, anulowanie wyjścia bez kasowania wpisu, strażnik fazy.
9. **D-9 + D-10**: „Sekta”: licznik dyskusji odporny na Tablicę i przytrzymanie bez gaśnięcia.
10. **D-17 + W-8 (tekst)**: `noindex` i usunięcie obietnicy „działa offline” (albo service worker, jeśli testy będą w miejscach bez zasięgu).

---

## 5. Priorytety i kolejność poprawek

**Do naprawienia w pierwszej kolejności:** W-1, W-2, W-4, W-5, W-7, W-6, W-3, D-13, D-14, D-15, D-9, D-10, D-17 (oraz tekst z W-8).

**Proponowana kolejność małych, niezależnych commitów** (każdy da się sprawdzić osobno w przeglądarce):

1. `dane: odpowiedzi w pytaniach jako liczby całkowite` (W-1, tylko pliki `data/`)
2. `css: wyłącz pull-to-refresh` (W-2, jedna linia w `base.css`)
3. `router: przewijaj nowy ekran na górę` (W-3)
4. `sekta: nowe role jako główny przycisk po grze` (W-7)
5. `na oko: instrukcja, przycisk ostatniego pytania, spacje w liczbach, strażnik fazy` (D-13, D-14, D-15)
6. `sekta: licznik dyskusji zachowuje czas; przytrzymanie bez touch-action` (D-9, D-10)
7. `core: krótka blokada dotknięć po zmianie ekranu` (W-6 + D-1; najpierw helper w `dom.js`, potem użycie w grach)
8. `content-pool: bez powtórek w obrębie partii` (W-4; najlepiej z małym testem w Node, jak symulacja z tego przeglądu)
9. `sekta: pokazanie roli osobie, która jej nie sprawdziła` (W-5)
10. `router: obsługa wstecz przez History API i ostrzeżenie przed opuszczeniem gry` (W-2, część JS; największa zmiana z listy)
11. `index: noindex i poprawiony opis` (D-17, W-8 tekst)
12. Później, gdy będzie czas: D-5 (neutralne teksty), D-3/D-4/D-19 (sprzątanie), P-2 (CSP), P-3 (README), W-8 (service worker), D-18 (wspólne moduły drużyn), D-20 (Capacitor).
