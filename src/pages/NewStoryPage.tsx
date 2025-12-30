import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, MapPin, Tag, ChevronLeft, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const placeholders = [
  "Tell this like you're talking to a friend. What happened?",
  "What's the moment that made this worth telling?",
  'Who was there, and what went wrong or changed?',
  'Start anywhere. You can clean it up later.',
  "If someone asked 'then what happened?', what would you say?",
];

const helpPrompts = [
  'What kicked this off?',
  'What surprised you?',
  'What did you feel or realise?',
  'How did it end?',
];

export default function NewStoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [setting, setSetting] = useState('');
  const [tags, setTags] = useState('');
  const [freeformText, setFreeformText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeformText.trim()) {
      setError('Please share your story. This field is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    const { error } = await supabase.from('stories').insert({
      user_id: user?.id,
      title: title || null,
      date: format(date, 'yyyy-MM-dd'),
      setting: setting || null,
      tags: tagArray.length > 0 ? tagArray : null,
      freeform_text: freeformText,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Story saved successfully, navigate to dashboard
      // AI analysis will be triggered automatically when viewing the story detail
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <header className="bg-background border-b px-4 py-3 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link to="/">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">New Story</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Capture the Moment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-muted-foreground font-normal">
                  Title (optional)
                </Label>
                <Input
                  id="title"
                  placeholder="A memorable name for this story"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="date" className="text-muted-foreground font-normal">
                    When did it happen?
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setting" className="text-muted-foreground font-normal">
                    Setting (where/when)
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="setting"
                      className="pl-9"
                      placeholder="e.g. Rainy Tuesday, at the office"
                      value={setting}
                      onChange={(e) => setSetting(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-muted-foreground font-normal">
                  Tags (comma separated)
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tags"
                    className="pl-9"
                    placeholder="reflection, family, achievement"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="story" className="text-base font-semibold">
                    The Story*
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-xs text-primary flex items-center hover:underline"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    {showHelp ? 'Hide help' : 'Need help?'}
                  </button>
                </div>

                {showHelp && (
                  <div className="bg-primary/5 p-3 rounded-md text-sm text-primary space-y-1 mb-2 animate-in fade-in slide-in-from-top-1">
                    <p className="font-semibold mb-1">Try focusing on:</p>
                    <ul className="list-disc list-inside space-y-0.5 opacity-80">
                      {helpPrompts.map((prompt, i) => (
                        <li key={i}>{prompt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Textarea
                  id="story"
                  className="min-h-[250px] text-base resize-none"
                  placeholder={
                    showHelp
                      ? 'Use the prompts above to guide you...'
                      : placeholders[placeholderIndex]
                  }
                  value={freeformText}
                  onChange={(e) => setFreeformText(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Saving story...' : 'Save Story'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
