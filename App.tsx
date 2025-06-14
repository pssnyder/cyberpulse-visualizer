
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Visualizer } from './components/Visualizer';
import { ControlsPanel } from './components/ControlsPanel';
import { NowPlayingDisplay } from './components/NowPlayingDisplay';
import { SpotifyAuthButton } from './components/SpotifyAuthButton';
import { FullscreenButton } from './components/FullscreenButton';
import { useMockAudioData } from './hooks/useMockAudioData';
import { useMicrophoneData } from './hooks/useMicrophoneData';
import { SliderConfig, Song, VisualizerCoreParams, Mood, AudioSource, SongIdentificationStatus, VisualizerRenderParams } from './types';
import {
  MOCK_SONGS, INITIAL_PUNCH, INITIAL_VIBE, INITIAL_MOOD_SLIDER_VALUE, ANALYZER_FFT_SIZE,
  UI_INACTIVITY_TIMEOUT, SONG_IDENTIFICATION_INTERVAL, MAX_IDENTIFICATION_ATTEMPTS, PLACEHOLDER_ALBUM_ART
} from './constants';

// Ensure API_KEY is available in the environment as per guidelines
const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY for Gemini is not set. Song identification will be disabled.");
}

const App: React.FC = () => {
  const [audioSource, setAudioSource] = useState<AudioSource>('none');
  const [isSpotifyConnected, setIsSpotifyConnected] = useState<boolean>(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [visualizerParams, setVisualizerParams] = useState<VisualizerCoreParams>({
    punch: INITIAL_PUNCH,
    vibe: INITIAL_VIBE,
    moodSliderValue: INITIAL_MOOD_SLIDER_VALUE,
  });

  const [isUIVisible, setIsUIVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [songIdentificationStatus, setSongIdentificationStatus] = useState<SongIdentificationStatus>('idle');
  const [identificationAttempts, setIdentificationAttempts] = useState<number>(0);

  const inactivityTimerRef = useRef<number | null>(null);
  const identificationIntervalRef = useRef<number | null>(null);

  // Spotify Mock Audio
  const mockSpotifyAudioActive = audioSource === 'spotify' && isSpotifyConnected;
  const mockSpotifyData = useMockAudioData(mockSpotifyAudioActive);

  // Microphone Audio
  const microphoneShouldBeActive = audioSource === 'microphone';
  const {
    audioData: microphoneData,
    isListening: isMicrophoneListening,
    error: microphoneError,
    permissionStatus: microphonePermissionStatus
  } = useMicrophoneData(microphoneShouldBeActive);

  let currentAudioData = new Uint8Array(ANALYZER_FFT_SIZE / 2);
  let visualizerIsPlaying = false;

  if (mockSpotifyAudioActive) {
    currentAudioData = mockSpotifyData;
    visualizerIsPlaying = true;
  } else if (microphoneShouldBeActive && isMicrophoneListening) {
    currentAudioData = microphoneData;
    visualizerIsPlaying = true;
  }

  const handleSpotifyConnect = useCallback(() => {
    setIsSpotifyConnected(prevConnected => {
      const nextConnected = !prevConnected;
      if (nextConnected) {
        setAudioSource('spotify');
        setSongIdentificationStatus('idle'); 
        setCurrentSong(null); 
      } else {
        if (audioSource === 'spotify') {
          setAudioSource('none');
        }
      }
      return nextConnected;
    });
  }, [audioSource]);

  useEffect(() => { // Spotify song cycling
    if (audioSource === 'spotify' && isSpotifyConnected) {
      setCurrentSong(MOCK_SONGS[0]);
      const intervalId = setInterval(() => {
        setCurrentSong(prevSong => {
          const currentIndex = MOCK_SONGS.findIndex(s => s.title === prevSong?.title);
          const nextIndex = (currentIndex + 1) % MOCK_SONGS.length;
          return MOCK_SONGS[nextIndex];
        });
      }, 15000); // Mock song duration
      return () => clearInterval(intervalId);
    } else if (audioSource !== 'spotify') {
       if (songIdentificationStatus !== 'identified' && songIdentificationStatus !== 'identifying') {
         setCurrentSong(null);
       }
    }
  }, [audioSource, isSpotifyConnected, songIdentificationStatus]);

  const handleParamChange = useCallback(<K extends keyof VisualizerCoreParams,>(param: K, value: VisualizerCoreParams[K]) => {
    setVisualizerParams(prevParams => ({ ...prevParams, [param]: value }));
  }, []);

  // Derive currentMood for the visualizer
  const getCurrentMood = (sliderValue: number): Mood => {
    // Ranges: Cool: -50 to -17; Full Spectrum: -16 to 16; Warm: 17 to 50
    if (sliderValue <= -17) return Mood.COOL;
    if (sliderValue >= 17) return Mood.WARM;
    return Mood.FULL_SPECTRUM;
  };
  const currentMoodForVisualizer = getCurrentMood(visualizerParams.moodSliderValue);

  const activeSliderConfigs: SliderConfig[] = [
    { id: 'punch', label: 'PUNCH', min: 0, max: 100, value: visualizerParams.punch, onChange: (val) => handleParamChange('punch', val) },
    { id: 'vibe', label: 'VIBE', min: 0, max: 100, value: visualizerParams.vibe, onChange: (val) => handleParamChange('vibe', val) },
    {
      id: 'moodSliderValue', // Bind to the raw slider value
      label: 'MOOD',
      min: -50,
      max: 50,
      value: visualizerParams.moodSliderValue, // Use the stored raw slider value
      onChange: (val) => handleParamChange('moodSliderValue', val) // Update the raw slider value
    },
  ];

  const handleMicrophoneToggle = () => {
    if (audioSource === 'microphone') {
      setAudioSource('none');
      setSongIdentificationStatus('stopped');
      setCurrentSong(null);
    } else {
      setAudioSource('microphone');
      if (isSpotifyConnected) setIsSpotifyConnected(false);
      setCurrentSong(null);
      setSongIdentificationStatus('idle');
      setIdentificationAttempts(0);
    }
  };

  const getMicrophoneButtonText = () => {
    if (audioSource === 'microphone') {
      if (isMicrophoneListening) return "Stop Microphone";
      if (microphoneError) return "Mic Error";
      if (microphonePermissionStatus === 'denied') return "Mic Denied";
      return "Connecting Mic...";
    }
    return "Use Microphone";
  };

  // --- Song Identification Logic ---
  const parseGeminiResponseForSong = (text: string): Song | null => {
    const songMatch = text.match(/Song:\s*(.*?)(?:,|$)/i);
    const artistMatch = text.match(/Artist:\s*(.*?)(?:,|$)/i);
    const albumMatch = text.match(/Album:\s*(.*?)(?:,|$)/i);

    if (songMatch && artistMatch) {
      return {
        title: songMatch[1].trim(),
        artist: artistMatch[1].trim(),
        album: albumMatch ? albumMatch[1].trim() : "Unknown Album",
        albumArtUrl: PLACEHOLDER_ALBUM_ART
      };
    }
    return null;
  };

  const identifySong = useCallback(async () => {
    if (!ai || songIdentificationStatus === 'identifying' || identificationAttempts >= MAX_IDENTIFICATION_ATTEMPTS) {
      if (identificationAttempts >= MAX_IDENTIFICATION_ATTEMPTS && songIdentificationStatus !== 'failed') {
        setSongIdentificationStatus('failed');
      }
      return;
    }

    setSongIdentificationStatus('identifying');
    try {
      const prompt = "Suggest a popular cyberpunk or electronic music song with its artist and album. Format as: Song: [Title], Artist: [Artist], Album: [Album]";
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
      });
      const identifiedSong = parseGeminiResponseForSong(response.text);

      if (identifiedSong) {
        setCurrentSong(identifiedSong);
        setSongIdentificationStatus('identified');
        setIdentificationAttempts(0);
      } else {
        throw new Error("Could not parse song information from response.");
      }
    } catch (error) {
      console.error("Error identifying song:", error);
      setIdentificationAttempts(prev => prev + 1);
      if (identificationAttempts + 1 >= MAX_IDENTIFICATION_ATTEMPTS) {
        setSongIdentificationStatus('failed');
      } else {
        setSongIdentificationStatus('idle');
      }
    }
  }, [songIdentificationStatus, identificationAttempts]);

  useEffect(() => {
    if (audioSource === 'microphone' && isMicrophoneListening && ai) {
      if (songIdentificationStatus === 'idle' || songIdentificationStatus === 'failed') {
        if (identificationAttempts < MAX_IDENTIFICATION_ATTEMPTS) {
            identifySong();
        }
      }
      if (identificationIntervalRef.current) clearInterval(identificationIntervalRef.current);
      identificationIntervalRef.current = window.setInterval(() => {
        if (songIdentificationStatus !== 'identified' && identificationAttempts < MAX_IDENTIFICATION_ATTEMPTS) {
          identifySong();
        } else if (identificationAttempts >= MAX_IDENTIFICATION_ATTEMPTS) {
            setSongIdentificationStatus('failed');
        }
      }, SONG_IDENTIFICATION_INTERVAL);
      return () => {
        if (identificationIntervalRef.current) clearInterval(identificationIntervalRef.current);
        identificationIntervalRef.current = null;
      };
    } else {
      if (identificationIntervalRef.current) clearInterval(identificationIntervalRef.current);
      identificationIntervalRef.current = null;
      if (audioSource !== 'microphone' || !isMicrophoneListening) {
         setSongIdentificationStatus('stopped');
         if (songIdentificationStatus !== 'idle') setCurrentSong(null);
      }
    }
  }, [audioSource, isMicrophoneListening, identifySong, songIdentificationStatus, identificationAttempts]);

  // --- UI Auto-Hide Logic ---
  const resetInactivityTimer = useCallback(() => {
    setIsUIVisible(true);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = window.setTimeout(() => {
      setIsUIVisible(false);
    }, UI_INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    resetInactivityTimer();
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('mousedown', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
    };
  }, [resetInactivityTimer]);

  // --- Fullscreen Logic ---
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const fullscreenChangeHandler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  }, []);

  const showNowPlaying = (audioSource === 'spotify' && currentSong && isSpotifyConnected) ||
                         (audioSource === 'microphone' && (songIdentificationStatus === 'identifying' || songIdentificationStatus === 'identified' || (microphoneError && isUIVisible) || (songIdentificationStatus === 'failed' && isUIVisible) ));

  const visualizerRenderParams: VisualizerRenderParams = {
    punch: visualizerParams.punch,
    vibe: visualizerParams.vibe,
    mood: currentMoodForVisualizer,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-cyber-bg">
      <div className="absolute inset-0 w-full h-full z-0">
        <Visualizer audioData={currentAudioData} params={visualizerRenderParams} isPlaying={visualizerIsPlaying} />
      </div>

      <header
        className={`ui-element absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 ${!isUIVisible ? 'header-hidden ui-hidden' : ''}`}
        aria-hidden={!isUIVisible}
        >
        <h1 className="text-3xl font-bold tracking-wider text-cyber-primary animate-pulse-slow" style={{textShadow: '0 0 5px #2DE2E6, 0 0 10px #F706CF'}}>
          CYBERPULSE
        </h1>
        <div className="flex items-center space-x-2 md:space-x-4">
          <SpotifyAuthButton isConnected={isSpotifyConnected && audioSource === 'spotify'} onClick={handleSpotifyConnect} />
          <button
            onClick={handleMicrophoneToggle}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 text-sm md:text-base
                        ${audioSource === 'microphone' && isMicrophoneListening
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                          : 'bg-cyber-accent hover:bg-purple-700 text-white shadow-lg shadow-cyber-accent/50'}
                        ${microphonePermissionStatus === 'denied' && audioSource !== 'microphone' ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
            disabled={microphonePermissionStatus === 'denied' && audioSource !== 'microphone'}
            aria-label={getMicrophoneButtonText()}
          >
            {getMicrophoneButtonText()}
          </button>
          <FullscreenButton isFullscreen={isFullscreen} onClick={handleToggleFullscreen} />
        </div>
      </header>

      {showNowPlaying && (
        <div className={`ui-element absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10
                        ${songIdentificationStatus === 'failed' || songIdentificationStatus === 'stopped' ? 'animate-fadeOut' : 'animate-fadeIn'}
                        ${!isUIVisible && audioSource === 'microphone' ? 'now-playing-hidden ui-hidden' : ''}
                        `}>
          <NowPlayingDisplay
            song={currentSong}
            audioSource={audioSource}
            isMicrophoneListening={isMicrophoneListening}
            microphoneError={microphoneError}
            identificationStatus={songIdentificationStatus}
          />
        </div>
      ) }


      <footer
        className={`ui-element absolute bottom-0 left-0 right-0 p-6 z-20 ${!isUIVisible ? 'footer-hidden ui-hidden' : ''}`}
        aria-hidden={!isUIVisible}
        >
        {(visualizerIsPlaying || (audioSource === 'microphone' && isMicrophoneListening)) && <ControlsPanel sliders={activeSliderConfigs} />}
      </footer>

      {audioSource === 'none' && !isSpotifyConnected && !isMicrophoneListening && (
        <div className={`z-10 text-center flex flex-col items-center ui-element ${!isUIVisible ? 'ui-hidden' : ''}`}>
          <p className="text-2xl text-cyber-primary mb-6 animate-pulse-slow">Choose an audio source to start.</p>
          <div className="flex items-center space-x-4">
             <SpotifyAuthButton isConnected={false} onClick={handleSpotifyConnect} />
             <button
                onClick={handleMicrophoneToggle}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 bg-cyber-accent hover:bg-purple-700 text-white shadow-lg shadow-cyber-accent/50
                           ${microphonePermissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : ''} `}
                disabled={microphonePermissionStatus === 'denied'}
                aria-label={getMicrophoneButtonText()}
            >
              {microphonePermissionStatus === 'denied' ? "Mic Denied" : "Use Microphone"}
            </button>
          </div>
          {microphonePermissionStatus === 'denied' && <p className="text-sm text-red-400 mt-4">Microphone access was denied. Check browser settings.</p>}
           {!API_KEY && <p className="text-sm text-yellow-400 mt-4">Song identification via microphone is disabled (API key missing).</p>}
          <p className="text-sm text-gray-400 mt-4">Spotify: Mock. Microphone: Live.</p>
        </div>
      )}
    </div>
  );
};

export default App;