import { generateText } from 'ai';

export const config = {
  runtime: 'edge',
};

type AnalyzeRequestBody = {
  storyText?: string;
};

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

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  try {
    const { storyText } = (await req.json()) as AnalyzeRequestBody;

    if (!storyText || typeof storyText !== 'string') {
      return new Response(JSON.stringify({ error: 'Story content is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const prompt = formatPrompt(storyText);

    // Use AI SDK's generateText with Vercel AI Gateway (default provider)
    const { text, usage } = await generateText({
      model: 'openai/gpt-4',
      prompt,
      temperature: 0.3,
      maxTokens: 1000,
    });

    return new Response(
      JSON.stringify({
        content: text,
        usage,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );
  } catch (error) {
    console.error('Error analyzing story:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze story',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );
  }
}
