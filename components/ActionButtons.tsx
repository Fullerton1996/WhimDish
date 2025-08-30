
import React from 'react';
import { HeartIcon } from './icons/HeartIcon';
import { NextIcon } from './icons/NextIcon';

interface ActionButtonsProps {
  onSave: () => void;
  onNext: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onSave, onNext }) => {
  return (
    <div className="flex items-center justify-center space-x-8 mt-8">
      <button
        onClick={onNext}
        className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 transition-all duration-300 transform hover:scale-110"
        aria-label="Next Recipe"
      >
        <NextIcon />
      </button>
      <button
        onClick={onSave}
        className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-green-100 transition-all duration-300 transform hover:scale-110"
        aria-label="Save Recipe"
      >
        <HeartIcon />
      </button>
    </div>
  );
};

export default ActionButtons;
