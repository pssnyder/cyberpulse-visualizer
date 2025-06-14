import React from 'react';
import { AudioSource } from '../types';

interface NowPlayingDisplayProps {
  audioSource: AudioSource; // Kept for potential future use, but currently only 'microphone' is relevant
  isMicrophoneListening?: boolean;
  microphoneError?: string | null;
}

export const NowPlayingDisplay: React.FC<NowPlayingDisplayProps> = ({ 
  audioSource,
  isMicrophoneListening, 
  microphoneError
}) => {

  const containerClasses = "bg-cyber-bg-light backdrop-blur-md p-6 rounded-xl shadow-2xl text-center max-w-xs md:max-w-sm transition-all duration-500 ease-in-out";

  if (audioSource === 'microphone') {
    if (microphoneError) {
      return (
        <div className={`${containerClasses} border-2 border-red-500/50`}>
          <h2 className="text-xl md:text-2xl font-semibold text-red-300">Microphone Error</h2>
          <p className="text-sm md:text-md text-red-200 break-words">{microphoneError}</p>
        </div>
      );
    }
    
    // "Listening via Microphone" box was previously removed by user request as it covered the visualizer.
    // If a non-obstructive indicator is ever needed, it could be placed here or elsewhere.
    // For now, only errors are shown in this component for microphone mode.
    // if (isMicrophoneListening) {
    //    return (
    //     <div className={containerClasses}>
    //        <svg className="w-12 h-12 text-cyber-primary mx-auto mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    //       </svg>
    //       <h2 className="text-lg md:text-xl font-semibold text-cyber-primary">Listening via Microphone</h2>
    //       <p className="text-xs text-gray-400 mt-1">Visuals reacting to live audio.</p>
    //     </div>
    //   );
    // }
    return null; 
  }

  return null; 
};