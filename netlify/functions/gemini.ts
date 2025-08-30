import { GoogleGenAI, Type } from '@google/genai';

type Handler = (event: any, context: any) => Promise<{ statusCode: number; body: string; headers?: any; }>;

// The API key is now expected as 'API_KEY' from environment variables.
const API_KEY = process.env.API_KEY;

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: { type: Type.STRING, description: "The name of the recipe." },
        description: { type: Type.STRING, description: "A brief, enticing description of the dish." },
        calories: { type: Type.NUMBER, description: "Total calories for the entire recipe, as a whole number." },
        servings: { type: Type.INTEGER, description: "The number of servings this recipe makes." },
        ingredients: {
            type: Type.ARRAY,
            description: "A list of ingredients.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the ingredient." },
                    quantity: { type: Type.NUMBER, description: "Amount of the ingredient." },
                    unit: { type: Type.STRING, description: "Unit of measurement (e.g., 'cup', 'g', 'tbsp')." },
                },
                required: ['name', 'quantity', 'unit'],
            },
        },
        instructions: {
            type: Type.ARRAY,
            description: "Step-by-step cooking instructions.",
            items: { type: Type.STRING },
        },
        mealType: { type: Type.STRING, enum: ['breakfast', 'lunch', 'dinner'], description: "The type of meal." },
    },
    required: ['recipeName', 'description', 'calories', 'servings', 'ingredients', 'instructions', 'mealType'],
};

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    if (!API_KEY) {
        console.error("Gemini API key is not configured.");
        return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: Missing API key.' }) };
    }

    try {
        const { prompt } = JSON.parse(event.body || '{}');
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt in request body' }) };
        }

        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const isAdjustment = prompt.includes("Original Recipe");

        const systemInstruction = isAdjustment 
            ? "You are an expert chef who modifies recipes based on user requests. Return only the adjusted recipe in the specified JSON format."
            : "You are an expert chef and nutritionist who creates delicious recipes. For recipe generation, you must always return an array of exactly 3 recipes in the specified JSON format.";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: isAdjustment ? recipeSchema : { type: Type.ARRAY, items: recipeSchema },
            },
        });
        
        const responseText = response.text.trim();
        
        // The response from Gemini with responseSchema should be valid JSON, but we'll parse to be sure.
        let finalJson;
        try {
            finalJson = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini response:", parseError);
            console.error("Original string that failed parsing:", responseText);
            throw new Error("The recipe data returned by the AI was not in a recognizable JSON format.");
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalJson),
        };

    } catch (error: unknown) {
        console.error("Error in Gemini proxy function:", error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        return { statusCode: 500, body: JSON.stringify({ error: `An internal server error occurred in the proxy function: ${errorMessage}` }) };
    }
};

export { handler };