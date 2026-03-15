import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Loader2 } from 'lucide-react';
import { sendEmail } from '@/lib/sendEmail';
import { wrapInEmailTemplate } from '@/lib/emailTemplate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface PersonalEmailPanelProps {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
}

const PersonalEmailPanel = ({ studentId, studentName, studentEmail }: PersonalEmailPanelProps) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  
  // Email template options
  const [skipGreeting, setSkipGreeting] = useState(false);
  const [signOffOption, setSignOffOption] = useState<'admin' | 'team' | 'none'>('admin');

  const generateEmailHTML = (emailContent: string) => {
    return wrapInEmailTemplate(emailContent, {
      skipGreeting,
      signOff: signOffOption
    });
  };

  const handleSend = async () => {
    if (!studentEmail) {
      toast({ 
        title: 'Error', 
        description: 'Student email is not available. Please try to refresh or check if the student has an email.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!subject.trim()) {
      toast({ title: 'Error', description: 'Please enter a subject', variant: 'destructive' });
      return;
    }
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Please enter email content', variant: 'destructive' });
      return;
    }

    if (!window.confirm(`Send this email to ${studentName} (${studentEmail})?`)) return;

    setSending(true);

    try {
      const htmlContent = generateEmailHTML(content);
      await sendEmail(studentEmail, subject, htmlContent);

      toast({
        title: 'Email Sent!',
        description: `Successfully sent email to ${studentName}.`,
      });

      setSubject('');
      setContent('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Send Personal Email</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Compose and send a personal email to {studentName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        {/* Recipient Info (Read Only) */}
        <div className="space-y-1.5">
          <Label className="text-sm">To</Label>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
            <span className="text-sm font-medium">{studentName}</span>
            <span className="text-xs text-muted-foreground">({studentEmail || 'No email found'})</span>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <Label htmlFor="subject" className="text-sm">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            className="h-9"
          />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <Label htmlFor="content" className="text-sm">Message</Label>
          <Textarea
            id="content"
            placeholder="Write your message here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={sending}
            className="min-h-[200px] resize-y text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Each new line becomes a paragraph.
          </p>
        </div>

        {/* Email Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="skipGreeting" 
              checked={skipGreeting}
              onCheckedChange={(checked) => setSkipGreeting(!!checked)}
            />
            <Label htmlFor="skipGreeting" className="text-xs cursor-pointer">
              Skip "Hello," (content has greeting)
            </Label>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sign-off</Label>
            <Select value={signOffOption} onValueChange={(v: 'admin' | 'team' | 'none') => setSignOffOption(v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="team">Team publicGermany</SelectItem>
                <SelectItem value="none">None (in content)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Send Button */}
        <Button onClick={handleSend} disabled={sending || !studentEmail} className="w-full">
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalEmailPanel;
