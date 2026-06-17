import { useCallback, useEffect, useRef, useState } from 'react';
import { loadP1BrickConfig } from '../tamagotchi/brickConfig';
import {
  clearTamagotchiState,
  getSlotsInfo,
  loadFromSlot,
  loadTamagotchiState,
  saveTamagotchiState,
  saveToSlot,
} from '../tamagotchi/storage';
import { LIB_BASE_URL, WORKER_URL } from '../tamagotchi/paths';
import { VRAM_SIZE } from '../tamagotchi/vram';
import { handleTamagotchiBeep, handleTamagotchiSoundStop, tamagotchiAudio } from '../tamagotchi/audio';

const AUTOSAVE_MS = 30000;

const EMPTY_SLOTS = [
  { index: 1, hasData: false, savedAt: null },
  { index: 2, hasData: false, savedAt: null },
  { index: 3, hasData: false, savedAt: null },
];

export function useTamagotchiEmulator(active) {
  const workerRef = useRef(null);
  const screenRef = useRef(null);
  const autosaveRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [fastForwarding, setFastForwarding] = useState(false);
  const [ffProgress, setFfProgress] = useState(0);
  const [pauseWanted, setPauseWanted] = useState(
    () => localStorage.getItem('tamagotchi-paused') === 'true',
  );
  const [slotsInfo, setSlotsInfo] = useState(EMPTY_SLOTS);
  const skipSavedRef = useRef(false);
  const pauseWantedRef = useRef(false);
  const pendingSaveSlotRef = useRef(null); // null | 1 | 2 | 3

  useEffect(() => {
    pauseWantedRef.current = pauseWanted;
    localStorage.setItem('tamagotchi-paused', String(pauseWanted));
  }, [pauseWanted]);

  useEffect(() => {
    getSlotsInfo().then(setSlotsInfo).catch(() => {});
  }, []);

  const sendButton = useCallback((button, pressed) => {
    workerRef.current?.postMessage({ type: 'button', button, pressed });
  }, []);

  const tapButton = useCallback(
    (button) => {
      sendButton(button, true);
      window.setTimeout(() => sendButton(button, false), 100);
    },
    [sendButton],
  );

  const resetGame = useCallback(async () => {
    setPauseWanted(false);
    await clearTamagotchiState();
    skipSavedRef.current = true;
    setSessionKey((key) => key + 1);
  }, []);

  const togglePause = useCallback(() => {
    if (!workerRef.current) {
      return;
    }

    workerRef.current.postMessage({
      type: pauseWanted ? 'resume' : 'pause',
    });
  }, [pauseWanted]);

  const saveSlot = useCallback((slotIndex) => {
    if (!workerRef.current) return;
    pendingSaveSlotRef.current = slotIndex;
    workerRef.current.postMessage({ type: 'save' });
  }, []);

  const fastForward = useCallback((hours, minutes) => {
    if (!workerRef.current) return;
    setFastForwarding(true);
    setFfProgress(0);
    workerRef.current.postMessage({ type: 'fastForward', hours, minutes });
  }, []);

  const cancelFastForward = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'cancelFf' });
  }, []);

  const loadSlot = useCallback(async (slotIndex) => {
    const record = await loadFromSlot(slotIndex);
    if (!record) return;
    await saveTamagotchiState(record.state);
    skipSavedRef.current = false;
    setSessionKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!active) {
      tamagotchiAudio.stop();
      workerRef.current?.postMessage({ type: 'stop' });
      workerRef.current?.terminate();
      workerRef.current = null;

      if (autosaveRef.current) {
        clearInterval(autosaveRef.current);
        autosaveRef.current = null;
      }

      setStatus('idle');
      return undefined;
    }

    let cancelled = false;

    async function boot() {
      setStatus('loading');
      setError('');

      let brickConfig;
      try {
        brickConfig = await loadP1BrickConfig();
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError(
            'Missing TamagotchiP1.brick — copy BrickEmuPy assets to public/tamagotchi/assets/.',
          );
        }
        return;
      }

      let romBuffer;
      try {
        const response = await fetch(brickConfig.romUrl);
        if (!response.ok) {
          throw new Error('missing-rom');
        }
        romBuffer = await response.arrayBuffer();
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError(
            'Missing TamagotchiP1.bin — copy from BrickEmuPy assets to public/tamagotchi/assets/.',
          );
        }
        return;
      }

      if (cancelled) {
        return;
      }

      setConfig(brickConfig);

      const savedState = skipSavedRef.current ? null : await loadTamagotchiState();
      skipSavedRef.current = false;
      const worker = new Worker(WORKER_URL);
      workerRef.current = worker;

      worker.onmessage = (event) => {
        const { type } = event.data;

        if (type === 'frame') {
          const vram = event.data.vram;
          if (vram instanceof Uint8Array && vram.length >= VRAM_SIZE) {
            screenRef.current?.drawVram(vram);
          }
          setStatus((current) => {
            if (current === 'paused' || current === 'running') {
              return current;
            }
            if (pauseWantedRef.current) {
              return current;
            }
            return 'running';
          });
          return;
        }

        if (type === 'paused') {
          setPauseWanted(true);
          setStatus('paused');
          return;
        }

        if (type === 'resumed') {
          setPauseWanted(false);
          setStatus('running');
          return;
        }

        if (type === 'error') {
          if (!cancelled) {
            setStatus('error');
            setError(event.data.message || 'Tamagotchi emulator failed to start.');
          }
          return;
        }

        if (type === 'state') {
          saveTamagotchiState(event.data.state).catch(() => {});
          const slotIndex = pendingSaveSlotRef.current;
          if (slotIndex != null) {
            pendingSaveSlotRef.current = null;
            saveToSlot(slotIndex, event.data.state)
              .then(() => getSlotsInfo())
              .then(setSlotsInfo)
              .catch(() => {});
          }
          return;
        }

        if (type === 'ffProgress') {
          setFfProgress(event.data.progress);
          return;
        }

        if (type === 'ffDone') {
          setFastForwarding(false);
          setFfProgress(0);
          return;
        }

        if (type === 'beep') {
          handleTamagotchiBeep(event.data.frequency, event.data.durationMs);
          return;
        }

        if (type === 'sound') {
          if (event.data.frequency < 0) {
            handleTamagotchiSoundStop();
          }
          return;
        }
      };

      worker.onerror = (event) => {
        if (!cancelled) {
          setStatus('error');
          setError(event.message || 'Tamagotchi emulator failed to start.');
        }
      };

      worker.postMessage(
        {
          type: 'init',
          rom: romBuffer,
          savedState,
          libBase: LIB_BASE_URL,
          startPaused: pauseWanted,
        },
        [romBuffer],
      );

      autosaveRef.current = window.setInterval(() => {
        workerRef.current?.postMessage({ type: 'save' });
      }, AUTOSAVE_MS);
    }

    boot();

    return () => {
      cancelled = true;
      tamagotchiAudio.stop();
      workerRef.current?.postMessage({ type: 'stop' });
      workerRef.current?.terminate();
      workerRef.current = null;

      if (autosaveRef.current) {
        clearInterval(autosaveRef.current);
        autosaveRef.current = null;
      }
    };
  }, [active, sessionKey]);

  return {
    screenRef,
    status,
    error,
    config,
    sendButton,
    tapButton,
    resetGame,
    togglePause,
    saveSlot,
    loadSlot,
    slotsInfo,
    fastForward,
    cancelFastForward,
    fastForwarding,
    ffProgress,
    isPaused: pauseWanted || status === 'paused',
  };
}
