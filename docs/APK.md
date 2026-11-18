# Aplikacja na Androida (APK)

Aplikacja na Androida to ta sama wersja webowa z folderu `www/`, zapakowana przez Capacitor. Wszystkie pliki (HTML, JS, CSS, treści gier, tłumaczenia, czcionki) są w środku APK, więc aplikacja działa bez internetu.

## Wersje

| Składnik | Wersja |
|---|---|
| Capacitor (`@capacitor/core`, `cli`, `android`) | 8.6.2 |
| `@capacitor/app` | 8.1.2 |
| `@capacitor/haptics` | 8.0.2 |
| `@capacitor/assets` (tylko generowanie ikon) | 4.0.0 |
| Node (wymagany przez Capacitor 8) | 22 lub nowszy (w Actions: 24) |
| JDK | 21 (Temurin) |
| Gradle / Android Gradle Plugin | 8.14.3 / 8.13.0 |
| minSdk / targetSdk | 24 (Android 7.0) / 36 |
| appId | `pl.grytowarzyskie.app` (tymczasowe) |
| versionName / versionCode | 0.1.0 / numer uruchomienia workflow |

## Jak pobrać APK z GitHub Actions
1. Otwórz repozytorium na GitHubie, zakładka **Actions**.
2. Po lewej wybierz workflow **Android APK (debug)**.
3. Kliknij ostatnie zielone uruchomienie (np. dla tagu `apk-3`).
4. Na dole strony, w sekcji **Artifacts**, kliknij `gry-towarzyskie-<tag>-debug`. Pobierze się plik ZIP (trzeba być zalogowanym na GitHubie).
5. Rozpakuj ZIP: w środku jest plik `gry-towarzyskie-<tag>-debug.apk`. Artefakty są przechowywane 30 dni.

Nowy APK powstaje po wypchnięciu tagu `apk-*` (`git tag apk-5 && git push origin apk-5`) albo ręcznie: Actions → Android APK (debug) → **Run workflow** (wybierz gałąź).

## Jak zainstalować na telefonie
1. Prześlij plik `.apk` na telefon (kabel USB, Dysk Google, e-mail do siebie, komunikator).
2. Otwórz plik na telefonie (np. z aplikacji Pliki / Pobrane).
3. Android zapyta o zgodę na instalację z nieznanych źródeł dla aplikacji, z której otwierasz plik (np. „Pliki” albo „Chrome”). Wejdź w **Ustawienia**, włącz **Zezwalaj z tego źródła**, wróć i wybierz **Zainstaluj**.
4. Google Play Protect może ostrzec o nieznanej aplikacji: wybierz **Zainstaluj mimo to** (to wersja testowa podpisana kluczem debug).
5. Kolejne APK z Actions instalują się jako aktualizacja (rosnący versionCode), o ile pochodzą z tego samego klucza. Uwaga: każdy runner GitHub Actions ma inny klucz debug, więc Android może odmówić aktualizacji („pakiet koliduje z istniejącym”). Wtedy odinstaluj starą wersję i zainstaluj nową. Wyniki gier nie są zapisywane, więc nic nie przepada.

## Lokalne budowanie (opcjonalnie)
Wymaga JDK 21 i Android SDK (np. z Android Studio).
```
npm ci
npx cap sync android
cd android
./gradlew assembleDebug      (Windows: gradlew.bat assembleDebug)
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Po każdej zmianie w `www/` trzeba ponownie uruchomić `npx cap sync android` (kopiuje `www/` do `android/app/src/main/assets/public`, ten folder nie jest w repozytorium).

## Wersja release i AAB (na przyszłość, do Google Play)
1. **Zmień appId** przed pierwszą publikacją w sklepie (w `capacitor.config.json` i `android/app/build.gradle`: `namespace` i `applicationId`, plus pakiet `MainActivity.java`). Po publikacji appId nie da się już zmienić.
2. Wygeneruj klucz podpisujący (`keytool -genkey -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`). **Klucz i hasła nigdy nie trafiają do repozytorium** (`.gitignore` wyklucza `*.jks`, `*.keystore`, `.env`, `local.properties`). Zrób kopię zapasową klucza poza komputerem.
3. W Actions klucz podaje się jako sekrety repozytorium (np. plik `.jks` zakodowany base64 i hasła), a workflow odtwarza go tylko na czas budowania i uruchamia `./gradlew bundleRelease` (AAB do Google Play) albo `assembleRelease` (APK).
4. Konfiguracja podpisu (`signingConfigs`) w `android/app/build.gradle` czyta hasła ze zmiennych środowiskowych, nie z pliku w repozytorium.
5. Google Play wymaga też polityki prywatności i formularza bezpieczeństwa danych (aplikacja nie zbiera danych, ale trzeba to zadeklarować).

## Do sprawdzenia na telefonie
- [ ] Aplikacja uruchamia się i działa w **trybie samolotowym** (wszystko z plików lokalnych).
- [ ] Uprawnienie `INTERNET` w `AndroidManifest.xml` zostało (domyślne w Capacitorze). Aplikacja go nie potrzebuje, bo pliki serwuje lokalnie sam WebView, ale nie usuwałem go bez sprawdzenia na urządzeniu. Test: usuń linię `<uses-permission android:name="android.permission.INTERNET" />`, zbuduj APK, sprawdź pełną partię każdej gry. Jeśli wszystko działa, uprawnienie można usunąć (wtedy w sklepie aplikacja nie pokazuje dostępu do sieci).
- [ ] Przycisk / gest **wstecz**: w grze pyta „Zakończyć grę?”, poza grą cofa o ekran, na ekranie głównym zamyka aplikację.
- [ ] Wibracje w Ping-pongu i Wampirze.
- [ ] Ekran nie gaśnie w trakcie pojedynku w Ping-pongu i w trakcie gry w Wampira.
- [ ] Ikona aplikacji i ekran startowy (ciemny, bez białego błysku).
- [ ] Czcionki z polskimi znakami (ą ć ę ł ń ó ś ź ż) w każdej grze.
- [ ] Pasek stanu i dolny pasek nawigacji nie zasłaniają przycisków (Android 15, tryb edge-to-edge).
- [ ] Pełna partia każdej gry, w Wampirze także 8–12 osób z wiedźmą, hrabią i sługą.
