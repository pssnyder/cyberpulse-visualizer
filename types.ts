export interface Song {
  title: string;
  artist: string;
  album: string | null; // Album might not always be identified
  albumArtUrl: string; // Keep this, can use a placeholder if not identified
}

export enum Mood {
  COOL = 'COOL',
  WARM = 'WARM',
  FULL_SPECTRUM = 'FULL_SPECTRUM',
}

// Parameters directly controlled by sliders
export interface VisualizerCoreParams {
  punch: number; // 0-100, affects frequency emphasis
  vibe: number;  // 0-100, affects smoothness/chaos
  moodSliderValue: number; // -50 to 50, raw value from the mood slider
}

// Parameters used by the Visualizer component for rendering
export interface VisualizerRenderParams {
  punch: number;
  vibe: number;
  mood: Mood;    // Color palette, derived from moodSliderValue
}


export interface SliderConfig {
  id: keyof VisualizerCoreParams; // Ensures id matches a key in VisualizerCoreParams
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export type AudioSource = 'none' | 'spotify' | 'microphone';

// For microphone hook
export interface MicrophoneData {
  audioData: Uint8Array;
  isListening: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied';
}

export type SongIdentificationStatus = 'idle' | 'identifying' | 'identified' | 'failed' | 'stopped';