/** Public tamagotchi URLs — respect Vite `base` (GitHub Pages subpaths). */
const ROOT = `${import.meta.env.BASE_URL}tamagotchi/`;

export function tamagotchiUrl(path) {
  return `${ROOT}${path.replace(/^\//, '')}`;
}

export const WORKER_URL = tamagotchiUrl('worker.js');
export const LIB_BASE_URL = tamagotchiUrl('lib/');
export const BRICK_PATH = tamagotchiUrl('assets/TamagotchiP1.brick');
export const FACE_PATH = tamagotchiUrl('assets/TamagotchiP1-shell.svg');
export const DISPLAY_OVERLAY_URL = tamagotchiUrl('assets/TamagotchiP1-display-overlay.svg');
