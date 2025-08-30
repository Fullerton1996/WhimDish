
import { Recipe, MealType, CalorieMode } from '../types';

// This error class is kept for type consistency in App.tsx, but it will no longer be thrown from this service.
// The proxy will return a generic error if the API key is missing on the server.
export class MissingApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

const callApiProxy = async (prompt: string): Promise<Omit<Recipe, 'id'>[]> => {
  try {
    // Requests are now sent to our secure Netlify function
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response from proxy' }));
      throw new Error(errorBody.error || `Request to API proxy failed with status ${response.status}`);
    }

    const recipeData = await response.json();
    
    // Client-side validation to ensure we received an array of recipes.
    if (!Array.isArray(recipeData)) {
        console.error("API proxy response was not an array of recipes:", recipeData);
        throw new Error("Invalid recipe format received from API proxy.");
    }
    
    return recipeData as Omit<Recipe, 'id'>[];

  } catch (error) {
    console.error("Error calling API proxy or processing its response:", error);
    // Re-throw the original error to propagate specific messages to the UI
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
    
  return callApiProxy(prompt);
}

export async function adjustRecipe(recipe: Recipe, adjustment: string): Promise<Omit<Recipe, 'id'>> {
  const prompt = `
      You are a recipe modification assistant. Your task is to modify a given JSON recipe based on a user's request and return the complete, updated recipe as a single JSON object.

      Original Recipe (JSON format):
      ${JSON.stringify(recipe, null, 2)}

      User's Adjustment Request: "${adjustment}"

      Instructions:
      1. Modify the recipe (name, description, ingredients, instructions) to fulfill the user's request.
      2. Recalculate the total 'calories' based on the ingredient changes.
      3. Keep 'servings' and 'mealType' the same unless explicitly requested.
  `;
  
  // The adjust endpoint on the server will return a single object, not an array.
  // We wrap it in an array to satisfy the type of callApiProxy, then unwrap it.
  // This is a simplification to reuse the proxy function. A better implementation might have a separate proxy function.
  const result = await callApiProxy(prompt);
  if (!result || result.length === 0) {
      throw new Error("Failed to receive adjusted recipe from the server.");
  }
  return result[0];
}
