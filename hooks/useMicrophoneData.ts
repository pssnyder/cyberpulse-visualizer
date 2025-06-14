
import { useState, useEffect, useRef, useCallback } from 'react';
import { ANALYZER_FFT_SIZE, MIC_INITIAL_GAIN, MIC_TARGET_AVERAGE_VOLUME, MIC_MIN_GAIN, MIC_MAX_GAIN, MIC_GAIN_SMOOTHING_TIME, MIC_GAIN_ADJUST_RATE } from '../constants';
import { MicrophoneData } from '../types';

export const useMicrophoneData = (activate: boolean): MicrophoneData => {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(ANALYZER_FFT_SIZE / 2));
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null); // For AGC
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const stopMicrophone = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        // gainNodeRef.current = null; // Keep gain node for potential reuse if context is not closed
    }
    // Don't disconnect analyser or close context here, allow re-activation
    setIsListening(false);
    // Reset audioData to silence when stopping
    setAudioData(new Uint8Array(ANALYZER_FFT_SIZE / 2));
  }, []);

  const requestAndStartMicrophone = useCallback(async () => {
    if (permissionStatus === 'denied') {
      setError("Microphone permission was previously denied. Please enable it in your browser settings.");
      setIsListening(false);
      return;
    }

    if (isListening) return;

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionStatus('granted');

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Ensure nodes are created or reused
      if (!analyserRef.current && audioContextRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = ANALYZER_FFT_SIZE;
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      }
      if (!gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.setValueAtTime(MIC_INITIAL_GAIN, audioContextRef.current.currentTime);
      }


      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      // Connect nodes: Source -> Gain -> Analyser
      if (sourceRef.current && gainNodeRef.current && analyserRef.current) {
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(analyserRef.current);
      } else {
        throw new Error("Audio nodes could not be initialized.");
      }
      
      setIsListening(true);

      const update = () => {
        if (!analyserRef.current || !dataArrayRef.current || !gainNodeRef.current || !audioContextRef.current || !isListening || !activate) {
           if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
           return;
        }

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        setAudioData(new Uint8Array(dataArrayRef.current));

        // Automatic Gain Control (AGC)
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
        }
        const averageVolume = dataArrayRef.current.length > 0 ? sum / dataArrayRef.current.length : 0;
        
        if (averageVolume > 1) { // Only adjust if there's some signal, avoid amplifying pure noise too much or division by zero.
            // Target gain based on current average volume vs target.
            // This is a proportional controller.
            let targetGain = gainNodeRef.current.gain.value * (MIC_TARGET_AVERAGE_VOLUME / averageVolume);
            targetGain = Math.max(MIC_MIN_GAIN, Math.min(MIC_MAX_GAIN, targetGain)); // Clamp gain

            // Smoothly adjust gain using setTargetAtTime for a more "musical" response.
            gainNodeRef.current.gain.setTargetAtTime(targetGain, audioContextRef.current.currentTime, MIC_GAIN_SMOOTHING_TIME);
        } else if (averageVolume <= 1 && gainNodeRef.current.gain.value > MIC_INITIAL_GAIN) {
            // If signal is very low, slowly revert gain towards initial if it's high
             gainNodeRef.current.gain.setTargetAtTime(MIC_INITIAL_GAIN, audioContextRef.current.currentTime, MIC_GAIN_SMOOTHING_TIME * 5);
        }


        animationFrameIdRef.current = requestAnimationFrame(update);
      };
      update();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      if ((err as Error).name === 'NotAllowedError' || (err as Error).name === 'PermissionDeniedError') {
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
        setPermissionStatus('denied');
      } else {
        setError(`Could not access microphone: ${(err as Error).message}`);
        setPermissionStatus('denied'); 
      }
      setIsListening(false);
      stopMicrophone(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, permissionStatus, stopMicrophone, activate]); // Added activate here

  useEffect(() => {
    if (activate) {
      if(!isListening){ // prevent multiple calls if already listening due to activate changing
         requestAndStartMicrophone();
      }
    } else {
      stopMicrophone();
    }
  }, [activate, isListening, requestAndStartMicrophone, stopMicrophone]);

 useEffect(() => {
    return () => {
        stopMicrophone(); 
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.warn("Error closing microphone audio context:", e));
            audioContextRef.current = null;
            analyserRef.current = null;
            gainNodeRef.current = null;
        }
    }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []); // stopMicrophone is stable


  return { audioData, isListening, error, permissionStatus };
};