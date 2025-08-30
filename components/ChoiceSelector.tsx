
import React from 'react';

interface ChoiceSelectorProps {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
}

const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({ count, currentIndex, onSelect }) => {
  if (count <= 1) {
    return null;
  }
  
  return (
    <div className="flex justify-center space-x-2 mb-4">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`w-10 h-2 rounded-full transition-colors ${
            currentIndex === index ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
          }`}
          aria-label={`View recipe choice ${index + 1}`}
          aria-current={currentIndex === index}
        />
      ))}
    </div>
  );
};

export default ChoiceSelector;
