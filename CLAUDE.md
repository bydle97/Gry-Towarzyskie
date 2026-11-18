# Gry Towarzyskie: kontekst projektu

## Czym jest projekt
Zbiór gier towarzyskich na jednym telefonie (telefon krąży między graczami albo leży między nimi). W pełni offline: bez kont, reklam, analityki i zapytań sieciowych. Dwie postacie aplikacji: wersja webowa (statyczna, folder www/) oraz aplikacja na Androida (Capacitor, APK). Autor pracuje sam, hobbystycznie. Komunikacja z autorem po polsku.

## Struktura
- www/index.html, www/css/, www/js/, www/data/<kod języka>/ (treść gier), www/locales/<kod>.json (teksty interfejsu), www/fonts/ (lokalne czcionki woff2, OFL, opis w www/fonts/LICENSES.md).
- www/css/: base, layout, components, fonts.css (@font-face i zmienne --font-*), themes.css (motyw per gra: czcionka i --color-accent według body[data-game], ustawianego przez router; wygląd HUB-a).
- www/js/core/: router (historia, handleSystemBack), session, random, content-pool, content-loader, i18n, languages, game-contract, games-registry, game-api, dom (el, guardTaps), format, wake-lock (Wake Lock API, w APK natywnie), native (Capacitor: przycisk wstecz, wibracje, KeepAwake; w przeglądarce no-op).
- www/js/vendor/native-bridge.js: kopia @capacitor/core (registerPlugin bez bundlera). Nie edytować ręcznie; po aktualizacji Capacitora: node tools/update-native-bridge.mjs.
- www/js/startup-check.js: zwykły skrypt z komunikatem przy otwarciu z file://.
- www/js/components/: player-list-editor, team-setup, content-status, language-switcher i inne wspólne komponenty.
- www/js/screens/: home-screen, details-screen, game-screen.
- www/js/games/<id>/: index.js, ui.js, engine.js (czyste funkcje logiki), config.js, pliki ze skryptami i instrukcjami (gra Wampir).
- docs/ (poza www/): PRZEGLAD.md (przegląd kodu), DODAWANIE-JEZYKA.md, ZADANIA-NOC.md, NOCNY-LOG.md, APK.md, ROLE.md, PORANEK.md.
- Android: package.json (tylko devDependencies: Capacitor 8, @capacitor/app, haptics, assets, @capacitor-community/keep-awake), capacitor.config.json, android/ (projekt Gradle; android/app/src/main/assets/public jest generowany przez npx cap sync android i nie jest w repo), assets/ (źródła ikony: assets/src/*.svg → node tools/render-icons.mjs → npx capacitor-assets generate --android). APK buduje .github/workflows/android-apk.yml (tagi apk-*, ręcznie workflow_dispatch). Szczegóły: docs/APK.md.
- tools/: serve.mjs (serwer statyczny 127.0.0.1:5510 do testów), test-content-pool.mjs, test-vampire.mjs (zbiorczy test Wampira, uruchamia też sect-*.js), sect-*.js (do konsoli lub Node), update-native-bridge.mjs, render-icons.mjs.
- Bez bundlera, bez bibliotek, bez kroku budowania webu. Moduły ES wymagają serwera (Live Server lub hosting), nie działają z file://. Podgląd lokalny: rozszerzenie Live Server w VS Code, adres w stylu http://127.0.0.1:5500/www/index.html.
- Wersja webowa publikowana statycznie z folderu www/ (workflow GitHub Pages lub Cloudflare Pages, katalog wyjściowy www). Aplikacja na Androida buduje się przez Capacitor (webDir: www).

## Gry (id w kodzie, nazwa w aplikacji)
Identyfikatory i klucze tłumaczeń są historyczne i NIE zmieniają się przy zmianie nazw.
- guess-number, „Na oko" (2–10 graczy): pytanie z odpowiedzią liczbową. Gracze po kolei wpisują typy (poprzednie widoczne). Ranking według odległości od odpowiedzi. Punkty: N − miejsce + 1 (remis daje wspólne miejsce, kolejne miejsce przeskakuje), bonus EXACT_HIT_BONUS = 2 za dokładny strzał. Partia ma QUESTIONS_PER_GAME = 8 pytań. Kolejność typowania w następnej rundzie wynika z rankingu (najbliższy pierwszy). Przycisk „Inne pytanie" tylko przed pierwszym typem rundy.
- revolver, „W pół słowa" (4–20): dwie drużyny (losowo lub ręcznie, min. 2 osoby w drużynie). Runda to para tłumaczy, po jednym z każdej drużyny. Widzą to samo hasło i mówią na zmianę po jednym słowie, aż któraś drużyna odgadnie. Aplikacja pokazuje, która drużyna zaczyna (losowo, potem na zmianę), i pozwala wybrać zwycięską drużynę albo „Unieważnij (0 pkt)". Liczba rund = liczba osób w większej drużynie, w mniejszej tłumacze się zapętlają. „Inne hasło": limit MAX_REDRAWS_PER_ROUND = 2.
- duel, „Ping-pong" (2–20, drużyny od 1 osoby): drużyny jak wyżej, pojedynek jednej osoby z każdej drużyny. Kategoria na ekranie, telefon leży między graczami, górna połowa ekranu obrócona o 180°. Każdy gracz ma pulę PLAYER_TIME_SECONDS = 10 na cały pojedynek (jak zegar szachowy). Po wymienieniu rzeczy dotyka swojej połowy: jego czas staje, rusza czas przeciwnika. Przegrywa ten, komu czas spadnie do zera. Pauza, blokada wygaszania ekranu, wibracje, INCREMENT_SECONDS = 0. „Inna kategoria" tylko przed startem zegara.
- sect, „Wampir" (5–20 graczy plus mistrz gry): gra w ukryte role. Mistrz gry nie gra, trzyma telefon i czyta scenariusz (bloki „Powiedz na głos" i „Zrób"). Role, ich zasady i wybór ról przed grą opisane w docs/ROLE.md. Strona zła to wampiry. Tablica mistrza z oznaczeniami, cofanie kroku, ręczne korekty.

## Twarde zasady (nie łam ich)
1. Offline: żadnych zapytań sieciowych poza własnymi plikami, żadnych CDN, czcionek z internetu, analityki ani reklam.
2. Zero innerHTML, insertAdjacentHTML i document.write. DOM budujemy przez el() z core/dom.js i textContent.
3. Jedyny zapis w pamięci przeglądarki to kod języka (localStorage, klucz gt.lang, w try/catch).
4. Ścieżki względne; adresy plików przez new URL(..., import.meta.url). Wielkość liter w nazwach plików ma znaczenie (serwer Linux).
5. Gracze zawsze po stałym id (np. p1), nigdy po indeksie tablicy. Imiona służą tylko do wyświetlania.
6. Wszystkie teksty widoczne dla użytkownika przez i18n (klucze w pl.json i en.json, oba języki naraz). Etykiety z liczbami bez odmiany, a gdzie konieczna, przez Intl.PluralRules. Przy imionach graczy formy neutralne rodzajowo. Kontrola: window.__i18nCheck().
7. Treść gier (pytania, hasła, kategorie) tylko w plikach www/data/<język>/*.txt. Losowanie przez core/content-pool.js bez powtórek w obrębie sesji i partii. Format plików opisują ich komentarze.
8. Przy zmianie ekranu lub fazy gry krótka blokada dotknięć (guardTaps) i zablokowane podwójne zatwierdzenie.
9. Logika gier w czystych funkcjach (engine.js), bez DOM, z komentarzami po polsku, z możliwością sprawdzenia skryptem w konsoli lub w Node.
10. Treści, nazwy i grafiki muszą być własne. Nie kopiuj cudzych talii pytań, haseł ani instrukcji i nie używaj cudzych nazw (Alias, Tabu, 5 Sekund, Ryzyk Fizyk i podobnych). Zasady gier nie są chronione, ale ich wykonanie tak.
11. Nigdy nie commituj sekretów: *.jks, *.keystore, local.properties, .env, haseł, kluczy.
12. Trzymaj się stylu istniejącego kodu: angielskie identyfikatory, polskie komentarze, małe pliki, bez nowych zależności w www/. Jedyny wyjątek: www/js/vendor/native-bridge.js (kopia @capacitor/core, generowana skryptem). Kod natywny woła się tylko przez core/native.js.

## Praca z gitem
- master to stan stabilny. Praca na gałęziach, małe commity po polsku, jeden temat na commit. Nigdy force push, nigdy przepisywanie historii.
- Przed zakończeniem zadania: node --check (jeśli Node dostępny), skrypty testowe logiki (node tools/test-content-pool.mjs, node tools/test-vampire.mjs), window.__i18nCheck(), a jeśli jest narzędzie przeglądarki, ręczne przejście ścieżki gry (node tools/serve.mjs, http://127.0.0.1:5510/).
- Po zmianach w www/ dla APK: npx cap sync android (lokalnie) albo nowy tag apk-N (Actions).

## Wygląd (stan po nocy 2026-11-19)
- Czcionki: HUB Baloo 2, Na oko Nunito, W pół słowa Patrick Hand, Ping-pong Barlow Condensed, Wampir Cinzel (nagłówki) + EB Garamond (narracja, przyciski). Tylko latin + latin-ext, maks. 2 wagi na rodzinę, łącznie ok. 450 KB. Nowa czcionka musi przejść test „Zażółć gęślą jaźń" (Fredoka i Lilita One odpadły: brak ą ę ż i innych).
- Tekst ciągły w czcionce systemowej. Akcenty: Na oko #5cc8ff, W pół słowa #ff8f5e, Ping-pong #b8f04a, Wampir #e8606c + bordo #9b1b30 na głównych przyciskach; kontrast min. 4,5:1. Kolory pochodne liczyć z var(--color-accent), nie wpisywać na stałe.

## Plany (nie wdrażaj bez polecenia)
Wersja premium (płatne paczki treści, klucze licencyjne), dodatkowe języki, service worker dla wersji webowej, publikacja w Google Play, polityka prywatności, ostateczna nazwa aplikacji (robocza: „Gry Towarzyskie").

## Gdzie czytać dalej
docs/ZADANIA-NOC.md (zadania), docs/NOCNY-LOG.md (dziennik pracy), docs/PRZEGLAD.md (znane problemy), docs/ROLE.md (role w grze Wampir).