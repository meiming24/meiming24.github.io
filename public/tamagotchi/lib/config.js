/* Must load before cpu.js — P1 uses the E0C6S46 MCU profile */
var E0C6S46_SUPPORT = true;
var E0C6S48_SUPPORT = false;
var NULL = null;

var log_level_t = {
  LOG_ERROR: 0x1,
  LOG_INFO: 0x1 << 1,
  LOG_MEMORY: 0x1 << 2,
  LOG_CPU: 0x1 << 3,
  LOG_INT: 0x1 << 4,
};
