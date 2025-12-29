import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Story } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Calendar, MapPin, Tag, Trash2 } from 'lucide-react';

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchStory(id);
    }
  }, [id]);

  async function fetchStory(storyId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (error) {
      console.error('Error fetching story:', error);
      navigate('/');
    } else {
      setStory(data);
    }
    setLoading(false);
  }

  const handleDelete = async () => {
    if (!story || !window.confirm('Are you sure you want to delete this story?')) return;

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', story.id);

    if (error) {
      alert('Error deleting story: ' + error.message);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link to="/">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold truncate max-w-[200px] sm:max-w-md">
            {story.title || 'Untitled Story'}
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10">
          <Trash2 className="h-5 w-5" />
        </Button>
      </header>

      <main className="max-w-3xl mx-auto p-4 mt-6">
        <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b pb-6">
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

            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                {story.freeform_text}
              </p>
            </div>

            {story.tags && story.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-6 border-t">
                {story.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
