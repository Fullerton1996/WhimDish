
// This is a Netlify Function that acts as a secure proxy to the Gemini API.
// It runs on the server, so it can safely access the API_KEY.

// In a real project, you would install these types via npm.
// We assume they are available in the execution environment.
type Handler = (event: any, context: any) => Promise<{ statusCode: number; body: string; headers?: any; }>;
import { GoogleGenAI, Type } from "@google/genai";

// This defines the schema for a single recipe object.
const singleRecipeSchema = {
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

// The API is now expected to return an array of recipe objects.
const recipeSchema = {
    type: Type.ARRAY,
    items: singleRecipeSchema,
};

// Initialize the AI client once per function instance.
let ai: GoogleGenAI;
function getAiClient() {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            // This error will be logged on the server, and a 500 status code will be returned to the client.
            throw new Error("API_KEY is not configured in the environment.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { prompt } = body;

        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing prompt in request body' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const client = getAiClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 0.9,
            },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
             return {
                statusCode: 500,
                body: JSON.stringify({ error: "API returned an empty text response." }),
                headers: { 'Content-Type': 'application/json' },
            };
        }
        
        // Return the JSON text directly from the Gemini API
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: jsonText,
        };

    } catch (error: unknown) {
        console.error("Error in serverless function:", error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};

export { handler };