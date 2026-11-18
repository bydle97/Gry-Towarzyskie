/*
 * Sprawdzenie ról Hrabia i Sługa w grze „Wampir” (historyczne id: sect).
 *
 * W przeglądarce: otwórz aplikację (strona z index.html), konsola (F12),
 * wklej CAŁĄ zawartość tego pliku i naciśnij Enter. Wynik pojawi się w tabeli.
 *
 * W Node (z katalogu projektu):
 *   node -e "globalThis.__SECT_BASE__ = require('url').pathToFileURL('www/').href; require('./tools/sect-count-servant-check.js')"
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

  /** Stan partii z ustalonymi rolami: p1 = roles[0], p2 = roles[1], ... */
  function makeState(roles) {
    const names = roles.map((_, index) => `Gracz ${index + 1}`);
    const fresh = engine.createGameState({ playerNames: names, roleConfig: config.defaultRoleConfig(10) });
    return { ...fresh, players: fresh.players.map((player, index) => ({ ...player, roleId: roles[index] })) };
  }
  const kill = (state, ids) => ids.reduce((acc, id) => engine.eliminatePlayer(acc, id), state);

  // 10 osób: p1 wampir, p2 hrabia, p3 sługa, p4 znachor, p5 uczeń, p6 łowca, p7 komendant, p8–p10 mieszkańcy
  const ROLES10 = [R.sect, R.count, R.servant, R.doctor, R.apprentice, R.detective, R.commander,
    R.villager, R.villager, R.villager];

  // (a) łowca sprawdza hrabiego → „nie wampir”, a mistrz gry widzi zafałszowanie
  {
    const s = makeState(ROLES10);
    check('(a) łowca sprawdza hrabiego → „nie wampir”',
      engine.getDetectiveResultFor(s, 'p2') === 'notSect' && engine.isDetectionFaked(s, 'p2'),
      `wynik: ${engine.getDetectiveResultFor(s, 'p2')}, zafałszowany: ${engine.isDetectionFaked(s, 'p2')}`);
    check('(a) łowca sprawdza zwykłego wampira → „wampir”, bez zafałszowania',
      engine.getDetectiveResultFor(s, 'p1') === 'sect' && !engine.isDetectionFaked(s, 'p1'));
    check('(a) łowca sprawdza sługę → „nie wampir” (prawdziwy wynik)',
      engine.getDetectiveResultFor(s, 'p3') === 'notSect' && !engine.isDetectionFaked(s, 'p3'));
    const night = engine.resolveNight({
      ...s,
      nightNumber: 1,
      nightChoices: { ...engine.createEmptyNightChoices(), sectTargetId: 'p8', doctorTargetId: 'p9',
        detectiveTargetId: 'p2', detectiveResult: 'notSect', detectiveFaked: true },
    });
    check('(a) dziennik nocy zapamiętuje zafałszowanie', night.nightLog[0].detectiveFaked === true);
    check('(a) rola zmarłego hrabiego: „Hrabia (wampir)”',
      config.getRoleRevealName(R.count) !== config.ROLES[R.count].name, config.getRoleRevealName(R.count));
  }

  // (b) skład wygranej z hrabią i sługą
  {
    const s = makeState(ROLES10);
    const onlyCount = kill(s, ['p1']);
    check('(b) zwykły wampir martwy, hrabia żyje → gra trwa (hrabia jest wampirem)',
      engine.checkWin(onlyCount) === null, String(engine.checkWin(onlyCount)));
    const noVampires = kill(s, ['p1', 'p2']);
    check('(b) brak żywych wampirów → mieszkańcy, nawet gdy sługa żyje',
      engine.checkWin(noVampires) === engine.WINNERS.villagers);
    // Zostają p1, p2 (wampiry), p3 (sługa), p4 (znachor): 2 wampiry vs 2 pozostałych → wampiry
    const parity = kill(s, ['p5', 'p6', 'p7', 'p8', 'p9', 'p10']);
    check('(b) 2 wampiry vs sługa + 1 → wampiry (sługa liczy się jako zwykły gracz)',
      engine.checkWin(parity) === engine.WINNERS.sect);
    // Zostają p1, p2, p3, p4, p8: 2 wampiry vs 3 (sługa nie jest wampirem) → gra trwa
    const notYet = kill(s, ['p5', 'p6', 'p7', 'p9', 'p10']);
    check('(b) 2 wampiry vs sługa + 2 → gra trwa', engine.checkWin(notYet) === null);
  }

  // (c) ekran końcowy wygranej wampirów wymienia sługę
  {
    const s = makeState(ROLES10);
    const parity = kill(s, ['p5', 'p6', 'p7', 'p8', 'p9', 'p10']);
    const outcome = engine.getWinnerOutcome(parity);
    check('(c) wygrana wampirów ze sługą → „sectWithServant”', outcome === 'sectWithServant', outcome);
    const withoutServant = makeState(ROLES10.map((role) => (role === R.servant ? R.villager : role)));
    const outcome2 = engine.getWinnerOutcome(kill(withoutServant, ['p5', 'p6', 'p7', 'p8', 'p9', 'p10']));
    check('(c) bez sługi → zwykła wygrana wampirów', outcome2 === 'sect', outcome2);
    check('(c) teksty wygranej są różne (klucze finish.sect i finish.sectWithServant)',
      script.FINISH_TEXTS.sect !== script.FINISH_TEXTS.sectWithServant);
  }

  // (d) walidacja hrabiego przy 1 wampirze, skład z hrabią
  {
    const one = engine.validateRoleConfig(10, { ...config.defaultRoleConfig(10), vampires: 1, hrabia: true });
    check('(d) hrabia przy 1 wampirze → błąd countNeedsVampires',
      !one.ok && one.errors.some((issue) => issue.code === 'countNeedsVampires'),
      one.errors.map((issue) => issue.code).join(', '));
    const normalized = engine.normalizeRoleConfig(10, { ...config.defaultRoleConfig(10), vampires: 1, hrabia: true });
    check('(d) normalizacja wyłącza hrabiego przy 1 wampirze',
      normalized.config.hrabia === false && normalized.notes.includes('countOff'));
    const list = engine.buildRoleList(10, config.defaultRoleConfig(10));
    const vampires = list.filter((roleId) => roleId === R.sect || roleId === R.count).length;
    check('(d) 10 graczy, domyślnie: hrabia zajmuje miejsce wampira (2 wampiry w tym hrabia)',
      vampires === 2 && list.includes(R.count) && list.includes(R.servant) && list.length === 10,
      list.join(' '));
    const steps = script.createNightSteps({ nightNumber: 1, doctorAlive: true, detectiveAlive: true, servantMeets: true });
    const ids = steps.map((step) => step.id);
    check('(d) pierwsza noc: sługa po zamknięciu oczu przez wampiry',
      ids.indexOf('servant-open') === ids.indexOf('sect-close') + 1, ids.join(' > '));
  }

  console.table(results);
  const failed = results.filter((row) => row.wynik !== 'OK').length;
  console.log(failed === 0 ? 'WYNIK: OK' : `WYNIK: BŁĘDY (${failed})`);
  return results;
})();
