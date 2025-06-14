
import React from 'react';

interface SpotifyAuthButtonProps {
  isConnected: boolean;
  onClick: () => void;
}

export const SpotifyAuthButton: React.FC<SpotifyAuthButtonProps> = ({ isConnected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105
                  ${isConnected 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50' 
                    : 'bg-cyber-primary hover:bg-cyber-secondary text-cyber-bg shadow-lg shadow-cyber-primary/50'
                  }`}
    >
      {isConnected ? 'Disconnect (Mock)' : 'Connect Spotify (Mock)'}
    </button>
  );
};
