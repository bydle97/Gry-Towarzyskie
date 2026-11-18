/**
 * Renderuje własną ikonę aplikacji (assets/src/*.svg) do plików PNG, z których
 * @capacitor/assets generuje ikony i ekrany startowe Androida.
 *
 * Uruchomienie z katalogu projektu:
 *   node tools/render-icons.mjs
 *   npx capacitor-assets generate --android --iconBackgroundColor "#0d1120" --iconBackgroundColorDark "#0d1120" --splashBackgroundColor "#0d1120" --splashBackgroundColorDark "#0d1120"
 *
 * sharp jest zależnością @capacitor/assets (devDependencies), w www/ nic nie dochodzi.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = new URL('../', import.meta.url);
const read = (name) => readFileSync(new URL(`assets/src/${name}`, root));
const out = (name) => fileURLToPath(new URL(`assets/${name}`, root));

const foreground = read('icon-foreground.svg');
const background = read('icon-background.svg');

// Ikona adaptacyjna: osobno pierwszy plan (przezroczysty) i tło.
await sharp(foreground, { density: 144 }).resize(1024, 1024).png().toFile(out('icon-foreground.png'));
await sharp(background, { density: 144 }).resize(1024, 1024).png().toFile(out('icon-background.png'));

// Ikona „legacy” (starsze Androidy): tło + pierwszy plan w jednym obrazku.
const fgPng = await sharp(foreground, { density: 144 }).resize(1024, 1024).png().toBuffer();
await sharp(background, { density: 144 }).resize(1024, 1024)
  .composite([{ input: fgPng }]).png().toFile(out('icon-only.png'));

// Ekran startowy: ciemne tło aplikacji, ikona na środku (bez białego błysku).
const SPLASH = 2732;
const logo = await sharp(foreground, { density: 144 }).resize(900, 900).png().toBuffer();
for (const name of ['splash.png', 'splash-dark.png']) {
  await sharp({ create: { width: SPLASH, height: SPLASH, channels: 4, background: '#0d1120' } })
    .composite([{ input: logo, gravity: 'center' }]).png().toFile(out(name));
}
console.log('assets/*.png gotowe');
