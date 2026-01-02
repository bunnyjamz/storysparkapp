import { parseStoryAnalysisResponse, trackApiCall } from './ai-prompts';
import { supabase } from './supabase';
import { StoryDetails } from '@/types';

type AnalyzeStoryApiResponse = {
  content: string;
  usage?: {
    total_tokens?: number;
  };
  error?: string;
};

function getAnalyzeStoryErrorMessage(status: number, fallback?: string): string {
  switch (status) {
    case 400:
      return fallback || 'Invalid request. Please try again.';
    case 401:
    case 403:
      return fallback || 'AI service not configured. Please contact support.';
    case 429:
      return 'Rate limit exceeded. Please try again in a moment.';
    case 500:
    case 502:
    case 503:
    case 504:
      return fallback || 'AI service error. Please try again later.';
    default:
      return fallback || 'An unexpected error occurred while analyzing your story.';
  }
}

export interface AnalyzeStoryOptions {
  storyId: string;
  storyText: string;
  userId: string;
  onError?: (error: string) => void;
}

export async function analyzeStory(options: AnalyzeStoryOptions): Promise<StoryDetails | null> {
  const { storyId, storyText, onError } = options;

  try {
    const apiRes = await fetch('/api/analyze-story', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        storyId,
        storyText,
      }),
    });

    const result = (await apiRes.json().catch(() => ({}))) as Partial<AnalyzeStoryApiResponse>;

    if (!apiRes.ok) {
      const errorMessage = getAnalyzeStoryErrorMessage(apiRes.status, result.error);
      onError?.(errorMessage);
      return null;
    }

    const response = result.content || '';

    if (result.usage?.total_tokens) {
      trackApiCall(result.usage.total_tokens);
    }

    const analysisResult = parseStoryAnalysisResponse(response);

    // Upsert story details
    const { data: storyDetails, error: upsertError } = await supabase
      .from('story_details')
      .upsert({
        story_id: storyId,
        characters: analysisResult.characters || [],
        hook: analysisResult.hook || null,
        beginning: analysisResult.beginning || null,
        middle: analysisResult.middle || null,
        end: analysisResult.end || null,
        outcome: analysisResult.outcome || null,
        lesson_or_takeaway: analysisResult.lesson_or_takeaway || null,
        turning_point: analysisResult.turning_point || null,
        generated_by_ai: true,
        user_edited: false,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error saving story details:', upsertError);
      onError?.('Failed to save analysis results');
      return null;
    }

    return storyDetails as StoryDetails;
  } catch (error) {
    console.error('Error analyzing story:', error);
    onError?.('An unexpected error occurred while analyzing your story.');
    return null;
  }
}

// Check if a story needs analysis (no details exist)
export async function storyNeedsAnalysis(storyId: string): Promise<boolean> {
  const { data } = await supabase
    .from('story_details')
    .select('id')
    .eq('story_id', storyId)
    .single();

  return !data;
}

// Update story details after user edits
export async function updateStoryDetails(
  storyId: string,
  updates: Partial<StoryDetails>,
): Promise<boolean> {
  const { error } = await supabase
    .from('story_details')
    .update({
      ...updates,
      user_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('story_id', storyId);

  if (error) {
    console.error('Error updating story details:', error);
    return false;
  }

  return true;
}

// Fetch story with its details
export async function fetchStoryWithDetails(storyId: string) {
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();

  if (storyError) {
    throw storyError;
  }

  const { data: details, error: detailsError } = await supabase
    .from('story_details')
    .select('*')
    .eq('story_id', storyId)
    .single();

  // It's okay if no details exist yet
  if (detailsError && detailsError.code !== 'PGRST116') {
    throw detailsError;
  }

  return {
    story,
    details: details as StoryDetails | null,
  };
}
