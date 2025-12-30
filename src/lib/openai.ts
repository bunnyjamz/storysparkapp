import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn(
    'OpenAI API key missing. AI features will not work. Set VITE_OPENAI_API_KEY in .env.local',
  );
}

export const openai = new OpenAI({
  apiKey: openaiApiKey || '',
  dangerouslyAllowBrowser: true,
});

export type OpenAIError = {
  message: string;
  status?: number;
  type?: string;
};

export function isOpenAIError(error: unknown): error is OpenAIError {
  return typeof error === 'object' && error !== null && 'message' in error && 'status' in error;
}

export function getOpenAIErrorMessage(error: unknown): string {
  if (isOpenAIError(error)) {
    switch (error.status) {
      case 401:
        return 'Invalid API key. Please check your OpenAI configuration.';
      case 429:
        return 'Rate limit exceeded. Please try again in a moment.';
      case 500:
        return 'OpenAI service error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred with OpenAI.';
    }
  }
  return 'An unexpected error occurred while analyzing your story.';
}
