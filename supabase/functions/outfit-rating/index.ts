import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // CORS handling
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const { imageBase64 } = await req.json();

        if (!imageBase64) {
            throw new Error('No image provided');
        }

        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `你是一位專業的時尚穿搭顧問。請分析這張穿搭照片並給出評分和建議。

請按照以下格式回覆（使用繁體中文）：

評分：[1-100的數字]

整體評價：
[2-3句話描述整體穿搭印象]

優點：
• [優點1]
• [優點2]
• [優點3]

可改進之處：
• [建議1]
• [建議2]

穿搭小技巧：
[一個實用的穿搭建議]

注意：評分標準為
- 90-100：完美穿搭，時尚感十足
- 80-89：優秀穿搭，有個人風格
- 70-79：良好穿搭，整體協調
- 60-69：普通穿搭，有進步空間
- 50-59：需要改進
- 50以下：需要重新搭配`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: base64Data,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extract score from the response
        const scoreMatch = generatedText.match(/評分[：:]\s*(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 70;

        return new Response(
            JSON.stringify({
                success: true,
                score: Math.min(100, Math.max(1, score)),
                feedback: generatedText,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            }
        );

    } catch (error) {
        console.error('Error in outfit-rating function:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to rate outfit',
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            }
        );
    }
});
