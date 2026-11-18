# Nocny dziennik pracy (Claude Code)

Dziennik pracy autonomicznej na gałęzi `noc`. Zadania: docs/ZADANIA-NOC.md.

## Tabela postępu

| Faza | Stan | Uwagi |
|---|---|---|
| 0. Ocena stanu | zrobione | |
| 1. Poprawki z przeglądu | zrobione | większość była już w kodzie; dorobione D-6, P-1 |
| 2. APK (Capacitor) | zrobione | apk-1 zbudowany w Actions (success) |
| 3. Wampir | do sprawdzenia | logika i UI były już w kodzie |
| 4. Wygląd | do zrobienia | |
| 5. Wykończenie Androida | do zrobienia | |

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

## 2026-11-19 00:50 — Faza 1: poprawki z przeglądu

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

## 2026-11-19 01:35 — Faza 2: pakowanie do APK (Capacitor)

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
