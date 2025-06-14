
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Visualizer } from './components/Visualizer';
import { ControlsPanel } from './components/ControlsPanel';
import { NowPlayingDisplay } from './components/NowPlayingDisplay';
import { FullscreenButton } from './components/FullscreenButton';
import { useMicrophoneData } from './hooks/useMicrophoneData';
import { SliderConfig, VisualizerCoreParams, Mood, AudioSource, VisualizerRenderParams } from './types';
import {
  INITIAL_PUNCH, INITIAL_VIBE, INITIAL_MOOD_SLIDER_VALUE, ANALYZER_FFT_SIZE,
  UI_INACTIVITY_TIMEOUT
} from './constants';

const App: React.FC = () => {
  const [audioSource, setAudioSource] = useState<AudioSource>('none');
  const [visualizerParams, setVisualizerParams] = useState<VisualizerCoreParams>({
    punch: INITIAL_PUNCH,
    vibe: INITIAL_VIBE,
    moodSliderValue: INITIAL_MOOD_SLIDER_VALUE,
  });

  const [isUIVisible, setIsUIVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const inactivityTimerRef = useRef<number | null>(null);

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

  if (microphoneShouldBeActive && isMicrophoneListening) {
    currentAudioData = microphoneData;
    visualizerIsPlaying = true;
  }

  const handleParamChange = useCallback(<K extends keyof VisualizerCoreParams,>(param: K, value: VisualizerCoreParams[K]) => {
    setVisualizerParams(prevParams => ({ ...prevParams, [param]: value }));
  }, []);

  const getCurrentMood = (sliderValue: number): Mood => {
    if (sliderValue <= -17) return Mood.COOL;
    if (sliderValue >= 17) return Mood.WARM;
    return Mood.FULL_SPECTRUM;
  };
  const currentMoodForVisualizer = getCurrentMood(visualizerParams.moodSliderValue);

  const activeSliderConfigs: SliderConfig[] = [
    { id: 'punch', label: 'PUNCH', min: 0, max: 100, value: visualizerParams.punch, onChange: (val) => handleParamChange('punch', val) },
    { id: 'vibe', label: 'VIBE', min: 0, max: 100, value: visualizerParams.vibe, onChange: (val) => handleParamChange('vibe', val) },
    {
      id: 'moodSliderValue',
      label: 'MOOD',
      min: -50,
      max: 50,
      value: visualizerParams.moodSliderValue,
      onChange: (val) => handleParamChange('moodSliderValue', val)
    },
  ];

  const handleMicrophoneToggle = () => {
    if (audioSource === 'microphone') {
      setAudioSource('none');
    } else {
      setAudioSource('microphone');
    }
  };

  const getMicrophoneButtonText = () => {
    if (audioSource === 'microphone') {
      if (isMicrophoneListening) return "Stop Microphone";
      if (microphoneError) return "Mic Error";
      if (microphonePermissionStatus === 'denied') return "Mic Denied";
      return "Connecting Mic...";
    }
    return "Activate Microphone";
  };

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

  const showNowPlayingError = audioSource === 'microphone' && microphoneError && isUIVisible;

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

      {showNowPlayingError && (
         <div className={`ui-element absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10
                        animate-fadeIn 
                        ${!isUIVisible ? 'now-playing-hidden ui-hidden' : ''}
                        `}>
          <NowPlayingDisplay
            audioSource={audioSource}
            isMicrophoneListening={isMicrophoneListening}
            microphoneError={microphoneError}
          />
        </div>
      ) }

      <footer
        className={`ui-element absolute bottom-0 left-0 right-0 p-6 z-20 ${!isUIVisible ? 'footer-hidden ui-hidden' : ''}`}
        aria-hidden={!isUIVisible}
      >
        {visualizerIsPlaying && <ControlsPanel sliders={activeSliderConfigs} />}
      </footer>

      {audioSource === 'none' && !isMicrophoneListening && (
        <div className={`z-10 text-center flex flex-col items-center ui-element ${!isUIVisible ? 'ui-hidden' : ''}`}>
          <p className="text-2xl text-cyber-primary mb-6 animate-pulse-slow">Activate microphone to start.</p>
          <div className="flex items-center space-x-4">
             <button
                onClick={handleMicrophoneToggle}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 bg-cyber-accent hover:bg-purple-700 text-white shadow-lg shadow-cyber-accent/50
                           ${microphonePermissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : ''} `}
                disabled={microphonePermissionStatus === 'denied'}
                aria-label={getMicrophoneButtonText()}
            >
              {microphonePermissionStatus === 'denied' ? "Mic Denied" : "Activate Microphone"}
            </button>
          </div>
          {microphonePermissionStatus === 'denied' && <p className="text-sm text-red-400 mt-4">Microphone access was denied. Check browser settings.</p>}
           <p className="text-sm text-gray-400 mt-4">Visuals react to live microphone audio.</p>
        </div>
      )}
    </div>
  );
};

export default App;