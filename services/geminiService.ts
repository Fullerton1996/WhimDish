
import { Recipe, MealType } from '../types';

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
    
    // Basic client-side validation to ensure we received an array.
    if (!Array.isArray(recipeData)) {
        console.error("API proxy response was not an array:", recipeData);
        throw new Error("Invalid recipe format received from API proxy.");
    }
    
    return recipeData as Omit<Recipe, 'id'>[];

  } catch (error) {
    console.error("Error calling API proxy or processing its response:", error);
    // Re-throw the original error to propagate specific messages to the UI
    throw error;
  }
};

export async function generateRecipe(mealType: MealType, mood?: string): Promise<Omit<Recipe, 'id'>[]> {
  let prompt = `
    Generate an array of 3 distinct, creative, low-calorie recipes suitable for weight loss.
    Each recipe should be simple, delicious, and come from a diverse global cuisine to avoid common flavor profiles.
    The meal type for all recipes must be '${mealType}'.
  `;

  if (mood) {
    prompt += ` The recipes must also fit the following theme, ingredients, or mood: "${mood}".`;
  }
  
  prompt += `\n\nCRITICAL: The entire response must be a single, valid JSON array that conforms to the provided schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json.`;
  
  return callApiProxy(prompt);
}

export async function adjustRecipe(recipe: Recipe, adjustment: string): Promise<Omit<Recipe, 'id'>[]> {
  const prompt = `
      You are a recipe modification assistant. Your task is to modify a given JSON recipe based on a user's request and return the complete, updated recipe.

      Original Recipe (JSON format):
      ${JSON.stringify(recipe, null, 2)}

      User's Adjustment Request: "${adjustment}"

      Instructions:
      1. Modify the recipe (name, description, ingredients, instructions) to fulfill the user's request.
      2. Recalculate the total 'calories' based on the ingredient changes.
      3. Keep 'servings' and 'mealType' the same unless explicitly requested.
      4. CRITICAL: The entire response must be a single, valid JSON array containing the single, updated recipe object that conforms to the schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
  `;
  
  return callApiProxy(prompt);
}
