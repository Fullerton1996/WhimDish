import React, { useState, useEffect, useCallback } from 'react';
import { Recipe, MealType } from './types';
import { generateRecipe, adjustRecipe } from './services/geminiService';
import Header from './components/Header';
import RecipeCard from './components/RecipeCard';
import SavedRecipesList from './components/SavedRecipesList';
import LoadingSpinner from './components/LoadingSpinner';
import ActionButtons from './components/ActionButtons';
import MealTypeSelector from './components/MealTypeSelector';
import MoodPromptInput from './components/MoodPromptInput';

type View = 'discover' | 'saved';

const App: React.FC = () => {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('discover');
  const [mealType, setMealType] = useState<MealType>('lunch');

  const fetchNewRecipe = useCallback(async (currentMealType: MealType, mood?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const recipeData = await generateRecipe(currentMealType, mood);
      setCurrentRecipe({ ...recipeData, id: Date.now().toString() });
    } catch (err) {
      setError('Failed to generate a recipe. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewRecipe(mealType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    if (currentRecipe && !savedRecipes.some(r => r.id === currentRecipe.id)) {
      setSavedRecipes(prev => [currentRecipe, ...prev]);
      fetchNewRecipe(mealType);
    }
  };

  const handleNext = () => {
    fetchNewRecipe(mealType);
  };

  const handleMealSelect = (newMealType: MealType) => {
    setMealType(newMealType);
    fetchNewRecipe(newMealType);
  };

  const handleGenerateFromMood = (mood: string) => {
    fetchNewRecipe(mealType, mood);
  };
  
  const handleAdjustRecipe = async (adjustment: string) => {
    if (!currentRecipe) return;
    setIsAdjusting(true);
    setError(null);
    try {
        const adjustedRecipeData = await adjustRecipe(currentRecipe, adjustment);
        // Use the old ID to maintain continuity for the saved state
        setCurrentRecipe({ ...adjustedRecipeData, id: currentRecipe.id });
    } catch (err) {
        setError('Failed to adjust the recipe. Please try again.');
        console.error(err);
    } finally {
        setIsAdjusting(false);
    }
  };

  const handleUpdateSavedRecipe = (id: string, updatedData: Partial<Omit<Recipe, 'id'>>) => {
    setSavedRecipes(prev => 
      prev.map(recipe => 
        recipe.id === id ? { ...recipe, ...updatedData } : recipe
      )
    );
  };
  
  const renderContent = () => {
    if (view === 'saved') {
      return <SavedRecipesList savedRecipes={savedRecipes} onUpdateRecipe={handleUpdateSavedRecipe} />;
    }

    if (isLoading) {
      return <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>;
    }

    if (error) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <p className="text-red-500 text-lg">{error}</p>
                <button 
                    onClick={() => fetchNewRecipe(mealType)}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md flex flex-col items-center">
            <MoodPromptInput onGenerate={handleGenerateFromMood} isLoading={isLoading} />
            <MealTypeSelector selectedMeal={mealType} onSelectMeal={handleMealSelect} />
            {currentRecipe && (
                <>
                    <RecipeCard 
                        recipe={currentRecipe} 
                        onAdjust={handleAdjustRecipe}
                        isAdjusting={isAdjusting}
                    />
                    <ActionButtons onSave={handleSave} onNext={handleNext} />
                </>
            )}
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentView={view} setView={setView} />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;