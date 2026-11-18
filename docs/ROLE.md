# Role w grze „Wampir”

Gra ma w kodzie historyczne id `sect` (folder `www/js/games/sect/`, klucze `games.sect.*`).
Progi i domyślne wartości są w `www/js/games/sect/config.js` (`ROLE_DEFAULT_MIN_PLAYERS`,
`getDefaultVampireCount`), a reguły w `engine.js`. Mistrz gry może zmienić skład na ekranie
„Role w tej grze” przed rozdaniem ról.

| Rola | Strona | Moc | Krok nocy | Domyślnie gra |
|---|---|---|---|---|
| 🧛 Wampir | wampiry | Co noc wampiry wspólnie wskazują jedną osobę do ataku (mogą wskazać też wampira). | 2. — „Wampiry otwierają oczy” (każda noc) | zawsze: 1 przy 5–7 graczach, 2 przy 8–11, 3 przy 12–15, 4 przy 16–20 |
| 🦇 Hrabia | wampiry | Jest jednym z wampirów (zajmuje miejsce z puli wampirów). Łowca widzi go jako „nie wampir”; mistrz gry widzi zafałszowanie w dzienniku i na Tablicy. Po śmierci: „Hrabia (wampir)”. | razem z wampirami | od 10 graczy; wymaga co najmniej 2 wampirów |
| 🗝️ Sługa | wampiry (człowiek) | Zna wampiry (one nie znają sługi). Dla łowcy „nie wampir”; w warunku przewagi liczy się jako zwykły gracz. Wygrywa razem z wampirami. | tylko 1. noc, zaraz po zamknięciu oczu przez wampiry | od 10 graczy |
| 🌿 Znachor | mieszkańcy | Co noc chroni jedną osobę przed atakiem wampirów, nie tę samą dwie noce z rzędu (może siebie). Nie chroni przed trucizną. | po wampirach (i słudze); atrapa, gdy nie żyje | zawsze (można wyłączyć) |
| 🎓 Uczeń | mieszkańcy | W 1. noc poznaje znachora. Gdy znachor zginie (noc, dzień, trucizna), od następnej nocy przejmuje jego moc z tym samym ograniczeniem. | w kroku znachora (1. noc: poznanie, później jako znachor) | od 8 graczy; wymaga znachora |
| 🧙 Wiedźma | mieszkańcy | Widzi ofiarę wampirów. Dwie mikstury, każda raz w grze: uleczenie ofiary i otrucie dowolnej innej żywej osoby. Jednej nocy może użyć obu, jednej albo żadnej. Trucizna zabija zawsze. | po znachorze, przed łowcą; atrapa, gdy nie żyje lub nie ma mikstur | od 12 graczy |
| 🔍 Łowca | mieszkańcy | Co noc sprawdza jedną żywą osobę (nie siebie): czy jest wampirem. Hrabia daje wynik „nie wampir”. | po wiedźmie; atrapa, gdy nie żyje | zawsze (można wyłączyć) |
| ⭐ Komendant | mieszkańcy | Raz na grę, w dzień i tylko za życia, przejmuje głosowanie i sam wskazuje, kto odpada. Ujawnia się publicznie (⭐ na Tablicy). | brak (działa w dzień, na ekranie głosowania) | od 7 graczy |
| 🧑 Mieszkaniec | mieszkańcy | Brak mocy; dyskutuje i głosuje w dzień. | brak | reszta grających |

## Kolejność kroków nocy

1. Zapada noc.
2. Wampiry (z hrabią) wskazują ofiarę → zamykają oczy.
3. Tylko 1. noc, jeśli gra sługa: sługa otwiera oczy, wampiry unoszą rękę → sługa zamyka oczy.
4. Znachor (1. noc razem z uczniem: poznanie, uczeń zamyka oczy) → wybór ochrony → zamyka oczy.
5. Wiedźma: widzi ofiarę, uleczenie / otrucie / nic → zamyka oczy.
6. Łowca: sprawdzenie → wynik gestem → zamyka oczy.
7. Poranek: rozstrzygnięcie (0, 1 albo 2 ofiary).

Role wyłączone na ekranie „Role w tej grze” nie mają kroków. Role w grze, ale martwe (znachor
bez ucznia z mocą, wiedźma, łowca), mają krok-atrapę z tymi samymi słowami (odczekaj 5–8 s).

## Rozstrzygnięcie nocy i wygrana

- Ofiara wampirów ginie, chyba że chroni ją znachor (albo uczeń z jego mocą) lub uleczy ją wiedźma.
- Osoba otruta ginie zawsze. Ta sama osoba jako ofiara i otruta = jedna śmierć.
- Mieszkańcy wygrywają, gdy nie ma żywych wampirów (także hrabiego). Sługa nie ma tu znaczenia.
- Wampiry wygrywają, gdy żywych wampirów jest tyle co pozostałych żywych lub więcej
  (sługa liczy się jako pozostały gracz). Wtedy wygrywa też sługa.
- Wygrana jest sprawdzana rano, po głosowaniu (także po przejęciu go przez komendanta) i po każdej korekcie.

## Skrypty kontrolne (`tools/`)

Każdy można wkleić w konsolę przeglądarki na stronie aplikacji albo uruchomić w Node (polecenie w nagłówku pliku):
`sect-roles-check.js` (konfiguracja ról), `sect-console-check.js` (uczeń, komendant, skład),
`sect-count-servant-check.js` (hrabia, sługa), `sect-witch-check.js` (wiedźma),
`sect-edge-cases-check.js` (sytuacje brzegowe).
