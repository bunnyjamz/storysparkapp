import { StoryAnalysisResult } from '@/types';

// Story Analysis Prompt - extracts structured fields from freeform story text
export const STORY_ANALYSIS_PROMPT = `You are a storytelling coach. Analyze this story and extract the key elements.

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

// Story Cleanup Prompt - generates a cleaned-up version (for Phase 2 stretch)
export const STORY_CLEANUP_PROMPT = `You are an editor helping someone tell their story better.

Rules:
- Preserve the original voice and all key facts
- Fix grammar, spelling, and punctuation
- Improve flow and clarity without changing meaning
- Keep the length similar to the original
- Don't add details that weren't in the original

Original story:
{STORY_TEXT}

Return only the cleaned story text, no explanations or markdown:`;

// Coach Feedback Prompt - generates coaching notes (for Phase 3)
export const COACH_FEEDBACK_PROMPT = `You are a storytelling coach reviewing a story.

Analyze for:
1. What could be cut (unnecessary words, repetition, tangents)
2. Vocabulary upgrades (simpler words that could be stronger)
3. Pacing suggestions (where to pause, slow down, speed up)
4. Stronger opening line suggestion
5. Callback ending suggestion (reference back to opening)

Story:
{STORY_TEXT}

Return valid JSON only:
{
  "what_to_cut": "...",
  "vocabulary_upgrades": [{"original": "...", "upgraded": "..."}],
  "pacing_notes": "...",
  "stronger_opening": "...",
  "callback_ending": "..."
}`;

// Format the story analysis prompt with the story text
export function formatStoryAnalysisPrompt(storyText: string): string {
  // Truncate story if too long (approx 4000 tokens max for gpt-3.5-turbo)
  const maxLength = 8000;
  const truncatedText = storyText.length > maxLength 
    ? storyText.substring(0, maxLength) + '...'
    : storyText;
  
  return STORY_ANALYSIS_PROMPT.replace('{STORY_TEXT}', truncatedText);
}

// Format the cleanup prompt with the story text
export function formatCleanupPrompt(storyText: string): string {
  const maxLength = 8000;
  const truncatedText = storyText.length > maxLength 
    ? storyText.substring(0, maxLength) + '...'
    : storyText;
  
  return STORY_CLEANUP_PROMPT.replace('{STORY_TEXT}', truncatedText);
}

// Parse the AI response into a StoryAnalysisResult
export function parseStoryAnalysisResponse(response: string): Partial<StoryAnalysisResult> {
  try {
    // Try to parse the raw response
    let cleanedResponse = response.trim();
    
    // Remove markdown code block fences if present
    cleanedResponse = cleanedResponse.replace(/^```json?\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
    
    const parsed = JSON.parse(cleanedResponse) as Partial<StoryAnalysisResult>;
    
    // Normalize the response - convert "Unclear" to empty strings
    const normalized: Partial<StoryAnalysisResult> = {
      characters: Array.isArray(parsed.characters) 
        ? parsed.characters.filter(c => c && c !== 'Unclear')
        : [],
      hook: normalizeField(parsed.hook),
      beginning: normalizeField(parsed.beginning),
      middle: normalizeField(parsed.middle),
      end: normalizeField(parsed.end),
      outcome: normalizeField(parsed.outcome),
      lesson_or_takeaway: normalizeField(parsed.lesson_or_takeaway),
      turning_point: normalizeField(parsed.turning_point),
    };
    
    return normalized;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Failed to parse story analysis response');
  }
}

function normalizeField(value: string | undefined): string {
  if (!value || value === 'Unclear' || value.trim() === '') {
    return '';
  }
  return value.trim();
}

// Cost tracking
let totalTokensUsed = 0;
let totalApiCalls = 0;

export function getCostStats() {
  return {
    totalTokensUsed,
    totalApiCalls,
    estimatedCost: (totalTokensUsed / 1000) * 0.001, // Approximate cost for gpt-3.5-turbo
  };
}

export function trackApiCall(tokens: number) {
  totalTokensUsed += tokens;
  totalApiCalls += 1;
  console.log(`[AI] API call #${totalApiCalls}, tokens: ${tokens}`);
}
