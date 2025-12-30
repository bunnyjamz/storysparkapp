import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Story } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, Calendar, MapPin, SortAsc, SortDesc } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

type SortField = 'date' | 'title' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchStories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order(sortField, { ascending: sortOrder === 'asc' });

    if (error) {
      console.error('Error fetching stories:', error);
    } else {
      setStories(data || []);
    }
    setLoading(false);
  }, [sortField, sortOrder]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">StorySpark</h1>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={signOut} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Stories</h2>
            <p className="text-muted-foreground">Capture and improve your storytelling skill.</p>
          </div>
          <Button asChild>
            <Link to="/new">
              <Plus className="mr-2 h-4 w-4" /> New Story
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortField.charAt(0).toUpperCase() + sortField.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortField('date')}>Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField('title')}>Title</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField('created_at')}>Date Created</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={toggleSortOrder}>
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : stories.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No stories yet. Capture your first story!</p>
              <Button asChild variant="outline">
                <Link to="/new">
                  <Plus className="mr-2 h-4 w-4" /> Capture First Story
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Link key={story.id} to={`/stories/${story.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1">
                      {story.title || (story.freeform_text.substring(0, 50) + (story.freeform_text.length > 50 ? '...' : ''))}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> {new Date(story.date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {story.setting && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" /> {story.setting}
                      </div>
                    )}
                    <p className="text-sm line-clamp-3 text-muted-foreground">
                      {story.freeform_text}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 flex flex-wrap gap-1">
                    {story.tags && story.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
