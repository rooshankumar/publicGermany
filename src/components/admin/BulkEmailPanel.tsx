import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Loader2, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendEmail } from '@/lib/sendEmail';

const BulkEmailPanel = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [sentCount, setSentCount] = useState(0);

  // Fetch user count on mount
  useState(() => {
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setUserCount(count);
      }
    };
    fetchCount();
  });

  const handleSend = async () => {
    if (!subject.trim()) {
      toast({ title: 'Error', description: 'Please enter a subject', variant: 'destructive' });
      return;
    }
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Please enter email content', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to send this email to ALL ${userCount || 'registered'} users? This action cannot be undone.`
    );
    if (!confirmed) return;

    setSending(true);
    setSentCount(0);

    try {
      // Fetch all user emails
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id');

      if (profilesError) throw profilesError;

      const userIds = profiles?.map(p => p.user_id) || [];
      
      // Fetch emails for all users using edge function
      const emails: string[] = [];
      
      for (const userId of userIds) {
        try {
          const { data, error } = await supabase.functions.invoke('get-user-email', {
            body: { user_id: userId }
          });
          
          if (!error && data?.email) {
            emails.push(data.email);
          }
        } catch (e) {
          console.error('Error fetching email for user:', userId, e);
        }
      }

      if (emails.length === 0) {
        toast({ title: 'Error', description: 'No valid email addresses found', variant: 'destructive' });
        setSending(false);
        return;
      }

      // Generate HTML email content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffd700; margin: 0; font-size: 24px;">publicGermany</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a1a2e; margin-top: 0;">${subject}</h2>
            <div style="color: #555;">
              ${content.split('\n').map(line => `<p style="margin: 10px 0;">${line}</p>`).join('')}
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Best regards,<br>
              <strong>Team publicGermany</strong>
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #888; font-size: 11px;">
            <p>© ${new Date().getFullYear()} publicGermany. All rights reserved.</p>
            <p>
              <a href="https://public-germany.lovable.app" style="color: #ffd700;">Visit our website</a>
            </p>
          </div>
        </body>
        </html>
      `;

      // Send emails in batches
      const batchSize = 10;
      let successCount = 0;

      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (email) => {
            try {
              await sendEmail(email, subject, htmlContent);
              successCount++;
              setSentCount(successCount);
            } catch (e) {
              console.error('Failed to send to:', email, e);
            }
          })
        );
      }

      toast({
        title: 'Emails Sent!',
        description: `Successfully sent ${successCount} of ${emails.length} emails.`,
      });

      // Reset form
      setSubject('');
      setContent('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send emails',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      setSentCount(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Send Email to All Users</CardTitle>
        </div>
        <CardDescription>
          Send a bulk email to all registered users ({userCount ?? '...'} users)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Important</AlertTitle>
          <AlertDescription className="text-amber-500/80">
            This will send an email to ALL registered users. Use this feature responsibly.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Enter email subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Email Content</Label>
          <Textarea
            id="content"
            placeholder="Write your email message here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={sending}
            className="min-h-[200px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Use plain text. Each new line will become a paragraph.
          </p>
        </div>

        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending emails... {sentCount} sent
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send to All Users
                <Users className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkEmailPanel;
