import React from 'react';
import { CalorieMode } from '../types';

interface CalorieModeSelectorProps {
  selectedMode: CalorieMode;
  onSelectMode: (mode: CalorieMode) => void;
}

const calorieModes: { mode: CalorieMode; label: string }[] = [
  { mode: 'low-cal', label: 'Low-Calorie' },
  { mode: 'nutritional', label: 'Nutritional' },
  { mode: 'treat-day', label: 'Treat Day' },
];

const CalorieModeSelector: React.FC<CalorieModeSelectorProps> = ({ selectedMode, onSelectMode }) => {
  return (
    <div className="flex justify-center space-x-2 mb-4 bg-gray-200 p-1 rounded-full">
      {calorieModes.map(({ mode, label }) => (
        <button
          key={mode}
          onClick={() => onSelectMode(mode)}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
            selectedMode === mode
              ? 'bg-white text-blue-600 shadow'
              : 'bg-transparent text-gray-600 hover:bg-gray-300'
          }`}
          aria-pressed={selectedMode === mode}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default CalorieModeSelector;
