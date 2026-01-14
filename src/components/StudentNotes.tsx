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
}

const StudentNotes = ({ studentId, readOnly = false }: StudentNotesProps) => {
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
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
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
