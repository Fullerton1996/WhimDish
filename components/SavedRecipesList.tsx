
import React from 'react';
import { Recipe } from '../types';
import { SavedRecipeItem } from './SavedRecipeItem';

interface SavedRecipesListProps {
  savedRecipes: Recipe[];
  onUpdateRecipe: (id: string, updatedData: Partial<Omit<Recipe, 'id'>>) => void;
  onDeleteRecipe: (id: string) => void;
}

const SavedRecipesList: React.FC<SavedRecipesListProps> = ({ savedRecipes, onUpdateRecipe, onDeleteRecipe }) => {
  if (savedRecipes.length === 0) {
    return (
      <div className="text-center text-gray-500">
        <h2 className="text-2xl font-semibold mb-2">No Saved Recipes</h2>
        <p>Start discovering to save your favorite healthy meals!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Your Saved Recipes</h2>
      {savedRecipes.map((recipe) => (
        <SavedRecipeItem key={recipe.id} recipe={recipe} onUpdateRecipe={onUpdateRecipe} onDelete={() => onDeleteRecipe(recipe.id)} />
      ))}
    </div>
  );
};

export default SavedRecipesList;
