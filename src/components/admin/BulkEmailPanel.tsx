import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Loader2, User, X } from 'lucide-react';
import { sendEmail } from '@/lib/sendEmail';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { wrapInEmailTemplate, EmailTemplateOptions } from '@/lib/emailTemplate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email?: string;
}

const BulkEmailPanel = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sendToAll, setSendToAll] = useState(true);
  
  // Email template options
  const [skipGreeting, setSkipGreeting] = useState(false);
  const [signOffOption, setSignOffOption] = useState<'admin' | 'team' | 'none'>('admin');

  // Fetch all users with their emails on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch emails for all users in parallel to be faster
        const usersWithEmails = await Promise.all((profiles || []).map(async (profile) => {
          try {
            const { data, error: emailError } = await supabase.functions.invoke('get-user-email', {
              body: { user_id: profile.user_id }
            });
            if (!emailError && data?.email) {
              return {
                ...profile,
                email: data.email
              };
            }
          } catch (e) {
            console.error('Error fetching email for user:', profile.user_id, e);
          }
          return null;
        }));

        const filteredUsers = usersWithEmails.filter((u): u is UserProfile => u !== null);
        setUsers(filteredUsers);
        
        // If there's only one user or we're in "send to all" mode, 
        // ensure we have the emails ready
        if (filteredUsers.length > 0) {
          console.log(`Loaded ${filteredUsers.length} users with emails`);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
    if (newSelection.size > 0) {
      setSendToAll(false);
    }
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
    setSendToAll(true);
  };

  const selectAllUsers = () => {
    setSelectedUserIds(new Set(users.map(u => u.user_id)));
    setSendToAll(false);
  };

  const generateEmailHTML = (emailContent: string) => {
    return wrapInEmailTemplate(emailContent, {
      skipGreeting,
      signOff: signOffOption
    });
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast({ title: 'Error', description: 'Please enter a subject', variant: 'destructive' });
      return;
    }
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Please enter email content', variant: 'destructive' });
      return;
    }

    const targetEmails = sendToAll 
      ? users.map(u => u.email).filter(Boolean) as string[]
      : users.filter(u => selectedUserIds.has(u.user_id)).map(u => u.email).filter(Boolean) as string[];

    if (targetEmails.length === 0) {
      toast({ title: 'Error', description: 'No recipients selected', variant: 'destructive' });
      return;
    }

    const confirmMessage = sendToAll 
      ? `Send this email to ALL ${targetEmails.length} users?`
      : `Send this email to ${targetEmails.length} selected user(s)?`;

    if (!window.confirm(confirmMessage)) return;

    setSending(true);
    setSentCount(0);

    try {
      const htmlContent = generateEmailHTML(content);
      const batchSize = 10;
      let successCount = 0;

      for (let i = 0; i < targetEmails.length; i += batchSize) {
        const batch = targetEmails.slice(i, i + batchSize);
        
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
        description: `Successfully sent ${successCount} of ${targetEmails.length} emails.`,
      });

      setSubject('');
      setContent('');
      setSelectedUserIds(new Set());
      setSendToAll(true);
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

  const selectedUsers = users.filter(u => selectedUserIds.has(u.user_id));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Email Panel</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Send to all or select specific users ({users.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Send Mode Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sendToAll" 
              checked={sendToAll}
              onCheckedChange={(checked) => {
                setSendToAll(!!checked);
                if (checked) setSelectedUserIds(new Set());
              }}
            />
            <Label htmlFor="sendToAll" className="text-sm font-medium cursor-pointer">
              Send to all users
            </Label>
          </div>
        </div>

        {/* User Selection - Only show when not sending to all */}
        {!sendToAll && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Select Recipients</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllUsers} className="h-7 text-xs">
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs">
                  Clear
                </Button>
              </div>
            </div>
            
            {/* Selected Users Badges */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-md">
                {selectedUsers.map(user => (
                  <Badge 
                    key={user.user_id} 
                    variant="secondary" 
                    className="text-xs pr-1 flex items-center gap-1"
                  >
                    {user.full_name || user.email}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => toggleUserSelection(user.user_id)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* User List */}
            <ScrollArea className="h-40 border rounded-md">
              {loadingUsers ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {users.map(user => (
                    <div
                      key={user.user_id}
                      onClick={() => toggleUserSelection(user.user_id)}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors ${
                        selectedUserIds.has(user.user_id) 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Checkbox checked={selectedUserIds.has(user.user_id)} />
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate flex-1">{user.full_name || 'No name'}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {user.email}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

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
            className="min-h-[120px] resize-y text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Each new line becomes a paragraph.
          </p>
        </div>

        {/* Email Options */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
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

        {/* Sending Progress */}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending... {sentCount} sent
          </div>
        )}

        {/* Send Button */}
        <Button onClick={handleSend} disabled={sending} className="w-full">
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {sendToAll ? `Send to All (${users.length})` : `Send to Selected (${selectedUserIds.size})`}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkEmailPanel;
