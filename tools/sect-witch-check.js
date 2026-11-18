/*
 * Sprawdzenie roli Wiedźma w grze „Wampir” (historyczne id: sect).
 *
 * W przeglądarce: otwórz aplikację (strona z index.html), konsola (F12),
 * wklej CAŁĄ zawartość tego pliku i naciśnij Enter. Wynik pojawi się w tabeli.
 *
 * W Node (z katalogu projektu):
 *   node -e "globalThis.__SECT_BASE__ = require('url').pathToFileURL('www/').href; require('./tools/sect-witch-check.js')"
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

  // 12 osób: p1, p2 wampiry; p3 znachor; p4 uczeń; p5 wiedźma; p6 łowca; p7–p12 mieszkańcy
  const ROLES12 = [R.sect, R.sect, R.doctor, R.apprentice, R.witch, R.detective,
    R.villager, R.villager, R.villager, R.villager, R.villager, R.villager];

  function makeState() {
    const names = ROLES12.map((_, index) => `Gracz ${index + 1}`);
    const fresh = engine.createGameState({ playerNames: names, roleConfig: config.defaultRoleConfig(12) });
    return { ...fresh, players: fresh.players.map((player, index) => ({ ...player, roleId: ROLES12[index] })) };
  }

  /** Noc jak w grze: numer nocy, wybory wampirów i znachora, potem wybór wiedźmy, rozstrzygnięcie. */
  function playNight(state, { sect, doctor = null, heal = false, poison = null }) {
    const started = {
      ...state,
      nightNumber: state.nightNumber + 1,
      nightChoices: { ...engine.createEmptyNightChoices(), sectTargetId: sect, doctorTargetId: doctor },
    };
    const witch = engine.applyWitchChoice(started, { heal, poisonTargetId: poison });
    return { witch, state: engine.resolveNight(witch.ok ? witch.state : started) };
  }

  const alive = (state, id) => engine.getPlayerById(state, id).alive;
  const last = (state) => state.nightLog[state.nightLog.length - 1];

  // (a) uleczenie ofiary — nikt nie ginie
  {
    const { witch, state } = playNight(makeState(), { sect: 'p7', doctor: 'p8', heal: true });
    check('(a) uleczenie ofiary → nikt nie ginie',
      witch.ok && alive(state, 'p7') && last(state).victimIds.length === 0 && last(state).savedBy === 'witch',
      `savedBy: ${last(state).savedBy}, ofiary: ${last(state).victimIds.length}`);
    check('(a) mikstura uleczenia zużyta, trucizna nadal dostępna',
      state.witchPotions.heal === false && state.witchPotions.poison === true,
      JSON.stringify(state.witchPotions));
  }

  // (b) ofiara wampirów + otrucie — giną dwie osoby
  {
    const { state } = playNight(makeState(), { sect: 'p7', doctor: 'p8', poison: 'p9' });
    const ids = last(state).victimIds;
    check('(b) ofiara + otrucie → giną dwie osoby',
      ids.length === 2 && !alive(state, 'p7') && !alive(state, 'p9'), ids.join(', '));
    const texts = script.getMorningTexts({
      victims: ids.map((id) => ({ name: engine.getPlayerById(state, id).name, roleName: 'x' })),
    });
    check('(b) poranek: ogłoszenie dla dwóch osób (klucz victimsSay)',
      texts.say !== script.getMorningTexts({ victims: [{ name: 'A', roleName: 'x' }] }).say, texts.say);
    const same = playNight(makeState(), { sect: 'p7', poison: 'p7' });
    check('(b) ofiara i otruta to ta sama osoba → ginie jedna osoba',
      last(same.state).victimIds.length === 1, last(same.state).victimIds.join(', '));
  }

  // (c) ochrona znachora + uleczenie wiedźmy — mikstura zużyta
  {
    const { witch, state } = playNight(makeState(), { sect: 'p7', doctor: 'p7', heal: true });
    check('(c) znachor + uleczenie → nikt nie ginie, mikstura zużyta bez skutku',
      witch.ok && alive(state, 'p7') && last(state).savedBy === 'both' && state.witchPotions.heal === false,
      `savedBy: ${last(state).savedBy}, uleczenie: ${state.witchPotions.heal}`);
  }

  // (d) ochrona znachora nie chroni przed trucizną
  {
    const { state } = playNight(makeState(), { sect: 'p7', doctor: 'p9', poison: 'p9' });
    check('(d) chroniona przez znachora, ale otruta → ginie',
      !alive(state, 'p9') && !alive(state, 'p7'), last(state).victimIds.join(', '));
  }

  // (e) druga próba użycia tej samej mikstury jest niemożliwa
  {
    const night1 = playNight(makeState(), { sect: 'p7', heal: true, poison: 'p8' }).state;
    const night2 = {
      ...night1,
      nightNumber: 2,
      nightChoices: { ...engine.createEmptyNightChoices(), sectTargetId: 'p9' },
    };
    const heal2 = engine.applyWitchChoice(night2, { heal: true });
    const poison2 = engine.applyWitchChoice(night2, { poisonTargetId: 'p10' });
    check('(e) drugie uleczenie w kolejnej nocy → odmowa',
      !heal2.ok && heal2.error === engine.WITCH_ERRORS.healUsed, heal2.error);
    check('(e) drugie otrucie w kolejnej nocy → odmowa',
      !poison2.ok && poison2.error === engine.WITCH_ERRORS.poisonUsed, poison2.error);
    const fresh = { ...makeState(), nightNumber: 1, nightChoices: { ...engine.createEmptyNightChoices(), sectTargetId: 'p7' } };
    const once = engine.applyWitchChoice(fresh, { heal: true });
    const twice = engine.applyWitchChoice(once.state, { heal: true });
    check('(e) drugie uleczenie tej samej nocy → odmowa', !twice.ok && twice.error === engine.WITCH_ERRORS.healUsed, twice.error);
    const self = engine.applyWitchChoice(fresh, { poisonTargetId: 'p5' });
    check('(e) wiedźma nie może otruć siebie', !self.ok && self.error === engine.WITCH_ERRORS.invalidPoisonTarget, self.error);
    check('(e) obie mikstury zużyte → krok wiedźmy jest atrapą', engine.isWitchActive(night1) === false);
  }

  // (f) wiedźma martwa — krok atrapą
  {
    const dead = engine.eliminatePlayer(makeState(), 'p5');
    const steps = script.createNightSteps({
      nightNumber: 2, doctorAlive: true, detectiveAlive: true,
      witchInGame: true, witchActive: engine.isWitchActive(dead),
    });
    const witchStep = steps.find((step) => step.id === 'witch');
    const ids = steps.map((step) => step.id);
    check('(f) martwa wiedźma → krok bez wyboru (atrapa)',
      engine.isWitchActive(dead) === false && witchStep && witchStep.pick === null);
    check('(f) kolejność kroków: znachor → wiedźma → łowca',
      ids.indexOf('doctor-close') < ids.indexOf('witch') && ids.indexOf('witch-close') < ids.indexOf('detective'),
      ids.join(' > '));
    const refused = engine.applyWitchChoice(
      { ...dead, nightNumber: 2, nightChoices: { ...engine.createEmptyNightChoices(), sectTargetId: 'p7' } },
      { heal: true },
    );
    check('(f) martwa wiedźma nie może użyć mikstury', !refused.ok && refused.error === engine.WITCH_ERRORS.witchDead, refused.error);
  }

  // (g) znachor otruty — uczeń przejmuje moc od następnej nocy
  {
    const { state } = playNight(makeState(), { sect: 'p7', doctor: 'p8', poison: 'p3' });
    const nextActor = engine.getHealerActor({ ...state, nightNumber: state.nightNumber + 1 });
    check('(g) znachor otruty → uczeń ma moc od następnej nocy',
      !alive(state, 'p3') && state.healerInheritance?.fromNight === 2 && nextActor?.id === 'p4',
      `przejęcie od nocy ${state.healerInheritance?.fromNight}, moc ma: ${nextActor?.id}`);
    check('(g) po rozstrzygnięciu sprawdzana jest wygrana (gra trwa)', engine.checkWin(state) === null);
  }

  console.table(results);
  const failed = results.filter((row) => row.wynik !== 'OK').length;
  console.log(failed === 0 ? 'WYNIK: OK' : `WYNIK: BŁĘDY (${failed})`);
  return results;
})();
