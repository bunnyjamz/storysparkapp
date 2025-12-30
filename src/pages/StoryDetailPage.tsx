import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Story, StoryDetails } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Tag,
  Trash2,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { EditableField, EditableArrayField } from '@/components/editable-field';
import { StoryDetailsSkeleton, AnalyzingSkeleton } from '@/components/skeleton';
import { analyzeStory, updateStoryDetails, fetchStoryWithDetails } from '@/lib/analyze-story';

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [storyDetails, setStoryDetails] = useState<StoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [showOriginalStory, setShowOriginalStory] = useState(true);

  const loadStoryData = useCallback(async (storyId: string) => {
    const { story: fetchedStory, details } = await fetchStoryWithDetails(storyId);
    return { fetchedStory, details };
  }, []);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    const timeoutId = setTimeout(() => {
      setLoading(true);
    });

    loadStoryData(id)
      .then(({ fetchedStory, details }) => {
        if (!mounted) return;
        setStory(fetchedStory);
        setStoryDetails(details);
        setLoading(false);

        // Auto-analyze if no details exist
        if (!details && fetchedStory) {
          setAnalyzing(true);
          setAnalyzeError(null);

          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user || !mounted) {
              setAnalyzing(false);
              return;
            }

            analyzeStory({
              storyId: id,
              storyText: fetchedStory.freeform_text,
              userId: user.id,
              onError: (error) => {
                if (mounted) {
                  setAnalyzeError(error);
                }
              },
            }).then((result) => {
              if (mounted && result) {
                setStoryDetails(result);
              }
              if (mounted) {
                setAnalyzing(false);
              }
            });
          });
        }
      })
      .catch((error) => {
        if (mounted) {
          console.error('Error loading story:', error);
          navigate('/');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [id, loadStoryData, navigate]);

  const handleDelete = async () => {
    if (!story || !window.confirm('Are you sure you want to delete this story?')) return;

    const { error } = await supabase.from('stories').delete().eq('id', story.id);

    if (error) {
      alert('Error deleting story: ' + error.message);
    } else {
      navigate('/');
    }
  };

  const handleFieldSave = async (field: keyof StoryDetails, value: string | string[]) => {
    if (!story) return;

    const success = await updateStoryDetails(story.id, { [field]: value });
    if (success) {
      setStoryDetails((prev) => (prev ? { ...prev, [field]: value } : null));
    }
  };

  const handleCharactersSave = async (characters: string[]) => {
    await handleFieldSave('characters', characters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 pb-12">
        <header className="bg-background border-b px-4 py-3 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link to="/">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="max-w-3xl mx-auto p-4 mt-6">
          <StoryDetailsSkeleton />
        </main>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold truncate max-w-[200px] sm:max-w-md">
            {story.title || 'Untitled Story'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (!story) return;
              setAnalyzing(true);
              setAnalyzeError(null);

              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) {
                setAnalyzing(false);
              }

              const result = await analyzeStory({
                storyId: story.id,
                storyText: story.freeform_text,
                userId: user.id,
                onError: (error) => {
                  setAnalyzeError(error);
                },
              });

              if (result) {
                setStoryDetails(result);
              }
              setAnalyzing(false);
            }}
            disabled={analyzing}
            className="text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Re-analyze
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 mt-6">
        {/* Story metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(story.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </div>
          {story.setting && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {story.setting}
            </div>
          )}
        </div>

        {/* Analysis error banner */}
        {analyzeError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Couldn't organize this story</p>
              <p className="text-sm text-muted-foreground mt-1">{analyzeError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={async () => {
                  if (!story) return;
                  setAnalyzing(true);
                  setAnalyzeError(null);

                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) {
                    setAnalyzing(false);
                    return;
                  }

                  const result = await analyzeStory({
                    storyId: story.id,
                    storyText: story.freeform_text,
                    userId: user.id,
                    onError: (error) => {
                      setAnalyzeError(error);
                    },
                  });

                  if (result) {
                    setStoryDetails(result);
                  }
                }}
                disabled={analyzing}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Analyzing state */}
        {analyzing && (
          <div className="mb-6">
            <AnalyzingSkeleton />
          </div>
        )}

        {/* Original story section */}
        <div className="mb-8">
          <button
            onClick={() => setShowOriginalStory(!showOriginalStory)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <span className="text-base">ORIGINAL STORY</span>
            <span className="text-xs">{showOriginalStory ? '(hide)' : '(show)'}</span>
          </button>

          {showOriginalStory && (
            <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {story.freeform_text}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Story Breakdown - AI Generated */}
        <div className="space-y-8">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">STORY BREAKDOWN</h2>
          </div>

          <div className="space-y-6">
            <EditableField
              label="Hook"
              value={storyDetails?.hook || ''}
              placeholder="Why is this story worth telling?"
              emptyMessage="Click to add a hook..."
              isAiGenerated={storyDetails?.generated_by_ai && !storyDetails?.user_edited}
              onSave={(value) => handleFieldSave('hook', value)}
            />

            <EditableArrayField
              label="Characters"
              values={storyDetails?.characters || []}
              placeholder="Who was involved?"
              emptyMessage="Click to add characters..."
              isAiGenerated={storyDetails?.generated_by_ai && !storyDetails?.user_edited}
              onSave={handleCharactersSave}
            />

            <EditableField
              label="Beginning"
              value={storyDetails?.beginning || ''}
              placeholder="What's the setup?"
              emptyMessage="Click to add the beginning..."
              isAiGenerated={storyDetails?.generated_by_ai && !storyDetails?.user_edited}
              onSave={(value) => handleFieldSave('beginning', value)}
            />

            <EditableField
              label="Middle"
              value={storyDetails?.middle || ''}
              placeholder="What's the main action/conflict?"
              emptyMessage="Click to add the middle..."
              isAiGenerated={storyDetails?.generated_by_ai && !storyDetails?.user_edited}
              onSave={(value) => handleFieldSave('middle', value)}
            />

            <EditableField
              label="End"
              value={storyDetails?.end || ''}
              placeholder="How does it resolve?"
              emptyMessage="Click to add the end..."
              isAiGenerated={storyDetails?.generated_by_ai && !storyDetails?.user_edited}
              onSave={(value) => handleFieldSave('end', value)}
            />

            <EditableField
              label="Outcome"
              value={storyDetails?.outcome || ''}
              placeholder="What was the result?"
              emptyMessage="Click to add the outcome..."
              isAiGenerated={storyDetails?.generated_by_ai && !storyDetails?.user_edited}
              onSave={(value) => handleFieldSave('outcome', value)}
            />

            <EditableField
              label="Lesson or Takeaway"
              value={storyDetails?.lesson_or_takeaway || ''}
              placeholder="What did the storyteller learn?"
              emptyMessage="Optional - click to add..."
              isAiGenerated={storyDetails?.generated_by_ai && !storyDetails?.user_edited}
              onSave={(value) => handleFieldSave('lesson_or_takeaway', value)}
            />

            <EditableField
              label="Turning Point"
              value={storyDetails?.turning_point || ''}
              placeholder="What's the pivotal moment?"
              emptyMessage="Optional - click to add..."
              isAiGenerated={storyDetails?.generated_by_ai && !storyDetails?.user_edited}
              onSave={(value) => handleFieldSave('turning_point', value)}
            />
          </div>
        </div>

        {/* Story versions section - scaffold for Phase 3 */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h2 className="text-lg font-semibold text-muted-foreground">STORY VERSIONS</h2>
          </div>

          <div className="space-y-2">
            <button
              className="w-full text-left px-4 py-3 rounded-lg border bg-background hover:bg-accent transition-colors flex items-center justify-between"
              disabled
            >
              <span className="text-sm">Original</span>
              <Badge variant="secondary">Current</Badge>
            </button>

            <div className="w-full px-4 py-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center text-muted-foreground">
              <span className="text-sm">Cleaned version (Phase 3)</span>
            </div>

            <div className="w-full px-4 py-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center text-muted-foreground">
              <span className="text-sm">AI Structure Rewrite (Phase 3)</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-8 mt-8 border-t">
            {story.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Simple skeleton component inline
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}
