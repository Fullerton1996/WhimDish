// This is a Netlify Function that acts as a secure proxy to the Open Router API.
// It runs on the server, so it can safely access the API_KEY.

type Handler = (event: any, context: any) => Promise<{ statusCode: number; body: string; headers?: any; }>;

// System prompt to guide the model to return the correct JSON structure.
const SYSTEM_PROMPT = `
You are a recipe generation API. Your sole purpose is to return a valid JSON object. Do not include any text, explanations, or markdown formatting like \`\`\`json outside of the JSON object itself.

The JSON object you return depends on the user's request.

1.  If the user asks for an ARRAY of recipes, the JSON object must have a single key, "recipes", which is an array containing exactly 3 distinct recipe objects.
2.  If the user provides an "Original Recipe" and asks for an "Adjustment", you must return a SINGLE recipe JSON object, not an array or a wrapped object.

Each recipe object, whether in an array or standalone, must conform to the following TypeScript interface:
\`\`\`typescript
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  recipeName: string;
  description: string;
  calories: number; // Total calories for the entire recipe
  servings: number;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  ingredients: Ingredient[];
  instructions: string[];
}
\`\`\`
CRITICAL: Adhere strictly to the requested response format (an array of 3 wrapped in a "recipes" object, OR a single recipe object).
`;

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

        const openRouterPayload = {
            model: "nousresearch/nous-hermes-2-mistral-7b-dpo", // A valid, cheap, and efficient model
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.8,
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(openRouterPayload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Open Router API error: ${response.status}`, errorBody);
            return { statusCode: response.status, body: JSON.stringify({ error: `Failed to fetch from Open Router: ${errorBody}` }) };
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        
        if (!content) {
            return { statusCode: 500, body: JSON.stringify({ error: "Invalid response structure from Open Router API." }) };
        }

        // The model's response is a JSON string. We parse it to get the object.
        const responseObject = JSON.parse(content);

        // Determine whether to return an array of recipes or a single adjusted recipe.
        // The presence of the "recipes" key indicates a request for 3 new recipes.
        const responseBody = responseObject.recipes ? responseObject.recipes : responseObject;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responseBody),
        };

    } catch (error: unknown) {
        console.error("Error in serverless function:", error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        return { statusCode: 500, body: JSON.stringify({ error: errorMessage }) };
    }
};

export { handler };