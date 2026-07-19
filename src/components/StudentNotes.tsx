import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Save, Loader2 } from 'lucide-react';

interface StudentNotesProps {
  // For admin view - pass the student's user_id
  studentId?: string;
  // For admin view - read-only mode
  readOnly?: boolean;
  // Compact inline variant - no Card wrapper, fits inside other cards
  variant?: 'card' | 'inline';
}

const StudentNotes = ({ studentId, readOnly = false, variant = 'card' }: StudentNotesProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);

  const userId = studentId || profile?.user_id;

  useEffect(() => {
    if (!userId) return;

    const fetchNote = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('student_notes')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching note:', error);
        }

        if (data) {
          setContent(data.content || '');
          setNoteId(data.id);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      if (noteId) {
        // Update existing note
        const { error } = await supabase
          .from('student_notes')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', noteId);

        if (error) throw error;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('student_notes')
          .insert({ user_id: userId, content })
          .select()
          .single();

        if (error) throw error;
        if (data) setNoteId(data.id);
      }

      toast({
        title: 'Note Saved',
        description: 'Your note has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save note',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    const Loader = () => (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
    if (variant === 'inline') return <Loader />;
    return <Card><CardContent><Loader /></CardContent></Card>;
  }

  const NotesContent = () => (
    <>
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className={`${variant === 'inline' ? 'h-3.5 w-3.5' : 'h-5 w-5'} text-muted-foreground`} />
        <span className={`${variant === 'inline' ? 'text-xs' : 'text-base'} font-medium`}>
          {readOnly ? 'Student Notes' : 'My Notes'}
        </span>
        
      </div>
      <Textarea
        placeholder={readOnly ? 'No notes from student yet...' : 'Write notes for the admin team to review...'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={readOnly}
        className={`resize-y ${variant === 'inline' ? 'min-h-[60px] text-xs' : 'min-h-[120px]'}`}
      />
      {!readOnly && (
        <div className="flex justify-end mt-2">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            size={variant === 'inline' ? 'sm' : 'sm'}
            className={variant === 'inline' ? 'h-7 text-xs px-2' : ''}
          >
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className={`${variant === 'inline' ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                Save
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className="rounded-lg border bg-muted/20 p-3">
        <NotesContent />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">
            {readOnly ? 'Student Notes' : 'My Notes'}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {readOnly
            ? 'Notes written by the student'
            : 'Write any notes, hints, or reminders here. Admins can also view these notes.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder={readOnly ? 'No notes from student yet...' : 'Write your notes here...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={readOnly}
          className="min-h-[120px] resize-y"
        />
        {!readOnly && (
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Note
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentNotes;
