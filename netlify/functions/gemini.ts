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

        // A strict TypeScript interface definition to guide the model.
        const typeSchema = `
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
            instructions: string[];
            mealType: 'breakfast' | 'lunch' | 'dinner';
          }
        `;

        const systemInstruction = isAdjustment
          ? `You are a recipe modification assistant. Modify the given recipe based on the user's request. Return ONLY the complete, updated recipe as a single valid JSON object. ${typeSchema} Your output must be a single Recipe object.`
          : `You are a recipe generation API. Return a valid JSON array of 3 distinct recipe objects based on the user's request. ${typeSchema} Your output must be an array of 3 Recipe objects.`;

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
                response_format: { "type": "json_object" }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Open Router API error: ${response.status}`, errorText);
            return { statusCode: response.status, body: JSON.stringify({ error: `Failed to fetch from Open Router: ${errorText}` }) };
        }
        
        const jsonResponse = await response.json();
        const content = jsonResponse.choices[0].message.content;

        // The model returns a string that is JSON. We need to parse it.
        // And because we requested a json_object, the top-level will be an object.
        // The actual content we want may be inside a property. Let's find it.
        const parsedContent = JSON.parse(content);

        // Models that are forced to JSON sometimes wrap the result in a key, e.g., {"recipes": [...]}.
        // We will extract the first array or object we find.
        let finalJson;
        if (typeof parsedContent === 'object' && parsedContent !== null) {
            const values = Object.values(parsedContent);
            const expectedType = isAdjustment ? 'object' : 'array';
            const foundValue = values.find(v => (expectedType === 'array' ? Array.isArray(v) : typeof v === 'object' && !Array.isArray(v)));
            finalJson = foundValue || parsedContent; // Fallback to the parsed content itself
        } else {
            finalJson = parsedContent;
        }

        const finalBody = JSON.stringify(finalJson);
        
        // Final validation to ensure we're sending valid JSON to the client.
        JSON.parse(finalBody);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: finalBody,
        };

    } catch (error: unknown) {
        console.error("Error in Open Router proxy function:", error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        return { statusCode: 500, body: JSON.stringify({ error: `An internal server error occurred in the proxy function: ${errorMessage}` }) };
    }
};

export { handler };