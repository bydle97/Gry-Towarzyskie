/*
 * Sytuacje brzegowe gry „Wampir” (historyczne id: sect) z udziałem nowych ról.
 *
 * W przeglądarce: otwórz aplikację (strona z index.html), konsola (F12),
 * wklej CAŁĄ zawartość tego pliku i naciśnij Enter. Wynik pojawi się w tabeli.
 *
 * W Node (z katalogu projektu):
 *   node -e "globalThis.__SECT_BASE__ = require('url').pathToFileURL('www/').href; require('./tools/sect-edge-cases-check.js')"
 *
 * Skrypt tylko czyta moduły gry i liczy w pamięci — niczego nie zapisuje.
 */
(async () => {
  const base = globalThis.__SECT_BASE__ ?? document.baseURI;
  const engine = await import(new URL('js/games/sect/engine.js', base).href);
  const config = await import(new URL('js/games/sect/config.js', base).href);
  const script = await import(new URL('js/games/sect/script.js', base).href);
  const R = config.ROLE_IDS;
  const results = [];

  const check = (test, ok, details = '') => {
    results.push({ test, wynik: ok ? 'OK' : 'BŁĄD', szczegóły: details });
  };

  // 12 osób: p1, p2 wampiry; p3 znachor; p4 uczeń; p5 wiedźma; p6 łowca; p7 komendant; p8–p12 mieszkańcy
  const ROLES12 = [R.sect, R.sect, R.doctor, R.apprentice, R.witch, R.detective, R.commander,
    R.villager, R.villager, R.villager, R.villager, R.villager];

  function makeState() {
    const names = ROLES12.map((_, index) => `Gracz ${index + 1}`);
    const fresh = engine.createGameState({ playerNames: names, roleConfig: config.defaultRoleConfig(12) });
    return { ...fresh, players: fresh.players.map((player, index) => ({ ...player, roleId: ROLES12[index] })) };
  }

  function playNight(state, { sect, doctor = null, heal = false, poison = null }) {
    const started = {
      ...state,
      nightNumber: state.nightNumber + 1,
      nightChoices: { ...engine.createEmptyNightChoices(), sectTargetId: sect, doctorTargetId: doctor },
    };
    const witch = engine.applyWitchChoice(started, { heal, poisonTargetId: poison });
    return engine.resolveNight(witch.ok ? witch.state : started);
  }

  const kill = (state, ids) => ids.reduce((acc, id) => engine.eliminatePlayer(acc, id), state);
  const alive = (state, id) => engine.getPlayerById(state, id).alive;
  const last = (state) => state.nightLog[state.nightLog.length - 1];

  // 1. Znachor chroni i wiedźma leczy tę samą osobę (ofiarę wampirów)
  {
    const s = playNight(makeState(), { sect: 'p8', doctor: 'p8', heal: true });
    check('1. znachor i wiedźma ratują tę samą osobę → nikt nie ginie, uleczenie zużyte',
      alive(s, 'p8') && last(s).savedBy === 'both' && s.witchPotions.heal === false,
      `savedBy: ${last(s).savedBy}`);
  }

  // 2. Wiedźma truje komendanta
  {
    const s = playNight(makeState(), { sect: 'p8', doctor: 'p9', poison: 'p7' });
    check('2. otruty komendant ginie i traci moc przejęcia głosowania',
      !alive(s, 'p7') && engine.getCommanderBlocker(s) === engine.COMMANDER_ERRORS.commanderDead,
      `ofiary: ${last(s).victimIds.join(', ')}; komendant: ${engine.getCommanderBlocker(s)}`);
  }

  // 3a. Ofiara wampirów to ostatni żywy wampir (wampiry mogą wskazać swojego)
  {
    const oneVampire = kill(makeState(), ['p2']);
    const s = playNight(oneVampire, { sect: 'p1', doctor: 'p9' });
    check('3a. wampiry atakują ostatniego wampira → rano wygrywają mieszkańcy',
      !alive(s, 'p1') && engine.checkWin(s) === engine.WINNERS.villagers, String(engine.checkWin(s)));
  }

  // 3b. Ofiara wampirów to ostatnia osoba, której brakowało do przewagi dobra
  {
    // Żyją: p1, p2 (wampiry), p3, p8, p9 → noc: ginie p9 → 2 vs 2 → wampiry
    const near = kill(makeState(), ['p4', 'p5', 'p6', 'p7', 'p10', 'p11', 'p12']);
    const s = playNight(near, { sect: 'p9', doctor: 'p8' });
    check('3b. śmierć ofiary daje przewagę wampirom → rano wygrywają wampiry',
      engine.checkWin(s) === engine.WINNERS.sect, String(engine.checkWin(s)));
  }

  // 4. Wygrana po porannej śmierci dwóch osób
  {
    // Żyją: p1, p2, p5 (wiedźma), p8, p9, p10 → ofiara p8 + otrucie p9 → 2 vs 2 → wampiry
    const before = kill(makeState(), ['p3', 'p4', 'p6', 'p7', 'p11', 'p12']);
    const s = playNight(before, { sect: 'p8', poison: 'p9' });
    check('4a. dwie śmierci w nocy dają przewagę → wygrywają wampiry',
      last(s).victimIds.length === 2 && engine.checkWin(s) === engine.WINNERS.sect,
      `ofiary: ${last(s).victimIds.join(', ')}, wynik: ${engine.checkWin(s)}`);
    // Jeden wampir żyje (p1); wiedźma truje p1, wampiry zabijają p8 → brak wampirów → mieszkańcy
    const oneVampire = kill(makeState(), ['p2']);
    const s2 = playNight(oneVampire, { sect: 'p8', doctor: 'p9', poison: 'p1' });
    check('4b. trucizna zabija ostatniego wampira (druga śmierć to ofiara) → wygrywają mieszkańcy',
      last(s2).victimIds.length === 2 && engine.checkWin(s2) === engine.WINNERS.villagers,
      `ofiary: ${last(s2).victimIds.join(', ')}, wynik: ${engine.checkWin(s2)}`);
  }

  // 5. Nocny krok martwej wiedźmy
  {
    const dead = kill(makeState(), ['p5']);
    const steps = script.createNightSteps({
      nightNumber: 2, doctorAlive: true, detectiveAlive: true,
      witchInGame: true, witchActive: engine.isWitchActive(dead),
    });
    const witchStep = steps.find((step) => step.id === 'witch');
    const s = playNight(dead, { sect: 'p8', doctor: 'p9', heal: true });
    check('5. martwa wiedźma: krok-atrapa bez wyboru, mikstury nietknięte, ofiara ginie',
      witchStep?.pick === null && s.witchPotions.heal === true && !alive(s, 'p8'),
      `pick: ${witchStep?.pick}, mikstury: ${JSON.stringify(s.witchPotions)}`);
  }

  // 6. „Nowe role” po partii z użytymi mocami
  {
    let s = playNight(makeState(), { sect: 'p3', doctor: 'p9', heal: false, poison: 'p10' });
    s = engine.commanderTakeOver(s, 'p1').state;
    const restarted = engine.restartGame(s);
    const counts = (state) => Object.fromEntries(
      Object.values(R).map((roleId) => [roleId, state.players.filter((p) => p.roleId === roleId).length]),
    );
    const before = counts(engine.createGameState({ playerNames: s.players.map((p) => p.name), roleConfig: s.roleConfig }));
    const after = counts(restarted);
    check('6. „Nowe role”: ten sam skład (konfiguracja zapamiętana)',
      JSON.stringify(before) === JSON.stringify(after), JSON.stringify(after));
    check('6. „Nowe role”: mikstury, przejęcie mocy znachora, komendant i dzienniki wyzerowane',
      restarted.witchPotions.heal && restarted.witchPotions.poison && restarted.healerInheritance === null
        && restarted.commanderTakeover === null && restarted.nightLog.length === 0 && restarted.dayLog.length === 0
        && restarted.players.every((p) => p.alive && !p.roleChecked));
  }

  console.table(results);
  const failed = results.filter((row) => row.wynik !== 'OK').length;
  console.log(failed === 0 ? 'WYNIK: OK' : `WYNIK: BŁĘDY (${failed})`);
  return results;
})();
