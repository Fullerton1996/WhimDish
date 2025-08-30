
type Handler = (event: any, context: any) => Promise<{ statusCode: number; body: string; headers?: any; }>;

// The API key is now expected as 'OPENROUTER_API_KEY' from environment variables.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    if (!OPENROUTER_API_KEY) {
        console.error("OpenRouter API key is not configured.");
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Server configuration error: An API key for the backend service is not set." }) 
        };
    }

    try {
        const { prompt } = JSON.parse(event.body || '{}');
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt in request body' }) };
        }

        const isAdjustment = prompt.includes("Original Recipe");
        
        const recipeStructure = `{ "recipeName": string, "description": string, "calories": number, "servings": number, "ingredients": [{ "name": string, "quantity": number, "unit": string }], "instructions": string[], "mealType": "breakfast"|"lunch"|"dinner" }`;
        
        const systemInstruction = isAdjustment
            ? `You are an expert chef who modifies recipes. Return only the adjusted recipe as a single JSON object. The JSON object must strictly follow this structure: ${recipeStructure}. Do not include any other text, just the JSON object.`
            : `You are an expert chef and nutritionist. Generate an array of 3 creative recipes. The response must be a valid JSON array of objects, where each object strictly follows this structure: ${recipeStructure}. Do not include any other text or markdown, just the JSON array.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-flash-1.5", // A fast and capable model for this use case
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("OpenRouter API error:", errorBody);
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
             throw new Error("Invalid response structure from OpenRouter API.");
        }
        
        const jsonContent = data.choices[0].message.content;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: jsonContent,
        };

    } catch (error: unknown) {
        console.error("Error in gemini proxy function:", error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        return { statusCode: 500, body: JSON.stringify({ error: `An internal server error occurred in the proxy function: ${errorMessage}` }) };
    }
};

export { handler };
