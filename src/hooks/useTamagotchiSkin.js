import { useCallback, useState } from 'react';
import { DEFAULT_SHELL_SKIN_ID, TAMAGOTCHI_SHELL_SKINS, getShellSkinById } from '../tamagotchi/shellSkins';

const SKIN_STORAGE_KEY = 'tamagotchi-shell-skin-v1';

function readStoredSkinId() {
  try {
    const stored = localStorage.getItem(SKIN_STORAGE_KEY);
    if (stored && TAMAGOTCHI_SHELL_SKINS.some((skin) => skin.id === stored)) {
      return stored;
    }
  } catch {
    // Ignore storage errors in private mode.
  }
  return DEFAULT_SHELL_SKIN_ID;
}

export function useTamagotchiSkin() {
  const [skinId, setSkinIdState] = useState(readStoredSkinId);

  const setSkinId = useCallback((nextSkinId) => {
    if (!TAMAGOTCHI_SHELL_SKINS.some((skin) => skin.id === nextSkinId)) {
      return;
    }

    setSkinIdState(nextSkinId);
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, nextSkinId);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  return {
    skin: getShellSkinById(skinId),
    skinId,
    setSkinId,
    skins: TAMAGOTCHI_SHELL_SKINS,
  };
}
