/*
 * Sprawdzenie konfiguracji ról gry „Wampir” (historyczne id: sect):
 * defaultRoleConfig() i validateRoleConfig().
 *
 * W przeglądarce: otwórz aplikację (strona z index.html), konsola (F12),
 * wklej CAŁĄ zawartość tego pliku i naciśnij Enter. Wynik pojawi się w tabelach.
 *
 * W Node (z katalogu projektu):
 *   node -e "globalThis.__SECT_BASE__ = require('url').pathToFileURL('www/').href; require('./tools/sect-roles-check.js')"
 *
 * Skrypt tylko czyta moduły gry i liczy w pamięci — niczego nie zapisuje.
 */
(async () => {
  const base = globalThis.__SECT_BASE__ ?? document.baseURI;
  const engine = await import(new URL('js/games/sect/engine.js', base).href);
  const config = await import(new URL('js/games/sect/config.js', base).href);

  const codes = (list) => list.map((issue) => issue.code).join(', ') || '—';
  const enabledRoles = (cfg) =>
    config.ROLE_CONFIG_KEYS.filter((key) => cfg[key]).join(', ') || '—';

  // 1. Domyślne konfiguracje
  const defaults = [5, 7, 8, 12, 20].map((n) => {
    const cfg = config.defaultRoleConfig(n);
    const result = engine.validateRoleConfig(n, cfg);
    return {
      N: n,
      wampiry: cfg.vampires,
      role: enabledRoles(cfg),
      mieszkańcy: engine.countVillagers(n, cfg),
      ok: result.ok,
      błędy: codes(result.errors),
      ostrzeżenia: codes(result.warnings),
      'rozdanych ról': engine.buildRoleList(n, cfg).length,
    };
  });
  console.log('defaultRoleConfig + validateRoleConfig');
  console.table(defaults);

  // 2. Przypadki błędów (i jeden z samym ostrzeżeniem)
  const cases = [
    ['3 wampiry przy 5 graczach', 5, { ...config.defaultRoleConfig(5), vampires: 3 }, 'vampireMajority'],
    ['uczeń bez znachora (8 graczy)', 8, { ...config.defaultRoleConfig(8), znachor: false, uczen: true }, 'apprenticeWithoutHealer'],
    ['suma ról > N (2 wampiry + 4 role przy 5)', 5, { vampires: 2, znachor: true, uczen: true, lowca: true, komendant: true }, 'tooManyRoles'],
    ['0 wampirów', 8, { ...config.defaultRoleConfig(8), vampires: 0 }, 'noVampires'],
    ['hrabia przy 1 wampirze', 7, { ...config.defaultRoleConfig(7), hrabia: true }, 'countNeedsVampires'],
  ].map(([name, n, cfg, expected]) => {
    const result = engine.validateRoleConfig(n, cfg);
    const found = result.errors.some((issue) => issue.code === expected);
    return {
      przypadek: name,
      ok: result.ok,
      błędy: codes(result.errors),
      ostrzeżenia: codes(result.warnings),
      oczekiwany: expected,
      wynik: !result.ok && found ? 'OK' : 'BŁĄD',
    };
  });
  console.log('Przypadki błędów');
  console.table(cases);

  // 3. Automatyczne wyłączenie przełącznika łamiącego regułę
  const normalized = engine.normalizeRoleConfig(8, { ...config.defaultRoleConfig(8), znachor: false });
  const autoOff = normalized.config.uczen === false && normalized.notes.includes('apprenticeOff');
  console.log('normalizeRoleConfig: uczeń bez znachora wyłączony automatycznie:', autoOff ? 'OK' : 'BŁĄD', normalized.notes);

  // 4. Ostrzeżenia
  const warnCase = engine.validateRoleConfig(9, { ...config.defaultRoleConfig(9), vampires: 4 });
  console.log('9 graczy, 4 wampiry → ok:', warnCase.ok, '| ostrzeżenia:', codes(warnCase.warnings));

  const failed =
    cases.filter((row) => row.wynik !== 'OK').length
    + defaults.filter((row) => !row.ok || row['rozdanych ról'] !== row.N).length
    + (autoOff ? 0 : 1);
  console.log(failed === 0 ? 'WYNIK: OK' : `WYNIK: BŁĘDY (${failed})`);
  return { defaults, cases };
})();
