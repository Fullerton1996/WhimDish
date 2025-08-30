// This is a Netlify Function that acts as a secure proxy to the Open Router API.
// It uses a fast model to address performance concerns.

type Handler = (event: any, context: any) => Promise<{ statusCode: number; body: string; headers?: any; }>;

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("Open Router API key is not configured.");
        return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: Missing API key.' }) };
    }

    try {
        const { prompt } = JSON.parse(event.body || '{}');
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt in request body' }) };
        }

        const isAdjustment = prompt.includes("Original Recipe");

        const schema = `
          The JSON output MUST conform to the following TypeScript interfaces:

          interface Ingredient {
            name: string; // e.g., "all-purpose flour"
            quantity: number; // e.g., 1.5
            unit: string; // e.g., "cup" or "grams"
          }

          interface Recipe {
            recipeName: string;
            description: string;
            calories: number; // Total calories for the ENTIRE recipe (all servings)
            servings: number; // The number of servings the recipe yields
            ingredients: Ingredient[];
            instructions: string[]; // An array of steps
            mealType: 'breakfast' | 'lunch' | 'dinner';
          }
        `;

        const systemInstruction = isAdjustment
            ? `You are a recipe modification assistant. Your task is to modify a given JSON recipe based on a user's request. Return only the complete, updated recipe as a single valid JSON object. Do not return an array or any wrapping text, markdown, or explanations. Only the JSON object is allowed. ${schema}`
            : `You are a recipe generation API. Your sole purpose is to return a valid JSON array of 3 distinct recipe objects based on the user's request. Do not include any text, explanations, or markdown formatting outside of the JSON array itself. The response must be only the JSON array. Each object in the array must conform to the schema. ${schema}`;
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://whimdish.netlify.app", 
                "X-Title": "WhimDish",
            },
            body: JSON.stringify({
                model: "mythologic/m-mythomax-l2-13b", 
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Open Router Error:", errorBody);
            try {
                const parsedError = JSON.parse(errorBody);
                const errorMessage = parsedError.error?.message || `Request to Open Router failed with status ${response.status}`;
                return { statusCode: response.status, body: JSON.stringify({ error: `Failed to fetch from Open Router: ${errorMessage}` }) };
            } catch (e) {
                 return { statusCode: response.status, body: JSON.stringify({ error: `Failed to fetch from Open Router: ${errorBody}` }) };
            }
        }

        const data = await response.json();
        const jsonContent = data.choices[0]?.message?.content;
        
        if (!jsonContent) {
            return { statusCode: 500, body: JSON.stringify({ error: "Invalid response structure from Open Router: no content." }) };
        }

        try {
            JSON.parse(jsonContent);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: jsonContent,
            };
        } catch (parseError) {
            console.error("Failed to parse JSON from model response:", parseError);
            console.error("Model response was:", jsonContent);
            return { statusCode: 500, body: JSON.stringify({ error: "The model returned an invalid JSON format. Please try again." }) };
        }

    } catch (error: unknown) {
        console.error("Error in Open Router function:", error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
         if (typeof errorMessage === 'string' && (errorMessage.includes('API key') || errorMessage.includes('authentication'))) {
            return { statusCode: 401, body: JSON.stringify({ error: `The provided API key is invalid or missing. Details: ${errorMessage}` }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: `An internal server error occurred in the proxy function: ${errorMessage}` }) };
    }
};

export { handler };