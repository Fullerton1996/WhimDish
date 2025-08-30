
import { Recipe, MealType, CalorieMode } from '../types';

// This error class is kept for type consistency in App.tsx, but it will no longer be thrown from this service.
// The proxy will return a generic error if the API key is missing on the server.
export class MissingApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

const callApiProxy = async <T>(prompt: string): Promise<T> => {
    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response from proxy' }));
            throw new Error(errorBody.error || `Request to API proxy failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error calling API proxy or processing its response:", error);
        throw error;
    }
};

const getPromptDescriptionForMode = (mode: CalorieMode): string => {
  switch (mode) {
    case 'nutritional':
      return 'nutritionally balanced and wholesome recipes. Focus on healthy fats, lean proteins, and complex carbohydrates. Calorie count is secondary to nutritional value.';
    case 'treat-day':
      return "indulgent and delicious 'treat day' recipes. They do not need to be healthy or low-calorie; focus on flavor and satisfaction.";
    case 'low-cal':
    default:
      return 'low-calorie recipes suitable for weight loss.';
  }
}

export async function generateRecipe(mealType: MealType, calorieMode: CalorieMode, mood?: string): Promise<Omit<Recipe, 'id'>[]> {
  const modeDescription = getPromptDescriptionForMode(calorieMode);
  
  let prompt = `
    Generate a distinct array of 3 creative, ${modeDescription}
    The recipes should be simple, delicious, and come from a diverse global cuisine to avoid common flavor profiles.
    The meal type for all recipes must be '${mealType}'.
  `;

  if (mood) {
    prompt += ` The recipes must also fit the following theme, ingredients, or mood: "${mood}".`;
  }
    
  const recipeData = await callApiProxy<Omit<Recipe, 'id'>[]>(prompt);
  
  if (!Array.isArray(recipeData)) {
      console.error("API proxy response was not an array of recipes:", recipeData);
      throw new Error("Invalid recipe format received from API proxy.");
  }
  return recipeData;
}

export async function adjustRecipe(recipe: Recipe, adjustment: string): Promise<Omit<Recipe, 'id'>> {
  const prompt = `
      Original Recipe (JSON format):
      ${JSON.stringify(recipe, null, 2)}

      User's Adjustment Request: "${adjustment}"
  `;
  
  const adjustedRecipe = await callApiProxy<Omit<Recipe, 'id'>>(prompt);
  if (typeof adjustedRecipe !== 'object' || adjustedRecipe === null || Array.isArray(adjustedRecipe)) {
      throw new Error("Failed to receive a valid adjusted recipe object from the server.");
  }
  return adjustedRecipe;
}
