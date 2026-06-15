/**
 * BrickEmuPy renders SVG element id="body" for the shell and drives id="display"
 * segments from VRAM. A full SVG used as <img> shows every segment as always-on.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'public', 'tamagotchi', 'assets');
const sourcePath = join(assetsDir, 'TamagotchiP1.svg');
const shellPath = join(assetsDir, 'TamagotchiP1-shell.svg');

const svg = readFileSync(sourcePath, 'utf8');
const displayStart = svg.indexOf('<g id="display">');
if (displayStart === -1) {
  throw new Error('TamagotchiP1.svg is missing <g id="display">');
}

const defsStart = svg.indexOf('<defs>', displayStart);
if (defsStart === -1) {
  throw new Error('TamagotchiP1.svg is missing <defs> after display group');
}

const shellSvg = `${svg.slice(0, displayStart)}${svg.slice(defsStart)}`;
writeFileSync(shellPath, shellSvg, 'utf8');
console.log(`Wrote ${shellPath}`);
