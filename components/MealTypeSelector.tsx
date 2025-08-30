import React from 'react';
import { MealType } from '../types';

interface MealTypeSelectorProps {
  selectedMeal: MealType;
  onSelectMeal: (meal: MealType) => void;
}

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

const MealTypeSelector: React.FC<MealTypeSelectorProps> = ({ selectedMeal, onSelectMeal }) => {
  return (
    <div className="flex justify-center space-x-2 mb-6 bg-gray-200 p-1 rounded-full">
      {mealTypes.map((meal) => (
        <button
          key={meal}
          onClick={() => onSelectMeal(meal)}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 capitalize ${
            selectedMeal === meal
              ? 'bg-white text-blue-600 shadow'
              : 'bg-transparent text-gray-600 hover:bg-gray-300'
          }`}
          aria-pressed={selectedMeal === meal}
        >
          {meal}
        </button>
      ))}
    </div>
  );
};

export default MealTypeSelector;
