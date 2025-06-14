
export const INITIAL_PUNCH = 50;
export const INITIAL_VIBE = 50;
export const INITIAL_MOOD_SLIDER_VALUE = 0; // For FULL_SPECTRUM initially

export const ANALYZER_FFT_SIZE = 256; // Standardized FFT size

export const UI_INACTIVITY_TIMEOUT = 3000; // milliseconds (3 seconds)

// Microphone Automatic Gain Control (AGC) constants
export const MIC_INITIAL_GAIN = 1.5;
export const MIC_TARGET_AVERAGE_VOLUME = 80; // Target average volume (0-255 scale) for post-gain data
export const MIC_MIN_GAIN = 0.1;             // Minimum gain multiplier
export const MIC_MAX_GAIN = 7.0;             // Maximum gain multiplier (be careful with very high values)
export const MIC_GAIN_SMOOTHING_TIME = 0.05; // Seconds for setTargetAtTime smoothing (AudioContext timing)
export const MIC_GAIN_ADJUST_RATE = 0.05;    // Factor for manual smoothing if setTargetAtTime is not precise enough for rapid changes
