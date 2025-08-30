
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, MealType } from '../types';

// Lazily initialize the AI client to avoid crashing on module load if API key is missing
let ai: GoogleGenAI;
function getAiClient() {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            // This error will be caught by the calling function and displayed in the UI
            throw new Error("API_KEY is not configured in the environment.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    recipeName: {
      type: Type.STRING,
      description: "The name of the recipe."
    },
    description: {
      type: Type.STRING,
      description: "A short, gentle, and encouraging description of the dish, highlighting its health benefits."
    },
    calories: {
      type: Type.INTEGER,
      description: "Estimated total calories for the entire recipe."
    },
    servings: {
      type: Type.INTEGER,
      description: "The number of people this recipe serves."
    },
    mealType: {
        type: Type.STRING,
        description: "The category of the meal. Must be one of: 'breakfast', 'lunch', or 'dinner'."
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The name of the ingredient."},
          quantity: { type: Type.NUMBER, description: "The numeric quantity of the ingredient."},
          unit: { type: Type.STRING, description: "The unit of measurement (e.g., 'g', 'ml', 'cup', 'tbsp')."}
        },
        required: ["name", "quantity", "unit"]
      }
    },
    instructions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "A single step in the cooking instructions."
      }
    }
  },
  required: ["recipeName", "description", "calories", "servings", "mealType", "ingredients", "instructions"]
};

const callGemini = async (prompt: string): Promise<Omit<Recipe, 'id'>> => {
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        temperature: 0.9,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
        throw new Error("API returned an empty text response.");
    }

    const recipeData = JSON.parse(jsonText);

    if (!recipeData.recipeName || !Array.isArray(recipeData.ingredients) || !recipeData.servings || !['breakfast', 'lunch', 'dinner'].includes(recipeData.mealType)) {
        console.error("API response failed validation:", recipeData);
        throw new Error("Invalid recipe format received from API.");
    }

    return recipeData as Omit<Recipe, 'id'>;
  } catch (error) {
    console.error("Error in callGemini:", error);
    if (error instanceof SyntaxError) {
        console.error("Failed to parse JSON response from API.");
    }
    throw new Error("Could not process request. The API may have returned an error or an invalid recipe format.");
  }
}

export async function generateRecipe(mealType: MealType, mood?: string): Promise<Omit<Recipe, 'id'>> {
  let prompt = `
    Generate a single, creative, low-calorie recipe suitable for weight loss.
    The recipe should be simple, delicious, and come from a diverse global cuisine to avoid common flavor profiles.
    The meal type must be '${mealType}'.
  `;

  if (mood) {
    prompt += ` The recipe must also fit the following theme, ingredients, or mood: "${mood}".`;
  }
  
  prompt += `\n\nYour response MUST be only a JSON object that conforms to the provided schema. Do not include any other text or markdown formatting.`;
  
  return callGemini(prompt);
}

export async function adjustRecipe(recipe: Recipe, adjustment: string): Promise<Omit<Recipe, 'id'>> {
  const prompt = `
      You are a recipe modification assistant. Your task is to modify a given JSON recipe based on a user's request and return the complete, updated recipe.

      Original Recipe (JSON format):
      ${JSON.stringify(recipe, null, 2)}

      User's Adjustment Request: "${adjustment}"

      Instructions:
      1. Modify the recipe (name, description, ingredients, instructions) to fulfill the user's request.
      2. Recalculate the total 'calories' based on the ingredient changes.
      3. Keep 'servings' and 'mealType' the same unless explicitly requested.
      4. Your entire response MUST be ONLY the updated recipe as a single JSON object. Do not wrap it in markdown formatting or add any introductory text or explanations.
  `;
  
  return callGemini(prompt);
}
