// This function is now an Open Router proxy.
// The filename remains "gemini.ts" to avoid breaking the frontend call, but the implementation is for Open Router.

type Handler = (event: any, context: any) => Promise<{ statusCode: number; body: string; headers?: any; }>;

const API_KEY = process.env.OPENROUTER_API_KEY;

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    if (!API_KEY) {
        console.error("Open Router API key is not configured.");
        return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: Missing API key.' }) };
    }

    try {
        const { prompt } = JSON.parse(event.body || '{}');
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt in request body' }) };
        }

        const isAdjustment = prompt.includes("Original Recipe");

        const typeSchema = `
          // IMPORTANT: Your entire response must be ONLY the raw JSON, with no markdown, comments, or other text.
          interface Ingredient {
            name: string;
            quantity: number;
            unit: string;
          }

          interface Recipe {
            recipeName: string;
            description: string;
            calories: number;
            servings: number;
            ingredients: Ingredient[];
            instructions: string[]; // Array of step-by-step instructions.
            mealType: 'breakfast' | 'lunch' | 'dinner';
          }
        `;

        const systemInstruction = isAdjustment
          ? `You are a recipe modification API. You MUST return a single, valid JSON object that perfectly matches the 'Recipe' interface. Do NOT add any text before or after the JSON object. ${typeSchema} Your entire response must be the raw JSON object.`
          : `You are a recipe generation API. You MUST return a single, valid JSON array containing exactly 3 'Recipe' objects. Do NOT add any text before or after the JSON array. ${typeSchema} Your entire response must be the raw JSON array.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://whimdish.netlify.app", // Replace with your site URL
                "X-Title": "WhimDish", // Replace with your site name
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct",
                messages: [
                    { "role": "system", "content": systemInstruction },
                    { "role": "user", "content": prompt }
                ],
                // Removed response_format as it was causing conflicts and was not reliable.
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Open Router API error: ${response.status}`, errorText);
            return { statusCode: response.status, body: JSON.stringify({ error: `Failed to fetch from Open Router: ${errorText}` }) };
        }
        
        const jsonResponse = await response.json();
        const content = jsonResponse.choices[0].message.content;

        // Models can be unreliable and wrap JSON in markdown or add conversational text.
        // This regex will find the first JSON object or array in the response string.
        const jsonMatch = content.match(/(\[.*\]|\{.*\})/s);

        if (!jsonMatch) {
            console.error("Malformed response from AI:", content);
            throw new Error("The recipe data returned by the AI was not in a recognizable format. Please try again.");
        }

        const jsonString = jsonMatch[0];
        let finalJson;

        try {
            finalJson = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse JSON from AI response:", parseError);
            console.error("Original string that failed parsing:", jsonString);
            throw new Error("There was an issue decoding the recipe data from the AI. Please try again.");
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalJson),
        };

    } catch (error: unknown) {
        console.error("Error in Open Router proxy function:", error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        return { statusCode: 500, body: JSON.stringify({ error: `An internal server error occurred in the proxy function: ${errorMessage}` }) };
    }
};

export { handler };