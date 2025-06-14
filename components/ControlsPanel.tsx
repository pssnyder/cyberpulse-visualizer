
import React from 'react';
import { Slider } from './Slider';
import { SliderConfig } from '../types';

interface ControlsPanelProps {
  sliders: SliderConfig[];
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({ sliders }) => {
  return (
    <div className="bg-cyber-bg-light backdrop-blur-md p-4 md:p-6 rounded-lg shadow-2xl w-full max-w-lg mx-auto">
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {sliders.map(slider => (
          <Slider
            key={slider.id}
            id={slider.id}
            label={slider.label}
            min={slider.min}
            max={slider.max}
            value={slider.value}
            onChange={slider.onChange}
          />
        ))}
      </div>
    </div>
  );
};
