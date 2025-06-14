import { Song } from './types';

export const MOCK_SONGS: Song[] = [
  {
    title: "Mirage",
    artist: "Synthwave Rider",
    album: "Neon Nights",
    albumArtUrl: "https://picsum.photos/seed/mirage/400/400",
  },
  {
    title: "Starlight Echoes",
    artist: "Galaxy Drifters",
    album: "Cosmic Tales",
    albumArtUrl: "https://picsum.photos/seed/starlight/400/400",
  },
  {
    title: "Cybernetic Pulse",
    artist: "Unit 731",
    album: "Digital Dreams",
    albumArtUrl: "https://picsum.photos/seed/cybernetic/400/400",
  },
  {
    title: "Ocean Drive",
    artist: "Coastal Lines",
    album: "Sunset Vibes",
    albumArtUrl: "https://picsum.photos/seed/ocean/400/400",
  }
];

export const INITIAL_PUNCH = 50;
export const INITIAL_VIBE = 50;
export const INITIAL_MOOD_SLIDER_VALUE = 0; // For FULL_SPECTRUM initially

export const ANALYZER_FFT_SIZE = 256; // Standardized FFT size

export const UI_INACTIVITY_TIMEOUT = 3000; // milliseconds (3 seconds)
export const SONG_IDENTIFICATION_INTERVAL = 15000; // milliseconds (15 seconds)
export const MAX_IDENTIFICATION_ATTEMPTS = 3;
export const PLACEHOLDER_ALBUM_ART = "https://picsum.photos/seed/placeholder/400/400"; // Placeholder for identified songs

// Microphone Automatic Gain Control (AGC) constants
export const MIC_INITIAL_GAIN = 1.5;
export const MIC_TARGET_AVERAGE_VOLUME = 80; // Target average volume (0-255 scale) for post-gain data
export const MIC_MIN_GAIN = 0.1;             // Minimum gain multiplier
export const MIC_MAX_GAIN = 7.0;             // Maximum gain multiplier (be careful with very high values)
export const MIC_GAIN_SMOOTHING_TIME = 0.05; // Seconds for setTargetAtTime smoothing (AudioContext timing)
export const MIC_GAIN_ADJUST_RATE = 0.05;    // Factor for manual smoothing if setTargetAtTime is not precise enough for rapid changes
