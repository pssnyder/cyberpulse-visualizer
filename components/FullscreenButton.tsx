import React from 'react';

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onClick: () => void;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ isFullscreen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg text-white hover:bg-cyber-accent/50 transition-colors duration-200"
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      <svg className="w-6 h-6" fill="currentColor">
        {isFullscreen ? <use href="#icon-fullscreen-exit" /> : <use href="#icon-fullscreen-enter" />}
      </svg>
    </button>
  );
};
