/**
 * Zbiorczy test silnika gry „Wampir” (historyczne id: sect) — czysty Node, bez zależności.
 *
 * Uruchomienie z katalogu projektu:
 *   node tools/test-vampire.mjs          (krótki raport)
 *   node tools/test-vampire.mjs --verbose (także tabele ze skryptów szczegółowych)
 *
 * Co sprawdza:
 *  1. Uruchamia skrypty szczegółowe tools/sect-*.js (te same, które można wkleić
 *     do konsoli przeglądarki) i zbiera ich werdykty „WYNIK: OK / BŁĘDY”:
 *     znachor chroni ofiarę; znachor ginie → uczeń od następnej nocy; obaj martwi →
 *     atrapa; komendant raz przejmuje głosowanie; łowca sprawdza Hrabiego → „nie
 *     wampir”; wiedźma leczy, truje, dwie ofiary, mikstura zużyta bez skutku, brak
 *     drugiego użycia; warunek wygranej ze sługą; przypadki błędów konfiguracji ról.
 *  2. Własne sprawdzenia domyślnych ról dla N = 5, 7, 8, 10, 12, 20 względem progów
 *     z docs/ZADANIA-NOC.md (3d) oraz kilka przypadków brzegowych.
 *
 * Kod wyjścia: 0 = wszystko w porządku, 1 = znaleziono błąd.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const verbose = process.argv.includes('--verbose');

globalThis.__SECT_BASE__ = new URL('www/', ROOT).href;

const engine = await import(new URL('www/js/games/sect/engine.js', ROOT).href);
const config = await import(new URL('www/js/games/sect/config.js', ROOT).href);

let failures = 0;
const report = (name, ok, details = '') => {
  if (!ok) {
    failures += 1;
  }
  console.log(`${ok ? 'OK   ' : 'BŁĄD '} ${name}${details ? ` — ${details}` : ''}`);
};

// --- 1. Skrypty szczegółowe tools/sect-*.js ---------------------------------
const toolsDir = fileURLToPath(new URL('tools/', ROOT));
const detailScripts = readdirSync(toolsDir).filter((name) => /^sect-.*\.js$/.test(name)).sort();

for (const name of detailScripts) {
  const lines = [];
  const original = { log: console.log, table: console.table, warn: console.warn };
  // W Node tłumaczenia nie są wczytane: ostrzeżenia i18n o brakujących kluczach pomijamy.
  console.warn = verbose ? original.warn : () => {};
  console.log = (...args) => lines.push(args.map(String).join(' '));
  console.table = (rows) => {
    // Wiersz z polem „wynik” różnym od „OK” to błąd (zostaje w raporcie).
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row && 'wynik' in row && row.wynik !== 'OK') {
        lines.push(`  ✗ ${row.test ?? row.przypadek ?? JSON.stringify(row)}: ${row.szczegóły ?? ''}`);
      }
    }
    if (verbose) {
      original.table(rows);
    }
  };
  try {
    // Skrypty to wyrażenie (async () => {...})(); — eval zwraca jego obietnicę.
    const source = readFileSync(new URL(name, pathToFileURL(toolsDir + '/')), 'utf8');
    await (0, eval)(source);
  } catch (error) {
    lines.push(`WYNIK: BŁĘDY (wyjątek: ${error.message})`);
  } finally {
    console.log = original.log;
    console.table = original.table;
    console.warn = original.warn;
  }
  const verdict = lines.find((line) => line.startsWith('WYNIK:')) ?? 'WYNIK: brak werdyktu';
  report(`tools/${name}`, verdict === 'WYNIK: OK', verdict === 'WYNIK: OK' ? '' : verdict);
  for (const line of lines.filter((l) => l.startsWith('  ✗') || verbose)) {
    console.log(line);
  }
}

// --- 2. Domyślne role według progów z zadania 3d -----------------------------
// wampirów: 5–7 → 1, 8–11 → 2, 12–15 → 3, 16–20 → 4; znachor i łowca zawsze;
// komendant od 7, uczeń od 8, Hrabia i sługa od 10, wiedźma od 12.
const expectedDefaults = (n) => ({
  vampires: n <= 7 ? 1 : n <= 11 ? 2 : n <= 15 ? 3 : 4,
  znachor: true,
  lowca: true,
  komendant: n >= 7,
  uczen: n >= 8,
  hrabia: n >= 10,
  sluga: n >= 10,
  wiedzma: n >= 12,
});

for (const n of [5, 7, 8, 10, 12, 20]) {
  const cfg = config.defaultRoleConfig(n);
  const expected = expectedDefaults(n);
  const mismatches = Object.entries(expected)
    .filter(([key, value]) => Boolean(cfg[key]) !== Boolean(value) && cfg[key] !== value)
    .map(([key, value]) => `${key}: jest ${cfg[key]}, oczekiwane ${value}`);
  const validation = engine.validateRoleConfig(n, cfg);
  const roles = engine.buildRoleList(n, cfg);
  const vampiresDealt = roles.filter((roleId) => roleId === config.ROLE_IDS.sect || roleId === config.ROLE_IDS.count).length;
  report(
    `domyślne role N=${n}`,
    mismatches.length === 0 && validation.ok && roles.length === n && vampiresDealt === expected.vampires,
    [...mismatches, validation.ok ? '' : `błędy: ${validation.errors.map((e) => e.code)}`, `rozdane: ${roles.length}, wampirów: ${vampiresDealt}`]
      .filter(Boolean)
      .join('; '),
  );
}

// --- 3. Przypadki brzegowe ---------------------------------------------------
{
  // Hrabia zajmuje miejsce z puli wampirów (nie dodaje wampira).
  const cfg = { ...config.defaultRoleConfig(10), vampires: 2, hrabia: true };
  const roles = engine.buildRoleList(10, cfg);
  const count = roles.filter((r) => r === config.ROLE_IDS.count).length;
  const plain = roles.filter((r) => r === config.ROLE_IDS.sect).length;
  report('Hrabia to jeden z wampirów (2 wampiry = 1 Hrabia + 1 zwykły)', count === 1 && plain === 1, `hrabia ${count}, zwykłe ${plain}`);
}
{
  // Wampiry z przewagą od startu: 2 wampiry przy 4 pozostałych jest OK, 3 przy 3 — błąd.
  const ok = engine.validateRoleConfig(6, { ...config.defaultRoleConfig(6), vampires: 2 });
  const bad = engine.validateRoleConfig(6, { ...config.defaultRoleConfig(6), vampires: 3 });
  report('przewaga wampirów od startu blokuje start', ok.ok && !bad.ok && bad.errors.some((e) => e.code === 'vampireMajority'));
}
{
  // Ostrzeżenie: więcej niż 1/3 wampirów (nie blokuje).
  const result = engine.validateRoleConfig(9, { ...config.defaultRoleConfig(9), vampires: 4 });
  report('ponad 1/3 wampirów → ostrzeżenie, nie błąd', result.ok && result.warnings.some((w) => w.code === 'manyVampires'));
}

console.log(failures === 0 ? '\nWYNIK: OK' : `\nWYNIK: BŁĘDY (${failures})`);
process.exit(failures === 0 ? 0 : 1);
