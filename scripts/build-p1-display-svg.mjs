/**
 * LCD-only SVG: display segments from TamagotchiP1.svg (driven by VRAM like BrickEmuPy).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'public', 'tamagotchi', 'assets');
const sourcePath = join(assetsDir, 'TamagotchiP1.svg');
const displayPath = join(assetsDir, 'TamagotchiP1-display.svg');

const LCD = { x: 173.504, y: 369.974, w: 352, h: 176 };

const svg = readFileSync(sourcePath, 'utf8');
const displayStart = svg.indexOf('<g id="display">');
const displayEnd = svg.indexOf('<defs>', displayStart);
if (displayStart === -1 || displayEnd === -1) {
  throw new Error('TamagotchiP1.svg is missing display group');
}

let displayInner = svg.slice(displayStart, displayEnd);
displayInner = displayInner.replace(
  '<g id="display">',
  '<g id="display" fill="#1a1a1a">',
);

const displaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LCD.x} ${LCD.y} ${LCD.w} ${LCD.h}">
<rect x="${LCD.x}" y="${LCD.y}" width="${LCD.w}" height="${LCD.h}" fill="#fffbc6"/>
${displayInner}
</svg>`;

writeFileSync(displayPath, displaySvg, 'utf8');
console.log(`Wrote ${displayPath}`);
