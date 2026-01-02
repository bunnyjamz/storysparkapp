export const config = {
  runtime: 'edge',
};

type AnalyzeStoryRequestBody = {
  storyText?: string;
  storyId?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

const SYSTEM_MESSAGE =
  'You are a helpful storytelling coach who extracts key story elements. Always respond with valid JSON.';

const STORY_ANALYSIS_PROMPT_TEMPLATE = `You are a storytelling coach. Analyze this story and extract the key elements.

Rules:
- Do not invent facts. Only extract what's explicitly in the story.
- If a field is unclear or missing, respond with "Unclear" (not an empty string).
- Keep language conversational, not academic.
- Be concise - each field should be 1-2 sentences max.
- Return valid JSON only, no markdown.

Story:
{STORY_TEXT}

Respond with JSON only:
{
  "characters": ["name1", "name2"],
  "hook": "...",
  "beginning": "...",
  "middle": "...",
  "end": "...",
  "outcome": "...",
  "lesson_or_takeaway": "...",
  "turning_point": "..."
}`;

function formatPrompt(storyText: string): string {
  const maxLength = 8000;
  const truncatedText =
    storyText.length > maxLength ? storyText.substring(0, maxLength) + '...' : storyText;

  return STORY_ANALYSIS_PROMPT_TEMPLATE.replace('{STORY_TEXT}', truncatedText);
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    ...init,
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  const gatewayToken = (globalThis as unknown as { process?: { env?: Record<string, string> } })
    .process?.env?.VERCEL_AI_GATEWAY_TOKEN;
  if (!gatewayToken) {
    return jsonResponse(
      {
        error:
          'Server misconfigured: missing VERCEL_AI_GATEWAY_TOKEN. Add it in Vercel → Project Settings → Environment Variables.',
      },
      { status: 500 },
    );
  }

  try {
    const { storyText } = (await req.json()) as AnalyzeStoryRequestBody;

    if (!storyText || typeof storyText !== 'string') {
      return jsonResponse({ error: 'Missing storyText' }, { status: 400 });
    }

    const prompt = formatPrompt(storyText);

    const upstreamRes = await fetch('https://api.vercel.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${gatewayToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: SYSTEM_MESSAGE,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const result = (await upstreamRes.json()) as ChatCompletionResponse;

    if (!upstreamRes.ok) {
      const error =
        result?.error?.message || `AI request failed with status ${upstreamRes.status}.`;

      return jsonResponse(
        {
          error,
        },
        { status: upstreamRes.status },
      );
    }

    const content = result?.choices?.[0]?.message?.content || '';

    return jsonResponse(
      {
        content,
        usage: result.usage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error analyzing story:', error);
    return jsonResponse({ error: 'Failed to analyze story' }, { status: 500 });
  }
}
