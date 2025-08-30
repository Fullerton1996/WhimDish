import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, MealType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        temperature: 0.9,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonText = response.text.trim();
    const recipeData = JSON.parse(jsonText);

    if (!recipeData.recipeName || !Array.isArray(recipeData.ingredients) || !recipeData.servings || !['breakfast', 'lunch', 'dinner'].includes(recipeData.mealType)) {
        throw new Error("Invalid recipe format received from API.");
    }

    return recipeData as Omit<Recipe, 'id'>;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Could not process request. The API returned an error.");
  }
}

export async function generateRecipe(mealType: MealType, mood?: string): Promise<Omit<Recipe, 'id'>> {
  let prompt = `Generate a single, creative, low-calorie ${mealType} recipe that is delicious and helpful for weight loss.`;
  if (mood) {
    prompt += ` The recipe should fit the following theme, ingredients, or mood: "${mood}".`;
  }
  prompt += ` Ensure the recipe comes from a diverse range of global cuisines to provide variety and avoid repetition of common flavor profiles like 'zesty lemon herb'. The recipe should be simple to make. Provide a calorie estimate for the whole dish.`;
  
  return callGemini(prompt);
}

export async function adjustRecipe(recipe: Recipe, adjustment: string): Promise<Omit<Recipe, 'id'>> {
  const prompt = `
      Given the following JSON recipe object:
      ${JSON.stringify(recipe, null, 2)}

      Please adjust this recipe based on the following user request: "${adjustment}".

      Important:
      - Modify the recipe name, description, ingredients, and instructions as needed to fulfill the request.
      - Recalculate the total calories based on the changes.
      - Keep the 'servings' and 'mealType' the same unless the user explicitly asks to change them.
      - Your response MUST be only the updated recipe in the exact same JSON format as the input, conforming to the provided schema. Do not include any extra text or explanation.
  `;
  
  return callGemini(prompt);
}