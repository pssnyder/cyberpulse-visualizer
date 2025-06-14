import { useState, useEffect, useRef } from 'react';
import { ANALYZER_FFT_SIZE } from '../constants'; // Use shared constant

export const useMockAudioData = (isPlaying: boolean): Uint8Array => {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(ANALYZER_FFT_SIZE / 2));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<OscillatorNode | MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(ANALYZER_FFT_SIZE / 2));
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = ANALYZER_FFT_SIZE;
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

        const oscillator = audioContextRef.current.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime); 
        
        const lfo = audioContextRef.current.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.5, audioContextRef.current.currentTime); 
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.setValueAtTime(100, audioContextRef.current.currentTime); 
        lfo.connect(gainNode);
        gainNode.connect(oscillator.frequency);

        oscillator.connect(analyserRef.current);
        
        oscillator.start();
        lfo.start();
        sourceRef.current = oscillator;
      } else {
        // If context exists, ensure oscillator is running if it was stopped
        if (sourceRef.current && sourceRef.current instanceof OscillatorNode && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
         if (!sourceRef.current && analyserRef.current && audioContextRef.current) { // Recreate source if nullified
            const oscillator = audioContextRef.current.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
            const lfo = audioContextRef.current.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.5, audioContextRef.current.currentTime);
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.setValueAtTime(100, audioContextRef.current.currentTime);
            lfo.connect(gainNode);
            gainNode.connect(oscillator.frequency);
            oscillator.connect(analyserRef.current);
            oscillator.start();
            lfo.start();
            sourceRef.current = oscillator;
        }
      }


      const updateAudioData = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          setAudioData(new Uint8Array(dataArrayRef.current)); 
        }
        animationFrameIdRef.current = requestAnimationFrame(updateAudioData);
      };

      updateAudioData();

    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (sourceRef.current && sourceRef.current instanceof OscillatorNode) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
        // Nullify source to allow recreation if mock audio is re-enabled
        const lfo = sourceRef.current.frequency.value !== 440 ? (sourceRef.current.frequency as any).sourceNode : null; // Hacky way to get LFO if connected
        if(lfo && lfo instanceof OscillatorNode) {
            lfo.stop();
            lfo.disconnect();
        }
        sourceRef.current = null;
      }
      // Don't disconnect analyser, it can be reused.
      // Don't close AudioContext, it can be reused or suspended by browser.
       setAudioData(new Uint8Array(ANALYZER_FFT_SIZE / 2)); 
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Stop oscillator only if it's the one created by this hook instance
      if (sourceRef.current && sourceRef.current instanceof OscillatorNode) {
         try {
            sourceRef.current.stop();
            sourceRef.current.disconnect();
             const lfo = (sourceRef.current.frequency as any).sourceNode; 
             if(lfo && lfo instanceof OscillatorNode) {
                lfo.stop();
                lfo.disconnect();
            }
        } catch(e) { /* ignore */ }
        sourceRef.current = null;
      }
      // Analyser and AudioContext are not cleaned up here to allow reuse if the component/hook remounts quickly
      // or if other parts of the app might use them. Full cleanup on App unmount might be needed if this were a larger app.
    };
  }, [isPlaying]);

  // Effect for full cleanup when the App component (or parent using this hook) unmounts
  useEffect(() => {
    return () => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.warn("Error closing mock audio context:", e));
            audioContextRef.current = null;
        }
    }
  }, []);


  return audioData;
};