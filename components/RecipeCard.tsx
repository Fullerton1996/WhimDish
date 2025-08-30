import React, { useState } from 'react';
import { Recipe } from '../types';
import { ServingAdjuster } from './ServingAdjuster';

interface RecipeCardProps {
  recipe: Recipe;
  onAdjust: (adjustment: string) => void;
  isAdjusting: boolean;
}

const formatQuantity = (quantity: number): string => {
  if (quantity === 0) return "0";
  if (quantity < 0.1) return quantity.toFixed(2);
  if (quantity < 1) {
    if (Math.abs(quantity - 0.25) < 0.01) return "1/4";
    if (Math.abs(quantity - 0.5) < 0.01) return "1/2";
    if (Math.abs(quantity - 0.75) < 0.01) return "3/4";
    if (Math.abs(quantity - 0.33) < 0.01) return "1/3";
    if (Math.abs(quantity - 0.66) < 0.01) return "2/3";
  }
  return Number(quantity.toFixed(1)).toString();
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onAdjust, isAdjusting }) => {
  const [servings, setServings] = useState(recipe.servings);
  const [adjustment, setAdjustment] = useState('');

  const handleAdjustClick = () => {
    if (adjustment.trim() && !isAdjusting) {
        onAdjust(adjustment.trim());
        setAdjustment('');
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6 flex-grow flex flex-col overflow-hidden animate-fade-in">
      <div className="text-center border-b border-gray-200 pb-4 pt-4 relative">
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
          {recipe.mealType}
        </span>
        <h2 className="text-2xl font-bold text-gray-800">{recipe.recipeName}</h2>
        <p className="text-sm text-gray-500 mt-1">{Math.round(recipe.calories / recipe.servings * servings)} calories for {servings} serving(s)</p>
      </div>
      
      <div className="overflow-y-auto pr-2 space-y-6 flex-grow">
          <p className="text-gray-600 italic text-center">{recipe.description}</p>
          
          <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-700">Ingredients</h3>
                <ServingAdjuster servings={servings} setServings={setServings} />
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {recipe.ingredients.map((ingredient, index) => {
                const adjustedQuantity = (ingredient.quantity / recipe.servings) * servings;
                return (
                    <li key={index}>
                        {formatQuantity(adjustedQuantity)} {ingredient.unit} {ingredient.name}
                    </li>
                )
              })}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              {recipe.instructions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Make it your own</h3>
        <p className="text-sm text-gray-500 mb-3 text-center">e.g., "swap chicken for tofu" or "make it spicier"</p>
        <div className="flex space-x-2">
            <input
                type="text"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="Request a change..."
                className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isAdjusting}
            />
            <button 
                onClick={handleAdjustClick} 
                disabled={isAdjusting || !adjustment.trim()}
                className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
                {isAdjusting ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : 'Adjust'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;