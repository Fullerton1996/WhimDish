import React, { useState, useRef } from 'react';
import { Recipe } from '../types';
import { ServingAdjuster } from './ServingAdjuster';

interface SavedRecipeItemProps {
  recipe: Recipe;
  onUpdateRecipe: (id: string, updatedData: Partial<Omit<Recipe, 'id'>>) => void;
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

export const SavedRecipeItem: React.FC<SavedRecipeItemProps> = ({ recipe, onUpdateRecipe }) => {
  const [servings, setServings] = useState(recipe.servings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onUpdateRecipe(recipe.id, { userImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <details className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      <summary className="font-semibold text-lg text-gray-700 list-none flex justify-between items-center">
        <span>{recipe.recipeName}</span>
        <span className="text-sm font-normal text-gray-500">{recipe.calories} calories</span>
      </summary>
      <div className="mt-4 pt-4 border-t border-gray-200">
        
        {recipe.userImage ? (
            <img src={recipe.userImage} alt={recipe.recipeName} className="w-full h-48 object-cover rounded-md mb-4" />
        ) : (
            <div className="text-center mb-4">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-hidden="true"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200 transition-colors text-sm"
                >
                    Add Photo
                </button>
            </div>
        )}

        <p className="text-gray-600 italic mb-4">{recipe.description}</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-700">Ingredients</h4>
                <ServingAdjuster servings={servings} setServings={setServings} />
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {recipe.ingredients.map((ing, i) => {
                const adjustedQuantity = (ing.quantity / recipe.servings) * servings;
                return <li key={i}>{formatQuantity(adjustedQuantity)} {ing.unit} {ing.name}</li>
              })}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        </div>
      </div>
    </details>
  );
};
