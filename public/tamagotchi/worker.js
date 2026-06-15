/* Classic web worker — TamaLIB (JS port of jcrona/tamalib) */

const SCREEN_COLS = 32;
const SCREEN_ROWS = 16;
const TARGET_FPS = 60;
const TARGET_FRAME_MS = 1000 / TARGET_FPS;
const CPU_CLOCK = 1600000;
const MAX_STEPS_PER_FRAME = 12000;
const VRAM_SIZE = 0xa0;
const LIB_BASE = '/tamagotchi/lib';

let libBase = LIB_BASE;

let engineReady = false;
let matrix = Array.from({ length: SCREEN_ROWS }, () => Array(SCREEN_COLS).fill(false));
let icons = Array(8).fill(false);
let screenTimer = null;
let loopPaused = false;
let vramOut = new Uint8Array(VRAM_SIZE);
let emuTimeUs = 0;
let wallAnchorMs = 0;
let buzzerEnabled = false;
let buzzerFrequencyHz = 0;

function postBuzzerBeep() {
  if (buzzerEnabled && buzzerFrequencyHz > 0) {
    self.postMessage({ type: 'beep', frequency: buzzerFrequencyHz });
  }
}

function postBuzzerStop() {
  self.postMessage({ type: 'sound', frequency: -1 });
}

function syncWallAnchor() {
  wallAnchorMs = performance.now() - emuTimeUs / 1000;
}

function wallTargetUs() {
  return (performance.now() - wallAnchorMs) * 1000;
}

function parseRomBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const wordCount = Math.ceil(bytes.length / 2);
  const program = new Array(wordCount);

  for (let i = 0; i < wordCount; i += 1) {
    const offset = i * 2;
    const byte0 = bytes[offset] ?? 0;
    const byte1 = bytes[offset + 1] ?? 0;
    // Match jcrona/tamalib ROM layout (see convert.py byte swap)
    program[i] = byte1 | (byte0 << 8);
  }

  return program;
}

const hal = {
  malloc: () => null,
  free: () => {},
  halt: () => {},
  is_log_enabled: () => false,
  log: () => {},
  sleep_until: (deadline) => {
    emuTimeUs = Math.max(emuTimeUs, deadline);
  },
  get_timestamp: () => emuTimeUs,
  update_screen: () => {
    const snapshot = tamalib_export_display_vram();
    vramOut.set(snapshot);
    self.postMessage({ type: 'frame', vram: vramOut }, [vramOut.buffer]);
    vramOut = new Uint8Array(VRAM_SIZE);
  },
  set_lcd_matrix: (x, y, val) => {
    matrix[y][x] = val;
  },
  set_lcd_icon: (icon, val) => {
    icons[icon] = val;
  },
  set_frequency: (freq) => {
    buzzerFrequencyHz = freq / 10;
    postBuzzerBeep();
  },
  play_frequency: (play) => {
    buzzerEnabled = !!play;
    if (buzzerEnabled) {
      postBuzzerBeep();
      return;
    }
    postBuzzerStop();
  },
  trigger_one_shot: (longPulse) => {
    const frequency = buzzerFrequencyHz > 0 ? buzzerFrequencyHz : 4096;
    self.postMessage({
      type: 'beep',
      frequency,
      durationMs: longPulse ? 160 : 90,
    });
  },
  set_envelope: (enabled) => {
    if (!enabled) {
      postBuzzerStop();
    }
  },
  reset_envelope: () => {},
  handler: () => 0,
};

let scriptsLoaded = false;

function loadEngineScripts() {
  if (scriptsLoaded) {
    return;
  }
  importScripts(
    `${libBase}config.js`,
    `${libBase}cpu.js`,
    `${libBase}hw.js`,
    `${libBase}tamalib.js`,
  );
  scriptsLoaded = true;
}

function catchUpEmulation() {
  const target = wallTargetUs();
  let steps = 0;

  while (emuTimeUs < target && steps < MAX_STEPS_PER_FRAME) {
    if (tamalib_step()) {
      break;
    }
    steps += 1;
  }

  if (emuTimeUs > target + 1000) {
    syncWallAnchor();
  }
}

function startLoop() {
  if (screenTimer != null) {
    return;
  }

  tamalib_set_speed(1);
  tamalib_set_framerate(TARGET_FPS);
  syncWallAnchor();

  const tick = () => {
    if (!engineReady) {
      return;
    }

    const frameStart = performance.now();

    if (!loopPaused) {
      catchUpEmulation();
      hal.update_screen();
    }

    const frameEnd = performance.now();
    const delay = Math.max(0, TARGET_FRAME_MS - (frameEnd - frameStart));
    screenTimer = setTimeout(tick, delay);
  };

  tick();
}

function stopLoop() {
  if (screenTimer != null) {
    clearTimeout(screenTimer);
    screenTimer = null;
  }
}

function setPaused(paused) {
  if (!engineReady) {
    return;
  }

  loopPaused = paused;
  if (paused) {
    tamalib_set_exec_mode(exec_mode_t.EXEC_MODE_PAUSE);
    self.postMessage({ type: 'paused' });
    return;
  }

  syncWallAnchor();
  tamalib_set_exec_mode(exec_mode_t.EXEC_MODE_RUN);
  self.postMessage({ type: 'resumed' });
}

function initEngine(programArray, savedState, startPaused = false) {
  try {
    loadEngineScripts();
    my_program = programArray;

    tamalib_register_hal(hal);

    const hasSavedState =
      savedState &&
      typeof savedState === 'object' &&
      Array.isArray(savedState.memory) &&
      savedState.memory.length > 0;

    if (hasSavedState) {
      try {
        cpu_init_from_state(programArray, savedState, null, CPU_CLOCK);
      } catch {
        tamalib_init(programArray, null, CPU_CLOCK);
      }
    } else {
      tamalib_init(programArray, null, CPU_CLOCK);
    }

    tamalib_refresh_hw();
    emuTimeUs = 0;
    syncWallAnchor();
    loopPaused = startPaused;
    tamalib_set_exec_mode(
      startPaused ? exec_mode_t.EXEC_MODE_PAUSE : exec_mode_t.EXEC_MODE_RUN,
    );

    engineReady = true;
    hal.update_screen();
    startLoop();

    if (startPaused) {
      self.postMessage({ type: 'paused' });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function setButton(label, pressed) {
  if (!engineReady) {
    return;
  }

  const buttonMap = {
    A: button_t.BTN_LEFT,
    B: button_t.BTN_MIDDLE,
    C: button_t.BTN_RIGHT,
  };

  const state = pressed ? btn_state_t.BTN_STATE_PRESSED : btn_state_t.BTN_STATE_RELEASED;
  tamalib_set_button(buttonMap[label], state);
}

self.onmessage = (event) => {
  const { type } = event.data;

  if (type === 'init') {
    stopLoop();
    engineReady = false;
    loopPaused = false;
    scriptsLoaded = false;
    if (typeof event.data.libBase === 'string' && event.data.libBase.length > 0) {
      libBase = event.data.libBase.endsWith('/') ? event.data.libBase : `${event.data.libBase}/`;
    } else {
      libBase = LIB_BASE.endsWith('/') ? LIB_BASE : `${LIB_BASE}/`;
    }
    matrix = Array.from({ length: SCREEN_ROWS }, () => Array(SCREEN_COLS).fill(false));
    icons = Array(8).fill(false);
    vramOut = new Uint8Array(VRAM_SIZE);
    emuTimeUs = 0;
    wallAnchorMs = 0;
    buzzerEnabled = false;
    buzzerFrequencyHz = 0;

    const program = parseRomBuffer(event.data.rom);
    initEngine(program, event.data.savedState ?? null, Boolean(event.data.startPaused));
    return;
  }

  if (type === 'button') {
    setButton(event.data.button, event.data.pressed);
    return;
  }

  if (type === 'pause') {
    setPaused(true);
    return;
  }

  if (type === 'resume') {
    setPaused(false);
    return;
  }

  if (type === 'save') {
    if (!engineReady) {
      return;
    }

    self.postMessage({
      type: 'state',
      state: tamalib_get_state(),
    });
  }

  if (type === 'stop') {
    stopLoop();
    engineReady = false;
  }
};
