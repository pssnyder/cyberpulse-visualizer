
import React from 'react';

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ id, label, min, max, value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <label htmlFor={id} className="text-xs font-semibold text-cyber-primary uppercase tracking-wider">
        {label}
      </label>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="w-full h-2.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-cyber-secondary hover:accent-cyber-primary transition-colors focus:outline-none focus:ring-2 focus:ring-cyber-primary/50"
      />
       <span className="text-xs text-cyber-accent font-mono">{value}</span>
    </div>
  );
};
