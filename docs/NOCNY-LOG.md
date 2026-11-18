# Nocny dziennik pracy (Claude Code)

Dziennik pracy autonomicznej na gałęzi `noc`. Zadania: docs/ZADANIA-NOC.md.

## Tabela postępu

| Faza | Stan | Uwagi |
|---|---|---|
| 0. Ocena stanu | zrobione | |
| 1. Poprawki z przeglądu | w toku | większość była już w kodzie |
| 2. APK (Capacitor) | do zrobienia | |
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
