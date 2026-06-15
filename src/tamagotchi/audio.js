const GAIN_LEVEL = 0.22;
const BEEP_SECONDS = 0.14;

class TamagotchiAudio {
  constructor() {
    this.ctx = null;
    this.readyPromise = null;
    this.sustainOsc = null;
    this.sustainGain = null;
    this.stopTimer = null;
  }

  primeSync() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return false;
    }

    if (!this.ctx) {
      this.ctx = new AudioContextClass();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start(0);

    return true;
  }
  ensureReady() {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = (async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return false;
      }

      if (!this.ctx) {
        this.ctx = new AudioContextClass();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      return this.ctx.state === 'running';
    })().finally(() => {
      this.readyPromise = null;
    });

    return this.readyPromise;
  }

  ensureSustainNodes() {
    if (!this.ctx || this.sustainOsc) {
      return;
    }

    this.sustainOsc = this.ctx.createOscillator();
    this.sustainGain = this.ctx.createGain();
    this.sustainOsc.type = 'square';
    this.sustainOsc.connect(this.sustainGain);
    this.sustainGain.connect(this.ctx.destination);
    this.sustainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.sustainOsc.start();
  }

  async beep(frequencyHz, durationSec = BEEP_SECONDS) {
    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
      return;
    }

    const ready = await this.ensureReady();
    if (!ready) {
      return;
    }

    const duration = Math.max(0.04, Math.min(durationSec, 0.5));

    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    this.ensureSustainNodes();
    const t = this.ctx.currentTime;
    this.sustainOsc.frequency.setValueAtTime(frequencyHz, t);
    this.sustainGain.gain.cancelScheduledValues(t);
    this.sustainGain.gain.setValueAtTime(GAIN_LEVEL, t);
    this.sustainGain.gain.setValueAtTime(GAIN_LEVEL, t + duration * 0.85);
    this.sustainGain.gain.linearRampToValueAtTime(0, t + duration);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(frequencyHz, t);
    gain.gain.setValueAtTime(GAIN_LEVEL, t);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  scheduleStop() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
    }

    this.stopTimer = window.setTimeout(() => {
      this.stopTimer = null;
      this.stop();
    }, 80);
  }

  stop() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    if (this.sustainGain && this.ctx) {
      this.sustainGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.sustainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  dispose() {
    this.stop();

    if (this.sustainOsc) {
      try {
        this.sustainOsc.stop();
      } catch {
        // Already stopped.
      }
      this.sustainOsc.disconnect();
      this.sustainGain.disconnect();
      this.sustainOsc = null;
      this.sustainGain = null;
    }

    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const tamagotchiAudio = new TamagotchiAudio();

export function handleTamagotchiBeep(frequencyHz, durationMs) {
  const durationSec =
    Number.isFinite(durationMs) && durationMs > 0 ? durationMs / 1000 : BEEP_SECONDS;
  tamagotchiAudio.beep(frequencyHz, durationSec).catch(() => {});
}

export function handleTamagotchiSoundStop() {
  tamagotchiAudio.scheduleStop();
}

export function primeTamagotchiAudio() {
  tamagotchiAudio.primeSync();
  tamagotchiAudio.ensureReady().catch(() => {});
}
