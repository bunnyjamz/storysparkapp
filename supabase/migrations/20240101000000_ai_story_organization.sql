-- Create story_details table for AI-generated story structure
CREATE TABLE public.story_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL UNIQUE,
  characters TEXT[] DEFAULT '{}',
  hook TEXT,
  beginning TEXT,
  middle TEXT,
  "end" TEXT,
  outcome TEXT,
  lesson_or_takeaway TEXT,
  turning_point TEXT,
  generated_by_ai BOOLEAN DEFAULT FALSE,
  user_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create coach_notes table for AI coaching feedback
CREATE TABLE public.coach_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  what_to_cut TEXT,
  vocabulary_upgrades JSONB DEFAULT '[]',
  pacing_notes TEXT,
  stronger_opening TEXT,
  callback_ending TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update story_versions table to add version_type constraint
ALTER TABLE public.story_versions 
ALTER COLUMN version_type TYPE TEXT;

-- Add constraint for valid version types
DO $$ BEGIN
  CREATE TYPE story_version_type AS ENUM ('original', 'cleaned', 'ai_organized');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add index for faster queries
CREATE INDEX idx_story_details_story_id ON public.story_details(story_id);
CREATE INDEX idx_coach_notes_story_id ON public.coach_notes(story_id);
CREATE INDEX idx_coach_notes_user_id ON public.coach_notes(user_id);

-- Enable Row Level Security
ALTER TABLE public.story_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_details
CREATE POLICY "Users can view their own story details" ON public.story_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stories WHERE stories.id = story_details.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own story details" ON public.story_details FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stories WHERE stories.id = story_details.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update their own story details" ON public.story_details FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stories WHERE stories.id = story_details.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own story details" ON public.story_details FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.stories WHERE stories.id = story_details.story_id AND stories.user_id = auth.uid())
);

-- RLS Policies for coach_notes
CREATE POLICY "Users can view their own coach notes" ON public.coach_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own coach notes" ON public.coach_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own coach notes" ON public.coach_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own coach notes" ON public.coach_notes FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to story_details
DROP TRIGGER IF EXISTS update_story_details_updated_at ON public.story_details;
CREATE TRIGGER update_story_details_updated_at
  BEFORE UPDATE ON public.story_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to coach_notes
DROP TRIGGER IF EXISTS update_coach_notes_updated_at ON public.coach_notes;
CREATE TRIGGER update_coach_notes_updated_at
  BEFORE UPDATE ON public.coach_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
