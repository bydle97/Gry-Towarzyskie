# Nocny dziennik pracy (Claude Code)

Dziennik pracy autonomicznej na gałęzi `noc`. Zadania: docs/ZADANIA-NOC.md.

## Tabela postępu

| Faza | Stan | Uwagi |
|---|---|---|
| 0. Ocena stanu | zrobione | |
| 1. Poprawki z przeglądu | zrobione | większość była już w kodzie; dorobione D-6, P-1 |
| 2. APK (Capacitor) | zrobione | apk-1 zbudowany w Actions (success) |
| 3. Wampir | zrobione | było w kodzie; dodany tools/test-vampire.mjs, apk-2 |
| 4. Wygląd | zrobione | Fredoka i Lilita One odrzucone (brak polskich znaków), apk-3 |
| 5. Wykończenie Androida | zrobione | apk-final-3 success (apk-final i -2: błąd komentarza XML) |

## 2026-11-19 00:23 — Faza 0: ocena stanu

### Repozytorium
- Gałąź `noc` już istniała (lokalnie i na origin), na niej pracuję. Ostatni commit: `0a131bb Kontekst projektu i lista zadań dla Claude Code`.
- CLAUDE.md i docs/ZADANIA-NOC.md były zmienione, ale niezacommitowane (w commicie były puste pliki). Commituję je jako pierwsze, bez zmian treści.
- docs/PRZEGLAD.md istnieje. Brak: package.json, capacitor.config.json, android/, docs/APK.md, docs/NOCNY-LOG.md (ten plik).
- Workflow: tylko `.github/workflows/pages.yml` (wersja webowa, nie ruszam).

### Środowisko
| Narzędzie | Wynik |
|---|---|
| node -v | v26.13.1 |
| npm -v | 11.20.0 |
| java -version | brak (polecenie nie istnieje) |
| ANDROID_HOME / ANDROID_SDK_ROOT | puste, brak `%LOCALAPPDATA%\Android\Sdk` |
| gh | brak (nie zainstalowane) |
| Przeglądarki | Edge i Chrome zainstalowane (można użyć trybu headless bez nowych zależności) |
| Playwright | brak (nie instaluję, nie ma go na liście dozwolonych zależności) |
| python | brak |

Wniosek: APK budowany wyłącznie w GitHub Actions. Bez `gh` nie pobiorę artefaktu; stan uruchomień sprawdzam przez publiczne API GitHuba (repo jest publiczne, tylko odczyt).

### Testy bazowe
- `node tools/test-content-pool.mjs`: OK (0 powtórek na 10000 partii).
- `tools/sect-*.js` (5 skryptów w Node): wszystkie przypadki OK.
- `node --check` na wszystkich plikach JS: bez błędów.

### Co jest już zrobione (zrobione / do zrobienia)
| Zadanie | Stan |
|---|---|
| 1.1 W-1 odpowiedzi jako cyfry + loader usuwa spacje i `_` | zrobione (dane PL/EN same cyfry, loader `replace(/[\s _]/g,'')`) |
| 1.2 W-3 scrollTo po renderze | zrobione (router, `scrollToTop: false` przy zmianie języka) |
| 1.3 D-1/W-6 guardTaps i blokada navigate 300 ms | zrobione (dom.js, wszystkie gry) |
| 1.4 W-2 overscroll, historia, beforeunload | zrobione (router pushState/popstate, game-screen beforeunload) |
| 1.5 W-4 excludeKeys + test | zrobione (tools/test-content-pool.mjs) |
| 1.6 D-13/14/15 Na oko | zrobione (QUESTIONS_PER_GAME, „Pokaż wynik”, maxLength 12) |
| 1.7 Wampir W-5/W-7/D-9..D-12 | zrobione („Nowe role”, „Pokaż rolę”, setPointerCapture, 6 osób w instrukcji) |
| 1.8 D-17 robots | zrobione |
| 1.8 W-8 opis bez obietnicy offline | zrobione (meta description bez „offline”) |
| 1.8 D-16 teksty Ping-ponga | zrobione |
| 1.8 D-5 formy neutralne | zrobione |
| 1.8 P-1 komunikat o serwerze | **do zrobienia** |
| 1.8 D-3/D-4/D-19 porządki | D-4 i D-19 zrobione; D-3 do sprawdzenia |
| 1.8 D-7 kontrast, safe-area poziome | safe-area zrobione; kontrast do sprawdzenia |
| 1.8 D-6 focus na tytule, aria-disabled | **do zrobienia** |
| Faza 2 Capacitor | **do zrobienia** (brak wszystkiego) |
| Faza 3 Wampir: role, hrabia, sługa, wiedźma, uczeń, komendant, wybór ról | w kodzie; brak `tools/test-vampire.mjs` (są `tools/sect-*.js`) |
| Faza 4 wygląd | **do zrobienia** (brak www/fonts/) |
| Faza 5 Android | `core/wake-lock.js` już jest; reszta do zrobienia |

## 2026-11-19 00:28 — Faza 1: poprawki z przeglądu

Większość punktów była już w kodzie (patrz tabela w fazie 0). Dorobione:
- **D-6**: router po narysowaniu nowego ekranu przenosi focus na tytuł (nagłówek aplikacji albo pierwszy `h1/h2` ekranu, gdy nagłówek jest ukryty), `tabindex="-1"`, bez obwódki. Przy odświeżeniu po zmianie języka focus zostaje. Zablokowane karty gier: `aria-disabled="true"` zamiast `disabled`, kliknięcie ignorowane w kodzie.
- **P-1**: nowy zwykły (nie modułowy) skrypt `www/js/startup-check.js`. Przy otwarciu z `file://` moduły ES w ogóle się nie ładują, więc `catch` w main.js nie zadziała; ten skrypt pokazuje wtedy komunikat w obu językach. Komunikat awaryjny w main.js też podpowiada serwer (w obu językach, bo i18n może być wtedy niedostępne).
- **D-3, D-4, D-7, D-19**: sprawdzone, już zrobione wcześniej.
- Nowe narzędzie `tools/serve.mjs` (serwer statyczny 127.0.0.1, bez zależności) do podglądu i testów.

Decyzja: list zmienionych pytań (W-1) nie odtwarzam, bo dane były poprawione we wcześniejszych commitach autora (np. „nowe pytania do na oko”, „poprawki 1-3”); obecnie wszystkie odpowiedzi PL i EN to same cyfry (sprawdzone skryptem).

### Sprawdzenia
- `node --check` na wszystkich plikach JS: OK. `tools/test-content-pool.mjs`: OK. `tools/sect-*.js`: OK.
- Przeglądarka: headless Chrome sterowany przez DevTools Protocol ze skryptu w Node (bez instalowania Playwrighta), serwer `tools/serve.mjs`.
  - `__i18nCheck()`: pl i en 0 brakujących, 0 nadmiarowych, klucze rejestru gier 0 brakujących.
  - Wszystkie zapytania sieciowe tylko do 127.0.0.1 (41 plików lokalnych przy starcie).
  - Ekran główny i szczegóły każdej gry przy 360x800 i 320x568: focus na tytule, `scrollY = 0`, układ bez obcięć.
  - Pełna partia „Na oko” (3 graczy, 8 pytań): typy „1 000” i „5 000” (twarda spacja) przyjęte jako liczby, na 8. pytaniu przycisk „Pokaż wynik”, ekran końcowy z tabelą.
  - Gest „wstecz” (`history.back()`) w trakcie gry: okno „Zakończyć grę?”; „Zostań w grze” zostawia grę, kolejne „wstecz” znów pyta.

## 2026-11-19 00:33 — Faza 2: pakowanie do APK (Capacitor)

- `package.json` (private, 0.1.0) z devDependencies w dokładnych wersjach jednego wydania głównego (Capacitor 8): `@capacitor/core`, `cli`, `android` 8.6.2, `@capacitor/app` 8.1.2, `@capacitor/haptics` 8.0.2, `@capacitor/assets` 4.0.0. Wymagania sprawdzone w paczkach: Node >= 22 (`engines` w `@capacitor/cli`), JDK 21 (`JavaVersion.VERSION_21` w wygenerowanym `capacitor.build.gradle`). Gradle 8.14.3, AGP 8.13.0, compile/targetSdk 36, minSdk 24.
- `capacitor.config.json`: appId `pl.grytowarzyskie.app` (tymczasowe), appName „Gry Towarzyskie”, webDir `www`, tło `#0d1120`.
- `npx cap add android` (projekt `android/` w repozytorium; `assets/public` i wtyczki cordova są ignorowane przez `android/.gitignore` i odtwarzane przez `npx cap sync`).
- `.gitignore` uzupełniony (android/build/, android/local.properties, *.apk, *.aab); nadal wyklucza *.jks, *.keystore, .env. Nowy `.gitattributes`: `android/gradlew` zawsze z LF (repo jest edytowane na Windows). `gradlew` ma w gicie bit wykonywania (100755).
- `android/app/build.gradle`: `versionCode` z `GITHUB_RUN_NUMBER` (lokalnie 1), `versionName "0.1.0"`.
- Uprawnienie INTERNET zostawione (decyzja z zadania); test do zrobienia na telefonie opisany w docs/APK.md.
- Workflow `.github/workflows/android-apk.yml`: workflow_dispatch i tagi `apk-*`, `contents: read`. Wersje akcji sprawdzone w API GitHuba (najnowsze wydania): checkout v7.0.1, setup-node v7.1.0, setup-java v6.3.0, upload-artifact v7.0.2. Node 24, Temurin 21, `npm ci`, `npx cap sync android`, sprawdzenie skopiowanych plików, `./gradlew assembleDebug`, `unzip -l` z wymaganym `assets/public/index.html`, artefakt `gry-towarzyskie-<tag>-debug` (30 dni). Workflow Pages bez zmian.
- Lokalny build: niemożliwy (brak JDK i Android SDK), nic nie instalowałem.

### Wynik
- Tag `apk-1` wypchnięty razem z gałęzią `noc`. Uruchomienie #1 „Android APK (debug)”: **success** za pierwszym razem, wszystkie kroki zielone.
  https://github.com/bydle97/Gry-Towarzyskie/actions/runs/44421271265
- Artefakt: `gry-towarzyskie-apk-1-debug`, 3,9 MB, wygasa 2026-12-18.
- `gh` nie jest zainstalowane, więc artefaktu nie pobrałem do dist/ (pobranie artefaktu wymaga zalogowania). Jak pobrać: docs/APK.md, sekcja „Jak pobrać APK z GitHub Actions”.
- Zawartość APK: krok workflow z `unzip -l ... | grep -q assets/public/index.html` przeszedł; logi kroków wymagają zalogowania, więc pełnej listy nie przeczytałem.
- docs/APK.md: pobieranie, instalacja, wersje, release/AAB (klucz nigdy w repo), ostrzeżenie o appId, lista do sprawdzenia na telefonie.
- Dodatkowo `tools/test-vampire.mjs` (zbiorczy test Wampira, faza 3) — wynik OK.

## 2026-11-19 00:36 — Faza 3: gra „Wampir”

Stan zastany: motyw, role (Wampir, Hrabia, Sługa, Znachor, Uczeń, Wiedźma, Łowca, Komendant, Mieszkaniec), ekran „Role w tej grze”, scenariusz, instrukcja mistrza, Tablica z legendą i docs/ROLE.md były już zrobione w commitach autora („Wampir: nowy motyw gry sekta”, „mechanika wampira”). Sprawdziłem je zamiast pisać od nowa.

Dorobione:
- `tools/test-vampire.mjs` (Node, kod wyjścia 0/1): uruchamia 5 szczegółowych skryptów `tools/sect-*.js` i zbiera ich werdykty, a do tego sprawdza domyślne role dla N = 5, 7, 8, 10, 12, 20 względem progów z zadania 3d, Hrabiego jako jednego z wampirów, blokadę przewagi wampirów od startu i ostrzeżenie „ponad 1/3”. Wynik: **OK** (wszystkie przypadki z listy zadania pokryte).
- EN: „investigation results” → „the hunter's results” w instrukcji mistrza.

### Sprawdzenia
- Grep wartości w pl.json i en.json: brak słów „sekta, sekciarz, lekarz, śledczy” (oraz cult/sect/doctor/detective w EN). Identyfikatory i klucze (`sect`, `doctor`, `detective`) zostają, zgodnie z zadaniem.
- Kwestie „Powiedz na głos”, wynik łowcy i legenda Tablicy zgodne z tekstem zadania 3a–3c.
- Przeglądarka (headless Chrome, 360x800), 10 graczy: ekran „Role w tej grze” (2 wampiry, Hrabia, Sługa, Uczeń, Komendant), sprawdzenie wszystkich 10 ról przez „Jesteś [imię]? → Tak, pokaż rolę → Ukryj rolę”, instrukcja mistrza, noc 1 (12 kroków: wampiry, sługa, znachor z uczniem, łowca z wynikiem pod przytrzymaniem), poranek, dzień z licznikiem i przyciskiem „⭐ Komendant przejmuje głosowanie”, noce 2–3 (8 kroków). Bez błędów JS w konsoli. Wiedźmy (od 12 graczy) w przeglądarce nie przechodziłem; jej logikę pokrywa test w Node.

## 2026-11-19 00:47 — Faza 4: wygląd

### A. Czcionki (lokalne, OFL-1.1, Fontsource 5.3.0, podzbiory latin + latin-ext)
| Gra | Czcionka | Wagi |
|---|---|---|
| HUB | Baloo 2 | 600, 700 |
| Na oko | Nunito | 700, 800 |
| W pół słowa | Patrick Hand | 400 |
| Ping-pong | Barlow Condensed | 600, 700 (cyfry zegara `tabular-nums`) |
| Wampir | Cinzel (nagłówki) + EB Garamond (tekst „Powiedz na głos”, przyciski) | 700 / 400, 600 |

- **Test „Zażółć gęślą jaźń”** (plus wielkie litery, „ ”, – i —) w headless Chrome: dla każdego znaku porównałem szerokość z dwoma różnymi czcionkami zapasowymi (monospace vs serif); różnica = znak spoza czcionki docelowej.
  - **Fredoka** (propozycja z zadania dla HUB): brak **ą ę ż Ą Ę Ż** → odrzucona.
  - **Lilita One** (propozycja dla W pół słowa): brak **ą ć ę ń ś ź ż** (i wielkich) → odrzucona.
  - Zamienniki z listy zadania: **Baloo 2** i **Patrick Hand** — komplet.
  - Wynik końcowy: wszystkie 10 krojów/wag renderuje cały tekst testowy czcionką docelową (0 znaków z czcionki zapasowej).
- Rozmiar: 20 plików woff2, łącznie ok. 464 KB (limit ok. 500 KB). Pakiety fontsource instalowane tymczasowo i usunięte (`npm prune`); package.json bez zmian.
- `www/css/fonts.css` (@font-face z `unicode-range`, `font-display: swap`, zmienne `--font-hub`, `--font-na-oko`, `--font-w-pol-slowa`, `--font-ping-pong`, `--font-wampir`, `--font-wampir-text`), `www/fonts/LICENSES.md` + pełne teksty licencji w `www/fonts/licenses/`.
- Router ustawia `data-game` na `<body>` i na sekcji ekranu (szczegóły i gra), karty HUB-a mają `data-game` i pokazują nazwę gry jej czcionką. Tekst ciągły zostaje systemowy.
- Workflow: `fonts/`, `fonts/LICENSES.md` i `css/fonts.css` są wymagane w skopiowanych plikach, a `assets/public/fonts/` w APK.

### B. Akcenty (`www/css/themes.css`)
Na oko #5cc8ff (błękit), W pół słowa #ff8f5e (koral), Ping-pong #b8f04a (limonka), Wampir #e8606c jako akcent tekstu i bordo #9b1b30 na głównych przyciskach. Kontrast obliczony wg WCAG: akcent na tle 5,65–13,95:1, na powierzchni kart ≥ 4,81:1, tekst na akcencie ≥ 5,97:1, biały na bordo 7,37:1. Na stałe wpisane odcienie pomarańczu w Wampirze liczone teraz z `--color-accent` (z zapasową wartością dla starszych WebView bez `color-mix`).

### C. Ping-pong
Połowy ekranu jako wypukłe przyciski: ramka w kolorze drużyny, zaokrąglenia, gradient i cień, `:active` przesuwa w dół i zmniejsza cień (także obrócona górna połowa), aktywny gracz z pulsującą poświatą (wyłączoną przy `prefers-reduced-motion`) i napisem „👆 DOTKNIJ, GDY ODPOWIESZ”, druga połowa przygaszona z „Czeka…” (nowe klucze `games.duel.tapHint`, `games.duel.waiting` w pl i en). Pauza bez zmian w pasku między połowami (margines połówek nie nachodzi na pasek). Zwarty wariant dla ekranów niższych niż 640 px. Logika zegara i blokady dotknięć nietknięte.

### D. HUB
Tytuł „Gry Towarzyskie” większy (Baloo 2, do 3,4 rem), karty: ikona w kafelku w odcieniu gry, lewa krawędź w kolorze gry, nazwa czcionką gry, zakres graczy jako etykieta, zablokowana karta wyszarzona z czytelnym powodem.

### E. Sprawdzenia
- Zrzuty przed (faza 1) i po: 360x800 i 320x568, HUB, szczegóły wszystkich gier, „Na oko” (pytanie i ranking), Ping-pong (gotowi, w trakcie, pauza), Wampir (noc). Brak poziomego przewijania przy 320 px (`scrollWidth <= innerWidth`).
- `__i18nCheck()`: 0 brakujących i 0 nadmiarowych w pl i en. `node --check`, `tools/test-content-pool.mjs`, `tools/test-vampire.mjs`: OK.
- Pełna partia „Na oko”, 3 cykle noc/dzień w Wampirze, start pojedynku w Ping-pongu: bez błędów JS.

## 2026-11-19 01:02 — Faza 5: wykończenie wersji na Androida

1. **Wstecz**: `window.Capacitor.Plugins` nie wystarcza bez bundlera (mostek natywny daje tylko `nativePromise`/`PluginHeaders`, obiekty wtyczek tworzy `registerPlugin` z `@capacitor/core` — sprawdzone w `node_modules/@capacitor/android/.../native-bridge.js` i `@capacitor/core/dist/index.js`). Dlatego `@capacitor/core/dist/index.js` (moduł ES bez importów, 24 KB, MIT) jest kopiowany do `www/js/vendor/native-bridge.js` skryptem `tools/update-native-bridge.mjs`. Nowy `www/js/core/native.js` (isNative, onSystemBack, vibrate, setNativeKeepAwake; w przeglądarce no-op). Router: `handleSystemBack()` używa tej samej ścieżki co gest w przeglądarce (history.back → popstate → okno „Zakończyć grę?”), przy otwartym oknie nic nie robi, na ekranie głównym zwraca false → `App.exitApp()`.
2. **Wibracje**: `@capacitor/haptics` z zapasowym `navigator.vibrate` (Ping-pong, Wampir). **Blokada ekranu**: `core/wake-lock.js` już był (Screen Wake Lock API); w APK używa natywnej flagi przez `@capacitor-community/keep-awake` 8.0.1 (peer `@capacitor/core >= 8`, zgodna). Decyzja: Wake Lock API w Android WebView nie jest pewne, a nie mam urządzenia do sprawdzenia. Ping-pong: w trakcie pojedynku; Wampir: od pierwszej nocy do końca gry (było).
3. **Ikona i splash**: własny rysunek SVG (dwa nakładające się dymki rozmowy w kolorach aplikacji) w `assets/src/`, PNG przez `tools/render-icons.mjs` (sharp z `@capacitor/assets`), zasoby przez `npx capacitor-assets generate --android` (74 pliki). Tło okna, splash (także `windowSplashScreenBackground` dla Androida 12+) i paski systemowe w `#0d1120`. Edge-to-edge (Android 15): Capacitor 8 `SystemBars.insetsHandling: "native"` + `viewport-fit=cover` + `env(safe-area-inset-*)` w CSS (było).
4. **Ustawienia**: `allowBackup="false"`, versionName 0.1.0, nazwa „Gry Towarzyskie”, orientacja pionowa (decyzja: wszystkie ekrany projektowane pionowo, Ping-pong dzieli ekran na górę i dół).
5. **Build końcowy**:
   - `apk-final`: **failure** w `gradlew assembleDebug`. Logi Actions wymagają zalogowania, więc dodałem krok, który przy błędzie wypisuje linie z logu Gradle jako adnotacje (publiczne w API).
   - `apk-final-2`: **failure**, adnotacja pokazała przyczynę: `res/values/colors.xml:3:38: The string "--" is not permitted within comments` (w komentarzu było „--color-bg”). Poprawione; sprawdziłem skryptem wszystkie komentarze XML w `android/app/src/main`.
   - `apk-final-3`: **success**. Artefakt `gry-towarzyskie-apk-final-3-debug`, 4,6 MB, wygasa 2026-12-19. Krok workflow sprawdził w APK: `assets/public/index.html`, `locales/pl.json`, `data/pl/`, `fonts/`, `js/vendor/native-bridge.js`, `res/mipmap-xxxhdpi`.

### Sprawdzenia
- Przeglądarka z atrapą mostka natywnego (sztuczne `window.androidBridge` i `PluginHeaders`): rejestracja `App.addListener(backButton)`, „wstecz” na szczegółach → HUB, w grze → okno „Zakończyć grę?”, drugie „wstecz” przy otwartym oknie nic nie robi, na HUB-ie → `App.exitApp`; start pojedynku → `KeepAwake.keepAwake`, pauza → `allowSleep`, dotknięcie połowy → `Haptics.vibrate {duration: 30}`.
- Wersja webowa bez zmian w działaniu (`__i18nCheck` OK, pojedynek, Na oko, Wampir); `node --check` wszystkich plików, `test-content-pool.mjs`, `test-vampire.mjs`: OK. Dodane `"type": "module"` w package.json (testy importujące www/ bez ostrzeżeń Node; skrypty `sect-*.js` nadal działają).
- Na prawdziwym telefonie nic nie sprawdzone (brak urządzenia/emulatora) — lista w docs/PORANEK.md.
- Uwaga: „Tak, zakończ grę” wraca do ekranu szczegółów gry (tak działa `game-api.exit()`), choć tekst okna mówi „Wrócisz do HUB-a”. Nie zmieniałem (zachowanie sprzed nocy), do decyzji autora.
