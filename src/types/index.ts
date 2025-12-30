export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Story {
  id: string;
  user_id: string;
  title?: string;
  date: string;
  setting?: string;
  tags?: string[];
  freeform_text: string;
  created_at: string;
  updated_at: string;
}

export interface StoryVersion {
  id: string;
  story_id: string;
  version_type: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface LearningProgress {
  user_id: string;
  structure_id: string;
  explored: boolean;
}

export interface StoryDetails {
  id: string;
  story_id: string;
  characters: string[];
  hook: string;
  beginning: string;
  middle: string;
  end: string;
  outcome: string;
  lesson_or_takeaway: string;
  turning_point: string;
  generated_by_ai: boolean;
  user_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryAnalysisResult {
  characters: string[];
  hook: string;
  beginning: string;
  middle: string;
  end: string;
  outcome: string;
  lesson_or_takeaway: string;
  turning_point: string;
}

export interface CoachNotes {
  id: string;
  story_id: string;
  user_id: string;
  what_to_cut?: string;
  vocabulary_upgrades: Array<{ original: string; upgraded: string }>;
  pacing_notes?: string;
  stronger_opening?: string;
  callback_ending?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
  status?: number;
  type?: string;
}
