import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Check, Edit2, Sparkles } from 'lucide-react';

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  emptyMessage?: string;
  isAiGenerated?: boolean;
  onSave: (newValue: string) => Promise<void>;
  multiline?: boolean;
  className?: string;
}

export function EditableField({
  label,
  value,
  placeholder,
  emptyMessage = 'Click to add...',
  isAiGenerated = false,
  onSave,
  multiline = false,
  className,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const displayValue = value?.trim();
  const isEmpty = !displayValue;

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-1" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
        <InputComponent
          value={editValue}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setEditValue(e.target.value)
          }
          placeholder={placeholder}
          className={cn(multiline && 'min-h-[80px] resize-none', 'transition-all')}
          autoFocus
          disabled={isSaving}
        />
      </div>
    );
  }

  return (
    <div className={cn('group relative', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">{label}</label>
          {isAiGenerated && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              AI
            </span>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
          aria-label={`Edit ${label}`}
        >
          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      ) : (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {displayValue}
        </p>
      )}
    </div>
  );
}

// Array field component for things like characters
interface EditableArrayFieldProps {
  label: string;
  values: string[];
  placeholder?: string;
  emptyMessage?: string;
  isAiGenerated?: boolean;
  onSave: (newValues: string[]) => Promise<void>;
  className?: string;
}

export function EditableArrayField({
  label,
  values = [],
  placeholder,
  emptyMessage = 'Click to add characters...',
  isAiGenerated = false,
  onSave,
  className,
}: EditableArrayFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(values.join(', '));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const newValues = editValue
      .split(',')
      .map((v: string) => v.trim())
      .filter((v: string) => v);

    setIsSaving(true);
    try {
      await onSave(newValues);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving array field:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(values.join(', '));
    setIsEditing(false);
  };

  const displayValues = values.filter((v: string) => v.trim());
  const isEmpty = displayValues.length === 0;

  if (isEditing) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-1" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
        <Input
          value={editValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
          placeholder={placeholder || 'Separate names with commas'}
          className="transition-all"
          autoFocus
          disabled={isSaving}
        />
        <p className="text-xs text-muted-foreground">Separate items with commas</p>
      </div>
    );
  }

  return (
    <div className={cn('group relative', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">{label}</label>
          {isAiGenerated && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              AI
            </span>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
          aria-label={`Edit ${label}`}
        >
          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayValues.map((value: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary text-sm text-secondary-foreground"
            >
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
