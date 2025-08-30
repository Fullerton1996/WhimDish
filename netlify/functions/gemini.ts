// This is a Netlify Function that acts as a secure proxy to the Google Gemini API.
// It runs on the server, so it can safely access the API_KEY.

import { GoogleGenAI, Type } from "@google/genai";

type Handler = (event: any, context: any) => Promise<{ statusCode: number; body: string; headers?: any; }>;

// Define the schema for the recipe data to ensure the AI returns structured JSON.
const ingredientSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        quantity: { type: Type.NUMBER },
        unit: { type: Type.STRING },
    },
    required: ["name", "quantity", "unit"],
};

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: { type: Type.STRING },
        description: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        servings: { type: Type.NUMBER },
        mealType: { type: Type.STRING, enum: ['breakfast', 'lunch', 'dinner'] },
        ingredients: {
            type: Type.ARRAY,
            items: ingredientSchema,
        },
        instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
    },
    required: ["recipeName", "description", "calories", "servings", "mealType", "ingredients", "instructions"],
};

const recipeArraySchema = {
    type: Type.ARRAY,
    items: recipeSchema,
};


const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("Gemini API key is not configured.");
        return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: Missing API key.' }) };
    }

    try {
        const { prompt } = JSON.parse(event.body || '{}');
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt in request body' }) };
        }

        const ai = new GoogleGenAI({ apiKey });

        // Determine if this is an adjustment or a generation request to use the correct schema.
        const isAdjustment = prompt.includes("Original Recipe");
        const schema = isAdjustment ? recipeSchema : recipeArraySchema;
        
        const systemInstruction = isAdjustment
            ? "You are a recipe modification assistant. Your task is to modify a given JSON recipe based on a user's request and return only the complete, updated recipe as a single valid JSON object. Do not return an array or any wrapping text."
            : "You are a recipe generation API. Your sole purpose is to return a valid JSON array of 3 distinct recipe objects based on the user's request. Do not include any text, explanations, or markdown formatting outside of the JSON array itself.";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.8,
            },
        });

        const responseText = response.text;
        
        if (!responseText) {
             return { statusCode: 500, body: JSON.stringify({ error: "Invalid response structure from Gemini API." }) };
        }

        // The response from Gemini in JSON mode is a string that needs to be parsed.
        const parsedJson = JSON.parse(responseText);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedJson),
        };

    } catch (error: unknown) {
        console.error("Error in Gemini function:", error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        if (typeof errorMessage === 'string' && errorMessage.includes('API key not valid')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'The provided API key is invalid.' }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: errorMessage }) };
    }
};

export { handler };