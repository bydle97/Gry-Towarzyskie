/*
 * Sprawdzenie silnika gry „Wampir” (historyczne id: sect) — uczeń i komendant.
 *
 * W przeglądarce: otwórz aplikację (strona z index.html), konsola (F12),
 * wklej CAŁĄ zawartość tego pliku i naciśnij Enter. Wynik pojawi się w tabeli.
 *
 * W Node (z katalogu projektu):
 *   node -e "globalThis.__SECT_BASE__ = require('url').pathToFileURL('www/').href; require('./tools/sect-console-check.js')"
 *
 * Skrypt tylko czyta moduły gry i liczy w pamięci — niczego nie zapisuje.
 */
(async () => {
  const base = globalThis.__SECT_BASE__ ?? document.baseURI;
  const engine = await import(new URL('js/games/sect/engine.js', base).href);
  const config = await import(new URL('js/games/sect/config.js', base).href);
  const R = config.ROLE_IDS;
  const results = [];

  const check = (test, ok, details = '') => {
    results.push({ test, wynik: ok ? 'OK' : 'BŁĄD', szczegóły: details });
  };

  /** Stan partii z ustalonymi rolami: p1 = roles[0], p2 = roles[1], ... */
  function makeState(roles) {
    const names = roles.map((_, index) => `Gracz ${index + 1}`);
    const fresh = engine.createGameState({
      playerNames: names,
      roleConfig: { vampires: 2, znachor: true, uczen: true, lowca: true, komendant: true },
    });
    return { ...fresh, players: fresh.players.map((player, index) => ({ ...player, roleId: roles[index] })) };
  }

  /** Jedna noc: nowy numer nocy, wybory, rozstrzygnięcie (jak w grze). */
  function playNight(state, choices) {
    const started = {
      ...state,
      nightNumber: state.nightNumber + 1,
      nightChoices: { ...engine.createEmptyNightChoices(), ...choices },
    };
    return engine.resolveNight(started);
  }

  const alive = (state, id) => engine.getPlayerById(state, id).alive;
  // 8 osób: p1, p8 wampiry; p2 znachor; p3 uczeń; p4 łowca; p5 komendant; p6, p7 mieszkańcy.
  const ROLES8 = [R.sect, R.doctor, R.apprentice, R.detective, R.commander, R.villager, R.villager, R.sect];

  // (a) znachor chroni ofiarę — nikt nie ginie
  {
    const s = playNight(makeState(ROLES8), { sectTargetId: 'p6', doctorTargetId: 'p6' });
    const entry = s.nightLog[0];
    check('(a) znachor chroni ofiarę', alive(s, 'p6') && entry.saved && entry.victimId === null,
      `p6 żyje: ${alive(s, 'p6')}, saved: ${entry.saved}`);
  }

  // (b) znachor ginie w nocy — uczeń działa jako znachor od następnej nocy
  {
    let s = playNight(makeState(ROLES8), { sectTargetId: 'p2', doctorTargetId: 'p6' });
    const sameNight = engine.getHealerActor(s);
    const nextNight = engine.getHealerActor({ ...s, nightNumber: s.nightNumber + 1 });
    s = playNight(s, { sectTargetId: 'p7', doctorTargetId: 'p7' });
    const entry = s.nightLog[1];
    check('(b) znachor ginie w nocy → uczeń od następnej nocy',
      !alive(s, 'p2') && sameNight === null && nextNight?.id === 'p3'
        && s.healerInheritance?.fromNight === 2 && entry.healerActorIsApprentice && entry.saved,
      `ta sama noc: ${sameNight?.id ?? 'nikt'}, następna: ${nextNight?.id}, przejęcie od nocy ${s.healerInheritance?.fromNight}`);
    check('(b) ograniczenie „nie tę samą osobę dwie noce z rzędu” przechodzi na ucznia',
      s.previousDoctorTargetId === 'p7', `poprzednio chroniona: ${s.previousDoctorTargetId}`);

    // wariant dzienny: znachor odpada w dzień 1 → uczeń od nocy 2
    let d = playNight(makeState(ROLES8), { sectTargetId: 'p6', doctorTargetId: 'p7' });
    d = engine.eliminatePlayer(d, 'p2', { type: 'day' });
    check('(b) znachor odpada w dzień → uczeń od następnej nocy',
      d.healerInheritance?.fromNight === 2 && engine.getHealerActor({ ...d, nightNumber: 2 })?.id === 'p3',
      `przejęcie od nocy ${d.healerInheritance?.fromNight}`);
  }

  // (c) znachor i uczeń nie żyją — krok znachora jest atrapą
  {
    let s = playNight(makeState(ROLES8), { sectTargetId: 'p2', doctorTargetId: 'p6' });
    s = engine.eliminatePlayer(s, 'p3', { type: 'day' });
    const actor = engine.getHealerActor({ ...s, nightNumber: 2 });
    check('(c) obaj martwi → atrapa (brak mocy znachora)', actor === null, `moc ma: ${actor?.id ?? 'nikt'}`);
  }

  // (d) komendant przejmuje głosowanie raz; drugi raz nie można
  {
    const s0 = playNight(makeState(ROLES8), { sectTargetId: 'p6', doctorTargetId: 'p7' });
    const self = engine.commanderTakeOver(s0, 'p5');
    const first = engine.commanderTakeOver(s0, 'p8');
    const second = engine.commanderTakeOver(first.state, 'p1');
    check('(d) komendant nie może wskazać siebie', !self.ok && self.error === engine.COMMANDER_ERRORS.invalidTarget, self.error);
    check('(d) pierwsze przejęcie działa',
      first.ok && !alive(first.state, 'p8') && first.state.commanderTakeover?.commanderId === 'p5'
        && first.state.dayLog.length === 1,
      `p8 żyje: ${alive(first.state, 'p8')}, wpisy dnia: ${first.state.dayLog.length}`);
    check('(d) drugie przejęcie zablokowane',
      !second.ok && second.error === engine.COMMANDER_ERRORS.alreadyUsed && alive(second.state, 'p1'), second.error);
    check('(d) po przejęciu sprawdzenie wygranej (1 wampir na 6 osób → gra trwa)',
      engine.checkWin(first.state) === null, String(engine.checkWin(first.state)));
    const deadCommander = engine.commanderTakeOver(engine.eliminatePlayer(s0, 'p5'), 'p8');
    check('(d) martwy komendant nie przejmuje głosowania',
      !deadCommander.ok && deadCommander.error === engine.COMMANDER_ERRORS.commanderDead, deadCommander.error);
  }

  // (e) skład ról dla 5, 7, 8, 12 i 20 graczy (domyślne role dodatkowe)
  {
    // Od 10 graczy domyślnie grają hrabia (jeden z wampirów) i sługa, od 12 — wiedźma.
    const expected = {
      5: { sect: 1, count: 0, servant: 0, doctor: 1, apprentice: 0, witch: 0, detective: 1, commander: 0, villager: 2 },
      7: { sect: 1, count: 0, servant: 0, doctor: 1, apprentice: 0, witch: 0, detective: 1, commander: 1, villager: 3 },
      8: { sect: 2, count: 0, servant: 0, doctor: 1, apprentice: 1, witch: 0, detective: 1, commander: 1, villager: 2 },
      12: { sect: 2, count: 1, servant: 1, doctor: 1, apprentice: 1, witch: 1, detective: 1, commander: 1, villager: 3 },
      20: { sect: 3, count: 1, servant: 1, doctor: 1, apprentice: 1, witch: 1, detective: 1, commander: 1, villager: 10 },
    };
    for (const [n, want] of Object.entries(expected)) {
      const count = Number(n);
      // Skład z domyślnej konfiguracji ról (config.defaultRoleConfig).
      const list = engine.buildRoleList(count, config.defaultRoleConfig(count));
      const lineup = Object.fromEntries(Object.keys(want).map((roleId) => [
        roleId,
        list.filter((item) => item === roleId).length,
      ]));
      const same = Object.keys(want).every((key) => lineup[key] === want[key]);
      check(`(e) skład dla ${count} graczy`, same && list.length === count,
        Object.entries(lineup).map(([key, value]) => `${key}:${value}`).join(' '));
    }
  }

  // (f) warunek wygranej bez zmian (uczeń i komendant liczą się po stronie mieszkańców)
  {
    const s = makeState(ROLES8);
    const kill = (state, ids) => ids.reduce((acc, id) => engine.eliminatePlayer(acc, id), state);
    check('(f) brak wampirów → mieszkańcy', engine.checkWin(kill(s, ['p1', 'p8'])) === engine.WINNERS.villagers);
    check('(f) wampirów tyle co pozostałych → wampiry',
      engine.checkWin(kill(s, ['p2', 'p4', 'p6', 'p7'])) === engine.WINNERS.sect, '2 wampiry vs uczeń i komendant');
    check('(f) przewaga mieszkańców → gra trwa', engine.checkWin(kill(s, ['p6'])) === null);
  }

  console.table(results);
  const failed = results.filter((row) => row.wynik !== 'OK').length;
  console.log(failed === 0 ? 'WYNIK: OK' : `WYNIK: BŁĘDY (${failed})`);
  return results;
})();
