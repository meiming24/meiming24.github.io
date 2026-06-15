/**
 * Parse TamagotchiP1.svg display segments (id = ramByte_bit) for canvas rendering.
 * LCD bounds match BrickEmuPy TamagotchiP1.svg reflector window.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'public', 'tamagotchi', 'assets');
const svgPath = join(assetsDir, 'TamagotchiP1.svg');
const outPath = join(__dirname, '..', 'src', 'tamagotchi', 'p1DisplayManifest.json');

/** Full reflector window — includes menu icon rows above/below the 32×16 matrix. */
const LCD = { x: 175.004, y: 294.179, w: 348, h: 329 };

const svg = readFileSync(svgPath, 'utf8');
const displayStart = svg.indexOf('<g id="display">');
const displayEnd = svg.indexOf('<defs>', displayStart);
if (displayStart === -1 || displayEnd === -1) {
  throw new Error('Could not locate display group in TamagotchiP1.svg');
}

const displaySvg = svg.slice(displayStart, displayEnd);

function bboxFromPath(d) {
  const nums = d.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
  if (nums.length < 2) {
    return null;
  }

  const xs = [];
  const ys = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i]);
    ys.push(nums[i + 1]);
  }

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

function mergeBoxes(boxes) {
  const valid = boxes.filter(Boolean);
  if (valid.length === 0) {
    return null;
  }
  const x = Math.min(...valid.map((b) => b.x));
  const y = Math.min(...valid.map((b) => b.y));
  const w = Math.max(...valid.map((b) => b.x + b.w)) - x;
  const h = Math.max(...valid.map((b) => b.y + b.h)) - y;
  return { x, y, w, h };
}

function toRelativeRect(box) {
  return [
    (box.x - LCD.x) / LCD.w,
    (box.y - LCD.y) / LCD.h,
    box.w / LCD.w,
    box.h / LCD.h,
  ];
}

/** @type {Map<string, { x: number, y: number, w: number, h: number }[]>} */
const boxesById = new Map();

const pathRe = /<path[^>]*\bid="(\d+_\d+)"[^>]*\bd="([^"]+)"/g;
let match;
while ((match = pathRe.exec(displaySvg)) !== null) {
  const id = match[1];
  const box = bboxFromPath(match[2]);
  if (!box) {
    continue;
  }
  if (!boxesById.has(id)) {
    boxesById.set(id, []);
  }
  boxesById.get(id).push(box);
}

const groupRe = /<g id="(\d+_\d+)">([\s\S]*?)<\/g>/g;
while ((match = groupRe.exec(displaySvg)) !== null) {
  const id = match[1];
  const inner = match[2];
  const childPaths = [...inner.matchAll(/\bd="([^"]+)"/g)].map((m) => bboxFromPath(m[1]));
  const merged = mergeBoxes(childPaths);
  if (!merged) {
    continue;
  }
  if (!boxesById.has(id)) {
    boxesById.set(id, []);
  }
  boxesById.get(id).push(merged);
}

/** @type {{ b: number, t: number, r: number[] }[]} */
const segments = [];

for (const [id, boxes] of boxesById) {
  const [ramByte, bit] = id.split('_').map(Number);
  const merged = mergeBoxes(boxes);
  if (!merged) {
    continue;
  }
  segments.push({
    b: ramByte,
    t: bit,
    r: toRelativeRect(merged),
  });
}

segments.sort((a, b) => a.b - b.b || a.t - b.t);

/** 137_1 uses complex paths; naive bbox parsing over-estimates the hit area. */
for (const seg of segments) {
  if (seg.b === 137 && seg.t === 1) {
    seg.r = toRelativeRect({ x: 290.503, y: 575.343, w: 53.415, h: 38.694 });
  }
}

writeFileSync(outPath, JSON.stringify({ lcd: LCD, segments }), 'utf8');
console.log(`Wrote ${segments.length} segments to ${outPath}`);

const overlayPath = join(assetsDir, 'TamagotchiP1-display-overlay.svg');
const overlaySvg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LCD.x} ${LCD.y} ${LCD.w} ${LCD.h}" fill="none">`,
  displaySvg,
  '</svg>',
].join('\n');
writeFileSync(overlayPath, overlaySvg, 'utf8');
console.log(`Wrote ${overlayPath}`);
