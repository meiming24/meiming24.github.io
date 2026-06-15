/** BrickEmuPy TamagotchiP1.brick + TamagotchiP1.svg layout (viewBox 696×858). */

import { BRICK_PATH, FACE_PATH, tamagotchiUrl } from './paths';



export { FACE_PATH };



/** LCD + button regions derived from TamagotchiP1.svg element bounds. */

export const P1_SHELL_LAYOUT = {

  screen: { left: 25.14, top: 34.29, width: 50, height: 38.35 },

  buttons: {
    A: { left: 30.87, top: 84.7, width: 7.47, height: 6.06 },
    B: { left: 46.38, top: 87.8, width: 7.47, height: 6.06 },
    C: { left: 61.62, top: 84.7, width: 7.47, height: 6.06 },
  },

};



const BRICK_BUTTON_MAP = {

  btnLeft: 'A',

  btnCenter: 'B',

  btnRight: 'C',

};



function resolveAssetPath(relativePath) {

  return tamagotchiUrl(relativePath.replace(/^\.\/assets\//, 'assets/'));

}



/** Brick face_path points at the full SVG; the UI uses body-only shell like BrickEmuPy. */

function resolveShellFaceUrl(facePath) {

  const url = resolveAssetPath(facePath ?? 'assets/TamagotchiP1.svg');

  return url.replace(/TamagotchiP1\.svg$/i, 'TamagotchiP1-shell.svg');

}



export async function loadP1BrickConfig() {

  const response = await fetch(BRICK_PATH);

  if (!response.ok) {

    throw new Error('missing-brick');

  }



  const brick = await response.json();

  const romUrl = resolveAssetPath(brick.mask_options?.rom_path ?? 'assets/TamagotchiP1.bin');

  const faceUrl = resolveShellFaceUrl(brick.face_path);



  const hotkeys = {};

  for (const [brickName, config] of Object.entries(brick.buttons ?? {})) {

    const label = BRICK_BUTTON_MAP[brickName];

    if (label && Array.isArray(config.hot_keys) && config.hot_keys.length > 0) {

      hotkeys[label] = config.hot_keys[0];

    }

  }



  return {

    brick,

    romUrl,

    faceUrl,

    layout: P1_SHELL_LAYOUT,

    hotkeys,

  };

}

