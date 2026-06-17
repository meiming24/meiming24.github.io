import { tamagotchiUrl } from './paths';
import { P1_SHELL_LAYOUT } from './brickConfig';

function pctRect(x, y, w, h, viewW = 696, viewH = 858) {
  return {
    left: (x / viewW) * 100,
    top: (y / viewH) * 100,
    width: (w / viewW) * 100,
    height: (h / viewH) * 100,
  };
}

/** Add entries here when new shell SVGs are dropped into public/tamagotchi/assets/skins/. */
export const TAMAGOTCHI_SHELL_SKINS = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Original white shell',
    shellUrl: tamagotchiUrl('assets/TamagotchiP1-shell.svg'),
    previewUrl: tamagotchiUrl('assets/TamagotchiP1-shell.svg'),
    layout: P1_SHELL_LAYOUT,
  },
  {
    id: 'garden',
    name: 'Garden',
    description: 'Floral pattern shell',
    shellUrl: tamagotchiUrl('assets/skins/TamagotchiP1-shell-garden.svg'),
    previewUrl: tamagotchiUrl('assets/skins/TamagotchiP1-shell-garden.svg'),
    layout: {
      screen: pctRect(173.875, 264.174, 348, 329),
      buttons: {
        A: pctRect(214.426, 709.177, 52, 52),
        B: pctRect(322.378, 735.765, 52, 52),
        C: pctRect(432.426, 709.177, 52, 52),
      },
    },
  },
  {
    id: 'tropical',
    name: 'Tropical',
    description: 'Tropical pattern shell',
    shellUrl: tamagotchiUrl('assets/skins/TamagotchiP1-shell-tropical.svg'),
    previewUrl: tamagotchiUrl('assets/skins/TamagotchiP1-shell-tropical.svg'),
    layout: {
      screen: pctRect(173.875, 264.174, 348, 329),
      buttons: {
        A: pctRect(214.426, 709.177, 52, 52),
        B: pctRect(322.378, 735.765, 52, 52),
        C: pctRect(432.426, 709.177, 52, 52),
      },
    },
  },
];

export const DEFAULT_SHELL_SKIN_ID = TAMAGOTCHI_SHELL_SKINS[0].id;

export function getShellSkinById(skinId) {
  return TAMAGOTCHI_SHELL_SKINS.find((skin) => skin.id === skinId) ?? TAMAGOTCHI_SHELL_SKINS[0];
}
