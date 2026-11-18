/**
 * Kopiuje runtime @capacitor/core (moduł ES bez importów) do www/js/vendor/native-bridge.js.
 *
 * Po co: aplikacja nie ma bundlera, a wtyczki Capacitora (App, Haptics, KeepAwake)
 * wymagają registerPlugin() z @capacitor/core. Ten jeden plik daje registerPlugin
 * i Capacitor.isNativePlatform() bez bundlowania całej aplikacji.
 *
 * Uruchom po każdej aktualizacji @capacitor/core (z katalogu projektu):
 *   node tools/update-native-bridge.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('node_modules/@capacitor/core/package.json', root), 'utf8'));
const source = readFileSync(new URL('node_modules/@capacitor/core/dist/index.js', root), 'utf8')
  // Bez odnośnika do mapy źródeł (plik .map nie jest kopiowany).
  .replace(/\n\/\/# sourceMappingURL=.*\s*$/, '\n');

if (/^\s*import\s/m.test(source)) {
  throw new Error('@capacitor/core/dist/index.js ma importy — kopiowanie jednego pliku już nie wystarczy.');
}

const header = `/*
 * @capacitor/core ${pkg.version} — skopiowane bez zmian z node_modules/@capacitor/core/dist/index.js
 * przez tools/update-native-bridge.mjs. Nie edytuj ręcznie.
 * Licencja: ${pkg.license} (c) Ionic / Capacitor — https://github.com/ionic-team/capacitor
 */
`;

writeFileSync(new URL('www/js/vendor/native-bridge.js', root), header + source);
console.log(`www/js/vendor/native-bridge.js: @capacitor/core ${pkg.version}, ${source.length} znaków`);
