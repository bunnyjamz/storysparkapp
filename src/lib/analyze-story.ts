import { openai, getOpenAIErrorMessage } from './openai';
import { formatStoryAnalysisPrompt, parseStoryAnalysisResponse, trackApiCall } from './ai-prompts';
import { supabase } from './supabase';
import { StoryDetails } from '@/types';

export interface AnalyzeStoryOptions {
  storyId: string;
  storyText: string;
  userId: string;
  onError?: (error: string) => void;
}

export async function analyzeStory(options: AnalyzeStoryOptions): Promise<StoryDetails | null> {
  const { storyId, storyText, onError } = options;

  try {
    const prompt = formatStoryAnalysisPrompt(storyText);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful storytelling coach who extracts key story elements. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Track tokens for cost optimization
    if (completion.usage) {
      trackApiCall(completion.usage.total_tokens);
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
    const errorMessage = getOpenAIErrorMessage(error);
    onError?.(errorMessage);
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
