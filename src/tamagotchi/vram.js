/** E0C6S46 display RAM size (matches BrickEmuPy E0C6200 VRAM 0xA0). */
export const VRAM_SIZE = 0xa0;

const DISPLAY1 = 0xe00;
const DISPLAY1_SIZE = 0x50;
const DISPLAY2 = 0xe80;

export function createEmptyVram() {
  return new Uint8Array(VRAM_SIZE);
}

export function setVramNibble(vram, address, value) {
  if (address >= DISPLAY1 && address < DISPLAY1 + DISPLAY1_SIZE) {
    vram[address - DISPLAY1] = value & 0xf;
    return;
  }
  if (address >= DISPLAY2 && address < DISPLAY2 + DISPLAY1_SIZE) {
    vram[DISPLAY1_SIZE + (address - DISPLAY2)] = value & 0xf;
  }
}

export function isSegmentLit(vram, ramByte, bit) {
  if (ramByte >= vram.length) {
    return false;
  }
  return ((vram[ramByte] >> bit) & 1) === 1;
}
