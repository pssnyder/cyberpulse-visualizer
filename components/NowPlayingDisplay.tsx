import React from 'react';
import { Song, AudioSource, SongIdentificationStatus } from '../types';
import { PLACEHOLDER_ALBUM_ART } from '../constants';

interface NowPlayingDisplayProps {
  song: Song | null;
  audioSource: AudioSource;
  isMicrophoneListening?: boolean;
  microphoneError?: string | null;
  identificationStatus?: SongIdentificationStatus;
}

export const NowPlayingDisplay: React.FC<NowPlayingDisplayProps> = ({ 
  song, 
  audioSource, 
  isMicrophoneListening, 
  microphoneError, 
  identificationStatus 
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

    if (identificationStatus === 'identifying') {
      return (
        <div className={containerClasses}>
          <div className="animate-pulse flex flex-col items-center">
            <svg className="w-12 h-12 text-cyber-primary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <h2 className="text-lg md:text-xl font-semibold text-cyber-primary">Identifying Song...</h2>
            <p className="text-xs text-gray-400 mt-1">Please wait</p>
          </div>
        </div>
      );
    }
    
    if (identificationStatus === 'failed') {
       return (
        <div className={containerClasses}>
          <svg className="w-12 h-12 text-yellow-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg md:text-xl font-semibold text-yellow-400">Song Identification Failed</h2>
          <p className="text-xs text-gray-400 mt-1">Could not identify the song. Visuals will continue.</p>
        </div>
      );
    }

    if (identificationStatus === 'identified' && song) {
      return (
        <div className={`${containerClasses} transform hover:scale-105`}>
          <img 
            src={song.albumArtUrl || PLACEHOLDER_ALBUM_ART} 
            alt={`${song.title} album art`} 
            className="w-36 h-36 md:w-48 md:h-48 rounded-lg mx-auto mb-4 shadow-lg border-2 border-cyber-secondary/70 object-cover" 
          />
          <h2 className="text-lg md:text-xl font-semibold text-cyber-primary truncate" title={song.title} style={{textShadow: '0 0 3px #2DE2E6'}}>
            {song.title}
          </h2>
          <p className="text-sm md:text-md text-cyber-accent opacity-90 truncate" title={song.artist}>{song.artist}</p>
          {song.album && <p className="text-xs md:text-sm text-gray-400 truncate" title={song.album}>{song.album}</p>}
          <p className="text-xs text-gray-500 mt-2">Identified via Microphone</p>
        </div>
      );
    }
    
    // Default for 'idle' or 'stopped' microphone, or if listening but no status yet and no song
    if (isMicrophoneListening && (identificationStatus === 'idle' || identificationStatus === 'stopped')) {
       return (
        <div className={containerClasses}>
           <svg className="w-12 h-12 text-cyber-primary mx-auto mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <h2 className="text-lg md:text-xl font-semibold text-cyber-primary">Listening via Microphone</h2>
          <p className="text-xs text-gray-400 mt-1">Visuals reacting to live audio.</p>
        </div>
      );
    }

    return null; // Fallback for other mic states or if not listening
  }


  if (audioSource === 'spotify' && song) {
    return (
      <div className={`${containerClasses} transform hover:scale-105`}>
        <img 
          src={song.albumArtUrl} 
          alt={`${song.title} album art`} 
          className="w-48 h-48 md:w-56 md:h-56 rounded-lg mx-auto mb-4 shadow-lg border-2 border-cyber-secondary/70 object-cover" 
        />
        <h2 className="text-xl md:text-2xl font-semibold text-cyber-primary truncate" title={song.title} style={{textShadow: '0 0 3px #2DE2E6'}}>
          {song.title}
        </h2>
        <p className="text-md md:text-lg text-cyber-accent opacity-90 truncate" title={song.artist}>{song.artist}</p>
        {song.album && <p className="text-xs md:text-sm text-gray-400 truncate" title={song.album}>{song.album}</p>}
      </div>
    );
  }

  return null; 
};
