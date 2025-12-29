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
  content: any;
  created_at: string;
}

export interface LearningProgress {
  user_id: string;
  structure_id: string;
  explored: boolean;
}
