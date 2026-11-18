# Raport na rano (noc 18/19 listopada 2026)

Wszystko jest na gałęzi `noc` (wypchnięta na GitHuba). Do `master` nic nie scalałem. Szczegóły i godziny: docs/NOCNY-LOG.md.

## Najważniejsze
- **APK do testów jest gotowy**: tag `apk-final`, workflow „Android APK (debug)”. Wcześniejsze: `apk-1` (sam Capacitor), `apk-2` (po fazie 3), `apk-3` (czcionki i wygląd). WYNIK_APK_FINAL
- Wszystkie fazy 0–5 zrobione. Duża część faz 1 i 3 była już w kodzie z Twoich wcześniejszych commitów; sprawdziłem ją testami i w przeglądarce, dorobiłem braki.

## Jak zainstalować APK
1. GitHub → repozytorium → **Actions** → po lewej **Android APK (debug)** → uruchomienie dla `apk-final` (zielone).
2. Na dole strony **Artifacts** → `gry-towarzyskie-apk-final-debug` (pobiera ZIP; trzeba być zalogowanym).
3. Rozpakuj, plik `.apk` prześlij na telefon (kabel, Dysk, e-mail) i otwórz.
4. Android poprosi o zgodę na instalację z nieznanych źródeł dla aplikacji, z której otwierasz plik: Ustawienia → **Zezwalaj z tego źródła** → wróć → **Zainstaluj**. Play Protect: **Zainstaluj mimo to**.
5. Jeśli aktualizacja starszego APK się nie uda („pakiet koliduje”), odinstaluj poprzednią wersję (każdy build ma inny klucz debug).

Artefakty są trzymane 30 dni. Nowy APK: `git tag apk-5 && git push origin apk-5` albo Actions → Run workflow. Pełny opis: docs/APK.md.

## Co zrobione
- **Faza 1** (przegląd): dorobione D-6 (focus na tytule nowego ekranu, `aria-disabled` na zablokowanych kartach) i P-1 (komunikat przy otwarciu z pliku, osobny zwykły skrypt `startup-check.js`, bo przy `file://` moduły w ogóle się nie ładują). Reszta była zrobiona — potwierdzone.
- **Faza 2** (APK): Capacitor 8.6.2, projekt `android/`, workflow z tagami `apk-*`, versionCode z numeru uruchomienia, versionName 0.1.0. Pierwszy build przeszedł za pierwszym razem.
- **Faza 3** (Wampir): wszystkie role i wybór ról były w kodzie. Dodałem `tools/test-vampire.mjs` (zbiorczy test, wszystkie przypadki z zadania: OK) i przeszedłem w przeglądarce 3 pełne cykle noc/dzień przy 10 osobach (Hrabia, Sługa, Uczeń, Komendant).
- **Faza 4** (wygląd): lokalne czcionki per gra, akcenty kolorystyczne, Ping-pong z połowami jak wypukłe przyciski i napisem „👆 DOTKNIJ, GDY ODPOWIESZ” / „Czeka…”, nowy wygląd HUB-a.
- **Faza 5** (Android): przycisk wstecz, wibracje (Haptics), blokada wygaszania ekranu (keep-awake), własna ikona (dwa dymki rozmowy), ciemny ekran startowy i tło okna, `allowBackup` wyłączone, orientacja pionowa.

## Najważniejsze decyzje
- **Czcionki**: Fredoka (HUB) i Lilita One (W pół słowa) z propozycji **nie mają polskich liter** (brak m.in. ą ę ż) — test „Zażółć gęślą jaźń” w przeglądarce. Zamiast nich Baloo 2 i Patrick Hand (alternatywy z zadania). Na oko: Nunito, Ping-pong: Barlow Condensed, Wampir: Cinzel + EB Garamond. Wszystkie OFL, ok. 450 KB.
- **Wtyczki bez bundlera**: `window.Capacitor.Plugins` nie wystarcza (obiekty wtyczek tworzy dopiero `registerPlugin` z `@capacitor/core`), więc `@capacitor/core` jest skopiowany do `www/js/vendor/native-bridge.js` skryptem `tools/update-native-bridge.mjs`. Reszta aplikacji bez zmian w budowaniu.
- **Blokada ekranu**: w APK natywna flaga okna przez `@capacitor-community/keep-awake` 8.0.1 (zgodna z Capacitorem 8), bo Wake Lock API w Android WebView nie jest pewne; w przeglądarce dalej Wake Lock API.
- **Uprawnienie INTERNET zostało** (zgodnie z zadaniem) — do sprawdzenia na telefonie, opis w docs/APK.md.
- **Orientacja pionowa**: wszystkie ekrany są projektowane pionowo, a Ping-pong dzieli ekran na górę i dół.
- Ping-pong ma w kodzie 2–20 graczy (drużyny od 1 osoby); poprawiłem to w CLAUDE.md (było 4–20).

## Czego NIE zrobiono i dlaczego
- **Nie testowałem na telefonie ani w emulatorze** (brak JDK, Android SDK i urządzenia; nic nie instalowałem globalnie). Logika wstecz/wibracji/KeepAwake sprawdzona w przeglądarce z atrapą mostka natywnego Capacitora; prawdziwe zachowanie trzeba potwierdzić na telefonie.
- **Nie pobrałem APK do `dist/`**: brak `gh`, a pobranie artefaktu wymaga zalogowania. Stan buildów sprawdzałem przez publiczne API GitHuba.
- Lista zmienionych pytań „Na oko” (W-1): pytania poprawiłeś już wcześniej, więc nie było czego zmieniać; dane PL i EN mają same cyfry.
- Wiedźmy (od 12 osób) nie przechodziłem w przeglądarce; jej logikę pokrywa test w Node.
- Pominięte zgodnie z zadaniem: D-2, D-8, D-18, P-2 (CSP), P-3, service worker.

## Do sprawdzenia na telefonie
- [ ] Tryb samolotowy: aplikacja startuje i każda gra działa.
- [ ] Gest/przycisk wstecz: w grze „Zakończyć grę?”, poza grą krok wstecz, na HUB-ie zamknięcie.
- [ ] Wibracje (Ping-pong: zmiana tury i koniec; Wampir: koniec licznika dyskusji).
- [ ] Ekran nie gaśnie w pojedynku Ping-ponga i w Wampirze od pierwszej nocy.
- [ ] Ikona na ekranie głównym telefonu i ciemny ekran startowy bez białego błysku.
- [ ] Czcionki z polskimi znakami we wszystkich grach.
- [ ] Pasek stanu i dolna nawigacja nie zasłaniają przycisków (Android 15).
- [ ] Pełna partia każdej gry; Wampir z 8–12 osobami (uczeń, Hrabia, sługa, wiedźma).
- [ ] Usunięcie uprawnienia INTERNET (test opisany w docs/APK.md).

## Znane ryzyka
- `www/js/vendor/native-bridge.js` musi pasować do wersji `@capacitor/android`; po aktualizacji Capacitora uruchom `node tools/update-native-bridge.mjs`.
- `color-mix()` w CSS (odcienie akcentu) wymaga WebView/Chrome 111+; starsze pokażą zapasowy pomarańcz albo brak tła kafelka ikony — bez wpływu na działanie.
- Klucz debug jest inny w każdym buildzie z Actions, więc aktualizacja APK może wymagać odinstalowania.
- appId `pl.grytowarzyskie.app` jest tymczasowy — zmień przed publikacją w sklepie (docs/APK.md).
- Czcionki są ładowane z `font-display: swap`: przy pierwszym renderze może mignąć czcionka systemowa (lokalnie trwa to ułamek sekundy).

## Jak scalić `noc` do `master`
1. Przejrzyj zmiany: `git log master..noc --oneline` i `git diff master...noc --stat`.
2. Zainstaluj APK i przejdź listę powyżej.
3. Scal bez przepisywania historii:
   ```
   git checkout master
   git pull
   git merge --no-ff noc
   git push origin master
   ```
   albo przez Pull Request `noc → master` na GitHubie.
4. Push na `master` uruchomi workflow GitHub Pages (wersja webowa z nowymi czcionkami i motywami).
